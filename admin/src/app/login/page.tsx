'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Lockup } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Your account does not have dashboard access.',
  not_partner: 'Your account is not registered as a partner.',
  no_community: 'Your account isn’t a leader or supporter of a community yet. Ask your community leader or Beast Tribe to add your email.',
  link: 'That sign-in link has expired or was already used. Send yourself a new one.',
};

function ErrorFromParams({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      onError(ERROR_MESSAGES[errorParam]);
    }
  }, [searchParams, onError]);
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  /** No password (signed up with Apple or Google, or invited): a one-time link by email. */
  async function sendLink() {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter your email first.');
      return;
    }
    setLoading(true);
    try {
      const { error: linkError } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/login/link` } });
      if (linkError) setError(linkError.message);
      else setLinkSent(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Enter your password, or use “Email me a sign-in link”.');
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Two-step sign-in on: ask for the authenticator code before anything else.
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        window.location.href = aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2' ? '/login/verify' : '/';
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-teal">
      <Suspense>
        <ErrorFromParams onError={setError} />
      </Suspense>

      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="sr-only">Beast Tribe</h1>
            <Lockup height={30} id="bt-login" className="mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Community leaders &amp; Beast Tribe HQ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-aqua focus:border-transparent outline-none transition"
                placeholder="you@operationbeast.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs text-brand-aqua hover:underline">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-aqua focus:border-transparent outline-none transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-200"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-600">
                Remember me
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                <Icon name="warning" size="sm" className="mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
            <button
              type="button"
              onClick={sendLink}
              disabled={loading}
              className="w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              Email me a sign-in link
            </button>
            {linkSent ? (
              <p className="text-sm text-[#25704F] bg-[#E8F5EE] px-4 py-3 rounded-xl">Check your email for a sign-in link. It works once, on this device.</p>
            ) : null}
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            No password? Use the sign-in link with the email you use in the Beast Tribe app.
          </p>
        </div>
      </div>
    </div>
  );
}
