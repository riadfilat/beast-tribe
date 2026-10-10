'use server';

import { createAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { parseOrder, parsePin, parseSports, venueContact } from './fields';

export type PlaceState = { error?: string } | undefined;

const text = (fd: FormData, key: string) => ((fd.get(key) as string) || '').trim();

/**
 * Uploads the chosen photo to the location-images bucket and returns its public address,
 * or null when no photo was chosen.
 */
async function uploadPhoto(fd: FormData): Promise<string | null> {
  const file = fd.get('image_file');
  if (!file || typeof file === 'string') return null;
  // Browsers send an empty file when nothing was picked
  if (!file.size) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error('That photo is too big. The limit is 5 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Photos must be JPG, PNG or WebP.');

  const db = createAdminClient();
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage
    .from('location-images')
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) throw new Error(`The photo didn't upload: ${error.message}`);
  return db.storage.from('location-images').getPublicUrl(path).data.publicUrl;
}

/** The photo to keep: a new upload first, then "remove", then a pasted link, then the one it had. */
async function pickPhoto(fd: FormData): Promise<string | null> {
  const uploaded = await uploadPhoto(fd);
  if (uploaded) return uploaded;
  if (fd.get('remove_photo') === 'on') return null;
  return text(fd, 'image_url') || text(fd, 'existing_image_url') || null;
}

/** Everything the form sends, checked. Throws a plain-English message when something is wrong. */
async function readPlace(fd: FormData) {
  const name = text(fd, 'name');
  const city = text(fd, 'city');
  if (!name || !city) throw new Error('A place needs a name and a city.');
  const pin = parsePin(text(fd, 'pin'));
  if (typeof pin === 'string') throw new Error(pin);
  return {
    name,
    name_ar: text(fd, 'name_ar') || null,
    city,
    country: text(fd, 'country') || 'SA',
    description: text(fd, 'description') || null,
    address: text(fd, 'address') || null,
    ...venueContact(text(fd, 'phone'), text(fd, 'booking_url')),
    latitude: pin ? pin.lat : null,
    longitude: pin ? pin.lng : null,
    sports: parseSports(fd.getAll('sports').map(String)),
    sort_order: parseOrder(text(fd, 'sort_order')),
    is_active: fd.get('is_active') === 'on',
    community_id: text(fd, 'community_id') || null,
    image_url: await pickPhoto(fd),
  };
}

/** Adds a place (id null) or saves changes to one. Back to the list on success. */
export async function savePlace(id: string | null, _prev: PlaceState, fd: FormData): Promise<PlaceState> {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  try {
    const row = await readPlace(fd);
    const { error } = id
      ? await db.from('popular_locations').update(row).eq('id', id)
      : await db.from('popular_locations').insert(row);
    if (error) {
      if (error.code === '23505') return { error: `There is already a place called "${row.name}" in ${row.city}.` };
      return { error: error.message };
    }
    await db.from('admin_audit_log').insert({
      admin_user_id: admin.id,
      action: id ? 'update_location' : 'create_location',
      target_table: 'popular_locations',
      ...(id ? { target_id: id } : {}),
      details: { name: row.name, city: row.city, country: row.country },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong. Try again.' };
  }
  revalidatePath('/hq/places');
  redirect('/hq/places?saved=1');
}

/** Shows or hides a place in the app without opening it. */
export async function setPlaceShown(id: string, shown: boolean) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const { error } = await db.from('popular_locations').update({ is_active: shown }).eq('id', id);
  if (error) throw new Error(error.message);
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'update_location',
    target_table: 'popular_locations',
    target_id: id,
    details: { is_active: shown },
  });
  revalidatePath('/hq/places');
  revalidatePath(`/hq/places/${id}`);
}

export async function deletePlace(id: string) {
  const admin = await requireRole('admin');
  const db = createAdminClient();
  const { error } = await db.from('popular_locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await db.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'delete_location',
    target_table: 'popular_locations',
    target_id: id,
  });
  revalidatePath('/hq/places');
  redirect('/hq/places?deleted=1');
}
