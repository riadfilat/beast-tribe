import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery } from './query';
import { PREVIEW } from './preview';

// The Operation Beast exercise library: one reference for every move in every workout.
// Each exercise carries bilingual setup, cues, mistakes and safety notes, its muscles and
// movement pattern, how it's tracked, and a media slot (video/poster) filled in from the admin.

export type ExerciseCategory = 'warmup' | 'mobility' | 'stretch' | 'strength' | 'core' | 'conditioning' | 'cardio';
export type Tracking = 'reps' | 'reps_weight' | 'time' | 'distance' | 'distance_time';
export type Level = 'easy' | 'medium' | 'hard';

export interface Exercise {
  slug: string;
  name: string;
  category: ExerciseCategory;
  pattern: string | null;
  mechanic: 'compound' | 'isolation' | null;
  primary: string[];
  secondary: string[];
  equipment: string[];
  level: Level;
  unilateral: boolean;
  tracking: Tracking;
  setup: string[];
  cues: string[];
  mistakes: string[];
  safety: string[];
  breathing: string | null;
  tempo: string | null;
  restSeconds: number | null;
  sports: string[];
  easier: string | null;
  harder: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
}

export const CATEGORIES: ExerciseCategory[] = ['strength', 'core', 'conditioning', 'cardio', 'warmup', 'mobility', 'stretch'];
/** Muscle groups as the library and the metrics count them. */
export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'core', 'glutes', 'quads', 'hamstrings', 'calves'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Fine muscle → the group it counts toward. */
export function groupOf(m: string): MuscleGroup | null {
  switch (m) {
    case 'chest': return 'chest';
    case 'lats': case 'upper_back': case 'traps': case 'lower_back': return 'back';
    case 'front_delts': case 'side_delts': case 'rear_delts': case 'rotator_cuff': return 'shoulders';
    case 'biceps': case 'triceps': case 'forearms': return 'arms';
    case 'core': case 'obliques': case 'hip_flexors': return 'core';
    case 'glutes': case 'abductors': return 'glutes';
    case 'quads': case 'adductors': return 'quads';
    case 'hamstrings': return 'hamstrings';
    case 'calves': return 'calves';
    default: return null;
  }
}

const loc = (lang: string, v: any): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return (lang === 'ar' && v.ar) || v.en || '';
};
const locList = (lang: string, a: any): string[] => (Array.isArray(a) ? a.map((x) => loc(lang, x)).filter(Boolean) : []);

function toExercise(r: any, lang: string): Exercise {
  return {
    slug: r.slug,
    name: (lang === 'ar' && r.name_ar) || r.name,
    category: r.category,
    pattern: r.pattern ?? null,
    mechanic: r.mechanic ?? null,
    primary: r.primary_muscles ?? [],
    secondary: r.secondary_muscles ?? [],
    equipment: r.equipment ?? [],
    level: r.level ?? 'medium',
    unilateral: !!r.unilateral,
    tracking: r.tracking ?? 'reps',
    setup: locList(lang, r.setup),
    cues: locList(lang, r.cues),
    mistakes: locList(lang, r.mistakes),
    safety: locList(lang, r.safety),
    breathing: r.breathing ? loc(lang, r.breathing) : null,
    tempo: r.tempo ?? null,
    restSeconds: r.rest_seconds ?? null,
    sports: r.sports ?? [],
    easier: r.easier ?? null,
    harder: r.harder ?? null,
    videoUrl: r.video_url ?? null,
    posterUrl: r.poster_url ?? null,
  };
}

// Preview (web demo, no backend): the same library straight from the source files.
function previewRows(): any[] {
  const files = [
    require('../../scripts/exercises/lib/conditioning.json'),
    require('../../scripts/exercises/lib/core.json'),
    require('../../scripts/exercises/lib/lower.json'),
    require('../../scripts/exercises/lib/mobility.json'),
    require('../../scripts/exercises/lib/upper.json'),
  ];
  const pairs = (a: any[] = []) => a.map(([en, ar]: string[]) => ({ en, ar }));
  return files.flat().map((x: any) => ({
    slug: x.slug, name: x.name, name_ar: x.ar, category: x.cat, pattern: x.pattern, mechanic: x.mech,
    primary_muscles: x.pm, secondary_muscles: x.sm || [], equipment: x.eq || [], level: x.lvl, unilateral: !!x.uni,
    tracking: x.track, setup: pairs(x.setup), cues: pairs(x.cues), mistakes: pairs(x.mistakes), safety: pairs(x.safety),
    breathing: x.breath ? { en: x.breath[0], ar: x.breath[1] } : null, tempo: x.tempo, rest_seconds: x.rest,
    sports: x.sports || [], easier: x.easier, harder: x.harder, video_url: null, poster_url: null,
  }));
}

/** The whole library (about a hundred moves), keyed by slug. Small enough to load once. */
export function useExercises(lang: string) {
  const { user } = useAuth();
  const key = PREVIEW || user ? `exercises:${lang}` : null;
  return useQuery<Map<string, Exercise>>(key, async () => {
    let rows: any[];
    if (PREVIEW) rows = previewRows();
    else {
      const { data, error } = await supabase.from('exercises').select('*').order('sort');
      if (error) throw error;
      rows = data || [];
    }
    return new Map(rows.map((r) => [r.slug, toExercise(r, lang)]));
  });
}
