import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { personOf } from './model';
import { addDays, localDateKey, startOfLocalDay } from '../i18n/format';
import { sportIdOf, SportId } from '../lib/sports';
import { PREVIEW, PREVIEW_ME, previewCoachLinks, previewSessionRows, previewTrainees } from './preview';
import type { Person } from '../components/board/people';

// Coaching runs on consent: a coach sends a request, the member accepts and picks what to
// share (nutrition, body measurements), and either side can end it. The database enforces
// all of this (migration 036); these helpers only shape it for the screens.

export type LinkStatus = 'pending' | 'active' | 'paused';
export interface Sharing {
  nutrition: boolean;
  body: boolean;
}

/** "Shares nutrition and measurements" / "Shares nothing yet" */
export function sharesLine(t: (k: string, v?: any) => string, sharing: Sharing) {
  const what = [sharing.nutrition ? t('coach.sharesNutrition') : null, sharing.body ? t('coach.sharesBody') : null].filter(Boolean) as string[];
  return what.length ? t('coach.shares', { what: what.join(t('coach.and')) }) : t('coach.sharesNothing');
}

function useMe() {
  const { user } = useAuth();
  return PREVIEW ? PREVIEW_ME : user?.id ?? null;
}

const statusOf = (s: any): LinkStatus => (s === 'active' || s === 'paused' ? s : 'pending');

// ─── Member side ────────────────────────────────────────────────────────────
export interface MyCoach {
  linkId: string;
  coachId: string;
  name: string;
  status: LinkStatus;
  since: Date | null;
  sharing: Sharing;
}

export function useMyCoaches() {
  const me = useMe();
  return useQuery<MyCoach[]>(me ? `coaching:mine:${me}` : null, async () => {
    const rows: any[] = PREVIEW
      ? previewCoachLinks
      : (
          await supabase
            .from('coach_trainees')
            .select('id, coach_id, status, started_at, coach:partners(id, business_name, name, user_id)')
            .eq('trainee_id', me!)
            .order('started_at', { ascending: false })
        ).data || [];
    const shared: any[] = PREVIEW ? [] : (await supabase.from('trainee_privacy').select('coach_id, share_nutrition, share_body_metrics').eq('trainee_id', me!)).data || [];
    return rows.map((r) => {
      const s = shared.find((x) => x.coach_id === r.coach_id);
      return {
        linkId: r.id,
        coachId: r.coach_id,
        name: r.coach?.business_name || r.coach?.name || '',
        status: statusOf(r.status),
        since: r.started_at ? new Date(r.started_at) : null,
        sharing: { nutrition: !!s?.share_nutrition, body: !!s?.share_body_metrics },
      };
    });
  });
}

export async function saveSharing(meId: string, coachId: string, sharing: Sharing) {
  if (PREVIEW) return;
  const { error } = await supabase
    .from('trainee_privacy')
    .upsert(
      { trainee_id: meId, coach_id: coachId, share_nutrition: sharing.nutrition, share_body_metrics: sharing.body, share_workouts: false, share_habits: false, share_photos: false, share_on_feed: false },
      { onConflict: 'trainee_id,coach_id' },
    );
  if (error) throw error;
  invalidate('coaching:');
}

export async function acceptCoach(meId: string, c: MyCoach, sharing: Sharing) {
  if (PREVIEW) return;
  // Save what is shared first, so the coach never sees an active link with defaults.
  await saveSharing(meId, c.coachId, sharing);
  const { error } = await supabase.from('coach_trainees').update({ status: 'active' }).eq('id', c.linkId);
  if (error) throw error;
  invalidate('coaching:');
}

/** Decline a request, stop being coached, or (coach side) withdraw / remove. */
export async function endCoaching(linkId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('coach_trainees').delete().eq('id', linkId);
  if (error) throw error;
  invalidate('coaching:');
}

