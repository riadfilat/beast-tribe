'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COMMUNITY_COOKIE, myTeams } from '@/lib/leader/context';

/** Pick which of your communities the dashboard shows (only ones you lead or support). */
export async function switchCommunity(formData: FormData) {
  const id = String(formData.get('community') || '');
  if ((await myTeams()).some((t) => t.id === id)) {
    (await cookies()).set(COMMUNITY_COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  redirect('/leader');
}
