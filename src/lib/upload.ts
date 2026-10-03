import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

/**
 * Compress a local photo and upload it to Supabase Storage. Returns the public URL.
 * Buckets: 'event-images' (session covers), 'user-uploads' (avatars, post photos;
 * paths must start with the member's id — storage policy).
 *
 * The photo is resized and re-encoded as JPEG with its bytes returned as base64, decoded here in
 * plain JS. (Reading a local file through fetch → blob → ArrayBuffer is unreliable on iOS, which
 * is why uploads used to fail.)
 */
const SIZE = { avatar: { width: 512, quality: 0.75 }, post: { width: 1080, quality: 0.75 } } as const;

export async function uploadImage(
  localUri: string,
  bucket: 'event-images' | 'user-uploads',
  path: string,
  kind: 'post' | 'avatar' = 'post',
): Promise<string> {
  const bytes = await jpegBytes(localUri, kind);
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function jpegBytes(uri: string, kind: 'post' | 'avatar'): Promise<Uint8Array> {
  try {
    const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: SIZE[kind].width } }], {
      compress: SIZE[kind].quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (out.base64) return base64ToBytes(out.base64);
  } catch {
    // fall through to reading the file as it is (web, or a format the manipulator can't read)
  }
  const res = await fetch(uri);
  return new Uint8Array(await res.arrayBuffer());
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = (() => {
  const t = new Uint8Array(128);
  for (let i = 0; i < ALPHABET.length; i++) t[ALPHABET.charCodeAt(i)] = i;
  return t;
})();

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const n = clean.length;
  const out = new Uint8Array(Math.floor((n * 3) / 4));
  let o = 0;
  for (let i = 0; i < n; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)];
    const b = LOOKUP[clean.charCodeAt(i + 1)];
    const c = i + 2 < n ? LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const d = i + 3 < n ? LOOKUP[clean.charCodeAt(i + 3)] : 0;
    out[o++] = (a << 2) | (b >> 4);
    if (i + 2 < n) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < n) out[o++] = ((c & 3) << 6) | d;
  }
  return out.subarray(0, o);
}
