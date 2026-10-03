import { createAdminClient } from './supabase-server';

// Beast Captains: a coach assigned to a community to put open sessions on its board every week.
// A paid service outside the subscription: the community pays by the hour, the captain is paid
// that rate less Beast Tribe's share (migrations 053–055).

export interface CaptainRow {
  communityId: string;
  community: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  target: number;
  thisWeek: number;
  nextWeek: number;
  rate: number | null;
  cutPct: number | null;
  startsOn: string;
  endsOn: string | null;
  notes: string | null;
  lastSession: string | null;
  active: boolean;
}

export interface StatementRow {
  communityId: string;
  community: string;
  userId: string;
  name: string;
  sessions: number;
  /** People who came, not counting the captain. */
  joined: number;
  hours: number;
  rate: number;
  cutPct: number;
  billed: number;
  ourShare: number;
  payout: number;
}

export const todayRiyadh = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
export const sar = (n: number) => `SAR ${Math.round(n).toLocaleString('en-US')}`;

/** First and last day of a month given as YYYY-MM (defaults to this month, Riyadh time). */
export function monthRange(m?: string) {
  const ym = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? m : todayRiyadh().slice(0, 7);
  const [y, mo] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const shift = (d: number) => new Date(Date.UTC(y, mo - 1 + d, 1)).toISOString().slice(0, 7);
  return {
    ym,
    from: `${ym}-01`,
    to: `${ym}-${String(last).padStart(2, '0')}`,
    label: new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    prev: shift(-1),
    next: shift(1),
  };
}

export async function loadCaptains(communityId?: string): Promise<CaptainRow[]> {
  const db = createAdminClient();
  const { data, error } = await db.rpc('captain_week');
  if (error) throw new Error(error.message);
  const today = todayRiyadh();
  return (data || [])
    .filter((r: any) => !communityId || r.community_id === communityId)
    .map((r: any) => ({
      communityId: r.community_id,
      community: r.community,
      userId: r.user_id,
      name: r.captain,
      avatarUrl: r.avatar_url,
      target: r.weekly_target,
      thisWeek: r.this_week,
      nextWeek: r.next_week,
      rate: r.hourly_rate_sar === null ? null : Number(r.hourly_rate_sar),
      cutPct: r.cut_pct === null ? null : Number(r.cut_pct),
      startsOn: r.starts_on,
      endsOn: r.ends_on,
      notes: r.notes,
      lastSession: r.last_session,
      active: r.starts_on <= today && (!r.ends_on || r.ends_on >= today),
    }));
}

export async function loadStatement(from: string, to: string, communityId?: string): Promise<StatementRow[]> {
  const db = createAdminClient();
  const { data, error } = await db.rpc('captain_statement', { p_from: from, p_to: to });
  if (error) throw new Error(error.message);
  return (data || [])
    .filter((r: any) => !communityId || r.community_id === communityId)
    .map((r: any) => ({
      communityId: r.community_id,
      community: r.community,
      userId: r.user_id,
      name: r.captain,
      sessions: r.sessions,
      joined: Math.max(0, r.joined - r.sessions),
      hours: Number(r.hours),
      rate: Number(r.rate),
      cutPct: Number(r.cut_pct),
      billed: Number(r.billed),
      ourShare: Number(r.our_share),
      payout: Number(r.payout),
    }));
}

export async function defaultCut(): Promise<number> {
  const db = createAdminClient();
  const { data } = await db.from('app_settings').select('value').eq('key', 'captain').maybeSingle();
  const n = Number((data?.value as any)?.cut_pct);
  return Number.isFinite(n) ? n : 20;
}
