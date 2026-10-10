'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

// Where the emailed sign-in link lands: swap the one-time code for a session, then go to the
// right dashboard (the home page decides: HQ, leader or partner).
export default function SignInLink() {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setFailed(true);
      return;
    }
    createClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) setFailed(true);
        else window.location.replace('/');
      });
  }, []);
  useEffect(() => {
    if (failed) window.location.replace('/login?error=link');
  }, [failed]);
  return <div className="min-h-screen grid place-items-center bg-brand-teal text-white text-sm">Signing you in…</div>;
}
