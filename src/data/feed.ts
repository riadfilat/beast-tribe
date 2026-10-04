import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { useQuery, invalidate } from './query';
import { personOf, PERSON_COLUMNS } from './model';
import { removeStoredImage, uploadImage } from '../lib/upload';
import { PREVIEW, PREVIEW_ME, previewPosts } from './preview';
import type { Person } from '../components/board/people';

export interface Post {
  id: string;
  author: Person;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  beastCount: number;
  beasted: boolean;
  commentCount: number;
  event: { id: string; title: string } | null;
  /** A finished workout shared from Train. */
  workout: { id: string; title: string; titleAr: string | null } | null;
  /** Shown on posts that live in a private community. */
  community: { id: string; name: string; private: boolean } | null;
}

function toPost(r: any, beasted: Set<string>): Post {
  return {
    id: r.id,
    author: personOf(r.author) ?? { id: r.user_id, name: '' },
    content: r.content || '',
    imageUrl: r.image_url || null,
    createdAt: new Date(r.created_at),
    beastCount: r.beast_count?.[0]?.count ?? 0,
    beasted: beasted.has(r.id),
    commentCount: r.comment_count ?? r.comments?.[0]?.count ?? 0,
    event: r.event?.id ? { id: r.event.id, title: r.event.title || '' } : null,
    workout: r.workout?.id ? { id: r.workout.id, title: r.workout.title || '', titleAr: r.workout.title_ar || null } : null,
    community: r.community?.id ? { id: r.community.id, name: r.community.name || '', private: r.community.visibility === 'private' } : null,
  };
}

export function useFeed() {
  const { user } = useAuth();
  const me = PREVIEW ? PREVIEW_ME : user?.id ?? null;
  return useQuery<Post[]>(me ? `feed:${me}` : null, async () => {
    if (PREVIEW) return previewPosts().map((r) => toPost(r, new Set(['post-2'])));
    const [{ data, error }, blocked] = await Promise.all([
      supabase
        .from('feed_posts')
        .select(`id, user_id, content, image_url, created_at, event:events(id, title), workout:workouts(id, title, title_ar), community:communities(id, name, visibility), author:profiles!user_id(${PERSON_COLUMNS}), beast_count:beasts(count)`)
        .eq('is_visible', true)
        .eq('is_hidden', false)
        .neq('image_status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(40),
      supabase.from('blocked_users').select('blocked_id').eq('blocker_id', me!),
    ]);
    if (error) throw error;
    const hidden = new Set((blocked.data || []).map((b: any) => b.blocked_id));
    const rows = (data || []).filter((r: any) => !hidden.has(r.user_id));
    const ids = rows.map((r: any) => r.id);
    let mine = new Set<string>();
    if (ids.length) {
      const { data: b } = await supabase.from('beasts').select('post_id').eq('user_id', me!).in('post_id', ids);
      mine = new Set((b || []).map((x: any) => x.post_id));
    }
    return rows.map((r: any) => toPost(r, mine));
  });
}

export async function toggleBeast(meId: string, postId: string, beasted: boolean) {
  if (PREVIEW) return;
  if (beasted) {
    await supabase.from('beasts').delete().eq('post_id', postId).eq('user_id', meId);
  } else {
    const { error } = await supabase.from('beasts').insert({ post_id: postId, user_id: meId });
    if (error && (error as any).code !== '23505') throw error;
  }
}

export async function createPost(meId: string, input: { content: string; imageUri?: string | null; eventId?: string | null; communityId?: string | null }) {
  if (PREVIEW) return;
  let imageUrl: string | null = null;
  if (input.imageUri) {
    imageUrl = await uploadImage(input.imageUri, 'user-uploads', `${meId}/posts/${Date.now()}.jpg`);
  }
  const { error } = await supabase.from('feed_posts').insert({
    user_id: meId,
    content: input.content.trim(),
    image_url: imageUrl,
    event_id: input.eventId ?? null,
    // A recap lives where its session lives (the database fills it in); otherwise the chosen community.
    community_id: input.eventId ? null : input.communityId ?? null,
    post_type: input.eventId ? 'recap' : 'activity',
    is_visible: true,
  });
  if (error) {
    removeStoredImage(imageUrl);
    throw error;
  }
  invalidate('feed:');
}

export async function deletePost(postId: string) {
  if (PREVIEW) return;
  const { data: before } = await supabase.from('feed_posts').select('image_url').eq('id', postId).maybeSingle();
  const { error } = await supabase.from('feed_posts').delete().eq('id', postId);
  if (error) throw error;
  removeStoredImage(before?.image_url);
  invalidate('feed:');
}

export async function reportPost(meId: string, postId: string, reason: string, details?: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('content_reports').insert({
    reporter_id: meId,
    target_table: 'feed_posts',
    target_id: postId,
    reason,
    details: details?.trim() || null,
  });
  if (error) throw error;
}

export async function blockMember(meId: string, blockedId: string) {
  if (PREVIEW) return;
  const { error } = await supabase.from('blocked_users').insert({ blocker_id: meId, blocked_id: blockedId });
  if (error && (error as any).code !== '23505') throw error;
  invalidate('feed:');
}
