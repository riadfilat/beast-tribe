'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function parseSports(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function createLocation(formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const name = (formData.get('name') as string)?.trim();
  const city = (formData.get('city') as string)?.trim();
  const country = ((formData.get('country') as string) || 'SA').trim();
  const description = ((formData.get('description') as string) || '').trim() || null;
  const image_url = ((formData.get('image_url') as string) || '').trim() || null;
  const address = ((formData.get('address') as string) || '').trim() || null;
  const sportsRaw = (formData.get('sports') as string) || '';
  const sports = parseSports(sportsRaw);
  const sortOrderRaw = formData.get('sort_order') as string;
  const sort_order = sortOrderRaw ? parseInt(sortOrderRaw, 10) : 0;
  const is_active = formData.get('is_active') !== 'off';

  if (!name || !city) throw new Error('Name and city are required');

  const { error } = await db.from('popular_locations').insert({
    name,
    city,
    country,
    description,
    image_url,
    address,
    sports,
    sort_order: isNaN(sort_order) ? 0 : sort_order,
    is_active,
  });
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'create_location',
    target_table: 'popular_locations',
    details: { name, city, country },
  });

  revalidatePath('/locations');
  redirect('/locations');
}

export async function updateLocation(locationId: string, formData: FormData) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const updates: Record<string, any> = {};
  const name = (formData.get('name') as string)?.trim();
  const city = (formData.get('city') as string)?.trim();
  if (!name || !city) throw new Error('Name and city are required');

  updates.name = name;
  updates.city = city;
  updates.country = ((formData.get('country') as string) || 'SA').trim();
  updates.description = ((formData.get('description') as string) || '').trim() || null;
  updates.image_url = ((formData.get('image_url') as string) || '').trim() || null;
  updates.address = ((formData.get('address') as string) || '').trim() || null;
  updates.sports = parseSports((formData.get('sports') as string) || '');
  const sortOrderRaw = formData.get('sort_order') as string;
  updates.sort_order = sortOrderRaw ? parseInt(sortOrderRaw, 10) : 0;
  if (isNaN(updates.sort_order)) updates.sort_order = 0;
  updates.is_active = formData.get('is_active') !== 'off';

  const { error } = await db.from('popular_locations').update(updates).eq('id', locationId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'update_location',
    target_table: 'popular_locations',
    target_id: locationId,
    details: { name, city },
  });

  revalidatePath('/locations');
  redirect('/locations');
}

export async function deleteLocation(locationId: string) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db.from('popular_locations').delete().eq('id', locationId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'delete_location',
    target_table: 'popular_locations',
    target_id: locationId,
  });

  revalidatePath('/locations');
  redirect('/locations');
}

export async function toggleLocationActive(locationId: string, isActive: boolean) {
  const admin = await requireAdmin();
  const db = createAdminClient();

  const { error } = await db.from('popular_locations').update({ is_active: isActive }).eq('id', locationId);
  if (error) throw new Error(error.message);

  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: isActive ? 'activate_location' : 'deactivate_location',
    target_table: 'popular_locations',
    target_id: locationId,
  });

  revalidatePath('/locations');
}
