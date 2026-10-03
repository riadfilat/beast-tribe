import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { ownsCommunity, requirePartner } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { Lockup } from '@/components/brand/Logo';
import PrintButton from '@/components/club/PrintButton';

export const revalidate = 0;

// A one-page poster for the front desk or the office kitchen: scan, get the app, enter the code.
export default async function PosterPage() {
  const partner = await requirePartner();
  if (!ownsCommunity(partner.partner_type)) redirect('/partner/dashboard');
  if (!partner.community_id) redirect('/partner/club');
  const db = createAdminClient();
  const { data: c } = await db.from('communities').select('name, join_code').eq('id', partner.community_id).single();
  if (!c?.join_code) redirect('/partner/club');

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://beast-tribe.vercel.app';
  const url = `${base}/get?code=${encodeURIComponent(c.join_code)}`;
  const qr = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#023C3C', light: '#00000000' } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Join poster</h1>
          <p className="text-sm text-gray-500">Print it for the front desk, the changing room or the office kitchen. Members scan it, get the app and enter your code.</p>
        </div>
        <PrintButton label="Print poster" />
      </div>

      <div id="poster" className="mx-auto bg-[#F4F1EA] text-[#023C3C] rounded-2xl print:rounded-none shadow-sm print:shadow-none" style={{ width: '100%', maxWidth: 620, aspectRatio: '210 / 297' }}>
        <div className="h-full flex flex-col p-[8%]">
          <Lockup height={26} id="bt-poster" />
          <p className="mt-[9%] text-[13px] font-semibold uppercase tracking-[0.2em] text-[#147070]">{c.name}</p>
          <h2 className="mt-2 text-[44px] leading-[1.02] font-black tracking-tight">
            Train with us.
            <br />
            <span className="text-[#E88F24]">Join the club.</span>
          </h2>

          <div className="mt-auto grid grid-cols-[1fr_auto] gap-6 items-end">
            <ol className="space-y-3 text-[15px] font-medium">
              <li><span className="font-black text-[#E88F24] me-2">1</span>Scan to get the Beast Tribe app</li>
              <li><span className="font-black text-[#E88F24] me-2">2</span>Create your free account</li>
              <li><span className="font-black text-[#E88F24] me-2">3</span>Enter our code</li>
            </ol>
            <div className="w-[150px] h-[150px] bg-white rounded-xl p-3" dangerouslySetInnerHTML={{ __html: qr }} />
          </div>

          <div className="mt-[6%] rounded-2xl bg-[#023C3C] text-[#F4F1EA] px-6 py-5 flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#56C4C4]">Our code</span>
            <span className="font-mono text-[40px] font-bold tracking-[0.25em]">{c.join_code}</span>
          </div>
          <p className="mt-3 text-[11px] text-[#023C3C]/60">Book classes, train together and see who&rsquo;s going. Free for members.</p>
        </div>
      </div>
    </div>
  );
}
