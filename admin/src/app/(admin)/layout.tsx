import { requireAdmin } from '@/lib/auth';
import { pendingModerationCount } from '@/lib/moderation';
import Sidebar from '@/components/layout/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const pending = await pendingModerationCount();

  return (
    <div className="flex min-h-screen">
      <NavigationProgress />
      <Sidebar
        type="admin"
        userName={admin.full_name}
        roleBadge={admin.role.replace('_', ' ')}
        pendingModeration={pending}
      />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="px-4 pb-6 pt-16 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
