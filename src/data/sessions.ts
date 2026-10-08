import { cityKey, cityKeys } from '../lib/cities';
import { supabase } from '../lib/supabase';
import { cancelEventReminder } from '../lib/notifications';
import { useAuth } from '../providers/AuthProvider';
import { useMemo } from 'react';
import { useQuery, invalidate } from './query';
import { MyStatus, ROSTER_FACES, Session, SESSION_LIST_SELECT, SESSION_SELECT, toSession, personOf } from './model';
import { PREVIEW, PREVIEW_ME, previewMyRsvps, previewSessionRows } from './preview';
import { addDays, startOfLocalDay } from '../i18n/format';
import { removeStoredImage, uploadImage } from '../lib/upload';
import { bookFacility } from './facilities';
import type { Person } from '../components/board/people';
import { CodedError, codeFrom } from './errors';

export type JoinResult = 'going' | 'waitlist';
const SESSION_CODES = [
  'WOMEN_ONLY_HOST', 'MEN_ONLY_HOST', 'MEN_ONLY', 'GENDER_NEEDED', 'LINK_INVALID', 'GUESTS_OFF', 'WOMEN_ONLY', 'PACK_ONLY', 'COMMUNITY_ONLY',
  'GUESTS_FULL', 'EVENT_OVER', 'EVENT_CANCELLED', 'EVENT_NOT_FOUND', 'NOT_HOST', 'LEVEL', 'FULL',
  'STARTED', 'TITLE_NEEDED', 'COURT_FIXED', 'PAST_TIME', 'SPOTS_BELOW_GOING',
] as const;
export type SessionErrorCode = (typeof SESSION_CODES)[number] | 'generic';
export class SessionError extends CodedError<SessionErrorCode> {}

