import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useSupabaseQuery } from './useSupabaseQuery';
import { SPORTS } from '../lib/constants';

// Helper: map constant sport id -> DB name for lookups
const SPORT_NAME_MAP: Record<string, string> = {};
SPORTS.forEach(s => { SPORT_NAME_MAP[s.id] = s.name; });

/** Sanitize search input for ilike queries (escape %, _, \) */
function sanitizeSearch(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

// ============================================
// PROFILE
// ============================================
export function useProfile() {
  const { profile, refreshProfile } = useAuth();
  return { profile, loading: !profile, refetch: refreshProfile };
}

// ============================================
// HOME DATA
// ============================================
export function useTodaySteps() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<any>(
    () => supabase.from('step_logs').select('*').eq('user_id', user?.id).eq('logged_date', today).maybeSingle(),
    [user?.id, today],
    { steps: 0, step_goal: 10000, logged_date: today }
  );
}

export function useTodayQuest() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<any>(
    () => supabase.from('user_quests').select('*, quest:quests(*)').eq('user_id', user?.id).eq('assigned_date', today).maybeSingle(),
    [user?.id, today],
    null
  );
}

export function useActivePackChallenge() {
  const { profile } = useAuth();
  const now = new Date().toISOString();
  return useSupabaseQuery<any>(
    () => supabase.from('pack_challenges')
      .select('*, pack_a:packs!pack_a_id(*), pack_b:packs!pack_b_id(*)')
      .or(`pack_a_id.eq.${profile?.pack_id},pack_b_id.eq.${profile?.pack_id}`)
      .gte('ends_at', now)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    [profile?.pack_id],
    null
  );
}

export function useUpcomingEvents(limit = 1) {
  const now = new Date().toISOString();
  return useSupabaseQuery<any[]>(
    () => supabase.from('events')
      .select('*, sport:sports(*), rsvp_count:event_rsvps(count)')
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(limit),
    [],
    []
  );
}

// ============================================
// NUTRITION
// ============================================
export function useTodayNutrition() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<any[]>(
    () => supabase.from('nutrition_logs')
      .select('*')
      .eq('user_id', user?.id)
      .eq('logged_date', today)
      .order('created_at', { ascending: true }),
    [user?.id, today],
    []
  );
}

export function useTodayWater() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<any[]>(
    () => supabase.from('water_logs')
      .select('*')
      .eq('user_id', user?.id)
      .eq('logged_date', today),
    [user?.id, today],
    []
  );
}

export function useLogMeal() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const logMeal = useCallback(async (meal: {
    meal_type: string;
    title: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: u.id,
        ...meal,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { logMeal, loading };
}

export function useLogWater() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const logWater = useCallback(async () => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('water_logs').insert({
        user_id: u.id,
        glasses: 1,
        logged_date: today,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { logWater, loading };
}

// ============================================
// WORKOUTS
// ============================================
export function useWorkouts(sportFilter?: string) {
  return useSupabaseQuery<any[]>(
    () => {
      if (sportFilter && sportFilter !== 'All') {
        // Use !inner join so rows without a matching sport are excluded
        return supabase.from('workouts')
          .select('*, sport:sports!inner(name, emoji)')
          .eq('sport.name', sportFilter)
          .order('created_at', { ascending: false });
      }
      return supabase.from('workouts')
        .select('*, sport:sports(name, emoji)')
        .order('created_at', { ascending: false });
    },
    [sportFilter],
    []
  );
}

export function useLogWorkout() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const logWorkout = useCallback(async (workout: {
    workout_id?: string;
    sport_id?: string;
    title: string;
    duration_minutes: number;
    calories_burned?: number;
    notes?: string;
    xp_reward?: number;
  }) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('workout_logs').insert({
        user_id: u.id,
        workout_id: workout.workout_id,
        sport_id: workout.sport_id,
        title: workout.title,
        duration_minutes: workout.duration_minutes,
        calories_burned: workout.calories_burned,
        notes: workout.notes,
      });
      if (error) throw error;

      // Award XP — use workout's defined reward, fall back to duration-based
      const xp = workout.xp_reward || Math.max(50, workout.duration_minutes * 4);
      const { error: xpError } = await supabase.from('xp_transactions').insert({
        user_id: u.id,
        amount: xp,
        source: 'workout',
        source_id: workout.workout_id,
        description: `Completed: ${workout.title}`,
      });
      if (xpError) throw xpError;
      return xp;
    } finally {
      setLoading(false);
    }
  }, []);

  return { logWorkout, loading };
}

// ============================================
// FEED
// ============================================
export function useFeedPosts(sportFilter?: string) {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      if (sportFilter && sportFilter !== 'All') {
        // Use !inner join to filter by sport name
        return supabase.from('feed_posts')
          .select(`
            *,
            author:profiles!user_id(display_name, full_name, tier, avatar_url),
            sport:sports!inner(name),
            beast_count:beasts(count)
          `)
          .eq('is_visible', true)
          .eq('sport.name', sportFilter)
          .order('created_at', { ascending: false })
          .limit(20);
      }
      return supabase.from('feed_posts')
        .select(`
          *,
          author:profiles!user_id(display_name, full_name, tier, avatar_url),
          sport:sports(name),
          beast_count:beasts(count)
        `)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(20);
    },
    [sportFilter, user?.id],
    []
  );
}

