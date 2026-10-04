/** @type {import('next').NextConfig} */
const nextConfig = {
  // Partner events and classes became one tool (Classes / Sessions / Events) on 2026-10-04.
  async redirects() {
    return [
      { source: '/partner/events', destination: '/partner/classes', permanent: true },
      { source: '/partner/events/new', destination: '/partner/classes/new', permanent: true },
      { source: '/partner/events/:id', destination: '/partner/classes/:id', permanent: true },
    ];
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
