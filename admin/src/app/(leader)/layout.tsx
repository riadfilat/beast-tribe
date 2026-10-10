import { requireTeam } from '@/lib/leader/context';
import { leaderNav } from '@/lib/leader/features';
import { Shell } from '@/components/board/Shell';
import { switchCommunity } from './leader/switch';

export const metadata = { title: 'Beast Tribe · Leader' };

export default async function LeaderLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireTeam();
  const switcher =
    ctx.teams.length > 1 ? (
      <form action={switchCommunity} className="grid gap-1.5">
        <label htmlFor="community" className="eyebrow px-1">
          Community
        </label>
        <select id="community" name="community" defaultValue={ctx.community.id} className="input text-[13px] py-2">
          {ctx.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.role === 'supporter' ? ' (supporter)' : ''}
            </option>
          ))}
        </select>
        <button className="btn ghost small">Switch</button>
      </form>
    ) : null;

  return (
    <Shell
      brand={
        <>
          BEAST <span style={{ color: 'var(--marker)' }}>TRIBE</span>
        </>
      }
      identity={{ title: ctx.community.name, subtitle: `${ctx.isLeader ? 'Leader' : 'Supporter'}${ctx.community.city ? ` · ${ctx.community.city}` : ''}`, avatar: ctx.community.logo_url }}
      aside={switcher}
      nav={leaderNav(ctx.role, ctx.features)}
      home="/leader"
      footer="Everything here shows in the app straight away."
    >
      {children}
    </Shell>
  );
}
