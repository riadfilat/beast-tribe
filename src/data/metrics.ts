import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery } from './query';
import { PREVIEW } from './preview';
import { e1rm } from './sets';
import { sportIdOf } from '../lib/sports';
import { localDateKey } from '../i18n/format';

// Training metrics for the You page: plain measurements of what the member actually did.
// Weekly time and sessions, active days, hard sets per muscle group against the evidence-based
// range (about 10–20 per week for growth), personal bests, effort trend and sports played.

export interface PersonalBest {
  exercise: string;
  kg: number | null;
  reps: number;
  e1rm: number | null;
  at: Date;
}

export interface TrainingMetrics {
  /** Monday-free, Sunday-start weeks (Saudi week), oldest first: minutes and sessions. */
  weeks: { start: Date; minutes: number; sessions: number }[];
  /** Days with training or a session, as YYYY-MM-DD. */
  activeDays: Set<string>;
  thisWeek: { sessions: number; minutes: number; sets: number };
  /** Hard sets this week per exercise slug (grouped by muscle in the UI with the library). */
  setsByExercise: Map<string, number>;
  bests: PersonalBest[];
  effort: { recent: number | null; before: number | null };
  sports: { sport: string; count: number }[];
}

const dayKey = localDateKey;
function weekStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // Sunday
  return x;
}

export function useTrainingMetrics(weeksBack = 12) {
  const { user } = useAuth();
  return useQuery<TrainingMetrics>(!PREVIEW && user ? `metrics:training:${user.id}` : null, async () => {
    const me = user!.id;
    const now = new Date();
    const first = weekStart(now);
    first.setDate(first.getDate() - 7 * (weeksBack - 1));
    const since = first.toISOString();

    const [logsR, setsR, rsvpR, bestR] = await Promise.all([
      supabase.from('workout_logs').select('completed_at, duration_minutes, rpe, workout:workouts(sport)').eq('user_id', me).gte('completed_at', since),
      supabase.from('workout_sets').select('exercise, reps, created_at').eq('user_id', me).gte('created_at', weekStart(now).toISOString()),
      supabase.from('event_rsvps').select('event:events(starts_at, ends_at, cancelled_at, sport:sports(name))').eq('user_id', me).eq('status', 'going'),
      supabase.from('workout_sets').select('exercise, reps, weight_kg, created_at').eq('user_id', me).order('created_at', { ascending: false }).limit(2000),
    ]);
    if (logsR.error) throw logsR.error;

    const weeks = Array.from({ length: weeksBack }, (_, i) => {
      const start = new Date(first);
      start.setDate(first.getDate() + i * 7);
      return { start, minutes: 0, sessions: 0 };
    });
    const weekIdx = (d: Date) => Math.floor((weekStart(d).getTime() - first.getTime()) / (7 * 86400000));
    const activeDays = new Set<string>();
    const sportCount = new Map<string, number>();
    const rpes: { at: Date; rpe: number }[] = [];

    for (const l of logsR.data || []) {
      const at = new Date((l as any).completed_at);
      const i = weekIdx(at);
      if (i >= 0 && i < weeksBack) {
        weeks[i].minutes += (l as any).duration_minutes || 0;
        weeks[i].sessions += 1;
      }
      activeDays.add(dayKey(at));
      if ((l as any).rpe) rpes.push({ at, rpe: (l as any).rpe });
      const sp = sportIdOf((l as any).workout?.sport);
      if (sp && sp !== 'other') sportCount.set(sp, (sportCount.get(sp) ?? 0) + 1);
    }
    for (const r of rsvpR.data || []) {
      const e: any = (r as any).event;
      if (!e || e.cancelled_at) continue;
      const start = new Date(e.starts_at);
      const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 90 * 60000);
      if (end > now) continue; // only sessions that happened
      const sp = sportIdOf(e.sport?.name);
      if (sp && sp !== 'other') sportCount.set(sp, (sportCount.get(sp) ?? 0) + 1);
      if (start < first) continue;
      const i = weekIdx(start);
      if (i >= 0 && i < weeksBack) {
        weeks[i].sessions += 1;
        weeks[i].minutes += Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
      }
      activeDays.add(dayKey(start));
    }

    const setsByExercise = new Map<string, number>();
    let setsThisWeek = 0;
    for (const s of setsR.data || []) {
      if (!(s as any).reps) continue;
      setsThisWeek += 1;
      setsByExercise.set((s as any).exercise, (setsByExercise.get((s as any).exercise) ?? 0) + 1);
    }

    // Personal bests: heaviest estimated 1RM per loaded exercise, most reps per bodyweight one.
    const best = new Map<string, PersonalBest>();
    for (const s of bestR.data || []) {
      const reps = (s as any).reps as number;
      if (!reps) continue;
      const kg = (s as any).weight_kg != null ? Number((s as any).weight_kg) : null;
      const score = kg ? e1rm(kg, reps) : null;
      const cur = best.get((s as any).exercise);
      const better = !cur || (score != null ? score > (cur.e1rm ?? 0) : cur.e1rm == null && reps > cur.reps);
      if (better) best.set((s as any).exercise, { exercise: (s as any).exercise, kg, reps, e1rm: score, at: new Date((s as any).created_at) });
    }
    const bests = Array.from(best.values()).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);

    const fourWeeks = 28 * 86400000;
    const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
    const effort = {
      recent: avg(rpes.filter((r) => now.getTime() - r.at.getTime() <= fourWeeks).map((r) => r.rpe)),
      before: avg(rpes.filter((r) => now.getTime() - r.at.getTime() > fourWeeks && now.getTime() - r.at.getTime() <= 2 * fourWeeks).map((r) => r.rpe)),
    };

    const last = weeks[weeks.length - 1];
    return {
      weeks,
      activeDays,
      thisWeek: { sessions: last.sessions, minutes: last.minutes, sets: setsThisWeek },
      setsByExercise,
      bests,
      effort,
      sports: Array.from(sportCount.entries()).map(([sport, count]) => ({ sport, count })).sort((a, b) => b.count - a.count),
    };
  });
}
