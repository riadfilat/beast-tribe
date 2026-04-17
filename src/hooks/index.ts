import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useSupabaseQuery } from './useSupabaseQuery';
import { SPORTS, HABIT_DEFINITIONS } from '../lib/constants';
import { addLocalEvent, getLocalEvents } from '../lib/localEventStore';

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
        glasses: 1, // Each tap = 0.5L (UI converts glasses to liters: glasses * 0.5)
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
        sport_id: workout.sport_id || null,
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
          .eq('is_hidden', false)
          .neq('image_status', 'rejected')
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
        .eq('is_hidden', false)
        .neq('image_status', 'rejected')
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
        await supabase.from('beasts').delete().eq('post_id', postId).eq('user_id', u.id);
      } else {
        const { error } = await supabase.from('beasts').insert({ post_id: postId, user_id: u.id });
        if (error) throw error;
        // Award XP to the giver for engaging with the tribe
        await supabase.from('xp_transactions').insert({
          user_id: u.id,
          amount: 10,
          source: 'beast_given',
          source_id: postId,
          description: 'Gave a Beast reaction',
        });
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
      const { data: post, error } = await supabase.from('feed_posts').insert({
        user_id: u.id,
        content: content.trim(),
        sport_id: sportFilter && sportFilter !== 'All' ? sportFilter : null,
        is_visible: true,
      }).select('id').single();
      if (error) throw error;

      // Award XP for posting a workout to the feed
      await supabase.from('xp_transactions').insert({
        user_id: u.id,
        amount: 75,
        source: 'post_workout',
        source_id: post?.id,
        sport_id: sportFilter && sportFilter !== 'All' ? sportFilter : null,
        description: 'Posted a workout to feed',
      });
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
// STREAK XP
// ============================================
/** Call after logging any activity to check and award streak XP */
export function useAwardStreakXP() {
  const { user, profile } = useAuth();

  const checkAndAwardStreak = useCallback(async () => {
    if (!isSupabaseConfigured || !user || !profile) return;
    const streak = profile.current_streak || 0;
    if (streak < 2) return; // No bonus for first day

    // Check if streak XP already awarded today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('xp_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', 'streak')
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) return; // Already awarded today

    await supabase.from('xp_transactions').insert({
      user_id: user.id,
      amount: 50,
      source: 'streak',
      description: `${streak}-day streak bonus`,
    });
  }, [user, profile]);

  return { checkAndAwardStreak };
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

export function useCreateEvent() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const createEvent = useCallback(async (event: {
    title: string;
    sport_id?: string;
    event_type: string;
    starts_at: string;
    location_name?: string;
    location_city?: string;
    coach_name?: string;
    description?: string;
    difficulty?: string;
    is_women_only?: boolean;
    country?: string;
    image_url?: string;
  }) => {
    const u = userRef.current;
    setLoading(true);
    try {
      const sportName = SPORTS.find(s => s.id === event.event_type)?.name || event.event_type;

      // Always store locally so event shows immediately
      const localEvt = {
        id: `local-${Date.now()}`,
        ...event,
        sport: { name: sportName },
        joined: true,
        rsvp_count: [{ count: 1 }] as [{ count: number }],
      };
      addLocalEvent(localEvt);

      if (!isSupabaseConfigured || !u) {
        await new Promise(r => setTimeout(r, 400));
        return localEvt;
      }

      // Also save to Supabase
      try {
        const { data, error } = await supabase.from('events').insert({
          ...event,
          created_by: u.id,
        }).select().single();
        if (!error && data) {
          // Auto-RSVP the creator
          await supabase.from('event_rsvps').upsert({
            event_id: data.id,
            user_id: u.id,
            status: 'going',
          });
          return data;
        }
      } catch (dbErr) {
        console.warn('Supabase insert failed, using local event:', dbErr);
      }
      return localEvt;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEvent, loading };
}

// ============================================
// LEADERBOARD
// ============================================
export function useLeaderboard(timeRange: string = 'all', packId?: string, sportId?: string) {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      if (timeRange === 'beast_score') {
        return supabase.from('profiles')
          .select('id, display_name, full_name, tier, total_xp, beast_score, avatar_url')
          .order('beast_score', { ascending: false })
          .limit(20);
      }

      if (timeRange === 'weekly') {
        // Sum XP from this week's transactions, optionally filtered by sport
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        let query = supabase.from('xp_transactions')
          .select('user_id, amount, sport_id, profile:profiles!user_id(id, display_name, full_name, tier, total_xp, avatar_url)')
          .gte('created_at', weekAgo.toISOString());
        if (sportId) query = query.eq('sport_id', sportId);
        return query.order('amount', { ascending: false }).limit(100);
      }

      if (timeRange === 'pack' && packId) {
        // Pack leaderboard — if sport selected, sum sport XP from xp_transactions
        if (sportId) {
          return supabase.from('xp_transactions')
            .select('user_id, amount, profile:profiles!user_id(id, display_name, full_name, tier, total_xp, avatar_url, pack_members!inner(pack_id))')
            .eq('sport_id', sportId)
            .eq('profile.pack_members.pack_id', packId)
            .order('amount', { ascending: false })
            .limit(100);
        }
        return supabase.from('pack_members')
          .select('*, profile:profiles(id, display_name, full_name, tier, total_xp, avatar_url)')
          .eq('pack_id', packId)
          .order('profile->total_xp', { ascending: false });
      }

      // 'all' — if sport selected, aggregate from xp_transactions; otherwise use profiles.total_xp
      if (sportId) {
        return supabase.from('xp_transactions')
          .select('user_id, amount, profile:profiles!user_id(id, display_name, full_name, tier, total_xp, avatar_url)')
          .eq('sport_id', sportId)
          .order('amount', { ascending: false })
          .limit(100);
      }
      return supabase.from('profiles')
        .select('id, display_name, full_name, tier, total_xp, avatar_url')
        .order('total_xp', { ascending: false })
        .limit(20);
    },
    [timeRange, packId, sportId, user?.id],
    []
  );
}

