import { sportIdOf, SportId } from '../lib/sports';
import type { Person } from '../components/board/people';

export type SessionState = 'upcoming' | 'live' | 'finished' | 'cancelled';
export type MyStatus = 'going' | 'waitlist' | null;

export interface Session {
  id: string;
  title: string;
  sport: SportId;
  rawType: string;
  startsAt: Date;
  endsAt: Date;
  durationMin: number;
  place: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  coachName: string | null;
  capacity: number | null;
  goingCount: number;
  spotsLeft: number | null;
  isFull: boolean;
  womenOnly: boolean;
  packOnly: boolean;
  packId: string | null;
  packName: string | null;
  communityId: string | null;
  communityName: string | null;
  /** Lives in a private (invite-code) community: only its members see it. */
  communityPrivate: boolean;
  /** Price per spot in SAR, when paid sessions are switched on (PAYMENTS_ENABLED). */
  priceSar: number | null;
  /** The plan for the session, when the host attached a workout the viewer can see. */
  workout: { id: string; title: string; titleAr: string | null; minutes: number | null } | null;
  host: Person | null;
  hostId: string | null;
  roster: Person[];
  myStatus: MyStatus;
  isHost: boolean;
  isMine: boolean;
  state: SessionState;
  cancelledAt: Date | null;
}

/** Sessions without an explicit end are assumed to run this long (matches the DB rules). */
export const DEFAULT_DURATION_MIN = 120;

export const SESSION_SELECT = `
  id, title, description, event_type, starts_at, ends_at, location_name, location_city, gym_name,
  country, location_lat, location_lng, image_url, max_capacity, going_count, created_by,
  is_women_only, visibility, pack_id, community_id, price_sar, difficulty, coach_name, cancelled_at, workout_id,
  pack:packs(id, name),
  workout:workouts(id, title, title_ar, duration_minutes),
  community:communities(id, name, visibility, is_default),
  host:profiles!events_created_by_fkey(id, display_name, full_name, avatar_url),
  roster:event_rsvps(user_id, status, created_at, profile:profiles(id, display_name, full_name, avatar_url))
`;

export function personOf(profile: any): Person | null {
  if (!profile?.id) return null;
  return {
    id: profile.id,
    name: profile.display_name || profile.full_name || '',
    avatarUrl: profile.avatar_url || null,
  };
}

export function sessionState(start: Date, end: Date, cancelledAt: Date | null, now = Date.now()): SessionState {
  if (cancelledAt) return 'cancelled';
  if (end.getTime() < now) return 'finished';
  if (start.getTime() <= now) return 'live';
  return 'upcoming';
}

export function toSession(row: any, meId: string | null | undefined, myStatus?: MyStatus, now = Date.now()): Session {
  const startsAt = new Date(row.starts_at);
  const endsAt = row.ends_at ? new Date(row.ends_at) : new Date(startsAt.getTime() + DEFAULT_DURATION_MIN * 60000);
  const cancelledAt = row.cancelled_at ? new Date(row.cancelled_at) : null;
  const roster: Person[] = (row.roster || [])
    .filter((r: any) => r.status === 'going' && r.profile)
    .sort((a: any, b: any) => (a.created_at || '').localeCompare(b.created_at || ''))
    .map((r: any) => personOf(r.profile)!)
    .filter(Boolean);
  const inRoster = !!meId && (row.roster || []).find((r: any) => r.user_id === meId);
  const status: MyStatus = myStatus ?? (inRoster ? (inRoster.status === 'waitlist' ? 'waitlist' : inRoster.status === 'going' ? 'going' : null) : null);
  const goingCount = typeof row.going_count === 'number' ? row.going_count : roster.length;
  const capacity = row.max_capacity ?? null;
  const spotsLeft = capacity != null ? Math.max(0, capacity - goingCount) : null;
  const isHost = !!meId && row.created_by === meId;
  return {
    id: row.id,
    title: (row.title || '').trim(),
    sport: sportIdOf(row.event_type || row.sport?.name),
    rawType: row.event_type || '',
    startsAt,
    endsAt,
    durationMin: Math.max(15, Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)),
    place: row.location_name || row.gym_name || null,
    city: row.location_city || null,
    country: row.country || null,
    lat: row.location_lat != null ? Number(row.location_lat) : null,
    lng: row.location_lng != null ? Number(row.location_lng) : null,
    imageUrl: row.image_url || null,
    description: row.description || null,
    difficulty: row.difficulty === 'easy' || row.difficulty === 'medium' || row.difficulty === 'hard' ? row.difficulty : null,
    coachName: row.coach_name || null,
    capacity,
    goingCount,
    spotsLeft,
    isFull: capacity != null && goingCount >= capacity,
    womenOnly: !!row.is_women_only,
    packOnly: row.visibility === 'pack',
    packId: row.pack_id || null,
    packName: row.pack?.name || null,
    communityId: row.community_id || null,
    communityName: row.community?.name || null,
    communityPrivate: row.community?.visibility === 'private',
    priceSar: row.price_sar != null ? Number(row.price_sar) : null,
    workout: row.workout?.id
      ? { id: row.workout.id, title: row.workout.title || '', titleAr: row.workout.title_ar || null, minutes: row.workout.duration_minutes ?? null }
      : null,
    host: personOf(row.host),
    hostId: row.created_by || null,
    roster,
    myStatus: status,
    isHost,
    isMine: isHost || status === 'going' || status === 'waitlist',
    state: sessionState(startsAt, endsAt, cancelledAt, now),
    cancelledAt,
  };
}
