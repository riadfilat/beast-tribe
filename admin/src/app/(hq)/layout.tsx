import { requireAdmin, isAtLeast } from '@/lib/auth';
import { pendingModerationCount } from '@/lib/moderation';
import { Shell } from '@/components/board/Shell';

export const metadata = { title: 'Beast Tribe · HQ' };

export default async function HqLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const pending = await pendingModerationCount();
  const full = isAtLeast(admin.role, 'admin');
  // Moderators look after Safety only; every other page also checks the role itself.
  const nav = full
    ? [
        { href: '/hq', label: 'Command center', icon: 'command' },
        { href: '/hq/communities', label: 'Leaders & communities', icon: 'communities' },
        { href: '/hq/people', label: 'People', icon: 'people' },
        { href: '/hq/sessions', label: 'Sessions', icon: 'sessions' },
        { href: '/hq/places', label: 'Places & courts', icon: 'places' },
        { href: '/hq/leads', label: 'Leads', icon: 'growth' },
        { href: '/hq/safety', label: 'Safety', icon: 'safety', badge: pending },
        { href: '/hq/captains', label: 'Captains', icon: 'coaching' },
        ...(admin.role === 'super_admin' ? [{ href: '/hq/admins', label: 'Admins', icon: 'teams' }] : []),
        { href: '/hq/account', label: 'Account', icon: 'profile' },
      ]
    : [
        { href: '/hq/safety', label: 'Safety', icon: 'safety', badge: pending },
        { href: '/hq/account', label: 'Account', icon: 'profile' },
      ];
  const label = admin.role === 'super_admin' ? 'Super admin' : admin.role === 'admin' ? 'Admin' : 'Moderator';
  return (
    <Shell brand={<>BEAST <span style={{ color: 'var(--marker)' }}>HQ</span></>} identity={{ title: admin.full_name, subtitle: label }} nav={nav} home={full ? '/hq' : '/hq/safety'}>
      {children}
    </Shell>
  );
}
