import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import TierBadge from '@/components/ui/TierBadge';

export const revalidate = 0;

async function getMetrics() {
  const db = createAdminClient();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = startOfMonth;

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activeUsers7d,
    activeUsers30d,
    premiumUsers,
    eventsThisMonth,
    rsvpsThisMonth,
    pendingModeration,
    totalWorkouts,
    recentSignups,
    topUsers,
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    db.from('profiles').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    db.from('workout_logs').select('user_id', { count: 'exact', head: true }).gte('completed_at', sevenDaysAgo),
    db.from('workout_logs').select('user_id', { count: 'exact', head: true }).gte('completed_at', thirtyDaysAgo),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    db.from('events').select('*', { count: 'exact', head: true }).gte('starts_at', startOfMonth),
    db.from('event_rsvps').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    db.from('image_moderation_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('workout_logs').select('*', { count: 'exact', head: true }),
    db.from('profiles')
      .select('id, full_name, display_name, tier, total_xp, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('profiles')
      .select('id, full_name, display_name, tier, total_xp')
      .order('total_xp', { ascending: false })
      .limit(8),
  ]);

  return {
    totalUsers: totalUsers.count || 0,
    newUsersThisMonth: newUsersThisMonth.count || 0,
    newUsersLastMonth: newUsersLastMonth.count || 0,
    activeUsers7d: activeUsers7d.count || 0,
    activeUsers30d: activeUsers30d.count || 0,
    premiumUsers: premiumUsers.count || 0,
    eventsThisMonth: eventsThisMonth.count || 0,
    rsvpsThisMonth: rsvpsThisMonth.count || 0,
    pendingModeration: pendingModeration.count || 0,
    totalWorkouts: totalWorkouts.count || 0,
    recentSignups: recentSignups.data || [],
    topUsers: topUsers.data || [],
  };
}

function GrowthPill({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  href?: string;
  accent?: string;
  alert?: boolean;
  growth?: { current: number; previous: number };
}

function MetricCard({ label, value, sub, href, accent = 'bg-brand-teal', alert, growth }: MetricCardProps) {
  const inner = (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition hover:shadow-md ${alert ? 'border-red-200' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-2 h-2 rounded-full ${alert ? 'bg-red-500 animate-pulse' : accent}`} />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {growth && <GrowthPill {...growth} />}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const data = await getMetrics();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {admin.full_name} ·{' '}
          <span className="text-gray-400 text-xs">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Users"
          value={data.totalUsers}
          sub={`+${data.newUsersThisMonth} this month`}
          href="/users"
          accent="bg-brand-teal"
          growth={{ current: data.newUsersThisMonth, previous: data.newUsersLastMonth }}
        />
        <MetricCard
          label="Active (7d)"
          value={data.activeUsers7d}
          sub="workout sessions"
          accent="bg-brand-aqua"
        />
        <MetricCard
          label="Active (30d)"
          value={data.activeUsers30d}
          sub="workout sessions"
          accent="bg-blue-500"
        />
        <MetricCard
          label="Premium"
          value={data.premiumUsers}
          sub={`${data.totalUsers > 0 ? Math.round((data.premiumUsers / data.totalUsers) * 100) : 0}% of users`}
          accent="bg-brand-orange"
          href="/users?tier=premium"
        />
        <MetricCard
          label="Events (month)"
          value={data.eventsThisMonth}
          href="/events?upcoming=1"
          accent="bg-brand-green"
        />
        <MetricCard
          label="RSVPs (month)"
          value={data.rsvpsThisMonth}
          accent="bg-purple-500"
        />
        <MetricCard
          label="Pending Review"
          value={data.pendingModeration}
          sub={data.pendingModeration > 0 ? 'Needs attention' : 'All clear'}
          href="/moderation"
          accent="bg-red-500"
          alert={data.pendingModeration > 0}
        />
        <MetricCard
          label="Total Workouts"
          value={data.totalWorkouts}
          accent="bg-brand-coral"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Signups</h2>
            <Link href="/users" className="text-xs text-brand-aqua hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentSignups.map((user: any) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-brand-teal transition">
                    {user.display_name || user.full_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <TierBadge tier={user.tier} />
              </Link>
            ))}
            {data.recentSignups.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">No users yet</p>
            )}
          </div>
        </div>

        {/* Top Users by XP */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Users by XP</h2>
            <Link href="/users" className="text-xs text-brand-aqua hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.topUsers.map((user: any, i: number) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-5 tabular-nums">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-brand-teal transition">
                      {user.display_name || user.full_name}
                    </p>
                    <p className="text-xs text-gray-400 tabular-nums">
                      {(user.total_xp || 0).toLocaleString()} XP
                    </p>
                  </div>
                </div>
                <TierBadge tier={user.tier} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Create Event', href: '/events/new', icon: '📅' },
          { label: 'Review Images', href: '/moderation', icon: '🛡️' },
          { label: 'Add Partner', href: '/partners/new', icon: '🤝' },
          { label: 'View Feed', href: '/feed', icon: '💬' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-brand-aqua hover:shadow-md transition text-sm font-medium text-gray-700"
          >
            <span className="text-lg">{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
