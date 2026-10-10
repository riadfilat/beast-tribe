/** @type {import('next').NextConfig} */
const nextConfig = {
  // October 2026: the classic staff pages and the partner dashboard moved into HQ (/hq) and the
  // leader dashboard (/leader). Old addresses keep working.
  async redirects() {
    const moved = [
      ['/dashboard', '/hq'],
      ['/business', '/hq?view=growth'],
      ['/leads', '/hq/leads'],
      ['/captains', '/hq/captains'],
      ['/users', '/hq/people'],
      ['/users/:id', '/hq/people/:id'],
      ['/communities', '/hq/communities'],
      ['/communities/new', '/hq/communities/new'],
      ['/communities/:id', '/hq/communities/:id'],
      ['/events', '/hq/sessions?when=all'],
      ['/events/new', '/hq/sessions/new'],
      ['/events/:id', '/hq/sessions/:id'],
      ['/locations', '/hq/places'],
      ['/locations/new', '/hq/places/new'],
      ['/locations/:id', '/hq/places/:id'],
      ['/feed', '/hq/safety?tab=posts'],
      ['/feed/comments', '/hq/safety?tab=comments'],
      ['/moderation', '/hq/safety'],
      ['/partners', '/hq/businesses'],
      ['/partners/new', '/hq/businesses/new'],
      ['/partners/:id', '/hq/businesses/:id'],
      ['/partner/:path*', '/leader'],
      ['/partner', '/leader'],
    ];
    return moved.map(([source, destination]) => ({ source, destination, permanent: false }));
  },
  // Only our own Supabase project's images go through the optimizer.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'doqpqzxqgszsybghgtfq.supabase.co' }],
  },
  // No framing (clickjacking on dashboard buttons), no MIME sniffing, no referrer leaks, no device APIs.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
