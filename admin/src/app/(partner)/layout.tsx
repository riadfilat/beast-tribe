import { requirePartner } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import NavigationProgress from '@/components/NavigationProgress';
import Link from 'next/link';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const partner = await requirePartner();

  const TYPE_LABELS: Record<string, string> = {
    coach: 'Coach',
    gym: 'Gym',
    event_company: 'Event Company',
    company: 'Company',
    nutritionist: 'Nutritionist',
  };

  // Trial and payment status, always in view: nobody should be surprised when a trial ends.
  const daysLeft = partner.trial_ends_at ? Math.ceil((new Date(partner.trial_ends_at).getTime() - Date.now()) / 86400000) : null;
  const banner =
    partner.plan_status === 'past_due'
      ? { tone: 'bg-[#FCEBEA] text-[#9E3A33]', text: 'Your last payment is due.', cta: 'See your plan' }
      : partner.plan_status === 'trial' && daysLeft != null && daysLeft < 0
        ? { tone: 'bg-[#FDF2E3] text-[#8A4F0B]', text: 'Your free trial has ended. Choose a plan to keep your community running.', cta: 'Choose a plan' }
        : partner.plan_status === 'trial' && daysLeft != null && daysLeft <= 7
          ? { tone: 'bg-[#FDF2E3] text-[#8A4F0B]', text: `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`, cta: 'Choose a plan' }
          : null;

  return (
    <div className="flex min-h-screen">
      <NavigationProgress />
      <Sidebar
        type="partner"
        partnerType={partner.partner_type}
        userName={partner.business_name}
        roleBadge={TYPE_LABELS[partner.partner_type] || partner.partner_type}
      />
      <main className="flex-1 bg-gray-50 print:bg-white overflow-auto">
        {banner ? (
          <div className={`print:hidden px-6 py-2.5 text-sm flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${banner.tone}`}>
            <span>{banner.text}</span>
            <Link href="/partner/plan" className="font-semibold underline">
              {banner.cta}
            </Link>
          </div>
        ) : null}
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
