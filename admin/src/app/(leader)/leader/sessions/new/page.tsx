import { requireTeam } from '@/lib/leader/context';
import { loadSports } from '@/lib/leader/overview';
import { createAdminClient } from '@/lib/supabase-server';
import { PageTop } from '@/components/board/ui';
import { SessionForm } from './SessionForm';

/** Next date (Riyadh) that falls on this weekday, today included when the hour is still ahead. */
function nextDate(dow: number | null, hour: number) {
  const now = new Date(Date.now() + 3 * 3600000);
  const d = new Date(now);
  if (dow != null) {
    let add = (dow - now.getUTCDay() + 7) % 7;
    if (add === 0 && now.getUTCHours() >= hour) add = 7;
    d.setUTCDate(d.getUTCDate() + add);
  } else if (now.getUTCHours() >= hour) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

export default async function NewSession({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireTeam();
  const q = await searchParams;
  const db = createAdminClient();
  const [sports, { data: courts }, { data: places }] = await Promise.all([
    loadSports(),
    ctx.businessId ? db.from('facilities').select('name').eq('partner_id', ctx.businessId).eq('is_active', true).order('name') : Promise.resolve({ data: [] as any[] }),
    ctx.community.city ? db.from('popular_locations').select('name').ilike('city', ctx.community.city).order('name').limit(60) : Promise.resolve({ data: [] as any[] }),
  ]);
  const hour = Math.min(23, Math.max(5, parseInt(q.hour || '') || 19));
  const dow = q.dow != null && /^[0-6]$/.test(q.dow) ? Number(q.dow) : null;

  return (
    <>
      <PageTop title="Post a session" sub="It appears in the app for your members the moment you post it." />
      <SessionForm
        sports={sports.map((s) => ({ slug: s.slug, name: s.name }))}
        places={[...new Set([...((courts || []) as any[]).map((c) => c.name), ...((places || []) as any[]).map((p) => p.name)])]}
        community={{ name: ctx.community.name, city: ctx.community.city || 'your city' }}
        host={ctx.name.split(' ')[0]}
        canPrice={ctx.isLeader}
        canGuests={ctx.isLeader && ctx.features.has('guests')}
        initial={{
          sport: sports.some((s) => s.slug === q.sport) ? q.sport! : '',
          level: ['easy', 'medium', 'hard'].includes(q.level || '') ? q.level! : '',
          date: nextDate(dow, hour),
          time: `${String(hour).padStart(2, '0')}:00`,
        }}
      />
    </>
  );
}
