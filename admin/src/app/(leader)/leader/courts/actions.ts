'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase-server';
import { userSupabase } from '@/lib/auth';
import { requireLeader } from '@/lib/leader/context';
import { ensureBusiness } from '@/lib/leader/business';
import { readCourt } from '@/lib/leader/courts';
import { uploadPublicImage } from '@/lib/upload';

// Courts belong to the community's business record. Leaders only (supporters never see prices).

export type CourtState = { error?: string } | undefined;

async function courtsCtx() {
  const ctx = await requireLeader();
  if (!ctx.features.has('courts')) redirect('/leader/features');
  return { ctx, businessId: await ensureBusiness(ctx) };
}

export async function saveCourt(courtId: string | null, _prev: CourtState, formData: FormData): Promise<CourtState> {
  const { ctx, businessId } = await courtsCtx();
  let row: Record<string, any>;
  try {
    row = { ...readCourt(formData, ctx.community.id), city: ctx.community.city };
    const image = await uploadPublicImage(formData.get('image'), 'facilities');
    if (image) row.image_url = image;
  } catch (e: any) {
    return { error: e.message };
  }
  const db = createAdminClient();
  const { error } = courtId
    ? await db.from('facilities').update(row).eq('id', courtId).eq('partner_id', businessId)
    : await db.from('facilities').insert({ ...row, sports: [row.sport], partner_id: businessId, is_active: true, bookable: true });
  if (error) return { error: 'Could not save the court. Please try again.' };
  revalidatePath('/leader/courts');
  redirect('/leader/courts?saved=1');
}

/** Hide a court from the app (bookings already made stay) or show it again. */
export async function setCourtActive(courtId: string, active: boolean) {
  const { businessId } = await courtsCtx();
  await createAdminClient().from('facilities').update({ is_active: active }).eq('id', courtId).eq('partner_id', businessId);
  revalidatePath('/leader/courts');
}

/** Tick that a player paid their court share at the venue (the database allows the court's leaders). */
export async function tickCourtPaid(eventId: string, userId: string, paid: boolean) {
  await courtsCtx();
  const { error } = await (await userSupabase()).rpc('set_player_paid', { p_event: eventId, p_user: userId, p_paid: paid });
  if (error) throw new Error('Could not change the payment.');
  revalidatePath('/leader/courts');
  revalidatePath('/leader');
}
