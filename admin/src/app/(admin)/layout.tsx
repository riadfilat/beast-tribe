import { getTwoStep, requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const twoStep = await getTwoStep();

  // Get pending moderation count
  const db = createAdminClient();
  const { count } = await db
    .from('image_moderation_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="flex min-h-screen">
      <NavigationProgress />
      <Sidebar
        type="admin"
        userName={admin.full_name}
        roleBadge={admin.role.replace('_', ' ')}
        pendingModeration={count || 0}
      />
      <main className="flex-1 bg-gray-50 overflow-auto">
        {!twoStep.enrolled ? (
          <div className="bg-[#FFF8EC] border-b border-[#F3DDBD] px-6 py-2.5 text-sm text-[#7A4A0B] flex flex-wrap items-center gap-3">
            <span>This admin account has no two-step sign-in. Anyone with the password can get in.</span>
            <Link href="/security" className="font-semibold underline">Turn it on</Link>
          </div>
        ) : null}
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