/** Check if current user has beasted a set of posts */
export function useUserBeasts(postIds: string[]) {
  const { user } = useAuth();
  const key = postIds.sort().join(',');
  return useSupabaseQuery<any[]>(
    () => {
      if (!user?.id || postIds.length === 0) {
        return Promise.resolve({ data: [], error: null });
      }
      return supabase.from('beasts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
    },
    [user?.id, key],
    []
  );
}

export function useToggleBeast() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const toggleBeast = useCallback(async (postId: string, hasBeasted: boolean) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      if (hasBeasted) {
        const { error } = await supabase.from('beasts').delete().eq('post_id', postId).eq('user_id', u.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('beasts').insert({ post_id: postId, user_id: u.id });
        if (error) throw error;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggleBeast, loading };
}

export function useCreatePost() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(async (content: string, sportFilter?: string) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u || !content.trim()) return false;
    setLoading(true);
    try {
      const { error } = await supabase.from('feed_posts').insert({
        user_id: u.id,
        content: content.trim(),
        sport_id: sportFilter && sportFilter !== 'All' ? sportFilter : null,
        is_visible: true,
      });
      if (error) throw error;
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading };
}

// ============================================
// EVENTS
// ============================================
export function useEvents(typeFilter?: string, searchQuery?: string, country?: string) {
  const now = new Date().toISOString();
  return useSupabaseQuery<any[]>(
    () => {
      let query = supabase.from('events')
        .select('*, sport:sports(name, emoji), rsvp_count:event_rsvps(count)')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true });

      if (country) {
        query = query.eq('country', country);
      }

      if (searchQuery) {
        const safe = sanitizeSearch(searchQuery);
        query = query.or(`coach_name.ilike.%${safe}%,gym_name.ilike.%${safe}%,title.ilike.%${safe}%`);
      }
      return query;
    },
    [typeFilter, searchQuery, country],
    []
  );
}

export function useJoinEvent() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const joinEvent = useCallback(async (eventId: string) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('event_rsvps').upsert({
        event_id: eventId,
        user_id: u.id,
        status: 'going',
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { joinEvent, loading };
}

// ============================================
// LEADERBOARD
// ============================================
export function useLeaderboard(timeRange: string = 'all', packId?: string) {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      if (timeRange === 'weekly') {
        // Sum XP from this week's transactions
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return supabase.from('xp_transactions')
          .select('user_id, amount, profile:profiles!user_id(id, display_name, full_name, tier, total_xp, avatar_url)')
          .gte('created_at', weekAgo.toISOString())
          .order('amount', { ascending: false })
          .limit(50);
      }

      if (timeRange === 'pack' && packId) {
        // Pack leaderboard — members' lifetime XP
        return supabase.from('pack_members')
          .select('*, profile:profiles(id, display_name, full_name, tier, total_xp, avatar_url)')
          .eq('pack_id', packId)
          .order('profile->total_xp', { ascending: false });
      }

      // 'all' — global lifetime leaderboard from profiles
      return supabase.from('profiles')
        .select('id, display_name, full_name, tier, total_xp, avatar_url')
        .order('total_xp', { ascending: false })
        .limit(20);
    },
    [timeRange, packId, user?.id],
    []
  );
}

