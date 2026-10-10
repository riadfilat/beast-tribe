import { redirect } from 'next/navigation';
import { getAccessType } from '@/lib/auth';

export default async function RootPage() {
  const access = await getAccessType();

  if (access === 'admin') redirect('/hq');
  if (access === 'leader') redirect('/leader');
  redirect('/login?error=no_community');
}
