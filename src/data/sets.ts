import { supabase } from '../lib/supabase';
import { PREVIEW } from './preview';
import { invalidate } from './query';

// Strength logging: every set a member does (reps, and weight where it's loaded), so the app can
// show last time's numbers, suggest the next step, and keep personal bests.

export interface SetRow {
  reps: number | null;
  kg: number | null;
}

export interface History {
  /** The sets from the most recent session with this exercise. */
  last: SetRow[];
  lastAt: Date | null;
  /** Best estimated one-rep max (Epley), or best reps for bodyweight moves. */
  bestE1rm: number | null;
  bestReps: number | null;
}

/** Epley: estimated one-rep max from a set of `reps` at `kg`. Valid for 1–12 reps. */
export function e1rm(kg: number, reps: number): number {
  if (reps <= 1) return kg;
  return kg * (1 + Math.min(reps, 12) / 30);
}

/** Last session's sets and all-time bests for each exercise. */
export async function historyFor(meId: string, slugs: string[]): Promise<Map<string, History>> {
  const out = new Map<string, History>();
  if (PREVIEW || !slugs.length) return out;
  const { data, error } = await supabase
    .from('workout_sets')
    .select('exercise, log_id, set_no, reps, weight_kg, created_at')
    .eq('user_id', meId)
    .in('exercise', slugs)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  for (const slug of slugs) {
    const rows = (data || []).filter((r: any) => r.exercise === slug);
    if (!rows.length) continue;
    const lastLog = rows[0].log_id;
    const last = rows
      .filter((r: any) => r.log_id === lastLog)
      .sort((a: any, b: any) => a.set_no - b.set_no)
      .map((r: any) => ({ reps: r.reps, kg: r.weight_kg != null ? Number(r.weight_kg) : null }));
    let bestE1rm: number | null = null;
    let bestReps: number | null = null;
    for (const r of rows) {
      if (r.reps && r.weight_kg) bestE1rm = Math.max(bestE1rm ?? 0, e1rm(Number(r.weight_kg), r.reps));
      if (r.reps) bestReps = Math.max(bestReps ?? 0, r.reps);
    }
    out.set(slug, { last, lastAt: new Date(rows[0].created_at), bestE1rm, bestReps });
  }
  return out;
}

export async function saveSets(meId: string, logId: string, entries: { exercise: string; sets: SetRow[] }[]) {
  if (PREVIEW) return;
  const rows = entries.flatMap((e) =>
    e.sets
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => (s.reps ?? 0) > 0)
      .map(({ s, i }) => ({ log_id: logId, user_id: meId, exercise: e.exercise, set_no: i + 1, reps: s.reps, weight_kg: s.kg })),
  );
  if (!rows.length) return;
  const { error } = await supabase.from('workout_sets').insert(rows);
  if (error) throw error;
  invalidate('metrics:');
}

/** "3 × 10", "4 × 5 / side", "3 × 3–6" → { sets, reps } (the lower rep number). */
export function parsePrescription(reps: string | null, rounds: number | null): { sets: number; reps: number | null } {
  const txt = (reps || '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const m = txt.match(/(\d+)\s*[×x]\s*(\d+)/);
  if (m) return { sets: Math.min(10, Number(m[1])), reps: Number(m[2]) };
  const n = txt.match(/^\s*(\d+)(?!\s*(s|ث|min|د|m\b|م|km|كم))/);
  return { sets: Math.min(10, rounds || 3), reps: n ? Number(n[1]) : null };
}

/**
 * Next step from last time (double progression): if every set reached the target reps,
 * add a small load jump; otherwise aim for one more rep at the same weight.
 */
export function suggestion(last: SetRow[], targetReps: number | null, loaded: boolean): { kg: number | null; reps: number | null; up: boolean } | null {
  if (!last.length) return null;
  const kg = last.reduce((m, s) => Math.max(m, s.kg ?? 0), 0) || null;
  const minReps = last.reduce((m, s) => Math.min(m, s.reps ?? 0), Infinity);
  const hit = targetReps != null && minReps >= targetReps;
  if (loaded && kg && hit) {
    const step = kg >= 40 ? 2.5 : kg >= 10 ? 2 : 1;
    return { kg: Math.round((kg + step) * 2) / 2, reps: targetReps, up: true };
  }
  return { kg, reps: hit ? (targetReps ?? 0) + 1 : Math.max(minReps, 1) + (minReps === Infinity ? 0 : 1), up: false };
}