// ============================================
// PROFILE DATA
// ============================================
export function useUserGoals() {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => supabase.from('goals')
      .select('*, sport:sports(name)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: true }),
    [user?.id],
    []
  );
}

export function useUserBadges() {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => supabase.from('user_badges')
      .select('*, badge:badges(*)')
      .eq('user_id', user?.id)
      .order('earned_at', { ascending: false }),
    [user?.id],
    []
  );
}

export function useUserSports() {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => supabase.from('user_sports')
      .select('*, sport:sports(*)')
      .eq('user_id', user?.id),
    [user?.id],
    []
  );
}

export function useWorkoutCount() {
  const { user } = useAuth();
  return useSupabaseQuery<any>(
    () => supabase.from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id),
    [user?.id],
    null
  );
}

// ============================================
// ANALYTICS
// ============================================

/** Fetch workout logs for the current user within a date range */
export function useWorkoutHistory(since?: string) {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      let query = supabase.from('workout_logs')
        .select('*, sport:sports(name, emoji)')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });
      if (since) {
        query = query.gte('completed_at', since);
      }
      return query;
    },
    [user?.id, since],
    []
  );
}

/** Fetch step logs for the current user within a date range */
export function useStepHistory(since?: string) {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      let query = supabase.from('step_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('logged_date', { ascending: false });
      if (since) {
        query = query.gte('logged_date', since);
      }
      return query;
    },
    [user?.id, since],
    []
  );
}

/** Fetch XP transactions for the current user */
export function useXPHistory(since?: string) {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      let query = supabase.from('xp_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (since) {
        query = query.gte('created_at', since);
      }
      return query;
    },
    [user?.id, since],
    []
  );
}

/** Fetch events the current user has RSVPed to */
export function useMyRSVPs() {
  const { user } = useAuth();
  const now = new Date().toISOString();
  return useSupabaseQuery<any[]>(
    () => {
      if (!user?.id) return Promise.resolve({ data: [], error: null });
      return supabase.from('event_rsvps')
        .select('*, event:events(id, title, starts_at, ends_at, location_name, location_city, gym_name, sport:sports(name, emoji))')
        .eq('user_id', user.id)
        .eq('status', 'going')
        .order('created_at', { ascending: false });
    },
    [user?.id],
    []
  );
}

// ============================================
// PACK ACTIVITY
// ============================================

/** Fetch workout logs for all members of a pack in a given week */
export function usePackWeekActivity(packId?: string) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const since = startOfWeek.toISOString();

  return useSupabaseQuery<any[]>(
    () => {
      if (!packId) return Promise.resolve({ data: [], error: null });
      // Get pack members' IDs, then their workout logs
      return supabase.from('pack_members')
        .select('user_id, profile:profiles(id, display_name, full_name, avatar_url, tier)')
        .eq('pack_id', packId);
    },
    [packId],
    []
  );
}

/** Fetch event RSVPs for pack members for upcoming events */
export function usePackEventRSVPs(packId?: string) {
  const now = new Date().toISOString();
  return useSupabaseQuery<any[]>(
    () => {
      if (!packId) return Promise.resolve({ data: [], error: null });
      return supabase.from('pack_members')
        .select(`
          user_id,
          profile:profiles(id, display_name, full_name, avatar_url),
          rsvps:event_rsvps(
            event_id,
            event:events(id, title, starts_at, location_name)
          )
        `)
        .eq('pack_id', packId);
    },
    [packId],
    []
  );
}

