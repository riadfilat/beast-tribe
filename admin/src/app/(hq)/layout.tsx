import { redirect } from 'next/navigation';
import { requireAdmin, isAtLeast } from '@/lib/auth';
import { pendingModerationCount } from '@/lib/moderation';
import { Shell } from '@/components/board/Shell';

export const metadata = { title: 'Beast Tribe · HQ' };

export default async function HqLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  // Moderators look after the feed and photos only (their pages are in the classic dashboard).
  if (!isAtLeast(admin.role, 'admin')) redirect('/moderation');
  const pending = await pendingModerationCount();
  const nav = [
    { href: '/hq', label: 'Command center', icon: 'command' },
    { href: '/hq/communities', label: 'Leaders & communities', icon: 'communities' },
    { href: '/locations', label: 'Places & courts', icon: 'places' },
    { href: '/moderation', label: 'Safety', icon: 'safety', badge: pending },
    ...(admin.role === 'super_admin' ? [{ href: '/hq/admins', label: 'Admins', icon: 'people' }] : []),
  ];
  return (
    <Shell
      brand={<>BEAST <span style={{ color: 'var(--marker)' }}>HQ</span></>}
      identity={{ title: admin.full_name, subtitle: admin.role === 'super_admin' ? 'Super admin' : 'Admin' }}
      nav={nav}
      home="/hq"
      footer={<a href="/dashboard" className="link">Classic dashboard</a>}
    >
      {children}
    </Shell>
  );
}