/** Fetch all sports from DB for sport filter tabs */
export function useSports() {
  return useSupabaseQuery<any[]>(
    () => supabase.from('sports')
      .select('id, name, emoji')
      .eq('is_active', true)
      .order('name'),
    [],
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
/** Get the first pack membership (backward compat for pack challenge on home screen) */
export function useMyPack() {
  const { user } = useAuth();
  return useSupabaseQuery<any>(
    () => {
      if (!user?.id) return Promise.resolve({ data: null, error: null });
      return supabase.from('pack_members')
        .select('*, pack:packs(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();
    },
    [user?.id],
    null
  );
}

/** Get ALL pack memberships for the current user (up to 4) */
export function useMyPacks() {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      if (!user?.id) return Promise.resolve({ data: [], error: null });
      return supabase.from('pack_members')
        .select('*, pack:packs(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true });
    },
    [user?.id],
    []
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
      // Check 4-pack limit
      const { count: userPackCount, error: countErr } = await supabase.from('pack_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id);
      if (countErr) throw new Error(countErr.message);
      if (userPackCount !== null && userPackCount >= 4) {
        throw new Error('You can only be in up to 4 packs at once.');
      }

      // Generate invite code client-side (6 char alphanumeric)
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: pack, error: packErr } = await supabase.from('packs').insert({
        name,
        animal,
        created_by: u.id,
        invite_code: code,
        is_system: false,
      }).select().single();
      if (packErr) throw new Error(packErr.message);

      // Join as leader
      const { error: memberErr } = await supabase.from('pack_members').insert({
        pack_id: pack.id,
        user_id: u.id,
        role: 'leader',
      });
      if (memberErr) throw new Error(memberErr.message);

      return pack;
    } catch (err) {
      throw err;
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

      // Check pack capacity
      const { count: packCapacity } = await supabase.from('pack_members')
        .select('*', { count: 'exact', head: true })
        .eq('pack_id', pack.id);
      if (packCapacity && packCapacity >= (pack.max_members || 20)) {
        setError('This pack is full');
        return null;
      }

      // Check user's pack limit (max 4 tribe packs)
      const { count: userPackCount } = await supabase.from('pack_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id);
      if (userPackCount !== null && userPackCount >= 4) {
        setError('You can join up to 4 packs — leave one first');
        return null;
      }

      // Check if already in this specific pack
      const { data: existing } = await supabase.from('pack_members')
        .select('id')
        .eq('pack_id', pack.id)
        .eq('user_id', u.id)
        .maybeSingle();
      if (existing) {
        setError('You are already in this pack');
        return null;
      }

      // Join
      const { error: joinErr } = await supabase.from('pack_members').insert({
        pack_id: pack.id,
        user_id: u.id,
        role: 'member',
      });
      if (joinErr) throw joinErr;

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

      // If accepted, check 4-pack limit then join
      if (accept) {
        const { count: userPackCount } = await supabase.from('pack_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', u.id);
        if (userPackCount !== null && userPackCount >= 4) {
          // Already at max — decline instead
          await supabase.from('pack_invites')
            .update({ status: 'declined' })
            .eq('id', inviteId);
          return;
        }
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

// ============================================
// HABITS & BEAST SCORE
// ============================================

/** Save training frequency to profile */
export function useSaveTrainingFrequency() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const saveFrequency = useCallback(async (frequency: number) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ training_frequency: frequency }).eq('id', u.id);
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveFrequency, loading };
}

/** Save user habits during onboarding */
export function useSaveHabits() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const saveHabits = useCallback(async (habits: Array<{ key: string; target: number }>) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      // Look up habit definition IDs by key
      const { data: defs, error: defErr } = await supabase
        .from('habit_definitions')
        .select('id, key')
        .in('key', habits.map(h => h.key));
      if (defErr) throw defErr;
      if (!defs || defs.length === 0) return;

      // Delete existing user habits
      await supabase.from('user_habits').delete().eq('user_id', u.id);

      // Insert new
      const rows = habits.map(h => {
        const def = defs.find((d: any) => d.key === h.key);
        if (!def) return null;
        return { user_id: u.id, habit_definition_id: def.id, target: h.target };
      }).filter(Boolean);

      if (rows.length > 0) {
        const { error } = await supabase.from('user_habits').insert(rows);
        if (error) throw error;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveHabits, loading };
}

/** Fetch user's active habits with definitions */
export function useUserHabits() {
  const { user } = useAuth();
  return useSupabaseQuery<any[]>(
    () => {
      if (!user?.id) return Promise.resolve({ data: [], error: null });
      return supabase.from('user_habits')
        .select('*, habit_definition:habit_definitions(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
    },
    [user?.id],
    []
  );
}

/** Fetch today's habit logs for current user */
export function useTodayHabitProgress() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useSupabaseQuery<any[]>(
    () => {
      if (!user?.id) return Promise.resolve({ data: [], error: null });
      return supabase.from('habit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('logged_date', today);
    },
    [user?.id, today],
    []
  );
}

/** Log a habit completion */
export function useLogHabit() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;
  const [loading, setLoading] = useState(false);

  const logHabit = useCallback(async (userHabitId: string, value: number = 1) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('habit_logs').upsert({
        user_id: u.id,
        user_habit_id: userHabitId,
        logged_date: today,
        value,
      }, { onConflict: 'user_habit_id,logged_date' });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { logHabit, loading };
}

/** Fetch beast score for current user */
export function useBeastScore() {
  const { user } = useAuth();
  return useSupabaseQuery<any>(
    () => {
      if (!user?.id) return Promise.resolve({ data: null, error: null });
      return supabase.from('beast_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
    },
    [user?.id],
    null
  );
}

/** Check if all habits completed today — award Perfect Day XP */
export function useCheckPerfectDay() {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const checkPerfectDay = useCallback(async (habits: any[], todayLogs: any[]) => {
    const u = userRef.current;
    if (!isSupabaseConfigured || !u || habits.length === 0) return false;

    // Check if every active habit has a log for today
    const loggedHabitIds = new Set(todayLogs.map((l: any) => l.user_habit_id));
    const allComplete = habits.every((h: any) => loggedHabitIds.has(h.id));
    if (!allComplete) return false;

    // Check if perfect day XP already awarded today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('xp_transactions')
      .select('id')
      .eq('user_id', u.id)
      .eq('source', 'perfect_day')
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);
    if (existing && existing.length > 0) return false;

    // Award XP
    await supabase.from('xp_transactions').insert({
      user_id: u.id,
      amount: 100,
      source: 'perfect_day',
      description: 'Perfect Day — all habits completed!',
    });
    return true;
  }, []);

  return { checkPerfectDay };
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

// ============================================
// CHAT
// ============================================

// Empty — real messages from Supabase
const DEMO_CHAT_MESSAGES: any[] = [];

/** Get or create a chat room for a pack or event */
export function useChatRoom(type: 'pack' | 'event', targetId?: string) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    if (!isSupabaseConfigured || targetId.startsWith('demo')) {
      setRoomId(`demo-room-${type}-${targetId}`);
      setLoading(false);
      return;
    }

    async function fetchOrCreate() {
      setLoading(true);
      const column = type === 'pack' ? 'pack_id' : 'event_id';
      // Try to find existing room
      const { data, error } = await supabase.from('chat_rooms').select('id').eq(column, targetId).single();
      if (data) {
        setRoomId(data.id);
      } else {
        // Create room
        const { data: newRoom, error: createErr } = await supabase.from('chat_rooms').insert({
          type,
          [column]: targetId,
          name: `${type} chat`,
        }).select('id').single();
        if (newRoom) {
          setRoomId(newRoom.id);
        } else {
          // Fallback to demo room if DB fails
          console.warn('Chat room create failed:', createErr?.message);
          setRoomId(`demo-room-${type}-${targetId}`);
        }
      }
      setLoading(false);
    }
    fetchOrCreate();
  }, [type, targetId]);

  return { roomId, loading };
}

/** Fetch chat messages for a room */
export function useChatMessages(roomId?: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function addLocalMessage(msg: any) {
    setMessages(prev => [...prev, msg]);
  }

  useEffect(() => {
    if (!roomId) { setLoading(false); return; }
    // Always use demo data for demo rooms, regardless of Supabase config
    if (roomId.startsWith('demo-') || !isSupabaseConfigured) {
      setMessages(DEMO_CHAT_MESSAGES);
      setLoading(false);
      return;
    }

    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('id, user_id, content, message_type, created_at, author:profiles(display_name, full_name, tier, avatar_url)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages(data || []);
      setLoading(false);
    }
    fetch();
  }, [roomId]);

  return { messages, loading, addLocalMessage };
}

/** Send a chat message */
export function useSendMessage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (roomId: string, content: string, messageType: 'text' | 'status' | 'ping' = 'text') => {
    if (!content.trim()) return null;
    setLoading(true);
    try {
      if (!isSupabaseConfigured || !user || roomId.startsWith('demo-')) {
        await new Promise(r => setTimeout(r, 200));
        return {
          id: `local-${Date.now()}`,
          user_id: user?.id || 'me',
          content: content.trim(),
          message_type: messageType,
          created_at: new Date().toISOString(),
          author: { display_name: profile?.display_name || 'You', full_name: profile?.full_name || 'You', tier: profile?.tier || 'initiate' },
        };
      }
      const { data, error } = await supabase.from('chat_messages').insert({
        room_id: roomId,
        user_id: user.id,
        content: content.trim(),
        message_type: messageType,
      }).select('id, user_id, content, message_type, created_at, author:profiles(display_name, full_name, tier, avatar_url)').single();
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  return { sendMessage, loading };
}

// ============================================
// ACTIVITY CALENDAR & JOURNAL
// ============================================

export interface DayActivity {
  workouts: number;
  habits: number;
  posts: number;
  events: number;
  journal?: string;
}

/** Fetch all activity for a given month */
export function useMonthlyActivity(year: number, month: number) {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, DayActivity>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;

    // Merge local events into activity data
    function mergeLocalEvents(map: Record<string, DayActivity>) {
      const locals = getLocalEvents();
      locals.forEach(evt => {
        const d = new Date(evt.starts_at).toISOString().split('T')[0];
        if (d >= monthStart && d < nextMonth) {
          if (!map[d]) map[d] = { workouts: 0, habits: 0, posts: 0, events: 0 };
          map[d].events++;
        }
      });
    }

    if (!isSupabaseConfigured) {
      const demo: Record<string, DayActivity> = {};
      mergeLocalEvents(demo);
      setData(demo);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const map: Record<string, DayActivity> = {};

      const initDay = (dateStr: string) => {
        if (!map[dateStr]) map[dateStr] = { workouts: 0, habits: 0, posts: 0, events: 0 };
      };

      // Workouts
      const { data: workouts } = await supabase.from('workout_logs')
        .select('completed_at').eq('user_id', user.id)
        .gte('completed_at', monthStart).lt('completed_at', nextMonth);
      (workouts || []).forEach((w: any) => {
        const d = new Date(w.completed_at).toISOString().split('T')[0];
        initDay(d); map[d].workouts++;
      });

      // Habits
      const { data: habits } = await supabase.from('habit_logs')
        .select('logged_date, user_habit:user_habits!inner(user_id)')
        .eq('user_habit.user_id', user.id)
        .gte('logged_date', monthStart).lt('logged_date', nextMonth);
      (habits || []).forEach((h: any) => {
        const d = h.logged_date;
        initDay(d); map[d].habits++;
      });

      // Posts
      const { data: posts } = await supabase.from('feed_posts')
        .select('created_at').eq('user_id', user.id)
        .gte('created_at', monthStart).lt('created_at', nextMonth);
      (posts || []).forEach((p: any) => {
        const d = new Date(p.created_at).toISOString().split('T')[0];
        initDay(d); map[d].posts++;
      });

      // Events
      const { data: rsvps } = await supabase.from('event_rsvps')
        .select('created_at').eq('user_id', user.id).eq('status', 'going')
        .gte('created_at', monthStart).lt('created_at', nextMonth);
      (rsvps || []).forEach((r: any) => {
        const d = new Date(r.created_at).toISOString().split('T')[0];
        initDay(d); map[d].events++;
      });

      // Journal
      const { data: journals } = await supabase.from('journal_entries')
        .select('entry_date, content').eq('user_id', user.id)
        .gte('entry_date', monthStart).lt('entry_date', nextMonth);
      (journals || []).forEach((j: any) => {
        initDay(j.entry_date); map[j.entry_date].journal = j.content;
      });

      mergeLocalEvents(map);
      setData(map);
      setLoading(false);
    })();
  }, [user, year, month]);

  return { data, loading };
}

