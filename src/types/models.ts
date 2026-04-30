import { Tier } from '../lib/constants';
// Tier values: 'initiate' | 'vanguard' | 'apex' | 'prime' | 'beast'

export interface Profile {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  city: string | null;
  experience_level: string | null;
  total_xp: number;
  level: number;
  tier: Tier;
  current_streak: number;
  longest_streak: number;
  region: string;
  is_premium: boolean;
  onboarding_completed: boolean;
  training_frequency: number;
  beast_score: number;
  pack_id: string | null;
  community_id: string | null;
  five_k_time_seconds: number | null;
  max_bench_kg: number | null;
  daily_steps_avg: number | null;
  created_at: string;
}

export interface Sport {
  id: string;
  name: string;
  emoji: string;
  category: string;
  popularity_male: number;
  popularity_female: number;
}

export interface Baseline {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  five_k_time_seconds: number | null;
  max_bench_kg: number | null;
  daily_steps_avg: number | null;
  progress_photo_url: string | null;
  recorded_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  sport_id: string | null;
  title: string;
  target_value: number | null;
  target_unit: string | null;
  target_date: string | null;
  progress_pct: number;
  is_completed: boolean;
}

export interface Workout {
  id: string;
  title: string;
  description: string | null;
  sport_id: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  duration_minutes: number;
  xp_reward: number;
  image_url: string | null;
  is_premium: boolean;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string | null;
  sport_id: string | null;
  title: string | null;
  duration_minutes: number | null;
  calories_burned: number | null;
  completed_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  logged_date: string;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  sport_id: string | null;
  post_type: 'activity' | 'milestone' | 'beast_roar_nomination';
  created_at: string;
  // Joined fields
  profile?: Profile;
  beast_count?: number;
  user_beasted?: boolean;
}

export interface BeastEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  sport_id: string | null;
  location_name: string | null;
  location_city: string | null;
  starts_at: string;
  ends_at: string | null;
  max_capacity: number | null;
  partner_name: string | null;
  coach_name: string | null;
  gym_name: string | null;
  country: string;
  is_women_only: boolean;
  rsvp_count?: number;
  user_rsvp?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  tier: Tier;
  weekly_xp: number;
  is_current_user?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  quest_type: 'daily' | 'weekly' | 'special';
  is_completed?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  color: string | null;
  earned_at?: string;
}

export interface HabitDefinition {
  id: string;
  key: string;
  label: string;
  description: string | null;
  icon: string;
  category: string;
  frequency_type: 'daily' | 'weekly' | 'monthly';
  default_target: number;
  target_unit: string;
  is_active: boolean;
  sort_order: number;
}

export interface UserHabit {
  id: string;
  user_id: string;
  habit_definition_id: string;
  target: number;
  is_active: boolean;
  created_at: string;
  habit_definition?: HabitDefinition;
}

export interface HabitLog {
  id: string;
  user_id: string;
  user_habit_id: string;
  logged_date: string;
  value: number;
  created_at: string;
}

export interface BeastScoreRecord {
  id: string;
  user_id: string;
  score: number;
  workout_consistency: number;
  nutrition_consistency: number;
  step_consistency: number;
  streak_bonus: number;
  event_bonus: number;
  perfect_days: number;
  calculated_at: string;
}

export interface Pack {
  id: string;
  name: string;
  animal: string;
  icon_url: string | null;
}

export interface PackChallenge {
  id: string;
  pack_a_id: string;
  pack_b_id: string;
  title: string | null;
  pack_a_xp: number;
  pack_b_xp: number;
  starts_at: string;
  ends_at: string;
  pack_a?: Pack;
  pack_b?: Pack;
}
