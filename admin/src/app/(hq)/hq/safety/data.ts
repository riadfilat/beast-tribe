import { attachProfiles } from '@/lib/profiles';
import { createAdminClient } from '@/lib/supabase-server';
import { pendingModerationCount } from '@/lib/moderation';

// Everything the Safety page reads. Pages display; these decide what is loaded.

export type Person = { full_name: string | null; display_name: string | null } | null;
export const nameOf = (p: Person, fallback = 'Unknown') => p?.display_name || p?.full_name || fallback;

export async function loadCounts() {
  const db = createAdminClient();
  const [{ count: reports }, photos] = await Promise.all([
    db.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    pendingModerationCount(),
  ]);
  return { reports: reports || 0, photos };
}

export interface ReportTarget {
  kind: 'post' | 'comment' | 'person' | 'other';
  text: string | null;
  author: string | null;
  authorId: string | null;
  image: string | null;
  hidden: boolean;
  gone: boolean;
}

/** Open member reports, newest first, each with a short look at what was reported. */
export async function loadReports() {
  const db = createAdminClient();
  const { data } = await db.from('content_reports')
    .select('id, target_table, target_id, reason, details, created_at, reporter:profiles!reporter_id(full_name, display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);
  const reports = (data || []) as any[];
  const ids = (t: string) => reports.filter((r) => r.target_table === t).map((r) => r.target_id);
  const [posts, comments, people] = await Promise.all([
    ids('feed_posts').length ? db.from('feed_posts').select('id, user_id, content, image_url, is_hidden, profile:profiles(full_name, display_name)').in('id', ids('feed_posts')) : { data: [] },
    // feed_comments.user_id points at sign-ins, not profiles: names are looked up separately.
    ids('feed_comments').length ? db.from('feed_comments').select('id, user_id, content, status').in('id', ids('feed_comments')).then(async (x) => ({ data: await attachProfiles((x.data || []) as any[]) })) : { data: [] },
    ids('profiles').length ? db.from('profiles').select('id, full_name, display_name').in('id', ids('profiles')) : { data: [] },
  ]);
  const find = (rows: any[] | null, id: string) => (rows || []).find((x) => x.id === id);
  return reports.map((r) => {
    let target: ReportTarget = { kind: 'other', text: null, author: null, authorId: null, image: null, hidden: false, gone: false };
    if (r.target_table === 'feed_posts') {
      const p = find(posts.data, r.target_id);
      target = { kind: 'post', text: p?.content ?? null, author: p ? nameOf(p.profile) : null, authorId: p?.user_id ?? null, image: p?.image_url ?? null, hidden: !!p?.is_hidden, gone: !p };
    } else if (r.target_table === 'feed_comments') {
      const c = find(comments.data, r.target_id);
      target = { kind: 'comment', text: c?.content ?? null, author: c ? nameOf(c.profile) : null, authorId: c?.user_id ?? null, image: null, hidden: c?.status === 'hidden' || c?.status === 'deleted', gone: !c };
    } else if (r.target_table === 'profiles') {
      const p = find(people.data, r.target_id);
      target = { kind: 'person', text: null, author: p ? nameOf(p) : null, authorId: r.target_id, image: null, hidden: false, gone: !p };
    }
    return { id: r.id as string, table: r.target_table as string, targetId: r.target_id as string, reason: r.reason as string, details: r.details as string | null, created_at: r.created_at as string, reporter: nameOf(r.reporter), target };
  });
}
export type Report = Awaited<ReturnType<typeof loadReports>>[number];

/** Photos waiting for a person, oldest first, and the last 20 that were checked. */
export async function loadPhotos() {
  const db = createAdminClient();
  const [{ data: pending }, { data: recent }] = await Promise.all([
    db.from('image_moderation_queue')
      .select('*, uploader:profiles!uploaded_by(full_name, display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    db.from('image_moderation_queue')
      .select('*, uploader:profiles!uploaded_by(full_name, display_name), reviewer:profiles!reviewed_by(full_name)')
      .in('status', ['approved', 'rejected', 'auto_approved', 'auto_rejected'])
      .order('reviewed_at', { ascending: false })
      .limit(20),
  ]);
  return { pending: (pending || []) as any[], recent: (recent || []) as any[] };
}

export const PER_PAGE = 20;

/** One page of feed posts: live ones by default, or only hidden ones. */
export async function loadPosts(page: number, hidden: boolean) {
  const db = createAdminClient();
  const from = (page - 1) * PER_PAGE;
  const { data, count } = await db.from('feed_posts')
    .select('id, user_id, content, image_url, image_status, is_hidden, post_type, created_at, profile:profiles(full_name, display_name), sport:sports(name, emoji), beast_count:beasts(count)', { count: 'exact' })
    .eq('is_hidden', hidden)
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1);
  return { posts: (data || []) as any[], total: count || 0 };
}

/** The 50 newest comments (hidden ones included), with the ones members reported marked. */
export async function loadComments() {
  const db = createAdminClient();
  const [{ data: comments }, { data: reports }] = await Promise.all([
    db.from('feed_comments')
      .select('id, user_id, content, status, created_at, post:feed_posts(content)')
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('content_reports').select('target_id').eq('target_table', 'feed_comments').eq('status', 'pending'),
  ]);
  const reported = new Set((reports || []).map((r: any) => r.target_id as string));
  return { comments: await attachProfiles((comments || []) as any[]), reported };
}
