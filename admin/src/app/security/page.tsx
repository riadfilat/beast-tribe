'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

// Two-step sign-in for the dashboard: scan a QR code once with an authenticator app
// (Google Authenticator, Microsoft Authenticator, 1Password…), then every sign-in asks for its code.
type Factor = { id: string; friendly_name?: string; status: string; created_at: string };

export default function SecurityPage() {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function load() {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors(((data?.all || []) as Factor[]).filter((f) => f.status === 'verified'));
  }
  useEffect(() => {
    load();
  }, []);

  async function start() {
    setError('');
    setBusy(true);
    const supabase = createClient();
    // An unfinished earlier attempt blocks a new one with the same name: clear it first.
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of (list?.all || []) as Factor[]) if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Beast Tribe dashboard' });
    setBusy(false);
    if (err || !data) {
      setError(err?.message || 'Could not start. Try again.');
      return;
    }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll || code.length !== 6) return;
    setBusy(true);
    setError('');
    const { error: err } = await createClient().auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
    setBusy(false);
    if (err) {
      setError('That code is not right. Use the newest code shown in the app.');
      setCode('');
      return;
    }
    setEnroll(null);
    setCode('');
    setDone(true);
    load();
  }

  async function turnOff(id: string) {
    if (!confirmBox('Turn off two-step sign-in for this account?')) return;
    const { error: err } = await createClient().auth.mfa.unenroll({ factorId: id });
    if (err) setError('To turn it off, sign out and sign in again with your code first.');
    load();
  }

  const on = !!factors?.length;
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">
        <a href="/" className="text-sm text-[#147070] hover:underline">← Back to the dashboard</a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Two-step sign-in</h1>
          <p className="text-sm text-gray-500 mt-1">After your password, sign-in also asks for a 6-digit code from an app on your phone. Someone with your password alone can't get in.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          {factors === null ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : on ? (
            <>
              <p className="text-sm font-semibold text-[#25704F]">✓ On for this account{done ? '. Next sign-in will ask for your code.' : ''}</p>
              {factors.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{f.friendly_name || 'Authenticator app'} · added {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <button onClick={() => turnOff(f.id)} className="text-red-600 hover:underline">Turn off</button>
                </div>
              ))}
            </>
          ) : enroll ? (
            <form onSubmit={confirm} className="space-y-4">
              <p className="text-sm text-gray-700"><b>1.</b> Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password) and scan this code.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enroll.qr} alt="QR code to add Beast Tribe to your authenticator app" className="w-48 h-48 mx-auto border border-gray-100 rounded-lg" />
              <p className="text-xs text-gray-500 text-center break-all">Can't scan? Enter this key: <span className="font-mono">{enroll.secret}</span></p>
              <p className="text-sm text-gray-700"><b>2.</b> Type the 6-digit code the app shows.</p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-brand-aqua"
                placeholder="••••••"
                aria-label="6-digit code"
              />
              <button type="submit" disabled={busy || code.length !== 6} className="w-full py-2.5 bg-brand-orange text-white rounded-xl font-semibold disabled:opacity-50">
                {busy ? 'Checking…' : 'Turn on'}
              </button>
            </form>
          ) : (
            <>
              <p className="text-sm text-gray-700">Not on yet. It takes a minute and protects everything in the dashboard.</p>
              <button onClick={start} disabled={busy} className="px-5 py-2.5 bg-brand-orange text-white rounded-xl font-semibold disabled:opacity-50">
                {busy ? 'Starting…' : 'Set up two-step sign-in'}
              </button>
            </>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

function confirmBox(msg: string) {
  return typeof window !== 'undefined' ? window.confirm(msg) : false;
}
