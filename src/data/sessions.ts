import { supabase } from '../lib/supabase';
import { cancelEventReminder } from '../lib/notifications';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { MyStatus, Session, SESSION_SELECT, toSession, personOf } from './model';
import { PREVIEW, PREVIEW_ME, previewMyRsvps, previewSessionRows } from './preview';
import { addDays, startOfLocalDay } from '../i18n/format';
import { uploadImage } from '../lib/upload';
import type { Person } from '../components/board/people';

export type JoinResult = 'going' | 'waitlist';
export type SessionErrorCode =
  | 'WOMEN_ONLY' | 'PACK_ONLY' | 'COMMUNITY_ONLY' | 'EVENT_OVER' | 'EVENT_CANCELLED' | 'EVENT_NOT_FOUND' | 'NOT_HOST' | 'generic';

export class SessionError extends Error {
  code: SessionErrorCode;
  constructor(code: SessionErrorCode, message?: string) {
    super(message || code);
    this.code = code;
  }
}

function toSessionError(e: any): SessionError {
  const m = String(e?.message || e || '');
  const hit = m.match(/WOMEN_ONLY|PACK_ONLY|COMMUNITY_ONLY|EVENT_OVER|EVENT_CANCELLED|EVENT_NOT_FOUND|NOT_HOST/);
  return new SessionError((hit?.[0] as SessionErrorCode) || 'generic', m);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function useMe() {
  const { user, profile } = useAuth();
  return { meId: PREVIEW ? PREVIEW_ME : user?.id ?? null, profile };
}

async function fetchMyRsvps(meId: string): Promise<Map<string, MyStatus>> {
  const map = new Map<string, MyStatus>();
  if (PREVIEW) {
    previewMyRsvps().forEach((r) => map.set(r.event_id, r.status as MyStatus));
    return map;
  }
  const { data, error } = await supabase
    .from('event_rsvps')
    .select('event_id, status')
    .eq('user_id', meId)
    .in('status', ['going', 'waitlist']);
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
export function useBoardSessions(days = 8) {
  const { meId, profile } = useMe();
  const country = profile?.region || 'SA';
  const key = meId ? `sessions:board:${meId}:${country}:${days}` : null;
  return useQuery<Session[]>(key, async () => {
    const mine = await fetchMyRsvps(meId!);
    let rows: any[];
    if (PREVIEW) {
      rows = previewSessionRows();
    } else {
      const from = startOfLocalDay(new Date());
      const to = addDays(from, days);
      const { data, error } = await supabase
        .from('events')
        .select(SESSION_SELECT)
        .gte('starts_at', from.toISOString())
        .lt('starts_at', to.toISOString())
        .eq('country', country)
        .eq('roster.status', 'going')
        .order('starts_at', { ascending: true })
        .order('created_at', { referencedTable: 'roster', ascending: true })
        .limit(8, { referencedTable: 'roster' });
      if (error) throw error;
      rows = data || [];
    }
    const now = Date.now();
    return rows
      .map((r) => toSession(r, meId, mine.get(r.id) ?? null, now))
      .filter((s) => visible(s, profile?.gender));
  });
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
    if (PREVIEW) {
      row = previewSessionRows().find((r) => r.id === id) ?? null;
    } else {
      const { data, error } = await supabase.from('events').select(SESSION_SELECT).eq('id', id!).maybeSingle();
      if (error) throw error;
      row = data;
    }
    if (!row) return null;
    const mine = await fetchMyRsvps(meId!);
    const s = toSession(row, meId, mine.get(row.id) ?? null);
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
    const mine = await fetchMyRsvps(meId!);
    let rows: any[];
    if (PREVIEW) {
      rows = previewSessionRows().filter((r) => mine.has(r.id) || r.created_by === meId);
    } else {
      const ids = Array.from(mine.keys());
      let q = supabase.from('events').select(SESSION_SELECT).eq('roster.status', 'going');
      q = ids.length ? q.or(`id.in.(${ids.join(',')}),created_by.eq.${meId}`) : q.eq('created_by', meId!);
      const { data, error } = await q
        .order('starts_at', { ascending: true })
        .order('created_at', { referencedTable: 'roster', ascending: true })
        .limit(8, { referencedTable: 'roster' });
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
  packId?: string | null;
  /** Where the session lives when it isn't pack-only (defaults to the open community). */
  communityId?: string | null;
  priceSar?: number | null;
  /** A workout from Train as the session's plan. */
  workoutId?: string | null;
  coachName?: string | null;
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
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: input.title.trim(),
      event_type: input.sport,
      starts_at: input.startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location_name: input.place?.trim() || null,
      location_city: input.city?.trim() || null,
      location_lat: input.lat ?? null,
      location_lng: input.lng ?? null,
      max_capacity: input.capacity ?? null,
      difficulty: input.difficulty ?? null,
      is_women_only: !!input.womenOnly,
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
    })
    .select('id')
    .single();
  if (error) throw toSessionError(error);
  await supabase.from('event_rsvps').upsert({ event_id: data.id, user_id: meId, status: 'going' }, { onConflict: 'event_id,user_id' });
  invalidate('sessions:');
  return { id: data.id, photoFailed };
}
