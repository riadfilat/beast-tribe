import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { PREVIEW, PREVIEW_ME, previewPartnerProfile, previewPartners } from './preview';
import type { Lvl } from '../components/board/level';
import { cityKeys } from '../lib/cities';
import { CodedError, codeFrom } from './errors';

// Training partners (migration 059). Members opt in; only open members can look, and only open
// members are suggested. The database scores sport, level (with private teammate ratings), usual
// training times, running pace, a shared club and sessions done together. Migration 083: members can
// show their own chosen level (seen only by matches who show theirs too; teammates' ratings never
// leave the server), browse one community, and add optional "about you" answers that only feed the
// score: we show what two people have in common, never the answers themselves.

export type PartnerTime = 'early' | 'morning' | 'midday' | 'evening' | 'night';
export const PARTNER_TIMES: PartnerTime[] = ['early', 'morning', 'midday', 'evening', 'night'];

export type PartnerWork = 'desk' | 'on_feet' | 'shifts' | 'student' | 'flexible';
export type PartnerGoal = 'fitness' | 'weight' | 'compete' | 'friends' | 'stress' | 'event';
export type PartnerVibe = 'easy' | 'steady' | 'push';
export const PARTNER_WORK: PartnerWork[] = ['desk', 'on_feet', 'shifts', 'student', 'flexible'];
export const PARTNER_GOALS: PartnerGoal[] = ['fitness', 'friends', 'compete', 'event', 'weight', 'stress'];
export const PARTNER_VIBES: PartnerVibe[] = ['easy', 'steady', 'push'];
export const MAX_GOALS = 3;

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
  /** Show my own chosen level to matches who show theirs. */
  showLevel: boolean;
  work: PartnerWork | null;
  goals: PartnerGoal[];
  vibe: PartnerVibe | null;
}

export const EMPTY_PARTNER_PROFILE: PartnerProfile = { open: false, sameCommunity: false, sameGender: false, times: [], paceS: null, note: '', showLevel: false, work: null, goals: [], vibe: null };

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
  /** Their own chosen level, only when both of you show yours. */
  level: Lvl | null;
  sameVibe: boolean;
  sharedGoals: PartnerGoal[];
}

const PARTNER_CODES = ['NOT_OPEN', 'NOT_MEMBER', 'NOT_AVAILABLE', 'EVENT_OVER', 'NOT_THERE', 'ALREADY_INVITED', 'ALREADY', 'WOMEN_ONLY', 'CANT_SEE', 'TOO_MANY'] as const;
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
    if (PREVIEW) return previewPartnerProfile;
    const { data, error } = await supabase.from('partner_profiles').select('open, same_community, same_gender, times, run_pace_s, note, show_level, work, goals, vibe').eq('user_id', me!).maybeSingle();
    if (error) throw error;
    return {
      open: !!data?.open,
      sameCommunity: !!data?.same_community,
      sameGender: !!data?.same_gender,
      times: ((data?.times as PartnerTime[]) || []).filter((x) => PARTNER_TIMES.includes(x)),
      paceS: data?.run_pace_s ?? null,
      note: data?.note || '',
      showLevel: !!data?.show_level,
      work: PARTNER_WORK.includes(data?.work) ? data!.work : null,
      goals: ((data?.goals as PartnerGoal[]) || []).filter((x) => PARTNER_GOALS.includes(x)),
      vibe: PARTNER_VIBES.includes(data?.vibe) ? data!.vibe : null,
    };
  });
}

export async function savePartnerProfile(meId: string, p: PartnerProfile) {
  if (PREVIEW) {
    Object.assign(previewPartnerProfile, p);
    invalidate('partners:');
    return;
  }
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
      work: p.work,
      goals: p.goals.slice(0, MAX_GOALS),
      vibe: p.vibe,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
  invalidate('partners:');
}

/**
 * Suggestions for an open member, best first. `sport` narrows to one sport; `community` to the
 * members of one community I'm in (private or open, any city). Without it: my city and shared communities.
 */
export function usePartners(open: boolean, sport: string | null, community: string | null = null) {
  const { user, profile } = useAuth();
  const me = meOf(user?.id);
  return useQuery<Partner[]>(me && open ? `partners:list:${me}:${sport ?? 'all'}:${community ?? 'all'}` : null, async () => {
    if (PREVIEW) return previewPartners(sport, community, previewPartnerProfile.showLevel);
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
      level: (['easy', 'medium', 'hard'] as Lvl[]).includes(r.level) ? r.level : null,
      sameVibe: !!r.same_vibe,
      sharedGoals: ((r.shared_goals as PartnerGoal[]) || []).filter((x) => PARTNER_GOALS.includes(x)),
    }));
  });
}

/** Invite a partner to one of your upcoming sessions. They get a notification that opens it. */
export async function invitePartner(userId: string, eventId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.rpc('invite_partner', { p_user: userId, p_event: eventId });
  if (error) throw toError(error);
}

/** A member's own chosen level, the way matches see it (train level first, then the onboarding stage). */
export function selfLevel(profile: { train_level?: string | null; experience_level?: string | null } | null | undefined): Lvl | null {
  const v = (profile?.train_level || profile?.experience_level || '').toLowerCase();
  if (v === 'beginner' || v === 'dreamer') return 'easy';
  if (v === 'intermediate' || v === 'seeker') return 'medium';
  if (v === 'advanced' || v === 'mover' || v === 'expert') return 'hard';
  return null;
}
