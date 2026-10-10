import { createAdminClient } from '../supabase-server';
import type { LeaderCtx } from './context';

// A community's business record: courts, coaching times and the plan hang off it (partners table).
// Communities set up by HQ may not have one yet; it is made the first time a feature needs it.

const slugify = (raw: string) => raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'community';

export async function ensureBusiness(ctx: LeaderCtx): Promise<string> {
  if (ctx.businessId) return ctx.businessId;
  const db = createAdminClient();
  const { data: existing } = await db.from('partners').select('id').eq('community_id', ctx.community.id).neq('partner_type', 'coach').eq('is_active', true).limit(1).maybeSingle();
  if (existing) return (existing as any).id;
  const name = ctx.community.name;
  const { data, error } = await db
    .from('partners')
    .insert({
      name,
      business_name: name,
      slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
      // `type` is an old fixed list without 'leader'; partner_type is the one the app reads.
      type: 'other',
      partner_type: 'leader',
      status: 'active',
      is_active: true,
      is_verified: true,
      city: ctx.community.city,
      community_id: ctx.community.id,
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (data as any).id;
}