/** Save a journal entry for a date */
export function useSaveJournal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveJournal = useCallback(async (date: string, content: string) => {
    if (!user) return;
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 300));
        return;
      }
      await supabase.from('journal_entries').upsert({
        user_id: user.id,
        entry_date: date,
        content: content.trim(),
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { saveJournal, loading };
}

// ============================================
// COACH BOOKING
// ============================================

/** Fetch available time slots for a coach on a specific date */
export function useCoachAvailability(partnerId?: string, date?: string) {
  const [slots, setSlots] = useState<{ start_time: string; end_time: string; booked: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!partnerId || !date) { setSlots([]); return; }

    (async () => {
      setLoading(true);
      if (!isSupabaseConfigured) {
        // Demo slots
        const demoSlots = ['06:00','07:00','08:00','09:00','10:00','16:00','17:00','18:00','19:00'].map(t => ({
          start_time: t, end_time: `${String(parseInt(t) + 1).padStart(2, '0')}:00`, booked: Math.random() > 0.7,
        }));
        setSlots(demoSlots);
        setLoading(false);
        return;
      }

      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();

      // Get coach's weekly slots for this day
      const { data: weeklySlots } = await supabase
        .from('coach_slots')
        .select('start_time, end_time')
        .eq('partner_id', partnerId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time');

      // Get existing bookings for this date
      const { data: bookings } = await supabase
        .from('coach_bookings')
        .select('start_time')
        .eq('partner_id', partnerId)
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      const bookedTimes = new Set((bookings || []).map((b: any) => b.start_time));

      const available = (weeklySlots || []).map((s: any) => ({
        start_time: s.start_time.substring(0, 5),
        end_time: s.end_time.substring(0, 5),
        booked: bookedTimes.has(s.start_time),
      }));

      setSlots(available);
      setLoading(false);
    })();
  }, [partnerId, date]);

  return { slots, loading };
}

