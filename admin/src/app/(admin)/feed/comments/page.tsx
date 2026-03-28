import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { hideComment, restoreComment } from '../actions';

export default async function CommentsPage() {
  await requireAdmin();
  const db = createAdminClient();

  // Get all comments (including hidden ones for admin)
  const { data: comments } = await db.from('feed_comments')
    .select('*, profile:profiles(full_name, display_name, tier), post:feed_posts(content)')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get reported comments
  const { data: reports } = await db.from('content_reports')
    .select('target_id, reason, details, status')
    .eq('target_table', 'feed_comments')
    .eq('status', 'pending');

  const reportedIds = new Set((reports || []).map((r: any) => r.target_id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Comment Moderation</h1>
      <p className="text-sm text-gray-500 mb-6">{(comments || []).length} recent comments · {reportedIds.size} flagged</p>

      <div className="space-y-2">
        {(comments || []).map((comment: any) => {
          const isHidden = !comment.is_visible;
          const isReported = reportedIds.has(comment.id);
          const action = isHidden
            ? restoreComment.bind(null, comment.id)
            : hideComment.bind(null, comment.id);

          return (
            <div key={comment.id} className={`bg-white rounded-xl border shadow-sm p-4 ${
              isHidden ? 'border-red-100 opacity-60' :
              isReported ? 'border-yellow-200' :
              'border-gray-100'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {comment.profile?.display_name || comment.profile?.full_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {isReported && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Reported</span>
                    )}
                    {isHidden && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                  {comment.post && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      On: &quot;{comment.post.content?.substring(0, 60)}...&quot;
                    </p>
                  )}
                </div>

                <form action={action}>
                  <button
                    type="submit"
                    className={`text-xs px-3 py-1.5 rounded-lg transition ${
                      isHidden
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    {isHidden ? 'Restore' : 'Hide'}
                  </button>
                </form>
              </div>
            </div>
          );
        })}

        {(!comments || comments.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-8">No comments to review</p>
        )}
      </div>
    </div>
  );
}
