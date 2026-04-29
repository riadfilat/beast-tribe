'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const ANIMALS = ['Wolf', 'Eagle', 'Tiger', 'Rhino'];

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readCommunityFields(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  let slug = ((formData.get('slug') as string) || '').trim();
  if (!slug && name) slug = slugify(name);
  const description = ((formData.get('description') as string) || '').trim() || null;
  const logo_url = ((formData.get('logo_url') as string) || '').trim() || null;
  const cover_url = ((formData.get('cover_url') as string) || '').trim() || null;
  const country = ((formData.get('country') as string) || 'SA').trim();
  const city = ((formData.get('city') as string) || '').trim() || null;
  const is_active = formData.get('is_active') !== 'off' && formData.get('is_active') !== null;

  if (!name) throw new Error('Name is required');
  if (!slug) throw new Error('Slug is required');

  return { name, slug, description, logo_url, cover_url, country, city, is_active };
}

export async function createCommunity(formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const fields = readCommunityFields(formData);

  const { data: created, error } = await db
    .from('communities')
    .insert(fields)
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_community',
    target_table: 'communities',
    target_id: created?.id,
    details: { name: fields.name, slug: fields.slug },
  });

  revalidatePath('/communities');
  redirect(`/communities/${created!.id}`);
}

export async function updateCommunity(communityId: string, formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const fields = readCommunityFields(formData);

  const { error } = await db
    .from('communities')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', communityId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'update_community',
    target_table: 'communities',
    target_id: communityId,
    details: { name: fields.name, slug: fields.slug },
  });

  revalidatePath('/communities');
  revalidatePath(`/communities/${communityId}`);
}

export async function deleteCommunity(communityId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db.from('communities').delete().eq('id', communityId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'delete_community',
    target_table: 'communities',
    target_id: communityId,
  });

  revalidatePath('/communities');
  redirect('/communities');
}

export async function assignUserToCommunity(userId: string, communityId: string | null) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db
    .from('profiles')
    .update({ community_id: communityId })
    .eq('id', userId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: communityId ? 'assign_user_to_community' : 'remove_user_from_community',
    target_table: 'profiles',
    target_id: userId,
    details: { community_id: communityId },
  });

  revalidatePath(`/users/${userId}`);
  if (communityId) revalidatePath(`/communities/${communityId}`);
}

/**
 * Adds a default pack for a community. Two modes:
 *   - existing pack: pass packId via formData "pack_id"
 *   - new pack: pass formData with name, animal, description (creates a new pack scoped to community + sets is_community_default)
 */
export async function addCommunityDefaultPack(communityId: string, formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const existingPackId = ((formData.get('pack_id') as string) || '').trim();

  let targetPackId: string;

  if (existingPackId) {
    // Mark existing pack as a community default + scope to this community
    const { error } = await db
      .from('packs')
      .update({ community_id: communityId, is_community_default: true })
      .eq('id', existingPackId);
    if (error) throw new Error(error.message);
    targetPackId = existingPackId;
  } else {
    const name = ((formData.get('name') as string) || '').trim();
    const animal = ((formData.get('animal') as string) || 'Wolf').trim();
    const description = ((formData.get('description') as string) || '').trim() || null;
    if (!name) throw new Error('Pack name is required');
    if (!ANIMALS.includes(animal)) throw new Error('Invalid animal');

    const { data: created, error } = await db
      .from('packs')
      .insert({
        name,
        animal,
        description,
        community_id: communityId,
        is_community_default: true,
        is_system: false,
        created_by: admin.id,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    targetPackId = created!.id;
  }

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'add_community_default_pack',
    target_table: 'packs',
    target_id: targetPackId,
    details: { community_id: communityId },
  });

  revalidatePath(`/communities/${communityId}`);
}

export async function removeCommunityDefaultPack(communityId: string, packId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db
    .from('packs')
    .update({ is_community_default: false })
    .eq('id', packId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'remove_community_default_pack',
    target_table: 'packs',
    target_id: packId,
    details: { community_id: communityId },
  });

  revalidatePath(`/communities/${communityId}`);
}

export async function removeUserFromCommunity(userId: string, communityId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db
    .from('profiles')
    .update({ community_id: null })
    .eq('id', userId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'remove_user_from_community',
    target_table: 'profiles',
    target_id: userId,
    details: { community_id: communityId },
  });

  revalidatePath(`/communities/${communityId}`);
  revalidatePath(`/users/${userId}`);
}