// ============================================
// ONBOARDING
// ============================================
export function useGoalTemplates(sportConstIds: string[]) {
  // Fetch goal templates for user's selected sports
  const dbNames = sportConstIds.map(id => SPORT_NAME_MAP[id] || id).filter(Boolean);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbNamesKey = dbNames.join(',');

  useEffect(() => {
    if (!isSupabaseConfigured || dbNames.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Step 1: look up sport UUIDs by name
        const { data: sportsData, error: sportsErr } = await supabase
          .from('sports')
          .select('id, name, emoji')
          .in('name', dbNames);
        if (sportsErr) throw sportsErr;
        const sportIds = (sportsData || []).map((s: any) => s.id);
        if (sportIds.length === 0) { setData([]); setLoading(false); return; }

        // Step 2: fetch templates for those sport IDs
        const { data: templates, error: tplErr } = await supabase
          .from('goal_templates')
          .select('*, sport:sports(id, name, emoji)')
          .in('sport_id', sportIds)
          .order('difficulty', { ascending: true });
        if (tplErr) throw tplErr;
        if (!cancelled) setData(templates || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to fetch goal templates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dbNamesKey]);

  const refetch = useCallback(() => {
    if (!isSupabaseConfigured || dbNames.length === 0) return;
    setLoading(true);
    (async () => {
      try {
        const { data: sportsData } = await supabase.from('sports').select('id').in('name', dbNames);
        const sportIds = (sportsData || []).map((s: any) => s.id);
        if (sportIds.length === 0) { setData([]); return; }
        const { data: templates } = await supabase.from('goal_templates')
          .select('*, sport:sports(id, name, emoji)').in('sport_id', sportIds).order('difficulty', { ascending: true });
        setData(templates || []);
      } catch (err: any) {
        setError(err.message);
      } finally { setLoading(false); }
    })();
  }, [dbNamesKey]);

  return { data, loading, error, refetch };
}

export function useSaveSports() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const saveSports = useCallback(async (sportConstIds: string[]) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      // Map constant IDs to DB names using the lookup table
      const dbNames = sportConstIds
        .map(id => SPORT_NAME_MAP[id] || id)
        .filter(Boolean);

      if (dbNames.length === 0) return;

      // Look up real UUIDs
      const { data: sports, error: lookupError } = await supabase
        .from('sports')
        .select('id, name')
        .in('name', dbNames);

      if (lookupError) throw lookupError;
      if (!sports || sports.length === 0) return;

      // Delete existing
      await supabase.from('user_sports').delete().eq('user_id', u.id);
      // Insert new with real UUIDs
      const rows = sports.map(s => ({ user_id: u.id, sport_id: s.id }));
      const { error } = await supabase.from('user_sports').insert(rows);
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveSports, loading };
}

export function useSaveBaseline() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const saveBaseline = useCallback(async (baseline: {
    weight_kg?: number;
    height_cm?: number;
    five_k_time_seconds?: number;
    max_bench_kg?: number;
    daily_steps_avg?: number;
  }) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('baselines').insert({
        user_id: u.id,
        ...baseline,
      });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveBaseline, loading };
}

export function useSaveGoals() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const saveGoals = useCallback(async (goals: Array<{
    title: string;
    sport_id?: string;
    target_date?: string;
  }>) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const rows = goals.map(g => ({ user_id: u.id, ...g }));
      const { error } = await supabase.from('goals').insert(rows);
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveGoals, loading };
}

// ============================================
// PACK (Friend Groups)
// ============================================

/** Get the current user's pack (from pack_members, not faction pack_id) */
export function useMyPack() {
  const { user } = useAuth();
  return useSupabaseQuery<any>(
    () => {
      if (!user?.id) return Promise.resolve({ data: null, error: null });
      return supabase.from('pack_members')
        .select('*, pack:packs(*)')
        .eq('user_id', user.id)
        .maybeSingle();
    },
    [user?.id],
    null
  );
}

/** Get all members of a pack */
export function usePackMembers(packId?: string) {
  return useSupabaseQuery<any[]>(
    () => {
      if (!packId) return Promise.resolve({ data: [], error: null });
      return supabase.from('pack_members')
        .select('*, profile:profiles(id, display_name, full_name, tier, total_xp, avatar_url)')
        .eq('pack_id', packId)
        .order('joined_at', { ascending: true });
    },
    [packId],
    []
  );
}

