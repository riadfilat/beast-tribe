import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_ME, previewWorkoutRows } from './preview';
import { postToPackChat } from './chat';
import { sportIdOf, SportId } from '../lib/sports';
import type { Person } from '../components/board/people';

// Train: the Operation Beast library plus coaches' workouts, written as blocks on the board.
// Members read what's published to everyone or to their communities (the database decides);
// finishing a coach's workout counts as a paid use for that coach (the database decides that too).

export type WorkoutFormat = 'amrap' | 'emom' | 'for_time' | 'rounds' | 'intervals' | 'steady' | 'flow' | 'strength';
export type WorkoutLevel = 'easy' | 'medium' | 'hard' | 'any';

export interface WorkoutItem {
  name: string;
  /** Exercise library slug, when the move is in the library. */
  ex: string | null;
  reps: string | null;
  note: string | null;
}

export interface WorkoutBlock {
  title: string;
  format: WorkoutFormat | null;
  minutes: number | null;
  rounds: number | null;
  note: string | null;
  items: WorkoutItem[];
}

export interface Workout {
  id: string;
  title: string;
  description: string | null;
  sport: SportId;
  format: WorkoutFormat | null;
  level: WorkoutLevel;
  minutes: number;
  equipment: string[];
  imageUrl: string | null;
  blocks: WorkoutBlock[];
  source: 'library' | 'coach';
  /** The coach who wrote it (library workouts are by Operation Beast). */
  coach: (Person & { partnerId: string }) | null;
  /** Set when it's published to one community only. */
  community: { id: string; name: string } | null;
  featured: boolean;
  publishedAt: Date | null;
  doneWeek: number;
  doneTotal: number;
  saved: boolean;
}

export interface WorkoutLog {
  id: string;
  workoutId: string | null;
  title: string;
  minutes: number | null;
  result: string | null;
  rpe: number | null;
  completedAt: Date;
}

const FORMATS: WorkoutFormat[] = ['amrap', 'emom', 'for_time', 'rounds', 'intervals', 'steady', 'flow', 'strength'];
const asFormat = (v: any): WorkoutFormat | null => (FORMATS.includes(v) ? v : null);
const num = (v: any): number | null => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v));

function levelOf(d?: string | null): WorkoutLevel {
  if (d === 'beginner' || d === 'easy') return 'easy';
  if (d === 'intermediate' || d === 'medium') return 'medium';
  if (d === 'advanced' || d === 'hard') return 'hard';
  return 'any';
}

const pick = (lang: string, en: any, ar: any): string => (lang === 'ar' && ar ? String(ar) : en != null ? String(en) : '');

function toBlocks(raw: any, lang: string): WorkoutBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((b: any) => ({
    title: pick(lang, b?.title, b?.title_ar),
    format: asFormat(b?.format),
    minutes: num(b?.minutes),
    rounds: num(b?.rounds),
    note: pick(lang, b?.note, b?.note_ar) || null,
    items: (Array.isArray(b?.items) ? b.items : []).map((i: any) => ({
      name: pick(lang, i?.name, i?.name_ar),
      ex: typeof i?.ex === 'string' && i.ex ? i.ex : null,
      reps: pick(lang, i?.reps, i?.reps_ar) || null,
      note: pick(lang, i?.note, i?.note_ar) || null,
    })),
  }));
}

export const WORKOUT_SELECT = `
  id, title, title_ar, description, description_ar, sport, format, difficulty, duration_minutes,
  equipment, image_url, blocks, source, featured, published_at, community_id,
  community:communities(id, name),
  author:partners!workouts_author_partner_id_fkey(id, business_name, name, logo_url, user_id)
`;

// partners.user_id points at auth.users, not profiles, so PostgREST can't embed the coach's
// profile (asking for it failed the whole query and emptied the Train tab). Fetch it separately.
async function withAuthorProfiles(rows: any[]) {
  const ids = Array.from(new Set(rows.map((r) => r.author?.user_id).filter(Boolean)));
  if (!ids.length) return rows;
  const { data } = await supabase.from('profiles').select('id, display_name, full_name, avatar_url').in('id', ids);
  const byId = new Map((data || []).map((p: any) => [p.id, p]));
  return rows.map((r) => (r.author?.user_id ? { ...r, author: { ...r.author, profile: byId.get(r.author.user_id) ?? null } } : r));
}

