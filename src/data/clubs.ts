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

export async function createClub(input: { name: string; sport: string | null; city: string; description: string; listing: ClubListing }): Promise<{ id: string; joinCode: string }> {
  if (PREVIEW) return { id: 'c-preview', joinCode: 'RUN24X' };
  const { data, error } = await supabase.rpc('create_club', {
    p_name: input.name.trim(),
    p_sport: input.sport,
    p_city: input.city.trim(),
    p_description: input.description.trim(),
    p_listing: input.listing,
  });
  if (error) throw toError(error);
  const row = Array.isArray(data) ? data[0] : data;
  invalidate('communities:');
  invalidate('sessions:');
  return { id: row.id, joinCode: row.join_code };
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
