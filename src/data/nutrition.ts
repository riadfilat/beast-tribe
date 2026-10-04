import { supabase } from '../lib/supabase';
import { useQuery, invalidate } from './query';
import { addDays, localDateKey, startOfLocalDay } from '../i18n/format';
import { PREVIEW, previewMeals, previewWater } from './preview';
import { useMeId } from './me';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface Meal {
  id: string;
  type: MealType;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Local calendar day, YYYY-MM-DD */
  date: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** litres */
  water: number;
}
export const DEFAULT_GOALS: NutritionGoals = { calories: 2200, protein: 150, carbs: 250, fat: 70, water: 3 };
/** One tap on water is one glass: 0.5 L (existing rows store glasses; the UI shows litres). */
export const GLASS_L = 0.5;

export interface NutritionWeek {
  /** Seven local day keys, oldest first; the last one is today. */
  days: string[];
  meals: Meal[];
  glasses: Record<string, number>;
}

/** A sensible default for the meal being logged right now. */
export function mealTypeForNow(d = new Date()): MealType {
  const h = d.getHours();
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 18 && h < 23) return 'dinner';
  return 'snack';
}

const num = (v: any) => (v == null || isNaN(Number(v)) ? 0 : Number(v));

function toMeal(r: any): Meal {
  const type = String(r.meal_type || 'snack').toLowerCase();
  return {
    id: r.id,
    type: (MEAL_TYPES as string[]).includes(type) ? (type as MealType) : 'snack',
    title: r.title || '',
    calories: num(r.calories),
    protein: num(r.protein_g),
    carbs: num(r.carbs_g),
    fat: num(r.fat_g),
    date: r.logged_date,
  };
}

// Days are keyed by the phone's local calendar. The DB default (CURRENT_DATE) is UTC,
// which filed anything logged between midnight and 3 AM in Riyadh under the day before,
// so every write sends logged_date explicitly.
export function useNutritionWeek() {
  const me = useMeId();
  const today = localDateKey(new Date());
  return useQuery<NutritionWeek>(me ? `nutrition:week:${me}:${today}` : null, async () => {
    const end = startOfLocalDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => localDateKey(addDays(end, i - 6)));
    if (PREVIEW) return { days, meals: previewMeals(days).map(toMeal), glasses: previewWater(days) };
    const [m, w] = await Promise.all([
      supabase
        .from('nutrition_logs')
        .select('id, meal_type, title, calories, protein_g, carbs_g, fat_g, logged_date, created_at')
        .eq('user_id', me!)
        .gte('logged_date', days[0])
        .lte('logged_date', days[6])
        .order('created_at', { ascending: true }),
      supabase.from('water_logs').select('glasses, logged_date').eq('user_id', me!).gte('logged_date', days[0]).lte('logged_date', days[6]),
    ]);
    if (m.error) throw m.error;
    if (w.error) throw w.error;
    const glasses: Record<string, number> = {};
    (w.data || []).forEach((r: any) => {
      glasses[r.logged_date] = (glasses[r.logged_date] ?? 0) + num(r.glasses || 1);
    });
    return { days, meals: (m.data || []).map(toMeal), glasses };
  });
}

// ─── Targets ────────────────────────────────────────────────────────────────
let previewGoals: NutritionGoals | null = null;

export function useNutritionGoals() {
  const me = useMeId();
  const q = useQuery<NutritionGoals>(me ? `nutrition:goals:${me}` : null, async () => {
    if (PREVIEW) return previewGoals ?? DEFAULT_GOALS;
    const { data, error } = await supabase.rpc('my_profile').maybeSingle();
    if (error) throw error;
    return { ...DEFAULT_GOALS, ...((data as any)?.nutrition_goals || {}) };
  });
  return { goals: q.data ?? DEFAULT_GOALS, custom: !!q.data && JSON.stringify(q.data) !== JSON.stringify(DEFAULT_GOALS), query: q };
}

export async function saveNutritionGoals(meId: string, goals: NutritionGoals) {
  if (PREVIEW) {
    previewGoals = goals;
  } else {
    const { error } = await supabase.from('profiles').update({ nutrition_goals: goals }).eq('id', meId);
    if (error) throw error;
  }
  invalidate('nutrition:goals');
}

// ─── Writes ─────────────────────────────────────────────────────────────────
export async function logMeal(
  meId: string,
  date: string,
  meal: { type: MealType; title: string; calories?: number; protein?: number; carbs?: number; fat?: number },
) {
  if (!PREVIEW) {
    const { error } = await supabase.from('nutrition_logs').insert({
      user_id: meId,
      meal_type: meal.type,
      title: meal.title.trim(),
      calories: meal.calories ?? null,
      protein_g: meal.protein ?? null,
      carbs_g: meal.carbs ?? null,
      fat_g: meal.fat ?? null,
      logged_date: date,
    });
    if (error) throw error;
  }
  invalidate('nutrition:week');
}

export async function deleteMeal(id: string) {
  if (!PREVIEW) {
    const { error } = await supabase.from('nutrition_logs').delete().eq('id', id);
    if (error) throw error;
  }
  invalidate('nutrition:week');
}

export async function addGlass(meId: string, date: string) {
  if (!PREVIEW) {
    const { error } = await supabase.from('water_logs').insert({ user_id: meId, glasses: 1, logged_date: date });
    if (error) throw error;
  }
  invalidate('nutrition:week');
}

export async function removeGlass(meId: string, date: string) {
  if (!PREVIEW) {
    const { data, error } = await supabase
      .from('water_logs')
      .select('id')
      .eq('user_id', meId)
      .eq('logged_date', date)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!data?.length) return;
    const { error: delErr } = await supabase.from('water_logs').delete().eq('id', data[0].id);
    if (delErr) throw delErr;
  }
  invalidate('nutrition:week');
}

// ─── Quick add ──────────────────────────────────────────────────────────────
// Everyday Gulf plates first. Values are typical single portions (estimates); the custom
// entry is there for exact numbers.
export interface QuickFood {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
export const QUICK_FOODS: QuickFood[] = [
  { id: 'dates', calories: 100, protein: 1, carbs: 27, fat: 0 },
  { id: 'eggs', calories: 150, protein: 12, carbs: 1, fat: 10 },
  { id: 'foul', calories: 300, protein: 15, carbs: 35, fat: 9 },
  { id: 'oats', calories: 300, protein: 10, carbs: 50, fat: 8 },
  { id: 'laban', calories: 130, protein: 8, carbs: 11, fat: 6 },
  { id: 'shake', calories: 200, protein: 30, carbs: 15, fat: 5 },
  { id: 'chicken', calories: 350, protein: 40, carbs: 5, fat: 18 },
  { id: 'kabsa', calories: 650, protein: 40, carbs: 75, fat: 20 },
  { id: 'shawarma', calories: 550, protein: 32, carbs: 45, fat: 24 },
  { id: 'hummus', calories: 400, protein: 13, carbs: 45, fat: 18 },
  { id: 'salad', calories: 250, protein: 12, carbs: 20, fat: 15 },
  { id: 'banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
];
