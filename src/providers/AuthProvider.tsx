import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { savePushToken } from '../lib/notifications';
import { Profile } from '../types/models';
import { PREVIEW, previewProfile } from '../data/preview';
import { i18n, registerLanguageListener } from '../i18n';
import { saveLocale } from '../data/locale';

/** Preview starts signed in unless the web URL asks for the auth screens (?auth=1). */
function previewStartsSignedIn() {
  if (!PREVIEW) return false;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search.includes('auth=1')) return false;
  } catch {}
  return true;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isEmailConfirmed: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  // Ensures we only register the device's push token once per signed-in user.
  const pushRegisteredForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Preview (design QA) signs in a synthetic member; otherwise demo mode starts signed out.
      if (previewStartsSignedIn()) {
        setSession({ user: { id: previewProfile.id, email: 'preview@beasttribe.test', email_confirmed_at: new Date().toISOString() } } as unknown as Session);
        setProfile(previewProfile as unknown as Profile);
      }
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Always release the splash screen after the initial resolution,
        // even if a concurrent fetch is in-flight (Fix 1: infinite splash race).
        fetchProfile(session.user.id).finally(() => setLoading(false));
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
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Once the user is authenticated, register + save their push token (once per user).
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || userId === 'demo' || !isSupabaseConfigured) return;
    if (pushRegisteredForRef.current === userId) return;
    pushRegisteredForRef.current = userId;
    Promise.resolve()
      .then(() => savePushToken(userId))
      .catch(() => {});
  }, [session?.user?.id]);

  // Language switches are saved on the profile so push notifications arrive in it.
  useEffect(() => {
    const userId = session?.user?.id;
    registerLanguageListener((lang) => saveLocale(userId, lang));
  }, [session?.user?.id]);

  // Keep the language on the profile in step with the app (push notifications are sent in it),
  // including when the app starts in Arabic because the phone is in Arabic.
  useEffect(() => {
    const saved = (profile as any)?.locale;
    if (profile?.id && saved !== undefined && saved !== i18n.lang) saveLocale(profile.id, i18n.lang);
  }, [profile?.id, (profile as any)?.locale]);

  async function fetchProfile(userId: string) {
    // Guard against concurrent fetches, but never block the caller's
    // setLoading(false) — that always runs in the caller's .finally().
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      // Own row only, through my_profile(): other members can read just a name and a photo.
      const { data, error } = await supabase.rpc('my_profile').maybeSingle();
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
    }
  }

  function createDemoProfile(fullName: string, onboarded: boolean): Profile {
    return {
      id: 'demo',
      full_name: fullName,
      display_name: fullName.split(' ')[0],
      avatar_url: null,
      gender: null,
      region: 'SA',
      onboarding_completed: onboarded,
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

    const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) throw error;

    // Email confirmation is off in this Supabase project, so sign-up returns a live session.
    // Keep the member signed in and let AuthGate take them straight into onboarding.
    // (Signing them out here raced AuthGate: onboarding opened, then everything bounced to
    // sign-in, so the onboarding buttons looked dead.) The DB trigger creates the profile;
    // this upsert also sets the name in case the trigger isn't there.
    if (data.user && data.session) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, full_name: fullName, display_name: fullName.split(' ')[0] }, { onConflict: 'id' });
      if (profileError) console.warn('[AuthProvider] profile upsert:', profileError.message);
      setSession(data.session);
      fetchingRef.current = false;
      await fetchProfile(data.user.id);
      return;
    }

    // Confirmation is on: they must tap the link in their email first.
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

  // Permanently deletes the signed-in user's account via the
  // `delete_my_account` RPC (removes auth.users row → cascades to profile
  // and all related data), then clears the local session so the app
  // returns to the auth screen.
  async function deleteAccount() {
    if (!isSupabaseConfigured) {
      setSession(null);
      setProfile(null);
      return;
    }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    // Local sign-out cleanup → AuthGate routes back to auth.
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
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
        .select('id');

      // Throw on update error so the caller can surface it and NOT navigate
      // (Fix 3: don't falsely mark onboarding complete then loop).
      if (updateErr) {
        console.error('Failed to complete onboarding:', updateErr);
        throw updateErr;
      }

      // If no rows were updated (profile doesn't exist), create it
      if (!updateData || updateData.length === 0) {
        const { error: insertErr } = await supabase.from('profiles').insert({
          id: session.user.id,
          full_name: session.user.email?.split('@')[0] || 'Beast',
          display_name: session.user.email?.split('@')[0] || 'Beast',
          onboarding_completed: true,
        });
        if (insertErr) {
          console.error('Failed to create profile on onboarding:', insertErr);
          throw insertErr;
        }
      }

      // Force re-fetch (bypass fetchingRef guard)
      fetchingRef.current = false;
      await fetchProfile(session.user.id);
    }

    // Optimistic update — ensures AuthGate sees onboarding_completed = true. If the profile could not
    // be read back, a minimal one still lets the member in; the next refresh fills in the rest.
    setProfile((prev) =>
      prev
        ? { ...prev, onboarding_completed: true }
        : session?.user
          ? ({ id: session.user.id, full_name: session.user.email?.split('@')[0] || '', onboarding_completed: true } as Profile)
          : prev,
    );
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
        deleteAccount,
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
