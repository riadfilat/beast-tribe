import { createAdminClient } from './supabase-server';

/**
 * Add each row's person (full_name, display_name) as `row[as]`, read by `row[key]`. For tables whose
 * user column points at the sign-in table rather than profiles (partners, feed_comments), where the
 * database can't join them in one query.
 */
export async function attachProfiles<T extends Record<string, any>>(rows: T[], key = 'user_id', as = 'profile'): Promise<T[]> {
  const ids = [...new Set(rows.map((r) => r[key]).filter(Boolean))] as string[];
  if (!ids.length) return rows;
  const { data } = await createAdminClient().from('profiles').select('id, full_name, display_name').in('id', ids);
  const byId = new Map(((data || []) as any[]).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, [as]: byId.get(r[key]) ?? null }));
}
