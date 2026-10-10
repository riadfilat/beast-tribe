'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EnvelopeSimple, Prohibit, ArrowCounterClockwise } from '@phosphor-icons/react';
import { resetUserPassword, suspendUser, unsuspendUser } from '../actions';

interface Props {
  userId: string;
  suspended: boolean;
  hasEmail: boolean;
}

/** Account tools: send a password reset, suspend (with a reason for the log) or lift a suspension. */
export function MemberActions({ userId, suspended, hasEmail }: Props) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<void>, done: string) {
    setMsg(null);
    startTransition(async () => {
      try {
        await fn();
        setMsg({ ok: true, text: done });
        setAsking(false);
        setReason('');
        router.refresh();
      } catch (e: any) {
        setMsg({ ok: false, text: `Something went wrong: ${e?.message || e}` });
      }
    });
  }

  const reset = () => {
    if (confirm('Email this person a link to choose a new password?')) run(() => resetUserPassword(userId), 'Password reset email sent.');
  };
  const lift = () => {
    if (confirm('Let this person sign in again?')) run(() => unsuspendUser(userId), 'Suspension lifted. They can sign in again.');
  };
  const suspend = () => {
    if (!reason.trim()) return setMsg({ ok: false, text: 'Write a short reason first.' });
    run(() => suspendUser(userId, reason.trim()), 'Account suspended. They can no longer sign in.');
  };

  return (
    <div className="grid gap-3">
      {suspended ? (
        <p className="text-[13px]" style={{ color: 'var(--bad)' }}>This account is suspended: they can’t sign in.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn ghost small" onClick={reset} disabled={pending || !hasEmail} title={hasEmail ? undefined : 'No email on this account'}>
          <EnvelopeSimple size={15} weight="bold" /> Send password reset
        </button>
        {suspended ? (
          <button type="button" className="btn ghost small" onClick={lift} disabled={pending}>
            <ArrowCounterClockwise size={15} weight="bold" /> Lift suspension
          </button>
        ) : !asking ? (
          <button type="button" className="btn danger small" onClick={() => { setAsking(true); setMsg(null); }} disabled={pending}>
            <Prohibit size={15} weight="bold" /> Suspend
          </button>
        ) : null}
      </div>

      {asking && !suspended ? (
        <div className="well p-3 grid gap-2">
          <label className="label" htmlFor="suspend-reason" style={{ marginBottom: 0 }}>Why are you suspending them?</label>
          <textarea id="suspend-reason" className="input" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Repeated reports of abuse" autoFocus />
          <p className="hint">Only staff see this. They won’t be able to sign in until you lift it.</p>
          <div className="flex gap-2">
            <button type="button" className="btn danger small" onClick={suspend} disabled={pending}>{pending ? 'Suspending…' : 'Suspend account'}</button>
            <button type="button" className="btn ghost small" onClick={() => { setAsking(false); setReason(''); setMsg(null); }} disabled={pending}>Cancel</button>
          </div>
        </div>
      ) : null}

      {msg ? <p role="status" className="text-[13px]" style={{ color: msg.ok ? 'var(--good)' : 'var(--bad)' }}>{msg.text}</p> : null}
    </div>
  );
}