export function toWorkout(r: any, lang: string, counts?: Map<string, { week: number; total: number }>, saved?: Set<string>): Workout {
  const a = r.author;
  const coach = a?.id
    ? {
        id: a.user_id || a.id,
        partnerId: a.id,
        name: a.business_name || a.name || a.profile?.display_name || a.profile?.full_name || '',
        avatarUrl: a.profile?.avatar_url || a.logo_url || null,
      }
    : null;
  const c = counts?.get(r.id);
  return {
    id: r.id,
    title: pick(lang, r.title, r.title_ar).trim(),
    description: pick(lang, r.description, r.description_ar) || null,
    sport: sportIdOf(r.sport),
    format: asFormat(r.format),
    level: levelOf(r.difficulty),
    minutes: Number(r.duration_minutes) || 0,
    equipment: Array.isArray(r.equipment) ? r.equipment : [],
    imageUrl: r.image_url || null,
    blocks: toBlocks(r.blocks, lang),
    source: r.source === 'coach' ? 'coach' : 'library',
    coach: r.source === 'coach' ? coach : null,
    community: r.community?.id ? { id: r.community.id, name: r.community.name || '' } : null,
    featured: !!r.featured,
    publishedAt: r.published_at ? new Date(r.published_at) : null,
    doneWeek: c?.week ?? 0,
    doneTotal: c?.total ?? 0,
    saved: !!saved?.has(r.id),
  };
}

