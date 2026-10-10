import { cache } from 'react';
import { createAdminClient } from './supabase-server';

// Photo checks. The database queues every photo our members upload and calls /api/moderate.
// Claude looks at the photo and returns allow / review / block. Blocked photos come down at once
// (bt_take_down_image); "review" waits for a person in HQ → Safety. Without ANTHROPIC_API_KEY every
// photo waits for an admin.

const MODEL = process.env.MODERATION_MODEL || 'claude-haiku-4-5-20251001';

export type Verdict = 'allow' | 'review' | 'block';
export interface CheckResult {
  verdict: Verdict;
  categories: string[];
  reason: string;
  model: string;
}

const RULES = `You check photos uploaded to Beast Tribe, a community sports app in Saudi Arabia used by adults, teenagers, families and companies.
Return ONLY JSON: {"verdict":"allow"|"review"|"block","categories":[...],"reason":"one short sentence"}.

block — never allowed:
- nudity: exposed genitals, exposed female breasts or nipples, exposed buttocks, see-through clothing showing these
- sexual: sexual acts, sexually suggestive poses or focus on private areas, sexual gestures, pornographic or fetish material
- minors_sexual: any sexualised image of someone who may be under 18 (always block)
- gore: graphic violence, serious injuries, blood, dead bodies
- hate: hate symbols or slogans, extremist or terrorist content
- self_harm: self-harm or suicide imagery
- drugs: drug use or drug paraphernalia shown approvingly

review — a person should look:
- revealing: underwear, swimwear, shirtless poses or very revealing clothing outside a normal sports setting
- weapons: firearms or knives (outside an obvious sport like archery or fencing)
- alcohol, smoking or vaping
- offensive: rude gestures, insults, profanity in text on the image
- unclear: you cannot tell what the image shows

allow — everything ordinary: people training or playing sport in normal sportswear (including women's sportswear and men in sports shorts), groups, courts, gyms, food, places, scenery, screenshots of workouts, logos and patches.
When in doubt between allow and review, choose review. When in doubt between review and block for nudity or sexual content, choose block.`;

// Only photos in our own Supabase storage, in the buckets the app uploads to, are ever fetched or
// removed. Anything else is refused: no fetching other hosts (SSRF), no deleting files by a crafted URL.
const BUCKETS = ['user-uploads', 'event-images', 'location-images'];
const MAX_BYTES = 4.5 * 1024 * 1024;

/** Bucket and path of one of our public storage URLs, or null for anything else. */
export function storedFile(imageUrl: string): { bucket: string; path: string } | null {
  let u: URL;
  try {
    u = new URL(imageUrl);
  } catch {
    return null;
  }
  const own = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
  if (u.origin !== own || u.search || u.hash) return null;
  const m = u.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m || !BUCKETS.includes(m[1])) return null;
  const path = decodeURIComponent(m[2]);
  if (path.split('/').some((seg) => seg === '..' || seg === '')) return null;
  return { bucket: m[1], path };
}

export async function checkPhoto(imageUrl: string): Promise<CheckResult | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!storedFile(imageUrl)) return { verdict: 'review', categories: ['unclear'], reason: 'Not a photo from Beast Tribe storage.', model: MODEL };
  const img = await fetch(imageUrl, { redirect: 'error' });
  if (!img.ok) throw new Error(`image ${img.status}`);
  const type = (img.headers.get('content-type') || 'image/jpeg').split(';')[0];
  const tooLarge = { verdict: 'review' as Verdict, categories: ['unclear'], reason: 'Image too large to check automatically.', model: MODEL };
  if (Number(img.headers.get('content-length') || 0) > MAX_BYTES) return tooLarge;
  const buf = Buffer.from(await img.arrayBuffer());
  if (buf.length > MAX_BYTES) return tooLarge;
  const media = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type) ? type : 'image/jpeg';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      system: RULES,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: media, data: buf.toString('base64') } },
            { type: 'text', text: 'Check this photo. JSON only.' },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`claude ${res.status}`);
  const data = await res.json();
  const text: string = (data.content || []).map((c: any) => c.text || '').join('');
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { verdict: 'review', categories: ['unclear'], reason: 'No clear answer from the check.', model: MODEL };
  const out = JSON.parse(json);
  const verdict: Verdict = out.verdict === 'block' ? 'block' : out.verdict === 'allow' ? 'allow' : 'review';
  return { verdict, categories: Array.isArray(out.categories) ? out.categories.slice(0, 6).map(String) : [], reason: String(out.reason || '').slice(0, 300), model: MODEL };
}

/** Remove the file from our storage. Anything that isn't one of our public storage URLs is left alone. */
export async function removeStoredFile(imageUrl: string) {
  const f = storedFile(imageUrl);
  if (!f) return;
  await createAdminClient().storage.from(f.bucket).remove([f.path]);
}

let cachedSecret: string | null = null;
export async function moderationSecret(): Promise<string | null> {
  if (cachedSecret) return cachedSecret;
  const db = createAdminClient();
  const { data } = await db.from('app_settings').select('value').eq('key', 'moderation').maybeSingle();
  cachedSecret = (data?.value as any)?.secret || null;
  return cachedSecret;
}

/** Photos waiting for an admin. Cached so the layout and the dashboard share one count per request. */
export const pendingModerationCount = cache(async (): Promise<number> => {
  const { count } = await createAdminClient()
    .from('image_moderation_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count || 0;
});
