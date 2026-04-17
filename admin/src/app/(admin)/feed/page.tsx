import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';

export const revalidate = 0;
import { hidePost } from './actions';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmSubmit';

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { page?: string; show_hidden?: string };
}) {
  await requireAdmin();
  const db = createAdminClient();

  const page = parseInt(searchParams.page || '1');
  const perPage = 20;
  const offset = (page - 1) * perPage;
  const showHidden = searchParams.show_hidden === '1';

  let query = db.from('feed_posts')
    .select('*, profile:profiles(full_name, display_name, tier), sport:sports(name, emoji), beast_count:beasts(count)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (!showHidden) {
    query = query.eq('is_hidden', false);
  }

  const { data: posts, count } = await query;

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feed Management</h1>
          <p className="text-sm text-gray-500">{(count || 0).toLocaleString()} total posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={showHidden ? '/feed' : '/feed?show_hidden=1'}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            {showHidden ? 'Hide hidden' : 'Show hidden'}
          </Link>
          <Link href="/feed/comments" className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Manage Comments
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {(posts || []).map((post: any) => {
          const beasts = post.beast_count?.[0]?.count || 0;
          const removeAction = hidePost.bind(null, post.id);

          return (
            <div key={post.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Author */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      post.profile?.tier === 'untamed' ? 'bg-yellow-100 text-yellow-700' :
                      post.profile?.tier === 'forged' ? 'bg-cyan-100 text-cyan-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {post.profile?.tier}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {post.profile?.display_name || post.profile?.full_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700 mb-2">{post.content}</p>

                  {/* Image if any */}
                  {post.image_url && (
                    <div className="mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        post.image_status === 'approved' ? 'bg-green-100 text-green-700' :
                        post.image_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        Image: {post.image_status}
                      </span>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {post.sport && <span>{post.sport.emoji} {post.sport.name}</span>}
                    <span>🐺 {beasts} beasts</span>
                    <span>{post.post_type}</span>
                  </div>
                </div>

                {/* Actions */}
                <form action={removeAction}>
                  <ConfirmButton
                    confirmMessage="Hide this post?"
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                  >
                    {post.is_hidden ? 'Hidden' : 'Hide'}
                  </ConfirmButton>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <span className="px-3 py-1.5 text-sm text-gray-500">Page {page} of {totalPages}</span>
        </div>
      )}
    </div>
  );
}