function toSessionError(e: any): SessionError {
  return new SessionError(codeFrom(e, SESSION_CODES), String(e?.message || e || ''));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function useMe() {
  const { user, profile } = useAuth();
  return { meId: PREVIEW ? PREVIEW_ME : user?.id ?? null, profile };
}

/** How far back "my sessions" reaches (the past tab, posts about a recent session). */
const HISTORY_DAYS = 180;
/** The board always loads this many days; shorter boards (Home) slice it, so all share one request. */
const BOARD_DAYS = 14;

/** My going/waitlist RSVPs for sessions starting from `since` (bounded, so the list never grows forever). */
async function fetchMyRsvps(meId: string, since: Date): Promise<Map<string, MyStatus>> {
  const map = new Map<string, MyStatus>();
  if (PREVIEW) {
    previewMyRsvps().forEach((r) => map.set(r.event_id, r.status as MyStatus));
    return map;
  }
  const { data, error } = await supabase
    .from('event_rsvps')
    .select('event_id, status, event:events!inner(starts_at)')
    .eq('user_id', meId)
    .in('status', ['going', 'waitlist'])
    .gte('event.starts_at', since.toISOString());
  if (error) throw error;
  (data || []).forEach((r: any) => map.set(r.event_id, r.status));
  return map;
}

/** Who may see a session on the board (the database also enforces joins). */
function visible(s: Session, gender?: string | null) {
  if (s.womenOnly && gender === 'male' && !s.isMine) return false;
  if (s.menOnly && gender === 'female' && !s.isMine) return false;
  if (s.state === 'cancelled' && !s.isMine) return false;
  return true;
}

// ─── Board: today through the next week, in the member's country ───────────
export function useBoardSessions(days = BOARD_DAYS) {
  const { meId, profile } = useMe();
  const country = profile?.region || 'SA';
  const key = meId ? `sessions:board:${meId}:${country}:${cityKey(profile?.city)}` : null;
  const q = useQuery<Session[]>(key, async () => {
    const from = startOfLocalDay(new Date());
    const minePromise = fetchMyRsvps(meId!, from);
    minePromise.catch(() => {}); // handled where it is awaited below
    let rows: any[];
    if (PREVIEW) {
      rows = previewSessionRows();
    } else {
      const to = addDays(from, BOARD_DAYS);
      let q = supabase
        .from('events')
        .select(SESSION_LIST_SELECT)
        .gte('starts_at', from.toISOString())
        .lt('starts_at', to.toISOString())
        .eq('country', country)
        .eq('roster.status', 'going');
      // Open communities show the member's own city; private communities and packs show from anywhere.
      const keys = cityKeys(profile?.city);
      if (keys.length) {
        const quoted = keys.map((k) => `"${k.replace(/[\\"]/g, '')}"`).join(',');
        q = q.or(`open_scope.is.false,city_key.is.null,city_key.in.(${quoted})`);
      }
      const { data, error } = await q
        .order('starts_at', { ascending: true })
        .order('created_at', { referencedTable: 'roster', ascending: true })
        .limit(ROSTER_FACES, { referencedTable: 'roster' })
        .limit(300);
      if (error) throw error;
      rows = data || [];
    }
    const mine = await minePromise;
    const now = Date.now();
    return rows
      .map((r) => toSession(r, meId, mine.get(r.id) ?? null, now))
      .filter((s) => visible(s, profile?.gender));
  });
  const data = useMemo(() => {
    if (!q.data || days >= BOARD_DAYS || PREVIEW) return q.data;
    const end = addDays(startOfLocalDay(new Date()), days).getTime();
    return q.data.filter((s) => s.startsAt.getTime() < end);
  }, [q.data, days]);
  return { ...q, data };
}

// ─── One session, with the full roster and waitlist ─────────────────────────
export interface SessionDetail extends Session {
  waitlist: Person[];
  myWaitlistPosition: number | null;
}

export function useSession(id?: string | null) {
  const { meId } = useMe();
  const key = id && meId ? `sessions:one:${id}:${meId}` : null;
  return useQuery<SessionDetail | null>(key, async () => {
    let row: any;
    let myStatus: MyStatus | null = null;
    if (PREVIEW) {
      row = previewSessionRows().find((r) => r.id === id) ?? null;
      myStatus = (previewMyRsvps().find((r) => r.event_id === id)?.status as MyStatus) ?? null;
    } else {
      // The full roster (going and waiting) is on the row, so my own status is read from it.
      const ev = await supabase.from('events').select(SESSION_SELECT).eq('id', id!).maybeSingle();
      if (ev.error) throw ev.error;
      row = ev.data;
    }
    if (!row) return null;
    const s = toSession(row, meId, myStatus ?? undefined);
    const waitRows = (row.roster || [])
      .filter((r: any) => r.status === 'waitlist')
      .sort((a: any, b: any) => (a.created_at || '').localeCompare(b.created_at || ''));
    const waitlist = waitRows.map((r: any) => personOf(r.profile)).filter(Boolean) as Person[];
    const idx = waitRows.findIndex((r: any) => r.user_id === meId);
    return { ...s, waitlist, myWaitlistPosition: idx >= 0 ? idx + 1 : null };
  });
}

// ─── My sessions (joined, waitlisted, or hosted) ────────────────────────────
export function useMySessions() {
  const { meId } = useMe();
  const key = meId ? `sessions:mine:${meId}` : null;
  return useQuery<Session[]>(key, async () => {
    const since = addDays(startOfLocalDay(new Date()), -HISTORY_DAYS);
    const mine = await fetchMyRsvps(meId!, since);
    let rows: any[];
    if (PREVIEW) {
      rows = previewSessionRows().filter((r) => mine.has(r.id) || r.created_by === meId);
    } else {
      const ids = Array.from(mine.keys());
      let q = supabase.from('events').select(SESSION_LIST_SELECT).eq('roster.status', 'going').gte('starts_at', since.toISOString());
      q = ids.length ? q.or(`id.in.(${ids.join(',')}),created_by.eq.${meId}`) : q.eq('created_by', meId!);
      // Newest first, so the cap drops the oldest history rather than what's coming up.
      const { data, error } = await q
        .order('starts_at', { ascending: false })
        .order('created_at', { referencedTable: 'roster', ascending: true })
        .limit(ROSTER_FACES, { referencedTable: 'roster' })
        .limit(300);
      if (error) throw error;
      rows = (data || []).reverse();
    }
    const now = Date.now();
    return rows.map((r) => toSession(r, meId, mine.get(r.id) ?? null, now));
  });
}

// ─── Actions ────────────────────────────────────────────────────────────────
export function useSessionActions() {
  const { meId } = useMe();

  async function join(eventId: string): Promise<JoinResult> {
    if (!meId) throw new SessionError('generic', 'Not signed in');
    if (PREVIEW) {
      await wait(420);
      return eventId === 's-full' ? 'waitlist' : 'going';
    }
    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert({ event_id: eventId, user_id: meId, status: 'going' }, { onConflict: 'event_id,user_id' })
      .select('status')
      .single();
    if (error) throw toSessionError(error);
    invalidate('sessions:');
    return data?.status === 'waitlist' ? 'waitlist' : 'going';
  }

  async function leave(eventId: string) {
    if (!meId) throw new SessionError('generic', 'Not signed in');
    if (PREVIEW) {
      await wait(300);
      return;
    }
    const { error } = await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', meId);
    if (error) throw toSessionError(error);
    cancelEventReminder(eventId);
    invalidate('sessions:');
  }

  async function cancel(eventId: string) {
    if (PREVIEW) {
      await wait(300);
      return;
    }
    const { error } = await supabase.rpc('cancel_event', { p_event_id: eventId, p_reason: null });
    if (error) throw toSessionError(error);
    cancelEventReminder(eventId);
    invalidate('sessions:');
  }

  return { join, leave, cancel };
}

/** The host changes a session they posted. Everyone in hears about a new time or place. */
export async function updateSession(
  eventId: string,
  input: { title: string; startsAt: Date; durationMin: number; place: string | null; capacity: number | null; difficulty: 'easy' | 'medium' | 'hard' | null; notes: string },
) {
  if (PREVIEW) {
    await wait(400);
    return;
  }
  const { error } = await supabase.rpc('update_session', {
    p_event: eventId,
    p_title: input.title,
    p_starts_at: input.startsAt.toISOString(),
    p_duration_min: input.durationMin,
    p_place: input.place,
    p_capacity: input.capacity,
    p_difficulty: input.difficulty,
    p_notes: input.notes,
  });
  if (error) throw toSessionError(error);
  invalidate('sessions:');
}

export interface HostInput {
  title: string;
  sport: string;
  startsAt: Date;
  durationMin: number;
  place?: string;
  city?: string;
  lat?: number | null;
  lng?: number | null;
  capacity?: number | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  womenOnly?: boolean;
  menOnly?: boolean;
  /** Let people outside the community join with the session's link. */
  guestInvite?: boolean;
  packId?: string | null;
  /** Where the session lives when it isn't pack-only (defaults to the open community). */
  communityId?: string | null;
  priceSar?: number | null;
  /** Extra seats after it fills (0–3). */
  waitlistMax?: number;
  /** A workout from Train as the session's plan. */
  workoutId?: string | null;
  coachName?: string | null;
  /** An open session (captains): come if you can. */
  dropIn?: boolean;
  /** Repeat weekly for this many weeks in total (captains). */
  repeatWeeks?: number;
  notes?: string;
  /** http(s) URL (popular spot photo) or a local file to upload */
  cover?: string | null;
  country: string;
}

/** Create a session and put the host's own name on it. Returns the new id and whether the photo made it. */
export async function hostSession(meId: string, input: HostInput): Promise<{ id: string; photoFailed: boolean }> {
  if (PREVIEW) {
    await wait(600);
    return { id: 's-yours', photoFailed: false };
  }
  let imageUrl: string | null = null;
  let photoFailed = false;
  if (input.cover) {
    if (/^https?:\/\//.test(input.cover)) imageUrl = input.cover;
    else {
      try {
        imageUrl = await uploadImage(input.cover, 'event-images', `${meId}/${Date.now()}.jpg`);
      } catch {
        photoFailed = true;
      }
    }
  }
  const endsAt = new Date(input.startsAt.getTime() + input.durationMin * 60000);
  const row = (week: number, series: string | null) => ({
      title: input.title.trim(),
      event_type: input.sport,
      starts_at: new Date(input.startsAt.getTime() + week * 7 * 86400000).toISOString(),
      ends_at: new Date(endsAt.getTime() + week * 7 * 86400000).toISOString(),
      location_name: input.place?.trim() || null,
      location_city: input.city?.trim() || null,
      location_lat: input.lat ?? null,
      location_lng: input.lng ?? null,
      max_capacity: input.dropIn ? null : input.capacity ?? null,
      difficulty: input.difficulty ?? null,
      is_women_only: !!input.womenOnly,
      is_men_only: !input.womenOnly && !!input.menOnly,
      guest_invite: !input.packId && !!input.guestInvite,
      pack_id: input.packId ?? null,
      community_id: input.packId ? null : input.communityId ?? null,
      visibility: input.packId ? 'pack' : 'community',
      price_sar: input.priceSar ?? null,
      workout_id: input.workoutId ?? null,
      coach_name: input.coachName ?? null,
      description: input.notes?.trim() || null,
      image_url: imageUrl,
      country: input.country,
      created_by: meId,
      drop_in: !!input.dropIn,
      waitlist_max: Math.min(3, Math.max(0, input.waitlistMax ?? 3)),
      class_series_id: series,
  });
  const { data, error } = await supabase.from('events').insert(row(0, null)).select('id').single();
  if (error) {
    // Don't leave the uploaded cover behind for a session that was never created.
    if (imageUrl && imageUrl !== input.cover) removeStoredImage(imageUrl);
    throw toSessionError(error);
  }
  const ids = [data.id];
  // The same slot for the following weeks, tied together as one series.
  const weeks = Math.min(12, Math.max(1, Math.round(input.repeatWeeks ?? 1)));
  if (weeks > 1) {
    await supabase.from('events').update({ class_series_id: data.id }).eq('id', data.id);
    const { data: more } = await supabase
      .from('events')
      .insert(Array.from({ length: weeks - 1 }, (_, i) => row(i + 1, data.id)))
      .select('id');
    (more || []).forEach((m: any) => ids.push(m.id));
  }
  await supabase.from('event_rsvps').upsert(ids.map((id) => ({ event_id: id, user_id: meId, status: 'going' })), { onConflict: 'event_id,user_id' });
  invalidate('sessions:');
  return { id: data.id, photoFailed };
}


/**
 * Host at a bookable court: the booking rules apply (a free slot, the court's daily limit, its
 * community), the booking creates the session, then the host's extras are added to it.
 */
export async function hostAtCourt(
  meId: string,
  input: {
    facilityId: string;
    startsAt: Date;
    players: number;
    title: string;
    sport: string;
    communityId: string | null;
    packId: string | null;
    difficulty?: 'easy' | 'medium' | 'hard' | null;
    womenOnly?: boolean;
    menOnly?: boolean;
    guestInvite?: boolean;
    coachName?: string | null;
    notes?: string;
    cover?: string | null;
    waitlistMax?: number;
  },
): Promise<{ id: string; photoFailed: boolean }> {
  if (PREVIEW) {
    await wait(600);
    return { id: 's-yours', photoFailed: false };
  }
  const id = await bookFacility({
    facilityId: input.facilityId,
    startsAt: input.startsAt,
    players: input.players,
    title: input.title,
    communityId: input.communityId,
    packId: input.packId,
    sport: input.sport,
  });
  let photoFailed = false;
  const extras: Record<string, any> = {};
  if (input.difficulty) extras.difficulty = input.difficulty;
  if (input.womenOnly) extras.is_women_only = true;
  else if (input.menOnly) extras.is_men_only = true;
  if (input.guestInvite && !input.packId) extras.guest_invite = true;
  if (input.coachName) extras.coach_name = input.coachName;
  if (input.waitlistMax != null) extras.waitlist_max = Math.min(3, Math.max(0, input.waitlistMax));
  if (input.notes?.trim()) extras.description = input.notes.trim();
  if (input.cover && !/^https?:\/\//.test(input.cover)) {
    try {
      extras.image_url = await uploadImage(input.cover, 'event-images', `${meId}/${Date.now()}.jpg`);
    } catch {
      photoFailed = true;
    }
  }
  // The court is booked either way; extras that fail to save don't undo it.
  if (Object.keys(extras).length) {
    const { error: extrasErr } = await supabase.from('events').update(extras).eq('id', id);
    if (extrasErr && extras.image_url) removeStoredImage(extras.image_url);
  }
  invalidate('sessions:');
  return { id, photoFailed };
}

// ─── Guests invited by link ─────────────────────────────────────────────────
/** The guest key for a session I host (only its host may read it). */
export function useGuestToken(eventId: string | null, enabled: boolean) {
  return useQuery<string | null>(eventId && enabled && !PREVIEW ? `sessions:guestkey:${eventId}` : null, async () => {
    const { data, error } = await supabase.rpc('session_guest_token', { p_event: eventId });
    if (error) throw error;
    return (data as string | null) ?? null;
  });
}

export interface GuestPreview {
  id: string;
  title: string;
  sport: string;
  startsAt: Date;
  endsAt: Date | null;
  place: string | null;
  city: string | null;
  host: string | null;
  community: string | null;
  going: number;
  capacity: number | null;
  womenOnly: boolean;
  imageUrl: string | null;
}

/** What someone outside the community sees from a session's guest link (null: link not valid any more). */
export async function guestPreview(eventId: string, token: string): Promise<GuestPreview | null> {
  const { data, error } = await supabase.rpc('guest_session_preview', { p_event: eventId, p_token: token });
  if (error) throw error;
  const r: any = Array.isArray(data) ? data[0] : data;
  if (!r) return null;
  return {
    id: r.id, title: r.title, sport: r.sport, startsAt: new Date(r.starts_at), endsAt: r.ends_at ? new Date(r.ends_at) : null,
    place: r.place ?? null, city: r.city ?? null, host: r.host ?? null, community: r.community ?? null,
    going: r.going ?? 0, capacity: r.capacity ?? null, womenOnly: !!r.women_only, imageUrl: r.image_url ?? null,
  };
}

/** Join a session as a guest with its link. Same checks as joining (women only, capacity). */
export async function joinAsGuest(eventId: string, token: string): Promise<'going' | 'waitlist'> {
  const { data, error } = await supabase.rpc('join_as_guest', { p_event: eventId, p_token: token });
  if (error) throw toSessionError(error);
  invalidate('sessions:');
  return data === 'waitlist' ? 'waitlist' : 'going';
}