/** Book a coach for an event */
export function useBookCoach() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const bookCoach = useCallback(async (partnerId: string, bookingDate: string, startTime: string, endTime: string, eventId?: string) => {
    if (!user) return null;
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 300));
        return { id: `demo-booking-${Date.now()}` };
      }
      const { data, error } = await supabase.from('coach_bookings').insert({
        partner_id: partnerId,
        booked_by: user.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        event_id: eventId || null,
        status: 'confirmed',
      }).select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Booking failed:', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { bookCoach, loading };
}

// ============================================
// COACH-TRAINEE PERFORMANCE TRACKING
// ============================================

/** Check if current user is a coach */
export function useIsCoach() {
  const { user } = useAuth();
  const [isCoach, setIsCoach] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    (async () => {
      const { data } = await supabase.from('partners').select('id').eq('user_id', user.id).eq('partner_type', 'coach').single();
      if (data) { setIsCoach(true); setCoachId(data.id); }
    })();
  }, [user]);

  return { isCoach, coachId };
}

/** Get coach's trainees */
export function useCoachTrainees(coachId?: string | null) {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('coach_trainees')
        .select('*, trainee:profiles!trainee_id(id, display_name, full_name, tier, total_xp, current_streak, level, beast_score, avatar_url, last_active_date)')
        .eq('coach_id', coachId)
        .eq('status', 'active')
        .order('started_at', { ascending: false });
      setTrainees(data || []);
      setLoading(false);
    })();
  }, [coachId]);

  return { trainees, loading, refetch: () => {} };
}

