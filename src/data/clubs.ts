import { supabase } from '../lib/supabase';
import { invalidate } from './query';
import { PREVIEW } from './preview';
import { CodedError, codeFrom } from './errors';

// Club leaders (migration 059): any member can run one club for free. The club starts invite-only
// with a join code; a club that wants to be listed for everyone is listed once Beast Tribe verifies it.

export type ClubListing = 'invite' | 'public';
const CLUB_CODES = ['ALREADY_LEADER', 'NOT_LEADER', 'NAME'] as const;
export type ClubErrorCode = (typeof CLUB_CODES)[number] | 'generic';
export class ClubError extends CodedError<ClubErrorCode> {}
const toError = (e: any) => new ClubError(codeFrom(e, CLUB_CODES));

// Your own community: members ask, Beast Tribe sets it up with them (2026-10-04). The request lands
// in the dashboard's Leads and pings the admins.
export type CommunityKind = 'company' | 'gym' | 'coach' | 'influencer' | 'compound' | 'school' | 'leader' | 'other';
export const COMMUNITY_KINDS: CommunityKind[] = ['company', 'gym', 'compound', 'coach', 'influencer', 'school', 'leader', 'other'];
const REQUEST_CODES = ['TOO_MANY', 'CONTACT', 'ORG', 'NAME'] as const;
export type RequestErrorCode = (typeof REQUEST_CODES)[number] | 'generic';
export class RequestError extends CodedError<RequestErrorCode> {}

export async function requestCommunity(input: { kind: CommunityKind; org: string; name: string; role: string; contact: string; city: string; size: string | null; message: string }) {
  if (PREVIEW) return;
  const { error } = await supabase.rpc('request_community', {
    p_kind: input.kind,
    p_org: input.org.trim(),
    p_name: input.name.trim(),
    p_role: input.role.trim(),
    p_contact: input.contact.trim(),
    p_city: input.city.trim(),
    p_size: input.size,
    p_message: input.message.trim(),
  });
  if (error) throw new RequestError(codeFrom(error, REQUEST_CODES));
}

export async function updateMyClub(id: string, input: { name?: string; description?: string; notice?: string; listing?: ClubListing }) {
  if (PREVIEW) return;
  const { error } = await supabase.rpc('update_my_club', {
    p_id: id,
    p_name: input.name ?? null,
    p_description: input.description ?? null,
    p_notice: input.notice ?? null,
    p_listing: input.listing ?? null,
  });
  if (error) throw toError(error);
  invalidate('communities:');
  invalidate('wellness:extras');
}
