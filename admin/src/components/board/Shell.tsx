import './board.css';
import { boardFonts } from './fonts';
import { NavLinks, type ShellNavItem } from './NavLinks';
import NavigationProgress from '@/components/NavigationProgress';

/** Initials for an avatar: "Falcon Padel Club" → "FP". */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '•';

/**
 * The frame of both board dashboards: brand, who you are, the menu, and the page.
 * `identity` is the card under the logo (a community, or HQ); `aside` adds anything below it
 * (the community switcher).
 */
export function Shell({
  brand,
  identity,
  aside,
  nav,
  home,
  footer,
  children,
}: {
  brand: React.ReactNode;
  identity: { title: string; subtitle: string; avatar?: string | null };
  aside?: React.ReactNode;
  nav: ShellNavItem[];
  home: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`bt ${boardFonts} md:flex`}>
      <NavigationProgress />
      <aside className="md:w-[232px] md:min-h-screen md:sticky md:top-0 md:self-start flex flex-col gap-4 p-3 md:p-4 md:py-5" style={{ background: 'var(--deep)', borderRight: '1px solid var(--rule)' }}>
        <div className="display text-[22px] leading-none px-2 hidden md:block">{brand}</div>
        <div className="flex items-center gap-2.5 rounded-xl p-2.5" style={{ background: 'var(--wash)' }}>
          {identity.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={identity.avatar} alt="" className="w-[38px] h-[38px] rounded-full object-cover flex-none" />
          ) : (
            <span className="w-[38px] h-[38px] rounded-full flex-none grid place-items-center text-[13px] font-bold" style={{ background: 'var(--marker)', color: 'var(--board)', fontFamily: 'var(--bt-head)' }}>
              {initials(identity.title)}
            </span>
          )}
          <span className="min-w-0">
            <b className="block truncate text-[13px]" style={{ fontFamily: 'var(--bt-head)' }}>
              {identity.title}
            </b>
            <span className="block truncate text-[11px]" style={{ color: 'var(--ink-faint)' }}>
              {identity.subtitle}
            </span>
          </span>
        </div>
        {aside}
        <NavLinks items={nav} home={home} />
        {footer ? <div className="mt-auto hidden md:block text-[12px] px-2" style={{ color: 'var(--ink-faint)' }}>{footer}</div> : null}
      </aside>
      <main className="flex-1 min-w-0 px-4 py-5 md:px-7 md:py-6">
        <div className="max-w-[1180px] mx-auto grid gap-5">{children}</div>
      </main>
    </div>
  );
}
