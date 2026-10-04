import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ownsCommunity, requireCap } from '@/lib/auth';
import { kindOf, sessionWord } from '@/lib/capabilities';
import { SessionFields } from '@/components/club/SessionFields';
import { createAdminClient } from '@/lib/supabase-server';
import { fmtDay, fmtTime } from '@/lib/club';
import SubmitButton from '@/components/SubmitButton';
import { ConfirmButton } from '@/components/ConfirmSubmit';
import { Icon } from '@/components/ui/Icon';
import { Avatar, FillBar, btnGhost, card, input } from '@/components/club/ui';
import { cancelClass, markAllAttended, setAttendance, updateClass } from '../../club/actions';
import { markPaid } from '../../facilities/actions';

export const revalidate = 0;

export default async function ClassPage({ params }: { params: { id: string } }) {
  const partner = await requireCap('classes');
  const db = createAdminClient();
  const plural = kindOf(partner.partner_type).sessions;
  const one = sessionWord(partner.partner_type);

  const { data: e } = await db
    .from('events')
    .select('id, title, description, starts_at, ends_at, max_capacity, coach_name, location_name, location_city, difficulty, is_women_only, cancelled_at, cancel_reason, class_series_id, partner_id, community_id, sport_id, guest_open, guest_price_sar, guest_spots, sport:sports(name, emoji)')
    .eq('id', params.id)
    .single();
  // The partner's own sessions, or (for a club) sessions members set up inside the club.
  const inMyClub = !!partner.community_id && ownsCommunity(partner.partner_type) && (e as any)?.community_id === partner.community_id;
  if (!e || ((e as any).partner_id !== partner.partner_id && !inMyClub)) notFound();
  const ev: any = e;
  const mine = ev.partner_id === partner.partner_id;

  const [{ data: rs }, { data: dues }, { data: sports }] = await Promise.all([
    db.from('event_rsvps').select('user_id, status, created_at, attended_at').eq('event_id', ev.id).in('status', ['going', 'waitlist']).order('created_at'),
    // What guests owe for this class (members book free).
    db.from('session_dues').select('user_id, amount_sar, paid_at').eq('event_id', ev.id).eq('kind', 'guest'),
    db.from('sports').select('id, name, emoji').eq('is_active', true).order('name'),
  ]);
  const ids = (rs || []).map((r: any) => r.user_id);
  const { data: profiles } = ids.length ? await db.from('profiles').select('id, full_name, display_name, avatar_url').in('id', ids) : { data: [] as any[] };
  const pById = new Map((profiles || []).map((p: any) => [p.id, p]));
  const dueOf = new Map(((dues || []) as any[]).map((d) => [d.user_id, d]));
  const guestDue = ((dues || []) as any[]).reduce((t, d) => t + Number(d.amount_sar), 0);
  const guestPaid = ((dues || []) as any[]).filter((d) => d.paid_at).reduce((t, d) => t + Number(d.amount_sar), 0);
  const going = (rs || []).filter((r: any) => r.status === 'going');
  const waiting = (rs || []).filter((r: any) => r.status === 'waitlist');
  const starts = new Date(ev.starts_at);
  const started = starts.getTime() <= Date.now();
  const attended = going.filter((r: any) => r.attended_at).length;
  const nameOf = (id: string) => {
    const p: any = pById.get(id) || {};
    return p.display_name || p.full_name || 'Member';
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/partner/classes" className="text-sm text-[#147070] hover:underline inline-flex items-center gap-1">
        <Icon name="back" size="sm" /> {plural}
      </Link>

      <div>
        <p className="text-sm text-gray-500">
          {fmtDay(starts)} · {fmtTime(starts)}
          {ev.ends_at ? `–${fmtTime(new Date(ev.ends_at))}` : ''}
          {ev.class_series_id ? ' · Weekly' : ''}
        </p>
        <h1 className={`text-2xl font-bold ${ev.cancelled_at ? 'line-through text-gray-400' : 'text-gray-900'}`}>{ev.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {[ev.coach_name, ev.sport ? `${ev.sport.emoji || ''} ${ev.sport.name}`.trim() : null, ev.location_name, ev.difficulty, ev.is_women_only ? 'Women only' : null].filter(Boolean).join(' · ')}
        </p>
        {ev.guest_open ? (
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#FFF1DC] text-[#9A5A0B] px-3 py-1 text-xs font-semibold">
            Open to guests · {ev.guest_price_sar ? `SAR ${Number(ev.guest_price_sar)}` : 'free'}
            {ev.guest_spots != null ? ` · ${ev.guest_spots} guest spots` : ''}
          </p>
        ) : null}
        {ev.cancelled_at ? (
          <p className="mt-3 rounded-lg bg-[#FCEBEA] text-[#9E3A33] text-sm px-4 py-2">Cancelled{ev.cancel_reason ? `: ${ev.cancel_reason}` : ''}. Booked members were notified.</p>
        ) : null}
      </div>

      <div className={`${card} p-5`}>
        <FillBar going={going.length} capacity={ev.max_capacity} waitlist={waiting.length} />
        {started && going.length ? (
          <p className="text-sm text-gray-600 mt-3">
            <span className="font-semibold tabular-nums">{attended}</span> of {going.length} checked in
            {going.length ? ` · ${Math.round((attended / going.length) * 100)}% show-up` : ''}
          </p>
        ) : null}
        {dueOf.size ? (
          <p className="text-sm text-gray-600 mt-3">
            <span className="font-semibold tabular-nums">{dueOf.size}</span> guest{dueOf.size === 1 ? '' : 's'} · SAR {guestDue} to collect at the desk · <span className="font-semibold tabular-nums">SAR {guestPaid}</span> marked paid
          </p>
        ) : null}
      </div>

      <section className={card}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-semibold text-gray-900">Booked ({going.length})</h2>
          {started && mine && going.length > attended ? (
            <form action={markAllAttended.bind(null, ev.id)}>
              <SubmitButton pendingLabel="Saving…" className="text-sm text-[#147070] hover:underline">
                Everyone came
              </SubmitButton>
            </form>
          ) : null}
        </div>
        <ul className="divide-y divide-gray-50">
          {going.map((r: any) => {
            const came = !!r.attended_at;
            return (
              <li key={r.user_id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar name={nameOf(r.user_id)} src={(pById.get(r.user_id) as any)?.avatar_url || null} />
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {nameOf(r.user_id)}
                  {dueOf.has(r.user_id) ? <span className="ml-2 rounded-full bg-[#FFF1DC] text-[#9A5A0B] px-2 py-0.5 text-[11px] font-semibold">Guest · SAR {Number((dueOf.get(r.user_id) as any).amount_sar)}</span> : null}
                </span>
                {dueOf.has(r.user_id) && mine ? (
                  <form action={markPaid.bind(null, ev.id, r.user_id, !(dueOf.get(r.user_id) as any).paid_at)}>
                    <SubmitButton
                      pendingLabel="…"
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${(dueOf.get(r.user_id) as any).paid_at ? 'bg-[#E8F5EE] text-[#25704F] border-[#CDE9D9]' : 'bg-white text-[#9A5A0B] border-[#F3DDBD] hover:border-[#E8B96B]'}`}
                    >
                      {(dueOf.get(r.user_id) as any).paid_at ? '✓ Paid' : 'Mark paid'}
                    </SubmitButton>
                  </form>
                ) : null}
                {started && mine ? (
                  <form action={setAttendance.bind(null, ev.id, r.user_id, !came)}>
                    <SubmitButton
                      pendingLabel="…"
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${came ? 'bg-[#E8F5EE] text-[#25704F] border-[#CDE9D9]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                      {came ? '✓ Came' : 'Mark came'}
                    </SubmitButton>
                  </form>
                ) : (
                  <span className="text-xs text-gray-400">Booked {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                )}
              </li>
            );
          })}
          {!going.length ? <li className="px-5 py-6 text-sm text-gray-400 text-center">No bookings yet.</li> : null}
        </ul>
      </section>

      {waiting.length ? (
        <section className={card}>
          <h2 className="font-semibold text-gray-900 px-5 pt-4 pb-2">Waitlist ({waiting.length})</h2>
          <ol className="divide-y divide-gray-50">
            {waiting.map((r: any, i: number) => (
              <li key={r.user_id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-5 text-xs text-gray-400 tabular-nums">{i + 1}</span>
                <Avatar name={nameOf(r.user_id)} src={(pById.get(r.user_id) as any)?.avatar_url || null} size={28} />
                <span className="text-sm text-gray-800">{nameOf(r.user_id)}</span>
              </li>
            ))}
          </ol>
          <p className="px-5 pb-4 pt-1 text-xs text-gray-400">When a booked member leaves, the first person here gets the spot and a notification.</p>
        </section>
      ) : null}

      {mine && !ev.cancelled_at && !started ? (
        <details className={`${card} p-5`}>
          <summary className="font-semibold text-gray-900 cursor-pointer">Edit</summary>
          <form action={updateClass.bind(null, ev.id)} className="space-y-5 mt-4">
            <SessionFields
              sports={(sports || []) as any}
              d={{
                title: ev.title,
                sportId: ev.sport_id,
                coach: ev.coach_name,
                // Riyadh is UTC+3 all year.
                date: new Date(starts.getTime() + 3 * 3600000).toISOString().slice(0, 10),
                time: new Date(starts.getTime() + 3 * 3600000).toISOString().slice(11, 16),
                duration: ev.ends_at ? Math.round((new Date(ev.ends_at).getTime() - starts.getTime()) / 60000) : 60,
                capacity: ev.max_capacity,
                difficulty: ev.difficulty,
                locationName: ev.location_name,
                city: ev.location_city,
                description: ev.description,
                womenOnly: ev.is_women_only,
              }}
              one={one}
              placeName={partner.business_name}
              showCity={!ownsCommunity(partner.partner_type)}
              showRepeat={false}
              lockTime={going.length + waiting.length > 0}
            />
            <SubmitButton pendingLabel="Saving…" className={`${btnGhost} w-full`}>
              Save changes
            </SubmitButton>
          </form>
        </details>
      ) : null}

      {mine && !ev.cancelled_at && !started ? (
        <section className={`${card} p-5`}>
          <h2 className="font-semibold text-gray-900">Cancel</h2>
          <p className="text-xs text-gray-500 mb-3">Everyone booked or waiting gets a notification in the app.</p>
          <form action={cancelClass.bind(null, ev.id)} className="space-y-3">
            <input name="reason" className={input} placeholder="Reason (optional), e.g. coach unwell" />
            {ev.class_series_id ? (
              <div className="flex gap-4 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input type="radio" name="scope" value="one" defaultChecked /> Only this {one}
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="scope" value="series" /> This and all later weeks
                </label>
              </div>
            ) : null}
            <ConfirmButton confirmMessage="Cancel and notify everyone booked?" className={`${btnGhost} text-[#9E3A33] border-[#F3CFCC] hover:bg-[#FCEBEA]`}>
              Cancel {one}
            </ConfirmButton>
          </form>
        </section>
      ) : null}
    </div>
  );
}
