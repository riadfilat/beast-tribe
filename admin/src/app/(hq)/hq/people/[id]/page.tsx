import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { Box, Kpi, PageTop, Pill } from '@/components/board/ui';
import { initials } from '@/components/board/Shell';
import { PackPatch } from '@/components/brand/PackPatch';
import { nameOf, regionName, shortDate, since } from '../shared';
import { MemberActions } from './MemberActions';
import { DeleteAccount } from './DeleteAccount';
import { CommunityPicker } from './CommunityPicker';
import { SessionList, summarise } from './SessionList';

export const revalidate = 0;

const ROLE: Record<string, string> = { admin: 'Leader', supporter: 'Supporter', member: 'Member' };

export default async function HqPerson(props: { params: Promise<{ id: string }> }) {
  const me = await requireRole('admin');
  const { id } = await props.params;
  const db = createAdminClient();

  const account = db.auth.admin
    .getUserById(id)
    .then(({ data }) => {
      const u = data?.user as any;
      const until = u?.banned_until ? new Date(u.banned_until).getTime() : 0;
      return { email: (u?.email as string) || null, lastSignIn: (u?.last_sign_in_at as string) || null, suspended: until > Date.now() };
    })
    .catch(() => ({ email: null, lastSignIn: null, suspended: false }));

  const [{ data: profile }, { data: communities }, acct, { data: memberships }, { data: packs }, { data: rsvps }] = await Promise.all([
    db.from('profiles').select('*, community:communities!profiles_community_id_fkey(id, name)').eq('id', id).maybeSingle(),
    db.from('communities').select('id, name').eq('is_active', true).order('name', { ascending: true }),
    account,
    db.from('community_members').select('role, joined_at, community:communities(id, name, city)').eq('user_id', id),
    // A member can be in several groups.
    db.from('pack_members').select('id, role, pack:packs(id, name, animal, emblem_kind, emblem_value, emblem_color)').eq('user_id', id),
    db
      .from('event_rsvps')
      .select('id, status, created_at, attended_at, event:events(id, title, starts_at, cancelled_at, community:communities(name))')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);
  if (!profile) notFound();

  const p = profile as any;
  // Who can't be deleted from here: HQ staff and community leaders (the database checks it again).
  const isStaff = !!(await db.from('admin_roles').select('user_id').eq('user_id', id).maybeSingle()).data;
  const leads = ((memberships || []) as any[]).filter((m) => m.role === 'admin' && m.community).map((m) => m.community.name as string);
  // "Last in the app": the newest day the app recorded (member_days), else the old field.
  const { data: seen } = await db.from('member_days').select('day').eq('user_id', id).order('day', { ascending: false }).limit(1);
  p.last_active_date = (seen as any[])?.[0]?.day ?? p.last_active_date ?? null;
  const name = nameOf(p);
  const groups = ((packs || []) as any[]).filter((m) => m.pack);
  const clubs = ((memberships || []) as any[]).filter((m) => m.community);
  const s = summarise((rsvps || []) as any[]);

  return (
    <>
      <Link href="/hq/people" className="link text-[13px] inline-flex items-center gap-1"><ArrowLeft size={14} /> People</Link>

      <div className="flex items-center gap-4">
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover flex-none" />
        ) : (
          <span className="w-14 h-14 rounded-full grid place-items-center text-[18px] font-bold flex-none" style={{ background: 'var(--aqua)', color: 'var(--board)', fontFamily: 'var(--bt-head)' }}>{initials(name)}</span>
        )}
        <div className="flex-1 min-w-0">
          <PageTop
            title={name}
            sub={[p.full_name && p.full_name !== name ? p.full_name : null, acct.email, p.city || regionName(p.region)].filter(Boolean).join(' · ')}
            action={acct.suspended ? <Pill tone="bad">Suspended</Pill> : <Pill tone="good">Active account</Pill>}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Sessions played" value={s.played} note={s.lastPlayed ? `last ${since(s.lastPlayed).toLowerCase()}` : 'none yet'} />
        <Kpi label="Last 30 days" value={s.played30} note="sessions played" />
        <Kpi label="Coming up" value={s.upcoming} note="sessions booked" />
        <Kpi label="Last in the app" value={since(p.last_active_date)} note={`joined ${shortDate(p.created_at)}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Box title="Communities" icon="communities" sub="Their home community decides which default groups they join.">
          <CommunityPicker userId={id} current={p.community ? { id: p.community.id, name: p.community.name } : null} communities={(communities || []) as any[]} />
          {clubs.length ? (
            <div className="grid">
              <span className="eyebrow">Member of</span>
              {clubs.map((m) => (
                <div key={m.community.id} className="flex items-center gap-3 py-2 rule-top first:border-t-0">
                  <Link href={`/hq/communities/${m.community.id}`} className="link flex-1 min-w-0 truncate text-[14px]">{m.community.name}</Link>
                  {m.community.city ? <span className="hint">{m.community.city}</span> : null}
                  <Pill tone={m.role === 'member' ? 'mute' : 'info'}>{ROLE[m.role] || m.role}</Pill>
                </div>
              ))}
            </div>
          ) : null}
        </Box>

        <Box title="Account" icon="safety" sub={acct.lastSignIn ? `Last signed in ${since(acct.lastSignIn).toLowerCase()}` : 'Has not signed in yet'}>
          <MemberActions userId={id} suspended={acct.suspended} hasEmail={!!acct.email} />
        </Box>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <Box title="Sessions" icon="sessions" sub="Their most recent bookings.">
          <SessionList rsvps={(rsvps || []) as any[]} />
        </Box>
        <Box title="Groups" icon="people" sub={groups.length ? `${groups.length} group${groups.length === 1 ? '' : 's'}` : undefined}>
          {groups.length ? (
            <div className="grid">
              {groups.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2 rule-top first:border-t-0">
                  <PackPatch pack={m.pack} size={26} />
                  <span className="flex-1 min-w-0 truncate text-[14px]">{m.pack.name}</span>
                  {m.role && m.role !== 'member' ? <Pill tone="info">{m.role}</Pill> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">Not in any group yet. Placing them in a community adds that community’s default groups.</p>
          )}
        </Box>
      </div>
      {me.role === 'super_admin' && me.id !== id ? (
        <Box title="Delete account" icon="safety" sub="Only you can see this. Use it when someone asks for their data to be removed.">
          {isStaff ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>This person is on the HQ team. Remove their admin role first (Admins).</p>
          ) : leads.length ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>This person leads {leads.join(', ')}. Hand it over or remove them from its team first (Leaders &amp; communities).</p>
          ) : (
            <DeleteAccount userId={id} name={(p.full_name || name).trim()} />
          )}
        </Box>
      ) : null}
    </>
  );
}
