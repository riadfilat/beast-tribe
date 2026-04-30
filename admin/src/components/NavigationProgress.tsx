'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

const NPROGRESS_STYLES = `
#nprogress {
  pointer-events: none;
}
#nprogress .bar {
  background: #E88F24 !important;
  position: fixed;
  z-index: 1031;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px !important;
  box-shadow: 0 0 8px rgba(232, 143, 36, 0.6);
}
#nprogress .peg {
  display: block;
  position: absolute;
  right: 0;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 10px #E88F24, 0 0 5px #E88F24;
  opacity: 1;
  transform: rotate(3deg) translate(0px, -4px);
}
`;

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Configure NProgress once.
  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 100,
      minimum: 0.1,
    });
  }, []);

  // Detect link clicks (capture phase) and start the bar.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // Ignore modified clicks (open in new tab, etc.)
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Skip explicit opt-outs.
      if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      // Skip hash-only / external / mailto / tel.
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Same URL? skip.
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }

      NProgress.start();
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  // Finish the bar whenever the route actually changes.
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return <style dangerouslySetInnerHTML={{ __html: NPROGRESS_STYLES }} />;
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