// ─── Coach side ─────────────────────────────────────────────────────────────
export interface CoachProfile {
  id: string;
  name: string;
}

/** The partner record that makes this member a coach (created in the admin). */
export function useCoachProfile() {
  const me = useMe();
  return useQuery<CoachProfile | null>(me ? `coaching:coach:${me}` : null, async () => {
    if (PREVIEW) return { id: 'c-noor', name: 'Coach Noor' };
    const { data, error } = await supabase
      .from('partners')
      .select('id, business_name, name')
      .eq('user_id', me!)
      .eq('partner_type', 'coach')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, name: data.business_name || data.name || '' } : null;
  });
}

export interface Trainee {
  linkId: string;
  person: Person;
  status: LinkStatus;
  since: Date | null;
  sharing: Sharing;
}

export function useTrainees(coachId?: string | null) {
  return useQuery<Trainee[]>(coachId ? `coaching:trainees:${coachId}` : null, async () => {
    const rows: any[] = PREVIEW
      ? previewTrainees
      : (
          await supabase
            .from('coach_trainees')
            .select('id, trainee_id, status, started_at, trainee:profiles!trainee_id(id, display_name, full_name, avatar_url)')
            .eq('coach_id', coachId!)
            .order('started_at', { ascending: false })
        ).data || [];
    const shared: any[] = PREVIEW
      ? [{ trainee_id: 'p-sara', share_nutrition: true, share_body_metrics: true }, { trainee_id: 'p-majed', share_nutrition: false, share_body_metrics: true }]
      : (await supabase.from('trainee_privacy').select('trainee_id, share_nutrition, share_body_metrics').eq('coach_id', coachId!)).data || [];
    return rows
      .map((r) => {
        const person = personOf(r.trainee);
        if (!person) return null;
        const s = shared.find((x) => x.trainee_id === r.trainee_id);
        return {
          linkId: r.id,
          person,
          status: statusOf(r.status),
          since: r.started_at ? new Date(r.started_at) : null,
          sharing: { nutrition: !!s?.share_nutrition, body: !!s?.share_body_metrics },
        } as Trainee;
      })
      .filter(Boolean) as Trainee[];
  });
}

export class CoachError extends Error {
  code: 'ALREADY' | 'generic';
  constructor(code: 'ALREADY' | 'generic') {
    super(code);
    this.code = code;
  }
}

export async function requestTrainee(coachId: string, personId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('coach_trainees').insert({ coach_id: coachId, trainee_id: personId, status: 'pending' });
  if (error) throw new CoachError((error as any).code === '23505' ? 'ALREADY' : 'generic');
  invalidate('coaching:');
}

// ─── One trainee ────────────────────────────────────────────────────────────
export interface Measurement {
  id: string;
  at: Date;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  waist: number | null;
  chest: number | null;
  bmi: number | null;
  notes: string | null;
}

const n = (v: any) => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v));

export function useMeasurements(traineeId?: string | null, enabled = true) {
  return useQuery<Measurement[]>(traineeId && enabled ? `coaching:metrics:${traineeId}` : null, async () => {
    if (PREVIEW) {
      return [
        { id: 'bm2', at: new Date(Date.now() - 3 * 86400000), weight: 71.4, height: 168, bodyFat: 24, waist: 76, chest: 92, bmi: 25.3, notes: null },
        { id: 'bm1', at: new Date(Date.now() - 31 * 86400000), weight: 73.0, height: 168, bodyFat: 25.5, waist: 79, chest: 93, bmi: 25.9, notes: 'Start of block' },
      ];
    }
    const { data, error } = await supabase
      .from('body_metrics')
      .select('id, recorded_at, weight_kg, height_cm, body_fat_pct, waist_cm, chest_cm, bmi, notes')
      .eq('user_id', traineeId!)
      .order('recorded_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      at: new Date(r.recorded_at),
      weight: n(r.weight_kg),
      height: n(r.height_cm),
      bodyFat: n(r.body_fat_pct),
      waist: n(r.waist_cm),
      chest: n(r.chest_cm),
      bmi: n(r.bmi),
      notes: r.notes || null,
    }));
  });
}

