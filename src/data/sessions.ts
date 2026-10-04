import { cityKey, cityKeys } from '../lib/cities';
import { supabase } from '../lib/supabase';
import { cancelEventReminder } from '../lib/notifications';
import { useAuth } from '../providers/AuthProvider';
import { useMemo } from 'react';
import { useQuery, invalidate } from './query';
import { MyStatus, Session, SESSION_SELECT, toSession, personOf } from './model';
import { PREVIEW, PREVIEW_ME, previewMyRsvps, previewSessionRows } from './preview';
import { addDays, startOfLocalDay } from '../i18n/format';
import { uploadImage } from '../lib/upload';
import type { Person } from '../components/board/people';
import { CodedError, codeFrom } from './errors';

export type JoinResult = 'going' | 'waitlist';
const SESSION_CODES = [
  'WOMEN_ONLY_HOST', 'GENDER_NEEDED', 'LINK_INVALID', 'GUESTS_OFF', 'WOMEN_ONLY', 'PACK_ONLY', 'COMMUNITY_ONLY',
  'GUESTS_FULL', 'EVENT_OVER', 'EVENT_CANCELLED', 'EVENT_NOT_FOUND', 'NOT_HOST',
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
        .select(SESSION_SELECT)
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
        .limit(8, { referencedTable: 'roster' })
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
      const [ev, rsvp] = await Promise.all([
        supabase.from('events').select(SESSION_SELECT).eq('id', id!).maybeSingle(),
        supabase.from('event_rsvps').select('status').eq('event_id', id!).eq('user_id', meId!).in('status', ['going', 'waitlist']).maybeSingle(),
      ]);
      if (ev.error) throw ev.error;
      if (rsvp.error) throw rsvp.error;
      row = ev.data;
      myStatus = (rsvp.data?.status as MyStatus) ?? null;
    }
    if (!row) return null;
    const s = toSession(row, meId, myStatus);
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
      let q = supabase.from('events').select(SESSION_SELECT).eq('roster.status', 'going').gte('starts_at', since.toISOString());
      q = ids.length ? q.or(`id.in.(${ids.join(',')}),created_by.eq.${meId}`) : q.eq('created_by', meId!);
      const { data, error } = await q
        .order('starts_at', { ascending: true })
        .order('created_at', { referencedTable: 'roster', ascending: true })
        .limit(8, { referencedTable: 'roster' })
        .limit(300);
      if (error) throw error;
      rows = data || [];
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
  /** Let people outside the community join with the session's link. */
  guestInvite?: boolean;
  packId?: string | null;
  /** Where the session lives when it isn't pack-only (defaults to the open community). */
  communityId?: string | null;
  priceSar?: number | null;
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
      class_series_id: series,
  });
  const { data, error } = await supabase.from('events').insert(row(0, null)).select('id').single();
  if (error) throw toSessionError(error);
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


// ─── Guests invited by link ─────────────────────────────────────────────────
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