/** Add a trainee to a coach */
export function useAddTrainee() {
  const [loading, setLoading] = useState(false);

  const addTrainee = useCallback(async (coachId: string, traineeEmail: string) => {
    if (!isSupabaseConfigured) return null;
    setLoading(true);
    try {
      // Find trainee by display_name or full_name (sanitized)
      const sanitized = traineeEmail.replace(/[^a-zA-Z0-9\s\u0600-\u06FF]/g, '');
      if (!sanitized) throw new Error('Invalid search');
      const { data: profiles } = await supabase.from('profiles')
        .select('id, display_name, full_name')
        .or(`display_name.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`)
        .limit(1);
      if (!profiles?.length) throw new Error('User not found');

      const { data, error } = await supabase.from('coach_trainees').insert({
        coach_id: coachId,
        trainee_id: profiles[0].id,
        status: 'active',
      }).select().single();
      if (error) throw error;

      // Create default privacy settings
      await supabase.from('trainee_privacy').insert({
        trainee_id: profiles[0].id,
        coach_id: coachId,
      });

      return data;
    } catch (e: any) {
      console.warn('Add trainee error:', e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addTrainee, loading };
}

/** Get trainee's body metrics history */
export function useBodyMetrics(userId?: string) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('body_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(50);
      setMetrics(data || []);
      setLoading(false);
    })();
  }, [userId]);

  return { metrics, loading };
}

