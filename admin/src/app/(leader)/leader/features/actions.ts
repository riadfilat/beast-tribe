'use server';

import { revalidatePath } from 'next/cache';
import { userSupabase } from '@/lib/auth';
import { requireLeader } from '@/lib/leader/context';
import { ensureBusiness } from '@/lib/leader/business';
import { FEATURES, type Feature } from '@/lib/leader/features';

/** Switch a feature on or off. The database allows leaders and HQ only (set_community_feature). */
export async function toggleFeature(feature: Feature, on: boolean) {
  const ctx = await requireLeader();
  if (!FEATURES.some((f) => f.key === feature)) throw new Error('Unknown feature');
  // Courts and coaching times belong to the community's business record.
  if (on && (feature === 'courts' || feature === 'coaching')) await ensureBusiness(ctx);
  const { error } = await (await userSupabase()).rpc('set_community_feature', { p_community: ctx.community.id, p_feature: feature, p_on: on });
  if (error) throw new Error('Could not change the feature.');
  revalidatePath('/leader', 'layout');
}
