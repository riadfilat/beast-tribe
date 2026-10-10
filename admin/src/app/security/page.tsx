import '@/components/board/board.css';
import { boardFonts } from '@/components/board/fonts';
import { TwoStep } from '@/components/board/TwoStep';

// Two-step sign-in, outside the dashboards: admins are sent here before they can open HQ
// (requireAdmin), so this page can't sit inside the HQ layout. Inside HQ it lives under Account.
export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ required?: string }> }) {
  const q = await searchParams;
  return (
    <div className={`bt ${boardFonts} px-4 py-10`}>
      <div className="max-w-lg mx-auto grid gap-5">
        <a href="/" className="link text-[13px]">← Back to the dashboard</a>
        <div className="display text-[26px]">BEAST <span style={{ color: 'var(--marker)' }}>HQ</span></div>
        <section className="box grid gap-3">
          <h1 className="text-[20px] font-bold">Two-step sign-in</h1>
          <TwoStep required={q.required != null} />
        </section>
      </div>
    </div>
  );
}
