import { redirect } from 'next/navigation';
import { getAccessType } from '@/lib/auth';

export default async function RootPage() {
  const access = await getAccessType();

  if (access === 'admin') redirect('/dashboard');
  if (access === 'partner') redirect('/partner/dashboard');
  redirect('/login');
}
