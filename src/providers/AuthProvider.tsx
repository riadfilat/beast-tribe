import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types/models';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data as Profile | null);
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
      tier: 'raw' as const,
      current_streak: 0,
      longest_streak: 0,
      region: 'SA',
      is_premium: false,
      onboarding_completed: onboarded,
      pack_id: null,
      created_at: new Date().toISOString(),
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

    if (data.user) {
      try {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName,
          display_name: fullName.split(' ')[0],
        });
        if (profileError) throw profileError;
        await fetchProfile(data.user.id);
      } catch (err) {
        // Clean up auth session if profile creation fails
        await supabase.auth.signOut();
        throw err;
      }
    }
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

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
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
