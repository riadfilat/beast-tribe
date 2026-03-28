import { createAdminClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/auth';
import { approveImage, rejectImage } from './actions';

export const revalidate = 0;

export default async function ModerationPage() {
  await requireAdmin();
  const db = createAdminClient();

  // Get pending items first, then recently reviewed
  const { data: pendingItems } = await db.from('image_moderation_queue')
    .select('*, uploader:profiles!uploaded_by(full_name, display_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { data: recentItems } = await db.from('image_moderation_queue')
    .select('*, uploader:profiles!uploaded_by(full_name, display_name), reviewer:profiles!reviewed_by(full_name)')
    .in('status', ['approved', 'rejected', 'auto_approved', 'auto_rejected'])
    .order('reviewed_at', { ascending: false })
    .limit(20);

  // Content reports
  const { data: reports, count: reportCount } = await db.from('content_reports')
    .select('*, reporter:profiles!reporter_id(full_name, display_name)', { count: 'exact' })
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10);

  const pending = pendingItems || [];
  const recent = recentItems || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Content Moderation</h1>
      <p className="text-sm text-gray-500 mb-6">
        {pending.length} images pending review · {reportCount || 0} user reports
      </p>

      {/* Pending Queue */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((item: any) => {
              const approveAction = approveImage.bind(null, item.id);
              const rejectAction = rejectImage.bind(null, item.id);

              return (
                <div key={item.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
                  {/* Image preview */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt="Pending review"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No preview</span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-800">
                      {item.uploader?.display_name || item.uploader?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400 mb-1">
                      {item.source_table} · {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    {/* Auto scan result */}
                    {item.auto_scan_score !== null && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">AI Score:</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            item.auto_scan_score > 0.7 ? 'bg-red-100 text-red-700' :
                            item.auto_scan_score > 0.3 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {(item.auto_scan_score * 100).toFixed(0)}% flagged
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <form action={approveAction} className="flex-1">
                        <button type="submit" className="w-full py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition">
                          ✓ Approve
                        </button>
                      </form>
                      <form action={rejectAction} className="flex-1">
                        <button type="submit" className="w-full py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">
                          ✕ Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center mb-8">
          <p className="text-green-700 font-medium">All clear! No images pending review.</p>
        </div>
      )}

      {/* User Reports */}
      {(reports || []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">User Reports</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {reports!.map((report: any) => (
              <div key={report.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${
                    report.reason === 'nudity' ? 'bg-red-100 text-red-700' :
                    report.reason === 'harassment' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {report.reason}
                  </span>
                  <span className="text-sm text-gray-700">{report.target_table} #{report.target_id.slice(0, 8)}</span>
                  {report.details && <p className="text-xs text-gray-400 mt-0.5">{report.details}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  by {report.reporter?.display_name || report.reporter?.full_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Reviewed */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recently Reviewed</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {recent.map((item: any) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status.includes('approved') ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-700">
                    {item.uploader?.display_name || item.uploader?.full_name}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {item.reviewer?.full_name && `by ${item.reviewer.full_name} · `}
                  {item.reviewed_at && new Date(item.reviewed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
