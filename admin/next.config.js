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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
};

module.exports = nextConfig;