export async function recordMeasurement(
  meId: string,
  traineeId: string,
  m: { weight?: number | null; height?: number | null; bodyFat?: number | null; waist?: number | null; chest?: number | null; notes?: string },
) {
  if (PREVIEW) return;
  const bmi = m.weight && m.height ? Math.round((m.weight / (m.height / 100) ** 2) * 10) / 10 : null;
  const { error } = await supabase.from('body_metrics').insert({
    user_id: traineeId,
    recorded_by: meId,
    weight_kg: m.weight ?? null,
    height_cm: m.height ?? null,
    body_fat_pct: m.bodyFat ?? null,
    waist_cm: m.waist ?? null,
    chest_cm: m.chest ?? null,
    bmi,
    notes: m.notes?.trim() || null,
  });
  if (error) throw error;
  invalidate(`coaching:metrics:${traineeId}`);
}

export interface DayIntake {
  date: string;
  calories: number;
  protein: number;
  meals: number;
}

/** Last seven days of what the member logged (only readable when they share it). */
export function useTraineeIntake(traineeId?: string | null, enabled = true) {
  return useQuery<DayIntake[]>(traineeId && enabled ? `coaching:intake:${traineeId}` : null, async () => {
    const end = startOfLocalDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => localDateKey(addDays(end, i - 6)));
    let rows: any[] = [];
    if (PREVIEW) {
      rows = days.map((d, i) => ({ logged_date: d, calories: [1850, 2310, 1620, 2050, 0, 1980, 1180][i], protein_g: [110, 140, 90, 120, 0, 125, 64][i] }));
    } else {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('logged_date, calories, protein_g')
        .eq('user_id', traineeId!)
        .gte('logged_date', days[0])
        .lte('logged_date', days[6]);
      if (error) throw error;
      rows = data || [];
    }
    return days.map((d) => {
      const today = rows.filter((r) => r.logged_date === d);
      return {
        date: d,
        calories: today.reduce((s, r) => s + (Number(r.calories) || 0), 0),
        protein: today.reduce((s, r) => s + (Number(r.protein_g) || 0), 0),
        meals: today.filter((r) => Number(r.calories) > 0).length,
      };
    });
  });
}

export interface AttendedSession {
  id: string;
  title: string;
  sport: SportId;
  startsAt: Date;
}

/** Sessions the member showed up for in the last 30 days (public on the board anyway). */
export function useTraineeSessions(traineeId?: string | null) {
  return useQuery<AttendedSession[]>(traineeId ? `coaching:sessions:${traineeId}` : null, async () => {
    const since = addDays(new Date(), -30);
    const now = Date.now();
    if (PREVIEW) {
      return previewSessionRows()
        .filter((r) => new Date(r.starts_at).getTime() < now && !r.cancelled_at)
        .map((r) => ({ id: r.id, title: r.title, sport: sportIdOf(r.event_type), startsAt: new Date(r.starts_at) }));
    }
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('events!inner(id, title, event_type, starts_at, cancelled_at)')
      .eq('user_id', traineeId!)
      .eq('status', 'going')
      .gte('events.starts_at', since.toISOString())
      .lte('events.starts_at', new Date(now).toISOString())
      .is('events.cancelled_at', null);
    if (error) throw error;
    return (data || [])
      .map((r: any) => r.events)
      .filter(Boolean)
      .map((e: any) => ({ id: e.id, title: e.title || '', sport: sportIdOf(e.event_type), startsAt: new Date(e.starts_at) }))
      .sort((a: AttendedSession, b: AttendedSession) => b.startsAt.getTime() - a.startsAt.getTime());
  });
}

