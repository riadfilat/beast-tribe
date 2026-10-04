import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { addCoachSlot, removeCoachSlot, updatePartner } from '../actions';
import SubmitButton from '@/components/SubmitButton';
import { Icon } from '@/components/ui/Icon';
import PartnerFields from '../PartnerFields';

export const revalidate = 0;

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function EditPartnerPage({ params }: { params: { id: string } }) {
  await requireRole('admin');
  const db = createAdminClient();

  const [{ data: partner }, { data: communities }, { data: slots }] = await Promise.all([
    db.from('partners').select('*, profile:profiles!user_id(full_name)').eq('id', params.id).single(),
    db.from('communities').select('id, name').eq('is_active', true).order('name'),
    db.from('coach_slots').select('id, day_of_week, start_time, end_time').eq('partner_id', params.id).order('day_of_week').order('start_time'),
  ]);

  if (!partner) notFound();

  const updateWithId = updatePartner.bind(null, params.id);
  const addSlot = addCoachSlot.bind(null, params.id);
  const isCoach = (partner.partner_type || partner.type) === 'coach';
  const byDay = DAYS.map((d, i) => ({ day: d, slots: (slots || []).filter((s: any) => s.day_of_week === i) })).filter((d) => d.slots.length);

  return (
    <div className="max-w-2xl">
      <Link href="/partners" className="text-sm text-brand-aqua hover:underline mb-4 inline-flex items-center gap-1">
        <Icon name="back" size="sm" />
        Back to Partners
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Partner</h1>
      {partner.profile?.full_name && <p className="text-sm text-gray-500 mb-6">Owner: {partner.profile.full_name}</p>}

      <form action={updateWithId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <PartnerFields p={partner} communities={communities || []} />

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name="is_verified" defaultChecked={partner.is_verified !== false} />
            Verified
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" name="is_active" defaultChecked={partner.is_active !== false} />
            Active (visible in the app)
          </label>
        </div>

        <SubmitButton
          pendingLabel="Saving…"
          className="w-full py-2.5 bg-brand-orange text-brand-teal font-semibold rounded-lg hover:bg-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Save Changes
        </SubmitButton>
      </form>

      {isCoach ? (
        <section className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Weekly availability</h2>
            <p className="text-xs text-gray-500">Members hosting a session can book these times. Each block becomes one bookable slot.</p>
          </div>

          {byDay.length ? (
            <div className="divide-y divide-gray-50">
              {byDay.map((d) => (
                <div key={d.day} className="py-2 flex items-start gap-4">
                  <span className="w-24 text-sm font-medium text-gray-700 flex-none">{d.day}</span>
                  <div className="flex flex-wrap gap-2">
                    {d.slots.map((s: any) => (
                      <form
                        key={s.id}
                        action={async () => {
                          'use server';
                          await removeCoachSlot(params.id, s.id);
                        }}
                      >
                        <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-brand-teal/10 text-brand-teal hover:bg-red-50 hover:text-red-700 transition" title="Remove">
                          {String(s.start_time).slice(0, 5)}–{String(s.end_time).slice(0, 5)}
                          <Icon name="close" size="xs" weight="bold" />
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No availability yet.</p>
          )}

          <form action={addSlot} className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <label key={d} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer has-[:checked]:bg-brand-teal has-[:checked]:text-white">
                  <input type="checkbox" name="day_of_week" value={i} className="sr-only" />
                  {d.slice(0, 3)}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input type="time" name="start_time" required defaultValue="06:00" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input type="time" name="end_time" required defaultValue="09:00" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slot length</label>
                <select name="slot_minutes" defaultValue="60" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>
            </div>
            <SubmitButton pendingLabel="Adding…" className="px-4 py-2 bg-brand-teal text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
              Add availability
            </SubmitButton>
          </form>
        </section>
      ) : null}
    </div>
  );
}
