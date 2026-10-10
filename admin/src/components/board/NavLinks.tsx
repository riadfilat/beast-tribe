'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { List, X } from '@phosphor-icons/react';
import { NavIcon } from './icons';
import { createClient } from '@/lib/supabase-browser';

export interface ShellNavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

/** The sidebar menu: highlights the current page; on phones it opens from a menu button. */
export function NavLinks({ items, home }: { items: ShellNavItem[]; home: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === home ? pathname === href : pathname === href || pathname.startsWith(href + '/'));

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = '/login';
  }

  return (
    <>
      <div className="md:hidden">
        <button type="button" className="btn ghost small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={16} weight="bold" /> : <List size={16} weight="bold" />}
          Menu
        </button>
      </div>
      <nav className={`${open ? 'flex' : 'hidden'} md:flex flex-col gap-0.5`} aria-label="Dashboard">
        {items.map((it) => {
          const on = active(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={on ? 'page' : undefined}
              className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[14px] font-medium transition-colors"
              style={{ background: on ? 'var(--sheet)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-soft)' }}
            >
              <span style={{ color: on ? 'var(--marker)' : 'inherit' }}>
                <NavIcon name={it.icon} active={on} />
              </span>
              <span className="flex-1">{it.label}</span>
              {it.badge ? <span className="pill bad num">{it.badge > 99 ? '99+' : it.badge}</span> : null}
            </Link>
          );
        })}
        <button type="button" onClick={signOut} className="mt-3 text-left px-2.5 py-2 text-[12px]" style={{ color: 'var(--ink-faint)' }}>
          Sign out
        </button>
      </nav>
    </>
  );
}
