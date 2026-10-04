'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PackMark } from '@/components/brand/Logo';
import { DASHBOARD_MIN_LENGTH, MIN_LENGTH, passwordProblem, passwordScore } from '@/lib/password';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get('code');

    async function init() {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          setHasSession(false);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
    }

    init();
  }, [searchParams]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Dashboard accounts need 12 characters, members 10; common and guessable passwords are refused.
    const supabaseCheck = createClient();
    const { data: who } = await supabaseCheck.auth.getUser();
    const { data: role } = who.user ? await supabaseCheck.from('admin_roles').select('role').eq('user_id', who.user.id).maybeSingle() : { data: null };
    const min = role ? DASHBOARD_MIN_LENGTH : MIN_LENGTH;
    const problem = passwordProblem(password, who.user?.email || '', min);
    if (problem) {
      setError(
        problem === 'short' ? `Use at least ${min} characters.`
        : problem === 'common' ? 'That password is too common. Pick one that is harder to guess.'
        : problem === 'personal' ? "Don't use your email in your password."
        : 'Avoid repeated or keyboard patterns like 123456 or qwerty.',
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (hasSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-teal">
        <div className="relative w-full max-w-md px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-2xl mb-4 shadow-lg">
              <Icon name="error" size="lg" className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-500 transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-teal">
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
            <PackMark height={34} id="bt-auth" className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-brand-teal">Create New Password</h1>
            <p className="text-sm text-gray-400 mt-1">Enter your new password below</p>
          </div>

          {!success ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-aqua focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={10}
                  autoFocus
                />
                {password ? (
                  <div className="mt-2 flex items-center gap-2" aria-live="polite">
                    <div className="flex-1 grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={`h-1.5 rounded-full ${passwordScore(password) >= n ? (passwordScore(password) <= 1 ? 'bg-red-500' : passwordScore(password) === 2 ? 'bg-amber-500' : 'bg-emerald-600') : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 w-14 text-right">{['', 'Weak', 'Fair', 'Good', 'Strong'][passwordScore(password)]}</span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-aqua focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
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
                className="w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4 shadow-lg">
                <Icon name="success" size="lg" className="text-green-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset</h2>
              <p className="text-gray-600 mb-6">Your password has been successfully reset.</p>
              <p className="text-sm text-gray-500">Redirecting to login in 3 seconds...</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-6">
            Need help?{' '}
            <Link href="/login" className="text-brand-aqua hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-teal">
          <div className="relative w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
