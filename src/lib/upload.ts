import { supabase } from './supabase';
import { compressImage } from './imageUtils';

/**
 * Compress a local photo and upload it to Supabase Storage. Returns the public URL.
 * Buckets: 'event-images' (session covers), 'user-uploads' (avatars, post photos;
 * paths must start with the member's id — storage policy).
 */
export async function uploadImage(
  localUri: string,
  bucket: 'event-images' | 'user-uploads',
  path: string,
  kind: 'post' | 'avatar' = 'post',
): Promise<string> {
  const compressed = await compressImage(localUri, kind);
  const res = await fetch(compressed);
  const blob = await res.blob();
  const bytes = new Uint8Array(await new Response(blob).arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