/** Log body metrics */
export function useLogBodyMetrics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const logMetrics = useCallback(async (userId: string, data: {
    weight_kg?: number; height_cm?: number; body_fat_pct?: number;
    waist_cm?: number; chest_cm?: number; hips_cm?: number;
    bicep_cm?: number; thigh_cm?: number; notes?: string;
    photo_front_url?: string; photo_side_url?: string; photo_back_url?: string;
  }) => {
    if (!user || !isSupabaseConfigured) return null;
    setLoading(true);
    try {
      // Auto-calculate BMI
      let bmi: number | undefined;
      if (data.weight_kg && data.height_cm) {
        bmi = Math.round((data.weight_kg / ((data.height_cm / 100) ** 2)) * 10) / 10;
      }
      const { data: result, error } = await supabase.from('body_metrics').insert({
        user_id: userId,
        recorded_by: user.id,
        ...data,
        bmi,
      }).select().single();
      if (error) throw error;
      return result;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { logMetrics, loading };
}

/** Get trainee's workout history */
export function useTraineeWorkouts(userId?: string) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('workout_logs')
        .select('*, sport:sports(name)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(30);
      setWorkouts(data || []);
      setLoading(false);
    })();
  }, [userId]);

  return { workouts, loading };
}

/** Get trainee's nutrition logs */
export function useTraineeNutrition(userId?: string, days = 7) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data } = await supabase.from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_date', since.toISOString().split('T')[0])
        .order('logged_date', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    })();
  }, [userId, days]);

  return { logs, loading };
}

