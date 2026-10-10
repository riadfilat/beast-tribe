'use server';

import { revalidatePath } from 'next/cache';
import { userSupabase } from '@/lib/auth';
import { requireLeader } from '@/lib/leader/context';

// Adding and removing supporters. The database checks the rules (invite_to_team, remove_from_team,
// cancel_team_invite: leaders add supporters, HQ adds leaders), so these only pass the request on.

export type InviteState = { ok?: string; error?: string } | undefined;

const ERRORS: Record<string, string> = {
  BAD_EMAIL: 'That email address doesn’t look right.',
  NOT_LEADER: 'Only leaders can add supporters.',
  HQ_ONLY: 'Only Beast Tribe can add leaders.',
};

export async function inviteSupporter(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const ctx = await requireLeader();
  const email = String(formData.get('email') || '').trim();
  const { data, error } = await (await userSupabase()).rpc('invite_to_team', { p_community: ctx.community.id, p_email: email, p_role: 'supporter' });
  if (error) return { error: ERRORS[Object.keys(ERRORS).find((k) => error.message.includes(k)) || ''] || 'Could not add them. Please try again.' };
  revalidatePath('/leader/people');
  return {
    ok:
      data === 'added'
        ? `${email} is now a supporter. They can sign in at beast-tribe.vercel.app with their Beast Tribe account.`
        : `Invite saved. Ask ${email} to sign in at beast-tribe.vercel.app with this email (“Email me a sign-in link”). They become a supporter as soon as they do.`,
  };
}

export async function removeSupporter(userId: string) {
  const ctx = await requireLeader();
  const { error } = await (await userSupabase()).rpc('remove_from_team', { p_community: ctx.community.id, p_user: userId });
  if (error) throw new Error('Could not remove them.');
  revalidatePath('/leader/people');
}

export async function cancelInvite(inviteId: string) {
  await requireLeader();
  const { error } = await (await userSupabase()).rpc('cancel_team_invite', { p_invite: inviteId });
  if (error) throw new Error('Could not cancel the invite.');
  revalidatePath('/leader/people');
}