export type NoteType = 'feedback' | 'goal' | 'milestone' | 'warning' | 'program';
export const NOTE_TYPES: NoteType[] = ['feedback', 'goal', 'milestone', 'program', 'warning'];
export interface CoachNote {
  id: string;
  type: NoteType;
  content: string;
  isPrivate: boolean;
  at: Date;
}

export function useCoachNotes(coachId?: string | null, traineeId?: string | null) {
  return useQuery<CoachNote[]>(coachId && traineeId ? `coaching:notes:${coachId}:${traineeId}` : null, async () => {
    if (PREVIEW) {
      return [
        { id: 'cn1', type: 'goal', content: 'Sub-25 5K by December. Two runs and one Hyrox session a week.', isPrivate: false, at: new Date(Date.now() - 9 * 86400000) },
        { id: 'cn2', type: 'warning', content: 'Left knee sore after box jumps. Swap for step-ups this block.', isPrivate: true, at: new Date(Date.now() - 4 * 86400000) },
      ];
    }
    const { data, error } = await supabase
      .from('coach_notes')
      .select('id, note_type, content, is_private, created_at')
      .eq('coach_id', coachId!)
      .eq('trainee_id', traineeId!)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id,
      type: (NOTE_TYPES as string[]).includes(r.note_type) ? r.note_type : 'feedback',
      content: r.content || '',
      isPrivate: !!r.is_private,
      at: new Date(r.created_at),
    }));
  });
}

export async function addCoachNote(coachId: string, traineeId: string, type: NoteType, content: string, isPrivate: boolean) {
  if (PREVIEW) return;
  const { error } = await supabase.from('coach_notes').insert({ coach_id: coachId, trainee_id: traineeId, note_type: type, content: content.trim(), is_private: isPrivate });
  if (error) throw error;
  invalidate(`coaching:notes:${coachId}:${traineeId}`);
}

export async function deleteCoachNote(coachId: string, traineeId: string, id: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('coach_notes').delete().eq('id', id);
  if (error) throw error;
  invalidate(`coaching:notes:${coachId}:${traineeId}`);
}

// ─── Booking a coach for a hosted session ───────────────────────────────────
export interface CoachSlot {
  start: string;
  end: string;
  booked: boolean;
}

export function useCoachSlots(partnerId?: string | null, dateKey?: string | null) {
  return useQuery<CoachSlot[]>(partnerId && dateKey ? `coaching:slots:${partnerId}:${dateKey}` : null, async () => {
    if (PREVIEW) {
      return ['06:00', '07:00', '17:00', '18:00', '19:00'].map((t, i) => ({ start: t, end: `${String(parseInt(t, 10) + 1).padStart(2, '0')}:00`, booked: i === 1 }));
    }
    const [y, m, d] = dateKey!.split('-').map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    const hhmm = (v: any) => String(v || '').substring(0, 5);
    const [weekly, bookings] = await Promise.all([
      supabase.from('coach_slots').select('start_time, end_time').eq('partner_id', partnerId!).eq('day_of_week', weekday).eq('is_active', true).order('start_time'),
      supabase.from('coach_bookings').select('start_time').eq('partner_id', partnerId!).eq('booking_date', dateKey!).neq('status', 'cancelled'),
    ]);
    if (weekly.error) throw weekly.error;
    const taken = new Set((bookings.data || []).map((b: any) => hhmm(b.start_time)));
    return (weekly.data || []).map((r: any) => ({ start: hhmm(r.start_time), end: hhmm(r.end_time), booked: taken.has(hhmm(r.start_time)) }));
  });
}

export async function bookCoach(meId: string, partnerId: string, dateKey: string, start: string, end: string, eventId?: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('coach_bookings').insert({
    partner_id: partnerId,
    booked_by: meId,
    booking_date: dateKey,
    start_time: start,
    end_time: end,
    event_id: eventId || null,
    status: 'confirmed',
  });
  if (error) throw error;
  invalidate(`coaching:slots:${partnerId}`);
}
