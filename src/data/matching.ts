import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_ME } from './preview';
import { cityKeys } from '../lib/cities';
import { CodedError, codeFrom } from './errors';

// Training partners (migration 059). Members opt in; only open members can look, and only open
// members are suggested. The database scores sport, level (with private teammate ratings), usual
// training times, running pace, a shared club, sessions done together and the optional "about you".
// It returns a level only when that person chose to show their own (never teammate ratings).

export type PartnerTime = 'early' | 'morning' | 'midday' | 'evening' | 'night';
export const PARTNER_TIMES: PartnerTime[] = ['early', 'morning', 'midday', 'evening', 'night'];

export interface PartnerProfile {
  open: boolean;
  /** Only people who share one of my communities (not the default one). */
  sameCommunity: boolean;
  /** Only people of my gender. */
  sameGender: boolean;
  times: PartnerTime[];
  /** Easy running pace, seconds per km. */
  paceS: number | null;
  note: string;
  /** Show the level I chose myself on my card. Teammate ratings are never shown. */
  showLevel: boolean;
  /** Optional, for better matches. */
  workStyle: WorkStyle | null;
  goals: PlayGoal[];
  groupSize: GroupSize | null;
}

export type WorkStyle = 'desk' | 'feet' | 'shifts' | 'student' | 'other';
export const WORK_STYLES: WorkStyle[] = ['desk', 'feet', 'shifts', 'student', 'other'];
export type PlayGoal = 'fit' | 'compete' | 'social' | 'fun' | 'learn';
export const PLAY_GOALS: PlayGoal[] = ['fit', 'compete', 'social', 'fun', 'learn'];
export type GroupSize = 'one' | 'small' | 'big';
export const GROUP_SIZES: GroupSize[] = ['one', 'small', 'big'];

export interface Partner {
  id: string;
  name: string;
  avatarUrl: string | null;
  sport: string | null;
  sports: string[];
  times: PartnerTime[];
  paceS: number | null;
  note: string | null;
  closeLevel: boolean;
  club: string | null;
  together: number;
  /** Only when they chose to show it: beginner / intermediate / advanced / expert. */
  level: string | null;
  sharedGoals: PlayGoal[];
}

const PARTNER_CODES = ['NOT_OPEN', 'NOT_AVAILABLE', 'EVENT_OVER', 'NOT_THERE', 'ALREADY_INVITED', 'ALREADY', 'WOMEN_ONLY', 'CANT_SEE', 'TOO_MANY'] as const;
export type PartnerErrorCode = (typeof PARTNER_CODES)[number] | 'generic';
export class PartnerError extends CodedError<PartnerErrorCode> {}
const toError = (e: any) => new PartnerError(codeFrom(e, PARTNER_CODES));

/** "5:30" for 330 seconds per km. */
export const fmtPace = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const meOf = (id?: string | null) => (PREVIEW ? PREVIEW_ME : id ?? null);

export function usePartnerProfile() {
  const { user } = useAuth();
  const me = meOf(user?.id);
  return useQuery<PartnerProfile>(me ? `partners:me:${me}` : null, async () => {
    if (PREVIEW) return { open: false, sameCommunity: false, sameGender: false, times: [], paceS: null, note: '', showLevel: false, workStyle: null, goals: [], groupSize: null };
    const { data, error } = await supabase
      .from('partner_profiles')
      .select('open, same_community, same_gender, times, run_pace_s, note, show_level, work_style, goals, group_size')
      .eq('user_id', me!)
      .maybeSingle();
    if (error) throw error;
    return {
      open: !!data?.open,
      sameCommunity: !!data?.same_community,
      sameGender: !!data?.same_gender,
      times: ((data?.times as PartnerTime[]) || []).filter((x) => PARTNER_TIMES.includes(x)),
      paceS: data?.run_pace_s ?? null,
      note: data?.note || '',
      showLevel: !!data?.show_level,
      workStyle: WORK_STYLES.includes(data?.work_style) ? data!.work_style : null,
      goals: ((data?.goals as PlayGoal[]) || []).filter((g) => PLAY_GOALS.includes(g)),
      groupSize: GROUP_SIZES.includes(data?.group_size) ? data!.group_size : null,
    };
  });
}

export async function savePartnerProfile(meId: string, p: PartnerProfile) {
  if (PREVIEW) return;
  const { error } = await supabase.from('partner_profiles').upsert(
    {
      user_id: meId,
      open: p.open,
      same_community: p.sameCommunity,
      same_gender: p.sameGender,
      times: p.times,
      run_pace_s: p.paceS,
      note: p.note.trim().slice(0, 140) || null,
      show_level: p.showLevel,
      work_style: p.workStyle,
      goals: p.goals,
      group_size: p.groupSize,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
  invalidate('partners:');
}

/** Suggestions for an open member, best first. `sport` narrows to one sport; `community` looks only
 *  inside one of my communities (otherwise: my city, plus anyone who shares a community with me). */
export function usePartners(open: boolean, sport: string | null, community: string | null = null) {
  const { user, profile } = useAuth();
  const me = meOf(user?.id);
  return useQuery<Partner[]>(me && open ? `partners:list:${me}:${sport ?? 'all'}:${community ?? 'any'}` : null, async () => {
    if (PREVIEW) return [];
    const { data, error } = await supabase.rpc('find_partners', { p_cities: cityKeys(profile?.city), p_sport: sport, p_limit: 30, p_community: community });
    if (error) throw toError(error);
    return ((data as any[]) || []).map((r) => ({
      id: r.user_id,
      name: r.name || '',
      avatarUrl: r.avatar_url || null,
      sport: r.sport || null,
      sports: r.sports || [],
      times: (r.times || []).filter((x: any) => PARTNER_TIMES.includes(x)),
      paceS: r.pace_s ?? null,
      note: r.note || null,
      closeLevel: !!r.close_level,
      club: r.club || null,
      together: r.together || 0,
      level: r.level || null,
      sharedGoals: ((r.shared_goals as PlayGoal[]) || []).filter((g) => PLAY_GOALS.includes(g)),
    }));
  });
}

/** Invite a partner to one of your upcoming sessions. They get a notification that opens it. */
export async function invitePartner(userId: string, eventId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.rpc('invite_partner', { p_user: userId, p_event: eventId });
  if (error) throw toError(error);
}
