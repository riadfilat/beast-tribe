import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/models';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isEmailConfirmed: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Skip network calls when using placeholder credentials
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.warn('[AuthProvider] fetchProfile error:', error.message);
        setProfile(null);
      } else {
        setProfile(data as Profile | null);
      }
    } catch (err) {
      console.warn('[AuthProvider] fetchProfile exception:', err);
      setProfile(null);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }

  function createDemoProfile(fullName: string, onboarded: boolean): Profile {
    return {
      id: 'demo',
      full_name: fullName,
      display_name: fullName.split(' ')[0],
      avatar_url: null,
      gender: null,
      total_xp: 0,
      level: 1,
      tier: 'initiate' as const,
      current_streak: 0,
      longest_streak: 0,
      region: 'SA',
      is_premium: false,
      onboarding_completed: onboarded,
      training_frequency: 4,
      beast_score: 0,
      pack_id: null,
      community_id: null,
      created_at: new Date().toISOString(),
      date_of_birth: null,
      city: null,
      experience_level: null,
      five_k_time_seconds: null,
      max_bench_kg: null,
      daily_steps_avg: null,
    };
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured) {
      const demoSession = { user: { id: 'demo', email } } as unknown as Session;
      setSession(demoSession);
      setProfile(createDemoProfile(fullName, false));
      return;
    }

    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // If Supabase returned a session immediately (email confirmation disabled),
    // create the profile then sign out — the user MUST confirm their email
    // before they can access the app, regardless of Supabase project settings.
    if (data.user && data.session) {
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!existing) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            display_name: fullName.split(' ')[0],
          });
          if (profileError) {
            console.error('Profile insert error:', profileError);
            throw profileError;
          }
        }
      } catch (err) {
        await supabase.auth.signOut();
        throw err;
      }
      // Sign out so the user can't enter the app until email is confirmed
      await supabase.auth.signOut();
    }

    // Always end signup with the "check your email" prompt —
    // whether Supabase confirmation is enabled or disabled.
    throw new Error('CHECK_EMAIL_CONFIRMATION');
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) {
      const demoSession = { user: { id: 'demo', email } } as unknown as Session;
      setSession(demoSession);
      setProfile(createDemoProfile(email.split('@')[0], true));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    if (!isSupabaseConfigured) {
      setSession(null);
      setProfile(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }

  async function completeOnboarding() {
    if (!isSupabaseConfigured) {
      setProfile((prev) => prev ? { ...prev, onboarding_completed: true } : prev);
      return;
    }
    if (session?.user) {
      // Try updating the existing profile
      const { data: updateData, error: updateErr } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', session.user.id)
        .select();

      if (updateErr) {
        console.error('Failed to complete onboarding:', updateErr);
      }

      // If no rows were updated (profile doesn't exist), create it
      if (!updateData || updateData.length === 0) {
        await supabase.from('profiles').insert({
          id: session.user.id,
          full_name: session.user.email?.split('@')[0] || 'Beast',
          display_name: session.user.email?.split('@')[0] || 'Beast',
          onboarding_completed: true,
        });
      }

      // Force re-fetch (bypass fetchingRef guard)
      fetchingRef.current = false;
      await fetchProfile(session.user.id);
    }

    // Optimistic update — ensures AuthGate sees onboarding_completed = true
    setProfile((prev) => prev ? { ...prev, onboarding_completed: true } : prev);
  }

  async function refreshProfile() {
    if (session?.user) {
      if (!isSupabaseConfigured) return;
      await fetchProfile(session.user.id);
    }
  }

  // Re-fetches the session from Supabase — used after user clicks confirmation link
  async function refreshSession() {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      setSession(data.session);
      fetchingRef.current = false;
      await fetchProfile(data.session.user.id);
    }
  }

  // Email is confirmed if confirmed_at is set, or if Supabase confirmation is disabled (no email in unconfirmed list)
  const isEmailConfirmed = !isSupabaseConfigured
    ? true
    : !!session?.user?.email_confirmed_at || !!session?.user?.confirmed_at;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isEmailConfirmed,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        refreshSession,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
