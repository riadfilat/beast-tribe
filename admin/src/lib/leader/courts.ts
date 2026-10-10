import { createAdminClient } from '../supabase-server';
import { FACILITY_KINDS, SLOT_MINUTES, type Facility } from '../venue';

// A community's courts (facilities on its business record) and how busy they are.

export async function loadCourts(businessId: string | null): Promise<Facility[]> {
  if (!businessId) return [];
  const { data } = await createAdminClient().from('facilities').select('*').eq('partner_id', businessId).order('created_at');
  return ((data || []) as any[]).map((f) => ({ ...f, price_sar: Number(f.price_sar), hours: f.hours || {} }));
}

/** Bookings by weekday (0 = Sunday) and hour (Riyadh), last 4 weeks, all courts. */
export async function courtHeat(courtIds: string[]): Promise<{ cells: number[][]; total: number }> {
  const cells = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  if (!courtIds.length) return { cells, total: 0 };
  const { data } = await createAdminClient()
    .from('facility_bookings')
    .select('starts_at')
    .in('facility_id', courtIds)
    .eq('status', 'confirmed')
    .gte('starts_at', new Date(Date.now() - 28 * 86400000).toISOString())
    .limit(5000);
  for (const b of (data || []) as any[]) {
    const local = new Date(new Date(b.starts_at).getTime() + 3 * 3600000);
    cells[local.getUTCDay()][local.getUTCHours()]++;
  }
  return { cells, total: (data || []).length };
}

/** A court from the form; throws a plain sentence when something is missing. */
export function readCourt(formData: FormData, communityId: string) {
  const str = (k: string) => String(formData.get(k) ?? '').trim();
  const name = str('name').slice(0, 60);
  if (name.length < 2) throw new Error('Give the court a name.');
  const price = Math.round(parseFloat(str('price_sar') || '0') * 100) / 100;
  if (!(price >= 0) || price > 100000) throw new Error('The price is not valid.');
  const slot = parseInt(str('slot_minutes')) || 60;
  const hours: Record<string, [string, string][]> = {};
  for (let d = 0; d < 7; d++) {
    if (formData.get(`open_${d}`) !== 'on') continue;
    const a = str(`from_${d}`);
    const b = str(`to_${d}`);
    if (!/^\d{2}:\d{2}$/.test(a) || !/^\d{2}:\d{2}$/.test(b)) throw new Error('Opening hours need a start and an end.');
    hours[String(d)] = [[a, b]];
  }
  const audience = ['everyone', 'women', 'community'].includes(str('audience')) ? str('audience') : 'everyone';
  return {
    name,
    kind: FACILITY_KINDS[str('kind')] ? str('kind') : 'court',
    sport: str('sport') || 'padel',
    address: str('address').slice(0, 160) || null,
    description: str('description').slice(0, 600) || null,
    price_sar: price,
    slot_minutes: SLOT_MINUTES.includes(slot) ? slot : 60,
    max_players: Math.min(40, Math.max(1, parseInt(str('max_players')) || 4)),
    hours,
    audience,
    community_id: audience === 'community' ? communityId : null,
    notice_hours: Math.min(72, Math.max(0, parseInt(str('notice_hours')) || 0)),
    cancel_hours: Math.min(168, Math.max(0, parseInt(str('cancel_hours')) || 0)),
    daily_limit: str('daily_limit') ? Math.min(10, Math.max(1, parseInt(str('daily_limit')) || 1)) : null,
  };
}
