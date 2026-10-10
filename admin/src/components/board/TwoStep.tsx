'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase-browser';

// Two-step sign-in: scan a QR code once with an authenticator app (Google Authenticator,
// Microsoft Authenticator, 1Password…), then every sign-in also asks for its 6-digit code.
type Factor = { id: string; friendly_name?: string; status: string; created_at: string };

export function TwoStep({ required = false }: { required?: boolean }) {
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
    if (err || !data) return setError(err?.message || 'Could not start. Try again.');
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
    if (!window.confirm('Turn off two-step sign-in for this account?')) return;
    const { error: err } = await createClient().auth.mfa.unenroll({ factorId: id });
    if (err) setError('To turn it off, sign out and sign in again with your code first.');
    load();
  }

  return (
    <div className="grid gap-3">
      {required ? <p className="rounded-xl px-4 py-3 text-[13px]" style={{ background: 'var(--wash)', borderLeft: '3px solid var(--warn)' }}>Admin accounts need two-step sign-in. Set it up once to open the dashboard.</p> : null}
      <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>After your password, sign-in also asks for a 6-digit code from an app on your phone. Someone with your password alone can’t get in.</p>
      {factors === null ? (
        <p className="hint">Loading…</p>
      ) : factors.length ? (
        <>
          <p className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--good)' }}>
            <CheckCircle size={18} weight="fill" /> On for this account{done ? '. Your next sign-in asks for the code.' : ''}
          </p>
          {factors.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <span style={{ color: 'var(--ink-soft)' }}>{f.friendly_name || 'Authenticator app'} · added {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <button onClick={() => turnOff(f.id)} className="btn danger small">Turn off</button>
            </div>
          ))}
        </>
      ) : enroll ? (
        <form onSubmit={confirm} className="grid gap-3">
          <p className="text-[13px]"><b>1.</b> Open an authenticator app and scan this code.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enroll.qr} alt="QR code to add Beast Tribe to your authenticator app" className="w-48 h-48 mx-auto rounded-lg bg-white p-2" />
          <p className="hint text-center break-all">Can’t scan? Enter this key: <span className="font-mono select-all">{enroll.secret}</span></p>
          <p className="text-[13px]"><b>2.</b> Type the 6-digit code the app shows.</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="input text-center text-2xl tracking-[0.5em] font-semibold num"
            placeholder="••••••"
            aria-label="6-digit code"
          />
          <button type="submit" disabled={busy || code.length !== 6} className="btn">{busy ? 'Checking…' : 'Turn on'}</button>
        </form>
      ) : (
        <div>
          <button onClick={start} disabled={busy} className="btn"><ShieldCheck size={16} weight="bold" /> {busy ? 'Starting…' : 'Set up two-step sign-in'}</button>
        </div>
      )}
      {error ? <p role="alert" className="text-[13px]" style={{ color: 'var(--bad)' }}>{error}</p> : null}
    </div>
  );
}
