import { redirect } from 'next/navigation';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { requireTeam } from '@/lib/leader/context';
import { loadPeople } from '@/lib/leader/people';
import { createAdminClient } from '@/lib/supabase-server';
import { Box, Empty, PageTop } from '@/components/board/ui';
import { HBar } from '@/components/board/charts';
import { addTeam, removeTeam } from './actions';

export default async function Teams() {
  const ctx = await requireTeam();
  if (!ctx.features.has('teams')) redirect('/leader/features');
  const db = createAdminClient();
  const [{ data: ts }, { data: tm }, people] = await Promise.all([
    db.from('community_teams').select('id, name, name_ar').eq('community_id', ctx.community.id).order('name'),
    db.from('community_team_members').select('team_id, user_id').eq('community_id', ctx.community.id).limit(10000),
    loadPeople(ctx.community.id),
  ]);
  const active = new Set(people.members.filter((m) => m.status === 'active').map((m) => m.id));
  const teams = ((ts || []) as any[]).map((t) => {
    const ids = ((tm || []) as any[]).filter((m) => m.team_id === t.id).map((m) => m.user_id);
    return { ...t, size: ids.length, active: ids.filter((i) => active.has(i)).length };
  });
  const maxSize = Math.max(1, ...teams.map((t) => t.size));

  return (
    <>
      <PageTop title="Company teams" sub="Employees pick their team when they join in the app." />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <Box title="Active in the last 3 weeks, by team" icon="teams" sub="Shows teams, never individual people.">
          {teams.length ? (
            <div className="grid gap-2">
              {teams.map((t) => <HBar key={t.id} label={t.name} value={t.active} max={maxSize} text={`${t.active}/${t.size}`} />)}
            </div>
          ) : (
            <Empty title="No teams yet" body="Add your departments or offices. Employees choose theirs in the app." />
          )}
        </Box>
        {ctx.isLeader ? (
          <Box title="Teams" icon="teams">
            <form action={addTeam} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <input name="name" required maxLength={40} className="input" placeholder="Engineering" aria-label="Team name" />
              <input name="name_ar" maxLength={40} className="input" placeholder="الهندسة" dir="rtl" aria-label="Team name in Arabic" />
              <button className="btn small"><Plus size={14} weight="bold" /> Add</button>
            </form>
            <div className="grid">
              {teams.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 py-2 rule-top first:border-t-0">
                  <span className="text-[14px]">{t.name}{t.name_ar ? <span className="hint"> · {t.name_ar}</span> : null}</span>
                  <form action={removeTeam.bind(null, t.id)}><button className="btn ghost small" disabled={t.size > 0} title={t.size ? 'Teams with people in them stay' : undefined}>Remove</button></form>
                </div>
              ))}
            </div>
          </Box>
        ) : null}
      </div>
    </>
  );
}
