import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW } from './preview';

// Programs: multi-week plans built from library workouts. A member follows one plan at a time;
// "next up" is the first session of the plan without a finished log since they started it.
// A week focus lets them train something else for a week without losing their place.

export type Goal = 'strength' | 'calisthenics' | 'home' | 'running' | 'padel' | 'hyrox' | 'busy';
export type TrainLevel = 'beginner' | 'intermediate' | 'advanced';
export const GOALS: Goal[] = ['strength', 'calisthenics', 'running', 'padel', 'hyrox', 'home', 'busy'];
export const GOAL_SPORT: Record<Goal, string> = {
  strength: 'gym', calisthenics: 'gym', home: 'gym', running: 'running', padel: 'padel', hyrox: 'hyrox', busy: 'crossfit',
};

/** The plan that fits a goal (and level, where there's more than one). */
export function recommendedSlug(goal: Goal, level: TrainLevel | null): string {
  switch (goal) {
    case 'strength': return level === 'beginner' ? 'home-strength' : 'strength-base';
    case 'calisthenics': return 'calisthenics-start';
    case 'home': return 'home-strength';
    case 'running': return 'first-5k';
    case 'padel': return 'padel-fit';
    case 'hyrox': return 'hyrox-ready';
    case 'busy': return 'busy-week';
  }
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  summary: string;
  goal: Goal;
  sport: string;
  level: 'easy' | 'medium' | 'hard';
  weeks: number;
  daysPerWeek: number;
  minutes: number | null;
  equipment: string[];
  principles: string[];
}

export interface ProgramSession {
  id: string;
  week: number;
  day: number;
  workoutId: string;
  focus: string;
  title: string;
  minutes: number;
  done: boolean;
}

export interface MyPlan {
  enrollmentId: string;
  startedAt: Date;
  program: Program;
  sessions: ProgramSession[];
  next: ProgramSession | null;
  doneCount: number;
  /** The week the member is on (the next session's week, or the last week when finished). */
  week: number;
  finished: boolean;
}

const loc = (lang: string, en: any, ar: any) => (lang === 'ar' && ar ? String(ar) : en != null ? String(en) : '');

function toProgram(r: any, lang: string): Program {
  return {
    id: r.id,
    slug: r.slug,
    title: loc(lang, r.title, r.title_ar),
    summary: loc(lang, r.summary, r.summary_ar),
    goal: r.goal,
    sport: r.sport,
    level: r.level,
    weeks: r.weeks,
    daysPerWeek: r.days_per_week,
    minutes: r.minutes,
    equipment: r.equipment ?? [],
    principles: (Array.isArray(r.principles) ? r.principles : []).map((x: any) => loc(lang, x?.en, x?.ar)).filter(Boolean),
  };
}

async function sessionsOf(programId: string, lang: string, doneIds: Set<string>): Promise<ProgramSession[]> {
  const { data, error } = await supabase
    .from('program_sessions')
    .select('id, week, day, workout_id, focus, focus_ar, workout:workouts(title, title_ar, duration_minutes)')
    .eq('program_id', programId)
    .order('week')
    .order('day');
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: s.id,
    week: s.week,
    day: s.day,
    workoutId: s.workout_id,
    focus: loc(lang, s.focus, s.focus_ar),
    title: loc(lang, s.workout?.title, s.workout?.title_ar),
    minutes: s.workout?.duration_minutes ?? 0,
    done: doneIds.has(s.id),
  }));
}

export function usePrograms(lang: string) {
  const { user } = useAuth();
  return useQuery<Program[]>(!PREVIEW && user ? `programs:list:${lang}` : null, async () => {
    const { data, error } = await supabase.from('programs').select('*').eq('status', 'published').order('sort');
    if (error) throw error;
    return (data || []).map((r) => toProgram(r, lang));
  });
}

export function useProgram(slug: string | null | undefined, lang: string) {
  const { user } = useAuth();
  return useQuery<{ program: Program; sessions: ProgramSession[] } | null>(!PREVIEW && user && slug ? `programs:one:${slug}:${lang}` : null, async () => {
    const { data, error } = await supabase.from('programs').select('*').eq('slug', slug!).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { program: toProgram(data, lang), sessions: await sessionsOf(data.id, lang, new Set()) };
  });
}

/** The member's active plan, with what's done and what's next. */
export function useMyPlan(lang: string) {
  const { user } = useAuth();
  return useQuery<MyPlan | null>(!PREVIEW && user ? `programs:mine:${lang}:${user.id}` : null, async () => {
    const { data: en, error } = await supabase
      .from('program_enrollments')
      .select('id, started_at, program:programs(*)')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw error;
    if (!en?.program) return null;
    const program = toProgram(en.program, lang);
    const { data: logs } = await supabase
      .from('workout_logs')
      .select('program_session_id')
      .eq('user_id', user!.id)
      .not('program_session_id', 'is', null)
      .gte('completed_at', en.started_at);
    const done = new Set<string>((logs || []).map((l: any) => l.program_session_id));
    const sessions = await sessionsOf(program.id, lang, done);
    const next = sessions.find((s) => !s.done) ?? null;
    return {
      enrollmentId: en.id,
      startedAt: new Date(en.started_at),
      program,
      sessions,
      next,
      doneCount: sessions.filter((s) => s.done).length,
      week: next ? next.week : program.weeks,
      finished: !next && sessions.length > 0,
    };
  });
}

/** Start a plan (ends any other active plan first). */
export async function startPlan(meId: string, programId: string) {
  await supabase.from('program_enrollments').update({ status: 'left', ended_at: new Date().toISOString() }).eq('user_id', meId).eq('status', 'active');
  const { error } = await supabase.from('program_enrollments').insert({ user_id: meId, program_id: programId, status: 'active' });
  if (error) throw error;
  invalidate('programs:');
}

export async function leavePlan(meId: string) {
  const { error } = await supabase.from('program_enrollments').update({ status: 'left', ended_at: new Date().toISOString() }).eq('user_id', meId).eq('status', 'active');
  if (error) throw error;
  invalidate('programs:');
}

/** End of the current Saudi week (Saturday), as YYYY-MM-DD. */
export function endOfWeek(now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The week's focus, if one is set and hasn't run out. */
export function activeWeekFocus(profile: any, now = new Date()): Goal | null {
  const f = profile?.week_focus as Goal | null;
  const until = profile?.week_focus_until as string | null;
  if (!f || !until) return null;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return today <= until ? f : null;
}

export async function saveTrainingFocus(meId: string, input: { goal: Goal; level: TrainLevel; days: number }) {
  const { error } = await supabase.from('profiles').update({ train_goal: input.goal, train_level: input.level, train_days: input.days }).eq('id', meId);
  if (error) throw error;
}

export async function setWeekFocus(meId: string, goal: Goal | null) {
  const { error } = await supabase
    .from('profiles')
    .update({ week_focus: goal, week_focus_until: goal ? endOfWeek() : null })
    .eq('id', meId);
  if (error) throw error;
}

/** Sessions for a week focus: three sessions of that goal's plan at the member's level. */
export function useFocusSessions(goal: Goal | null, level: TrainLevel | null, lang: string) {
  const slug = goal ? recommendedSlug(goal, level) : null;
  const q = useProgram(slug, lang);
  const week = level === 'advanced' ? 5 : level === 'intermediate' ? 3 : 1;
  const sessions = q.data?.sessions ?? [];
  const w = Math.min(week, q.data?.program.weeks ?? 1);
  return { program: q.data?.program ?? null, sessions: sessions.filter((s) => s.week === w).slice(0, 3), loading: q.loading };
}
