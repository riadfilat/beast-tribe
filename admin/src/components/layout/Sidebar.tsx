'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Lockup } from '@/components/brand/Logo';
import { Icon, type IconName } from '@/components/ui/Icon';
import { TRAIN_ENABLED } from '@/lib/features';

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
}

const ADMIN_NAV: NavItem[] = [
  // The new HQ (command center, leaders & communities, admins) lives at /hq.
  { label: 'Command center', href: '/hq', icon: 'business' },
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Business', href: '/business', icon: 'business' },
  { label: 'Leads', href: '/leads', icon: 'leads' },
  { label: 'Captains', href: '/captains', icon: 'captain' },
  { label: 'Users', href: '/users', icon: 'users' },
  { label: 'Communities', href: '/communities', icon: 'communities' },
  { label: 'Events', href: '/events', icon: 'events' },
  { label: 'Locations', href: '/locations', icon: 'locations' },
  { label: 'Feed', href: '/feed', icon: 'feed' },
  { label: 'Moderation', href: '/moderation', icon: 'moderation' },
  { label: 'Partners', href: '/partners', icon: 'partners' },
  // Train is off for launch: no workout pages in the menu (they come back with TRAIN_ENABLED).
  ...(TRAIN_ENABLED ? [{ label: 'Workouts', href: '/workouts', icon: 'workouts' as IconName }] : []),
  { label: 'Security', href: '/security', icon: 'key' },
];

interface SidebarProps {
  type: 'admin';
  userName: string;
  roleBadge: string;
  pendingModeration?: number;
}

export default function Sidebar({ userName, roleBadge, pendingModeration }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Moderators only look after the feed and photos (the pages check the role too).
  const nav: NavItem[] = roleBadge === 'moderator' ? ADMIN_NAV.filter((i) => ['/feed', '/moderation', '/security'].includes(i.href)) : ADMIN_NAV;

  // Inject moderation badge
  const navWithBadges = nav.map((item) => {
    if (item.href === '/moderation' && pendingModeration && pendingModeration > 0) {
      return { ...item, badge: pendingModeration };
    }
    return item;
  });

  function isActive(href: string) {
    // Exact match for dashboard to avoid matching all /d* paths
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setOpen((v) => !v)}
        className="print:hidden md:hidden fixed top-3 left-3 z-50 w-11 h-11 rounded-lg bg-brand-teal text-white flex items-center justify-center shadow-lg"
      >
        <Icon name={open ? 'close' : 'menu'} size="lg" weight="bold" />
      </button>

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`print:hidden fixed md:static top-0 left-0 z-40 w-64 bg-brand-teal min-h-screen flex flex-col text-white flex-none transform transition-transform duration-200 md:w-64 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex flex-col gap-2">
            <Lockup height={20} ink="#F4F1EA" id="bt-sidebar" />
            <p className="text-xs text-white/60 leading-tight">
              Classic dashboard
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navWithBadges.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-white/15 text-white font-medium shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`}
              >
                <Icon name={item.icon} size="md" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-brand-orange text-brand-teal text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange flex-none" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-xs font-bold text-white flex-none shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{userName}</p>
              <p className="text-xs text-white/40 capitalize leading-tight">{roleBadge}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-xs text-white/40 hover:text-white/70 transition text-left py-1 flex items-center gap-1"
          >
            <Icon name="signOut" size="sm" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
