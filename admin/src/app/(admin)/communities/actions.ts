'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { GLYPH_IDS, PATCH_PAINT } from '@/components/brand/PackPatch';

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
  const visibility = formData.get('visibility') === 'open' ? 'open' : 'private';
  const kindRaw = (formData.get('kind') as string) || 'club';
  const kind = ['club', 'gym', 'company', 'compound', 'city', 'brand'].includes(kindRaw) ? kindRaw : 'club';
  const seats = parseInt((formData.get('seat_limit') as string) || '', 10);
  const seat_limit = Number.isFinite(seats) && seats > 0 ? seats : null;
  const ends = ((formData.get('contract_ends_at') as string) || '').trim();
  const contract_ends_at = ends ? new Date(`${ends}T23:59:59`).toISOString() : null;

  if (!name) throw new Error('Name is required');
  if (!slug) throw new Error('Slug is required');

  return { name, slug, description, logo_url, cover_url, country, city, is_active, visibility, kind, seat_limit, contract_ends_at };
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
 *   - new pack: pass formData with name, emblem_value (glyph), emblem_color, description (creates a new pack scoped to community + sets is_community_default)
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
    const glyph = ((formData.get('emblem_value') as string) || 'wolf').trim();
    const color = ((formData.get('emblem_color') as string) || 'slate').trim();
    const description = ((formData.get('description') as string) || '').trim() || null;
    if (!name) throw new Error('Pack name is required');
    if (!GLYPH_IDS.includes(glyph)) throw new Error('Invalid patch');
    if (!PATCH_PAINT[color]) throw new Error('Invalid colour');

    const { data: created, error } = await db
      .from('packs')
      .insert({
        name,
        animal: glyph,
        emblem_kind: 'glyph',
        emblem_value: glyph,
        emblem_color: color,
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

  // Members can be in several communities; remove just this one.
  const { error } = await db.from('community_members').delete().eq('community_id', communityId).eq('user_id', userId);
  if (error) throw new Error(error.message);
  await db.from('profiles').update({ community_id: null }).eq('id', userId).eq('community_id', communityId);

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

/** Issue a new invite code for a private community (the old one stops working). */
export async function regenerateJoinCode(communityId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();
  // The communities trigger fills in a fresh code when it is cleared.
  const { error } = await db.from('communities').update({ join_code: null }).eq('id', communityId);
  if (error) throw new Error(error.message);
  await db.from('admin_audit_log').insert({ admin_user_id: admin.id, action: 'regenerate_join_code', target_table: 'communities', target_id: communityId });
  revalidatePath(`/communities/${communityId}`);
}