function useMe() {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

async function countsFor(ids: string[]) {
  const map = new Map<string, { week: number; total: number }>();
  if (!ids.length) return map;
  const { data } = await supabase.rpc('workout_done_counts', { p_ids: ids });
  (data || []).forEach((r: any) => map.set(r.workout_id, { week: r.done_week || 0, total: r.done_total || 0 }));
  return map;
}

async function savedSet(meId: string) {
  const { data } = await supabase.from('workout_saves').select('workout_id').eq('user_id', meId);
  return new Set<string>((data || []).map((r: any) => r.workout_id));
}

// Preview: counts and saves that make the screens read like a living library.
const PREVIEW_COUNTS = new Map<string, { week: number; total: number }>([
  ['w-engine', { week: 38, total: 412 }],
  ['w-nokit', { week: 61, total: 980 }],
  ['w-desk', { week: 27, total: 305 }],
  ['w-padel', { week: 19, total: 140 }],
  ['w-reem', { week: 23, total: 96 }],
  ['w-faisal', { week: 14, total: 58 }],
]);
const previewSaved = new Set<string>(['w-desk']);

/** Everything the member can train: featured first, then newest. */
export function useWorkouts(lang: string) {
  const me = useMe();
  return useQuery<Workout[]>(me ? `workouts:list:${lang}:${me}` : null, async () => {
    if (PREVIEW) return previewWorkoutRows().map((r) => toWorkout(r, lang, PREVIEW_COUNTS, previewSaved));
    const { data, error } = await supabase
      .from('workouts')
      .select(WORKOUT_SELECT)
      .eq('status', 'published')
      .eq('program_only', false)
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      // The whole library (about 12 per sport) plus coach workouts; sport and level filters run on the phone.
      .limit(500);
    if (error) throw error;
    const rows = await withAuthorProfiles(data || []);
    const [counts, saved] = await Promise.all([countsFor(rows.map((r: any) => r.id)), savedSet(me!)]);
    return rows.map((r: any) => toWorkout(r, lang, counts, saved));
  });
}

export function useWorkout(id: string | null | undefined, lang: string) {
  const me = useMe();
  return useQuery<Workout | null>(id && me ? `workouts:one:${id}:${lang}` : null, async () => {
    if (PREVIEW) {
      const r = previewWorkoutRows().find((x) => x.id === id);
      return r ? toWorkout(r, lang, PREVIEW_COUNTS, previewSaved) : null;
    }
    const { data, error } = await supabase.from('workouts').select(WORKOUT_SELECT).eq('id', id!).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [row] = await withAuthorProfiles([data]);
    const [counts, saved] = await Promise.all([countsFor([row.id]), savedSet(me!)]);
    return toWorkout(row, lang, counts, saved);
  });
}

/** Today's workout: the one Operation Beast features, else a different library workout each day. */
export function todaysWorkout(list: Workout[], now = new Date()): Workout | null {
  if (!list.length) return null;
  const featured = list.find((w) => w.featured);
  if (featured) return featured;
  const lib = list.filter((w) => w.source === 'library');
  const pool = lib.length ? lib : list;
  const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[day % sorted.length];
}

export async function setSaved(meId: string, workoutId: string, saved: boolean) {
  if (PREVIEW) {
    saved ? previewSaved.add(workoutId) : previewSaved.delete(workoutId);
    invalidate('workouts:');
    return;
  }
  if (saved) {
    const { error } = await supabase.from('workout_saves').upsert({ user_id: meId, workout_id: workoutId }, { onConflict: 'user_id,workout_id' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('workout_saves').delete().eq('user_id', meId).eq('workout_id', workoutId);
    if (error) throw error;
  }
  invalidate('workouts:');
}

export interface LogInput {
  workoutId: string | null;
  title: string;
  startedAt: Date;
  minutes: number;
  result?: string | null;
  rpe?: number | null;
  notes?: string | null;
  eventId?: string | null;
  /** The plan session this finishes, when it's part of a program. */
  programSessionId?: string | null;
}

/** Save what the member did. The database decides whether it counts as a coach's paid use. */
export async function logWorkout(meId: string, input: LogInput): Promise<{ id: string }> {
  if (PREVIEW) {
    previewLogs.unshift({ id: `log-${Date.now()}`, workoutId: input.workoutId, title: input.title, minutes: input.minutes, result: input.result ?? null, rpe: input.rpe ?? null, completedAt: new Date() });
    invalidate('workouts:');
    return { id: previewLogs[0].id };
  }
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: meId,
      workout_id: input.workoutId,
      title: input.title,
      started_at: input.startedAt.toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: Math.max(1, Math.round(input.minutes)),
      result: input.result?.trim() || null,
      rpe: input.rpe ?? null,
      notes: input.notes?.trim() || null,
      event_id: input.eventId ?? null,
      program_session_id: input.programSessionId ?? null,
      source: 'app',
    })
    .select('id')
    .single();
  if (error) throw error;
  invalidate('workouts:');
  invalidate('programs:');
  invalidate('metrics:');
  return { id: data.id };
}

/** Where a finished workout goes: nowhere, a community's feed, or a pack's chat. */
export type ShareTarget = { kind: 'none' } | { kind: 'community'; id: string; name: string } | { kind: 'pack'; id: string; name: string };

/** Share a finished workout: a post on that community's feed, or a message in the pack's chat. */
export async function shareWorkout(meId: string, input: { logId: string; workoutId: string | null; content: string; target: ShareTarget }) {
  if (PREVIEW || input.target.kind === 'none') return;
  if (input.target.kind === 'pack') {
    await postToPackChat(meId, input.target.id, input.content);
    return;
  }
  const { error } = await supabase.from('feed_posts').insert({
    user_id: meId,
    content: input.content.trim(),
    workout_log_id: input.logId,
    workout_id: input.workoutId,
    community_id: input.target.id,
    post_type: 'workout',
    is_visible: true,
  });
  if (error) throw error;
  invalidate('feed:');
}

const previewLogs: WorkoutLog[] = [];

/** The member's own training log, newest first. */
export function useMyWorkoutLogs(limit = 10, lang: string = 'en') {
  const me = useMe();
  return useQuery<WorkoutLog[]>(me ? `workouts:logs:${me}:${lang}` : null, async () => {
    if (PREVIEW) return previewLogs.slice(0, limit);
    const { data, error } = await supabase
      .from('workout_logs')
      .select('id, workout_id, title, duration_minutes, result, rpe, completed_at, workout:workouts(title, title_ar)')
      .eq('user_id', me!)
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      workoutId: r.workout_id,
      title: (r.workout ? pick(lang, r.workout.title, r.workout.title_ar).trim() : '') || r.title || '',
      minutes: r.duration_minutes ?? null,
      result: r.result ?? null,
      rpe: r.rpe ?? null,
      completedAt: new Date(r.completed_at),
    }));
  });
}

/** The time-based length of a step ("3 min", "90 s", "30 ث", "2 د"), in seconds, if it has one. */
export function stepSeconds(reps: string | null): number | null {
  if (!reps) return null;
  const m = reps.trim().match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds|min|mins|minutes|ث|د)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  return unit.startsWith('m') || unit === 'د' ? Math.round(n * 60) : Math.round(n);
}
