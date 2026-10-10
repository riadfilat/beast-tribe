import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, PageTop, Pill } from '@/components/board/ui';
import { initials } from '@/components/board/Shell';
import { AdminForm } from './AdminForm';
import { removeAdmin } from './actions';

const LABEL: Record<string, string> = { super_admin: 'Super admin', admin: 'Admin', moderator: 'Moderator', support: 'Support' };

export default async function Admins() {
  const me = await requireRole('super_admin');
  const db = createAdminClient();
  const { data: roles } = await db.from('admin_roles').select('user_id, role, created_at').order('created_at');
  const ids = ((roles || []) as any[]).map((r) => r.user_id);
  const [{ data: ps }, users] = await Promise.all([
    ids.length ? db.from('profiles').select('id, full_name, display_name').in('id', ids) : Promise.resolve({ data: [] as any[] }),
    Promise.all(ids.map((id) => db.auth.admin.getUserById(id).then((r) => [id, r.data.user?.email || ''] as const))),
  ]);
  const name = new Map(((ps || []) as any[]).map((p) => [p.id, p.display_name || p.full_name || 'Admin']));
  const email = new Map(users);

  return (
    <>
      <PageTop title="Admins" sub="Who runs Beast Tribe HQ. Only you can change this." />
      <Box title="Add an admin or moderator" icon="people"><AdminForm /></Box>
      <Box title="HQ team" icon="communities">
        <div className="grid">
          {((roles || []) as any[]).map((r) => (
            <div key={r.user_id} className="flex flex-wrap items-center gap-3 py-2.5 rule-top first:border-t-0">
              <span className="w-9 h-9 rounded-full grid place-items-center text-[12px] font-bold flex-none" style={{ background: r.role === 'super_admin' ? 'var(--marker)' : 'var(--aqua)', color: 'var(--board)' }}>{initials(name.get(r.user_id) || 'A')}</span>
              <span className="flex-1 min-w-[160px]"><b className="block text-[14px]" style={{ fontFamily: 'var(--bt-head)' }}>{name.get(r.user_id)}{r.user_id === me.id ? ' (you)' : ''}</b><span className="hint">{email.get(r.user_id)}</span></span>
              <Pill tone={r.role === 'super_admin' ? 'warn' : 'info'}>{LABEL[r.role] || r.role}</Pill>
              {r.role !== 'super_admin' && email.get(r.user_id) ? <form action={removeAdmin.bind(null, email.get(r.user_id)!)}><button className="btn ghost small">Remove</button></form> : null}
            </div>
          ))}
        </div>
      </Box>
    </>
  );
}
