import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const db = createAdminClient();

  const { data: user } = await db.from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!user) notFound();

  // Parallel data fetching
  const [workoutLogs, xpHistory, eventRsvps, packMembership] = await Promise.all([
    db.from('workout_logs')
      .select('*, sport:sports(name, emoji)')
      .eq('user_id', params.id)
      .order('completed_at', { ascending: false })
      .limit(10),
    db.from('xp_transactions')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('event_rsvps')
      .select('*, event:events(title, starts_at)')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('pack_members')
      .select('*, pack:packs(name, animal)')
      .eq('user_id', params.id)
      .maybeSingle(),
  ]);

  return (
    <div>
      <Link href="/users" className="text-sm text-brand-aqua hover:underline mb-4 inline-block">← Back to Users</Link>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
            <p className="text-sm text-gray-500">@{user.display_name || user.full_name}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              user.tier === 'untamed' ? 'bg-yellow-100 text-yellow-700' :
              user.tier === 'forged' ? 'bg-cyan-100 text-cyan-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {user.tier}
            </span>
            {user.is_premium && <span className="text-xs font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-700">Premium</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          <Stat label="Total XP" value={(user.total_xp || 0).toLocaleString()} />
          <Stat label="Level" value={user.level} />
          <Stat label="Streak" value={`${user.current_streak}d`} />
          <Stat label="Region" value={user.region || 'SA'} />
          <Stat label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
        </div>

        {packMembership.data?.pack && (
          <div className="mt-4 px-4 py-2 bg-brand-teal/5 rounded-lg">
            <span className="text-xs text-gray-500">Pack: </span>
            <span className="text-sm font-medium text-brand-teal">{packMembership.data.pack.name}</span>
            <span className="text-xs text-gray-400 ml-2">({packMembership.data.role})</span>
          </div>
        )}
      </div>

      {/* Data sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Workout Logs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Workouts</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(workoutLogs.data || []).map((log: any) => (
              <div key={log.id} className="px-5 py-3 flex justify-between">
                <div>
                  <p className="text-sm text-gray-800">{log.sport?.emoji} {log.title || 'Workout'}</p>
                  <p className="text-xs text-gray-400">{log.duration_minutes}min · {(log.calories_burned || 0)} cal</p>
                </div>
                <p className="text-xs text-gray-400">{new Date(log.completed_at).toLocaleDateString()}</p>
              </div>
            ))}
            {(!workoutLogs.data || workoutLogs.data.length === 0) && (
              <p className="px-5 py-4 text-sm text-gray-400">No workout logs</p>
            )}
          </div>
        </div>

        {/* XP History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">XP History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(xpHistory.data || []).map((tx: any) => (
              <div key={tx.id} className="px-5 py-3 flex justify-between">
                <div>
                  <p className="text-sm text-gray-800">{tx.description}</p>
                  <p className="text-xs text-gray-400">{tx.source}</p>
                </div>
                <p className="text-sm font-medium text-brand-green">+{tx.amount}</p>
              </div>
            ))}
            {(!xpHistory.data || xpHistory.data.length === 0) && (
              <p className="px-5 py-4 text-sm text-gray-400">No XP transactions</p>
            )}
          </div>
        </div>

        {/* Event RSVPs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm md:col-span-2">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Event RSVPs</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(eventRsvps.data || []).map((rsvp: any) => (
              <div key={rsvp.id} className="px-5 py-3 flex justify-between">
                <p className="text-sm text-gray-800">{rsvp.event?.title || 'Event'}</p>
                <p className="text-xs text-gray-400">
                  {rsvp.event?.starts_at ? new Date(rsvp.event.starts_at).toLocaleDateString() : ''}
                </p>
              </div>
            ))}
            {(!eventRsvps.data || eventRsvps.data.length === 0) && (
              <p className="px-5 py-4 text-sm text-gray-400">No RSVPs</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}
