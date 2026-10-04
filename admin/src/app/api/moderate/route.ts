import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase-server';
import { checkPhoto, moderationSecret, removeStoredFile } from '@/lib/moderation';

// Called by the database (bt_check_image) for every newly uploaded photo. Not for browsers:
// the shared secret in app_settings 'moderation' must match.
export const runtime = 'nodejs';
export const maxDuration = 30;

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req: Request) {
  const secret = await moderationSecret();
  const given = req.headers.get('x-bt-secret') || '';
  if (!secret || !same(given, secret)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await req.json().catch(() => ({ id: null }));
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const db = createAdminClient();
  const { data: row } = await db.from('image_moderation_queue').select('id, image_url, status').eq('id', id).maybeSingle();
  if (!row || row.status !== 'pending' || !row.image_url) return NextResponse.json({ ok: true, skipped: true });

  let result;
  try {
    result = await checkPhoto(row.image_url);
  } catch (e: any) {
    // Stays pending: an admin sees it in Moderation.
    await db.from('image_moderation_queue').update({ auto_scan_result: { error: String(e?.message || e) } }).eq('id', id);
    return NextResponse.json({ ok: true, queued: true });
  }
  if (!result) return NextResponse.json({ ok: true, queued: true }); // no key yet: a person reviews it

  if (result.verdict === 'block') {
    await db.rpc('bt_take_down_image', { p_queue: id, p_reason: result.reason || result.categories.join(', '), p_result: result, p_by: null });
    await removeStoredFile(row.image_url).catch(() => {});
    return NextResponse.json({ ok: true, verdict: 'block' });
  }
  await db
    .from('image_moderation_queue')
    .update({
      status: result.verdict === 'allow' ? 'auto_approved' : 'pending',
      auto_scan_result: result,
      auto_scan_score: result.verdict === 'allow' ? 0 : 0.5,
      reviewed_at: result.verdict === 'allow' ? new Date().toISOString() : null,
    })
    .eq('id', id);
  return NextResponse.json({ ok: true, verdict: result.verdict });
}
