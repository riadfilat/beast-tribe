import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-server';
import { cityKeys } from '@/lib/cities';

// Ask Beast: the app's Claude-powered assistant. The member's own sign-in travels with each
// request, so every lookup runs as them and only sees what they can see in the app. Level
// ratings never leave the database; matching only says whether a level is close.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const MODEL = process.env.ASSISTANT_MODEL || 'claude-sonnet-5-5';
const DAILY = Number(process.env.ASSISTANT_DAILY_LIMIT || 25);
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

type Card = Record<string, unknown> & { type: string };
type Msg = { role: 'user' | 'assistant'; content: any };

const TOOLS = [
  {
    name: 'find_training_partners',
    description: 'Training partners suggested for the member: people open to partners, nearby or in a shared club, at a similar level, who train at similar times. Returns names, shared sports, usual times and whether the level is similar.',
    input_schema: { type: 'object', properties: { sport: { type: 'string', description: 'Sport id, e.g. running, padel, football, gym, basketball, tennis, cycling, swimming, hyrox, crossfit, yoga, pilates, walking, hiking, boxing, climbing' } } },
  },
  {
    name: 'find_sessions',
    description: 'Upcoming sessions on the member\'s Board (their city and their communities) that they can join.',
    input_schema: {
      type: 'object',
      properties: {
        sport: { type: 'string', description: 'Sport id to filter by' },
        when: { type: 'string', enum: ['today', 'tomorrow', 'this_week'], description: 'Time window (Riyadh time)' },
        part_of_day: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'any'] },
      },
    },
  },
  {
    name: 'find_workouts',
    description: 'Workouts from the Operation Beast library and the member\'s coaches.',
    input_schema: {
      type: 'object',
      properties: {
        max_minutes: { type: 'number' },
        sport: { type: 'string' },
        no_equipment: { type: 'boolean' },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
      },
    },
  },
  {
    name: 'find_clubs',
    description: 'Clubs and communities: ones the member is in and open ones they can join.',
    input_schema: { type: 'object', properties: { sport: { type: 'string' } } },
  },
];

function riyadhDayStart(offsetDays: number) {
  const now = new Date();
  const riyadh = new Date(now.getTime() + 3 * 3600000);
  const start = Date.UTC(riyadh.getUTCFullYear(), riyadh.getUTCMonth(), riyadh.getUTCDate()) - 3 * 3600000;
  return new Date(start + offsetDays * 86400000);
}

