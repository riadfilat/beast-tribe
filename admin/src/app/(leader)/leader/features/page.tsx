import Link from 'next/link';
import { ToggleLeft, ToggleRight } from '@phosphor-icons/react/dist/ssr';
import { requireTeam } from '@/lib/leader/context';
import { FEATURES } from '@/lib/leader/features';
import { PageTop } from '@/components/board/ui';
import { NavIcon } from '@/components/board/icons';
import { toggleFeature } from './actions';

export default async function Features() {
  const ctx = await requireTeam();
  return (
    <>
      <PageTop title="Features" sub="Switch on what you run. It appears in your menu and in the app straight away." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {FEATURES.map((f) => {
          const on = ctx.features.has(f.key);
          return (
            <section key={f.key} className="well p-4 grid gap-2.5 content-start" style={{ border: `1.5px solid ${on ? 'var(--aqua)' : 'var(--rule-strong)'}`, borderRadius: 14 }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-[10px] grid place-items-center flex-none" style={{ background: 'var(--wash)', color: 'var(--aqua)' }}>
                  <NavIcon name={f.key} active size={20} />
                </span>
                <span className="min-w-0">
                  <h2 className="text-[15px] font-semibold">{f.title}</h2>
                  <span className="hint">{f.page ? `Adds a ${f.page.label} page` : 'Adds an option when you post a session'}</span>
                </span>
              </div>
              <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{f.about}</p>
              <div className="flex flex-wrap items-center gap-2">
                {ctx.isLeader ? (
                  <form action={toggleFeature.bind(null, f.key, !on)}>
                    <button className={`chip ${on ? 'on' : ''}`} aria-pressed={on}>
                      {on ? <ToggleRight size={18} weight="fill" /> : <ToggleLeft size={18} />} {on ? 'On' : 'Switch on'}
                    </button>
                  </form>
                ) : (
                  <span className={`pill ${on ? 'good' : 'mute'}`}>{on ? 'On' : 'Off'}</span>
                )}
                {on && f.page && (ctx.isLeader || !f.leadersOnly) ? <Link href={f.page.href} className="link text-[13px]">Open {f.page.label}</Link> : null}
              </div>
            </section>
          );
        })}
      </div>
      <p className="hint">{ctx.isLeader ? 'Beast Tribe can also switch features on for you.' : 'Only leaders can switch features. Ask your leader.'}</p>
    </>
  );
}
