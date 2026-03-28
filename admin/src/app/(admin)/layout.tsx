import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  // Get pending moderation count
  const db = createAdminClient();
  const { count } = await db
    .from('image_moderation_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="flex min-h-screen">
      <Sidebar
        type="admin"
        userName={admin.full_name}
        roleBadge={admin.role.replace('_', ' ')}
        pendingModeration={count || 0}
      />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