/** Create a new pack and become its leader */
export function useCreatePack() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const createPack = useCallback(async (name: string, animal: string) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return null;
    setLoading(true);
    try {
      // Generate invite code client-side (6 char alphanumeric)
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: pack, error: packErr } = await supabase.from('packs').insert({
        name,
        animal,
        created_by: u.id,
        invite_code: code,
        is_system: false,
      }).select().single();
      if (packErr) throw packErr;

      // Join as leader
      const { error: memberErr } = await supabase.from('pack_members').insert({
        pack_id: pack.id,
        user_id: u.id,
        role: 'leader',
      });
      if (memberErr) throw memberErr;

      return pack;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPack, loading };
}

/** Join a pack using an invite code */
export function useJoinPackByCode() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinPack = useCallback(async (code: string) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return null;
    setLoading(true);
    setError(null);
    try {
      // Find pack by code
      const { data: pack, error: findErr } = await supabase.from('packs')
        .select('id, name, max_members')
        .eq('invite_code', code.toUpperCase().trim())
        .eq('is_system', false)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!pack) { setError('Invalid invite code'); return null; }

      // Check capacity
      const { count } = await supabase.from('pack_members')
        .select('*', { count: 'exact', head: true })
        .eq('pack_id', pack.id);
      if (count && count >= (pack.max_members || 20)) {
        setError('This pack is full');
        return null;
      }

      // Join
      const { error: joinErr } = await supabase.from('pack_members').insert({
        pack_id: pack.id,
        user_id: u.id,
        role: 'member',
      });
      if (joinErr) {
        if (joinErr.code === '23505') setError('You are already in a pack');
        else throw joinErr;
        return null;
      }

      return pack;
    } catch (err: any) {
      setError(err.message || 'Failed to join pack');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { joinPack, loading, error };
}

/** Leave current pack */
export function useLeavePack() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const leavePack = useCallback(async (packId: string) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      // Remove self
      const { error } = await supabase.from('pack_members')
        .delete()
        .eq('pack_id', packId)
        .eq('user_id', u.id);
      if (error) throw error;

      // Check if pack is now empty → delete it
      const { count } = await supabase.from('pack_members')
        .select('*', { count: 'exact', head: true })
        .eq('pack_id', packId);
      if (count === 0) {
        await supabase.from('packs').delete().eq('id', packId).eq('is_system', false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { leavePack, loading };
}

/** Get pending invites for current user */
export function usePackInvites() {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      if (!user?.id) return Promise.resolve({ data: [], error: null });
      return supabase.from('pack_invites')
        .select('*, pack:packs(name, animal), inviter:profiles!invited_by(display_name)')
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    },
    [user?.id],
    []
  );
}

/** Respond to a pack invite */
export function useRespondToInvite() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const respond = useCallback(async (inviteId: string, packId: string, accept: boolean) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      // Update invite status
      await supabase.from('pack_invites')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', inviteId);

      // If accepted, join the pack
      if (accept) {
        await supabase.from('pack_members').insert({
          pack_id: packId,
          user_id: u.id,
          role: 'member',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { respond, loading };
}

/** Search users by display_name (for inviting to pack) */
export function useSearchUsers(query: string) {
  return useSupabaseQuery<any[]>(
    () => {
      if (!query || query.length < 2) return Promise.resolve({ data: [], error: null });
      const safe = sanitizeSearch(query);
      return supabase.from('profiles')
        .select('id, display_name, full_name, tier, avatar_url')
        .ilike('display_name', `%${safe}%`)
        .limit(10);
    },
    [query],
    []
  );
}

/** Invite a user to a pack */
export function useInviteToPack() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const invite = useCallback(async (packId: string, targetUserId: string) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('pack_invites').insert({
        pack_id: packId,
        invited_by: u.id,
        invited_user_id: targetUserId,
      });
      if (error) {
        if (error.code === '23505') return; // Already invited
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { invite, loading };
}
