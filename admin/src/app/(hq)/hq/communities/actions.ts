'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, userSupabase } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { FEATURES, type Feature } from '@/lib/leader/features';

// HQ adds leaders (and their community), switches features and removes people. The database
// checks HQ itself (invite_to_team, set_community_feature, remove_from_team, cancel_team_invite).

export type AddLeaderState = { ok?: string; error?: string } | undefined;

const KINDS = ['club', 'gym', 'company', 'school', 'compound'];
const slugify = (raw: string) => raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '') || 'community';

export async function addLeader(_prev: AddLeaderState, formData: FormData): Promise<AddLeaderState> {
  await requireRole('admin');
  const str = (k: string, max = 80) => String(formData.get(k) ?? '').trim().slice(0, max);
  const email = str('email', 200);
  let communityId = str('community');
  if (communityId === 'new') {
    const name = str('name', 60);
    if (name.length < 2) return { error: 'Give the new community a name.' };
    const { data, error } = await createAdminClient()
      .from('communities')
      .insert({ name, slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`, city: str('city') || null, kind: KINDS.includes(str('kind')) ? str('kind') : 'club', visibility: 'private', is_active: true })
      .select('id')
      .single();
    if (error) return { error: /duplicate|unique/i.test(error.message) ? 'A community with that name already exists.' : 'Could not create the community.' };
    communityId = (data as any).id;
  }
  if (!communityId) return { error: 'Pick a community or create a new one.' };
  const { data, error } = await (await userSupabase()).rpc('invite_to_team', { p_community: communityId, p_email: email, p_role: 'admin' });
  if (error) return { error: error.message.includes('BAD_EMAIL') ? 'That email address doesn’t look right.' : 'Could not add the leader.' };
  revalidatePath('/hq/communities');
  revalidatePath('/hq');
  return {
    ok:
      data === 'added'
        ? `${email} now leads it. They sign in at beast-tribe.vercel.app with their Beast Tribe account.`
        : `Invite saved. Ask ${email} to open beast-tribe.vercel.app and choose “Email me a sign-in link” with this email. They become the leader as soon as they do.`,
  };
}

export async function hqToggleFeature(communityId: string, feature: Feature, on: boolean) {
  await requireRole('admin');
  if (!FEATURES.some((f) => f.key === feature)) throw new Error('Unknown feature');
  const { error } = await (await userSupabase()).rpc('set_community_feature', { p_community: communityId, p_feature: feature, p_on: on });
  if (error) throw new Error('Could not change the feature.');
  revalidatePath(`/hq/communities/${communityId}`);
}

export async function hqRemoveFromTeam(communityId: string, userId: string) {
  await requireRole('admin');
  const { error } = await (await userSupabase()).rpc('remove_from_team', { p_community: communityId, p_user: userId });
  if (error) throw new Error('Could not remove them.');
  revalidatePath(`/hq/communities/${communityId}`);
}

export async function hqCancelInvite(communityId: string, inviteId: string) {
  await requireRole('admin');
  await (await userSupabase()).rpc('cancel_team_invite', { p_invite: inviteId });
  revalidatePath(`/hq/communities/${communityId}`);
}
