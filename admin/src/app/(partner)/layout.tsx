import { requirePartner } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const partner = await requirePartner();

  const TYPE_LABELS: Record<string, string> = {
    coach: 'Coach',
    gym: 'Gym',
    event_company: 'Event Company',
  };

  return (
    <div className="flex min-h-screen">
      <NavigationProgress />
      <Sidebar
        type="partner"
        userName={partner.business_name}
        roleBadge={TYPE_LABELS[partner.partner_type] || partner.partner_type}
      />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