async function runTool(name: string, input: any, ctx: { db: SupabaseClient; city: string | null; lang: string; userId: string }, cards: Card[]) {
  const { db } = ctx;
  if (name === 'find_training_partners') {
    const { data, error } = await db.rpc('find_partners', { p_cities: cityKeys(ctx.city), p_sport: input?.sport || null, p_limit: 6 });
    if (error) {
      if (/NOT_OPEN/.test(error.message)) {
        cards.push({ type: 'action', action: 'partners' });
        return { status: 'not_open', note: 'The member has not switched on Training partners. Tell them to switch it on (a button is shown under your reply); only people who switch it on can see each other.' };
      }
      return { error: 'unavailable' };
    }
    const rows = (data as any[]) || [];
    rows.slice(0, 4).forEach((r) =>
      cards.push({ type: 'partner', id: r.user_id, name: r.name, avatarUrl: r.avatar_url, line: [r.sport, r.close_level ? 'similar level' : null, (r.times || []).join('/')].filter(Boolean).join(' · ') }),
    );
    return rows.map((r) => ({ name: r.name, sport: r.sport, shared_sports: r.sports, usual_times: r.times, similar_level: r.close_level, shared_club: r.club, trained_together: r.together, note: r.note }));
  }

  if (name === 'find_sessions') {
    const when = input?.when || 'this_week';
    const from = when === 'tomorrow' ? riyadhDayStart(1) : new Date();
    const to = when === 'today' ? riyadhDayStart(1) : when === 'tomorrow' ? riyadhDayStart(2) : new Date(Date.now() + 7 * 86400000);
    let q = db
      .from('events')
      .select('id, title, event_type, starts_at, location_name, location_city, going_count, max_capacity, is_women_only, drop_in, community:communities(name)')
      .is('cancelled_at', null)
      .gte('starts_at', from.toISOString())
      .lt('starts_at', to.toISOString())
      .order('starts_at')
      .limit(25);
    const keys = cityKeys(ctx.city);
    q = keys.length ? q.or(`open_scope.is.false,city_key.is.null,city_key.in.(${keys.map((k) => `"${k}"`).join(',')})`) : q;
    if (input?.sport) q = q.eq('event_type', input.sport);
    const { data, error } = await q;
    if (error) return { error: 'unavailable' };
    let rows = (data as any[]) || [];
    const pod = input?.part_of_day;
    if (pod && pod !== 'any') {
      rows = rows.filter((r) => {
        const h = (new Date(r.starts_at).getUTCHours() + 3) % 24;
        return pod === 'morning' ? h < 12 : pod === 'afternoon' ? h >= 12 && h < 17 : h >= 17;
      });
    }
    rows = rows.slice(0, 6);
    rows.slice(0, 4).forEach((r) => cards.push({ type: 'session', id: r.id, title: r.title, sport: r.event_type, startsAt: r.starts_at, place: r.location_name || r.location_city || null }));
    if (!rows.length) cards.push({ type: 'action', action: 'host' });
    return rows.map((r) => ({
      title: r.title,
      sport: r.event_type,
      starts_at_riyadh: new Date(new Date(r.starts_at).getTime() + 3 * 3600000).toISOString().slice(0, 16).replace('T', ' '),
      place: r.location_name || r.location_city,
      community: r.community?.name,
      going: r.going_count,
      spots: r.max_capacity,
      women_only: r.is_women_only,
      open_session: r.drop_in,
    }));
  }

  if (name === 'find_workouts') {
    let q = db
      .from('workouts')
      .select('id, title, title_ar, sport, duration_minutes, difficulty, equipment, format')
      .eq('status', 'published')
      .eq('program_only', false)
      .order('featured', { ascending: false })
      .limit(30);
    if (input?.sport) q = q.eq('sport', input.sport);
    if (input?.max_minutes) q = q.lte('duration_minutes', Math.round(input.max_minutes));
    if (input?.level) q = q.eq('difficulty', input.level);
    const { data, error } = await q;
    if (error) return { error: 'unavailable' };
    let rows = (data as any[]) || [];
    if (input?.no_equipment) rows = rows.filter((r) => !(r.equipment || []).length);
    rows = rows.slice(0, 5);
    rows.slice(0, 3).forEach((r) => cards.push({ type: 'workout', id: r.id, title: (ctx.lang === 'ar' && r.title_ar) || r.title, minutes: r.duration_minutes, sport: r.sport }));
    return rows.map((r) => ({ title: (ctx.lang === 'ar' && r.title_ar) || r.title, sport: r.sport, minutes: r.duration_minutes, level: r.difficulty, equipment: r.equipment, format: r.format }));
  }

  if (name === 'find_clubs') {
    const [{ data: mine }, { data: open }] = await Promise.all([
      db.from('community_members').select('community_id').eq('user_id', ctx.userId),
      db.from('communities').select('id, name, kind, city, sport, description, verified_at, members:community_members(count)').eq('visibility', 'open').eq('is_active', true).eq('is_default', false).limit(30),
    ]);
    const mineIds = new Set(((mine as any[]) || []).map((r) => r.community_id));
    let rows = ((open as any[]) || []).filter((r) => !input?.sport || !r.sport || r.sport === input.sport);
    rows = rows.slice(0, 6);
    rows.slice(0, 4).forEach((r) => cards.push({ type: 'club', id: r.id, name: r.name, line: [r.sport, r.city, `${r.members?.[0]?.count ?? 0} members`].filter(Boolean).join(' · ') }));
    if (!rows.length) cards.push({ type: 'action', action: 'clubs' });
    return rows.map((r) => ({ name: r.name, sport: r.sport, city: r.city, about: r.description, members: r.members?.[0]?.count ?? 0, verified: !!r.verified_at, already_member: mineIds.has(r.id) }));
  }
  return { error: 'unknown tool' };
}

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'signed_out' }, 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: who } = await db.auth.getUser(token);
  const user = who?.user;
  if (!user) return json({ error: 'signed_out' }, 401);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json({ error: 'not_configured' }, 503);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const lang = body?.lang === 'ar' ? 'ar' : 'en';
  const history: Msg[] = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 1000) }));
  if (!history.length || history[history.length - 1].role !== 'user') return json({ error: 'bad_request' }, 400);
  while (history.length && history[0].role !== 'user') history.shift();

  const admin = createAdminClient();
  const { data: allowed } = await admin.rpc('assistant_take', { p_user: user.id, p_limit: DAILY });
  if (!allowed) return json({ error: 'limit' }, 429);

  const [{ data: me }, { data: sp }] = await Promise.all([
    db.rpc('my_profile').maybeSingle(),
    db.from('user_sports').select('sport:sports(name)').eq('user_id', user.id),
  ]);
  const profile: any = me || {};
  const sports = ((sp as any[]) || []).map((r) => String(r.sport?.name || '').toLowerCase()).filter(Boolean);
  const today = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);

  const system = [
    'You are Beast, the assistant inside Beast Tribe, a community sports app by Operation Beast (a Saudi activewear brand).',
    'Help the member find training partners, sessions to join, workouts and clubs. Use the tools to look things up; never invent people, sessions, clubs, workouts or prices.',
    `Reply in ${lang === 'ar' ? 'Arabic (Gulf-friendly Modern Standard). Say جلسة for a session, تمرين for a workout, حركة for a single exercise' : 'English'}.`,
    'Keep replies to one to three short, warm sentences. The app shows the results as tappable cards under your reply, so do not list every detail or use markdown.',
    'Never mention level ratings, scores, or how anyone was rated; say "similar level" at most.',
    'No medical advice: for pain, injury or health conditions, suggest seeing a professional.',
    'If nothing is found, say so plainly and suggest hosting a session, switching on Training partners, or joining a club.',
    `Today in Riyadh: ${today}. Member: ${profile.display_name || profile.full_name || 'member'}; city: ${profile.city || 'unknown'}; sports: ${sports.join(', ') || 'not set'}; level: ${profile.train_level || profile.experience_level || 'not set'}; goal: ${profile.train_goal || 'not set'}.`,
  ].join('\n');

  const cards: Card[] = [];
  const messages: Msg[] = [...history];
  let reply = '';
  for (let round = 0; round < 4; round++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, system, tools: TOOLS, messages }),
    });
    if (!res.ok) return json({ error: 'upstream', status: res.status }, 502);
    const out: any = await res.json();
    const content: any[] = out.content || [];
    reply = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const uses = content.filter((b) => b.type === 'tool_use');
    if (out.stop_reason !== 'tool_use' || !uses.length) break;
    messages.push({ role: 'assistant', content });
    const results = [];
    for (const u of uses) {
      const r = await runTool(u.name, u.input, { db, city: profile.city || null, lang, userId: user.id }, cards).catch(() => ({ error: 'unavailable' }));
      results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(r).slice(0, 6000) });
    }
    messages.push({ role: 'user', content: results });
  }

  const seen = new Set<string>();
  const unique = cards.filter((c) => {
    const k = `${c.type}:${(c as any).id ?? (c as any).action}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return json({ reply, cards: unique.slice(0, 6) });
}
