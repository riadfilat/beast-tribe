import { redirect } from 'next/navigation';
import { requireCap } from '@/lib/auth';
import { loadTeams } from '@/lib/wellness';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { btnPrimary, card, input, label } from '@/components/club/ui';
import { addTeam, removeTeam } from '../club/actions';

export const revalidate = 0;

export default async function TeamsPage() {
  const partner = await requireCap('teams');
  if (!partner.community_id) redirect('/partner/club');
  const teams = await loadTeams(partner.community_id);
  const total = teams.reduce((s, t) => s + t.members, 0);
  const isCompany = partner.partner_type === 'company';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <p className="text-sm text-gray-500">
          {isCompany ? 'Departments, offices or floors.' : 'Class groups, squads or branches.'} People pick their own team in the app, one each, and team challenges rank teams by the
          average per person.
        </p>
      </div>

      <section className={card}>
        <ul className="divide-y divide-gray-50">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900">{t.name}</span>
                {t.name_ar ? <span className="block text-xs text-gray-400" dir="rtl">{t.name_ar}</span> : null}
              </span>
              <span className="text-sm text-gray-500 tabular-nums">{t.members} {t.members === 1 ? 'person' : 'people'}</span>
              <form action={removeTeam.bind(null, t.id)}>
                <ConfirmButton confirmMessage={`Remove ${t.name}? Its people will have no team until they pick another.`} className="text-xs text-[#9E3A33] hover:underline">
                  Remove
                </ConfirmButton>
              </form>
            </li>
          ))}
          {!teams.length ? <li className="px-5 py-8 text-center text-sm text-gray-400">No teams yet. Add the first one below.</li> : null}
        </ul>
        {teams.length ? <p className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50">{total} people have picked a team.</p> : null}
      </section>

      <form action={addTeam} className={`${card} p-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end`}>
        <div>
          <label className={label} htmlFor="team-name">Team name</label>
          <input id="team-name" name="name" required minLength={2} maxLength={40} className={input} placeholder={isCompany ? 'Finance, Riyadh office…' : 'Dawn group, Ladies 6 pm…'} />
        </div>
        <div>
          <label className={label} htmlFor="team-name-ar">In Arabic (optional)</label>
          <input id="team-name-ar" name="name_ar" dir="rtl" maxLength={40} className={input} />
        </div>
        <SubmitButton pendingLabel="Adding…" className={btnPrimary}>
          Add team
        </SubmitButton>
      </form>
    </div>
  );
}