/** Get/add coach notes for a trainee */
export function useCoachNotes(coachId?: string | null, traineeId?: string) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachId || !traineeId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('coach_notes')
        .select('*')
        .eq('coach_id', coachId)
        .eq('trainee_id', traineeId)
        .order('created_at', { ascending: false });
      setNotes(data || []);
      setLoading(false);
    })();
  }, [coachId, traineeId]);

  const addNote = useCallback(async (noteType: string, content: string, isPrivate = false) => {
    if (!coachId || !traineeId || !isSupabaseConfigured) return;
    const { data } = await supabase.from('coach_notes').insert({
      coach_id: coachId, trainee_id: traineeId, note_type: noteType, content, is_private: isPrivate,
    }).select().single();
    if (data) setNotes(prev => [data, ...prev]);
  }, [coachId, traineeId]);

  return { notes, loading, addNote };
}

/** Get trainee privacy settings */
export function useTraineePrivacy(traineeId?: string, coachId?: string | null) {
  const [privacy, setPrivacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!traineeId || !coachId || !isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('trainee_privacy')
        .select('*')
        .eq('trainee_id', traineeId)
        .eq('coach_id', coachId)
        .single();
      setPrivacy(data || { share_workouts: true, share_nutrition: true, share_habits: true, share_body_metrics: true, share_photos: false, share_on_feed: false });
      setLoading(false);
    })();
  }, [traineeId, coachId]);

  const updatePrivacy = useCallback(async (field: string, value: boolean) => {
    if (!traineeId || !coachId || !isSupabaseConfigured) return;
    await supabase.from('trainee_privacy').upsert({
      trainee_id: traineeId, coach_id: coachId, [field]: value,
    });
    setPrivacy((prev: any) => ({ ...prev, [field]: value }));
  }, [traineeId, coachId]);

  return { privacy, loading, updatePrivacy };
}
