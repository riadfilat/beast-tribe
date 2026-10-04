'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Lockup } from '@/components/brand/Logo';

// Second step of signing in: the 6-digit code from the authenticator app.
export default function VerifyCodePage() {
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const f = data?.totp?.find((x) => x.status === 'verified');
      if (f) setFactorId(f.id);
      else window.location.href = '/';
    });
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (err) {
      setError('That code is not right. Use the newest code from your authenticator app.');
      setCode('');
      return;
    }
    window.location.href = '/';
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-teal px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <Lockup height={26} id="bt-verify" className="mx-auto" />
          <h1 className="text-lg font-bold text-gray-900 mt-5">Enter your code</h1>
          <p className="text-sm text-gray-500 mt-1">Open your authenticator app and type the 6-digit code for Beast Tribe.</p>
        </div>
        <form onSubmit={verify} className="space-y-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-semibold tabular-nums focus:ring-2 focus:ring-brand-aqua outline-none"
            placeholder="••••••"
            aria-label="6-digit code"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={busy || code.length !== 6 || !factorId} className="w-full py-2.5 bg-brand-orange text-white rounded-xl font-semibold disabled:opacity-50">
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </form>
        <button onClick={signOut} className="w-full mt-4 text-sm text-gray-500 hover:underline">
          Sign out
        </button>
      </div>
    </div>
  );
}
