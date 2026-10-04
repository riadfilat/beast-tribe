// The signed-in member's profile row (public.profiles) as the app reads it.
export interface Profile {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  city: string | null;
  experience_level: string | null;
  region: string;
  onboarding_completed: boolean;
  community_id: string | null;
  five_k_time_seconds: number | null;
  max_bench_kg: number | null;
  daily_steps_avg: number | null;
  created_at: string;
}
