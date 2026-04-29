'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Users', href: '/users', icon: '👥' },
  { label: 'Communities', href: '/communities', icon: '🏘️' },
  { label: 'Events', href: '/events', icon: '📅' },
  { label: 'Locations', href: '/locations', icon: '📍' },
  { label: 'Feed', href: '/feed', icon: '💬' },
  { label: 'Moderation', href: '/moderation', icon: '🛡️' },
  { label: 'Partners', href: '/partners', icon: '🤝' },
];

const PARTNER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/partner/dashboard', icon: '📊' },
  { label: 'My Events', href: '/partner/events', icon: '📅' },
  { label: 'Profile', href: '/partner/profile', icon: '⚙️' },
];

interface SidebarProps {
  type: 'admin' | 'partner';
  userName: string;
  roleBadge: string;
  pendingModeration?: number;
}

export default function Sidebar({ type, userName, roleBadge, pendingModeration }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = type === 'admin' ? ADMIN_NAV : PARTNER_NAV;

  // Inject moderation badge
  const navWithBadges = nav.map((item) => {
    if (item.href === '/moderation' && pendingModeration && pendingModeration > 0) {
      return { ...item, badge: pendingModeration };
    }
    return item;
  });

  function isActive(href: string) {
    // Exact match for dashboard to avoid matching all /d* paths
    if (href === '/dashboard' || href === '/partner/dashboard') {
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
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-lg bg-brand-teal text-white flex items-center justify-center shadow-lg"
      >
        <span className="text-lg">{open ? '✕' : '☰'}</span>
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
        className={`fixed md:static top-0 left-0 z-40 w-64 bg-brand-teal min-h-screen flex flex-col text-white flex-none transform transition-transform duration-200 md:w-64 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">
              🐺
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Beast Tribe</h1>
              <p className="text-xs text-white/50 leading-tight">
                {type === 'admin' ? 'Admin Dashboard' : 'Partner Portal'}
              </p>
            </div>
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
                <span className="text-base w-5 flex-none text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
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
            <span>Sign out</span>
            <span className="text-white/25">→</span>
          </button>
        </div>
      </aside>
    </>
  );
}
