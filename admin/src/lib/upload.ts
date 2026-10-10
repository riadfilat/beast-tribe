import { createAdminClient } from './supabase-server';

/** A photo from a form (JPG, PNG or WebP, up to 5 MB) stored publicly; returns its address, or null when none was chosen. */
export async function uploadPublicImage(file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!file || typeof file === 'string' || !file.size) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error('The photo is over 5 MB');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use a JPG, PNG or WebP photo');
  const db = createAdminClient();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from('location-images').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error(error.message);
  return db.storage.from('location-images').getPublicUrl(path).data.publicUrl;
}
