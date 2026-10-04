import type { Metadata } from 'next';
import { Montserrat, Poppins } from 'next/font/google';
import { Lockup } from '@/components/brand/Logo';
import { createAdminClient } from '@/lib/supabase-server';

const display = Montserrat({ subsets: ['latin'], weight: ['800', '900'], variable: '--font-display' });
const body = Poppins({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });

export const metadata: Metadata = { title: 'Get Beast Tribe', description: 'Download the Beast Tribe app and join your community with its code.' };
export const revalidate = 300;

// Where posters and QR codes point. Shows the download buttons once the links are set (admin › Business).
export default async function GetPage(props: { searchParams: Promise<{ code?: string }> }) {
  const searchParams = await props.searchParams;
  const db = createAdminClient();
  const { data } = await db.from('app_settings').select('value').eq('key', 'app_links').maybeSingle();
  const links: { ios?: string | null; android?: string | null } = (data?.value as any) || {};
  const code = (searchParams.code || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase();
  const H = 'font-[family-name:var(--font-display)] tracking-tight';

  return (
    <main className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] min-h-screen bg-[#023C3C] text-white`}>
      <div className="mx-auto max-w-md px-6 py-12">
        <Lockup height={22} ink="#F4F1EA" id="bt-get" />
        <h1 className={`${H} mt-10 text-4xl font-black leading-[1.05]`}>
          Train with <span className="text-[#E88F24]">your people.</span>
        </h1>

        <ol className="mt-10 space-y-6">
          <li className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-[#E88F24] text-[#023C3C] font-bold flex items-center justify-center flex-none">1</span>
            <div className="flex-1">
              <p className="font-semibold text-lg">Get the app</p>
              {links.ios || links.android ? (
                <div className="mt-3 flex flex-col gap-2">
                  {links.ios ? (
                    <a href={links.ios} className="rounded-xl bg-[#F4F1EA] text-[#023C3C] px-5 py-3 font-semibold text-center">Download for iPhone</a>
                  ) : null}
                  {links.android ? (
                    <a href={links.android} className="rounded-xl bg-[#F4F1EA] text-[#023C3C] px-5 py-3 font-semibold text-center">Download for Android</a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1 text-white/70">Beast Tribe is in private testing. Ask your club or company for an invite to the test app.</p>
              )}
            </div>
          </li>
          <li className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-[#E88F24] text-[#023C3C] font-bold flex items-center justify-center flex-none">2</span>
            <div className="flex-1">
              <p className="font-semibold text-lg">Create your account</p>
              <p className="mt-1 text-white/70">It takes a minute. The app is free.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-[#E88F24] text-[#023C3C] font-bold flex items-center justify-center flex-none">3</span>
            <div className="flex-1">
              <p className="font-semibold text-lg">Enter your community code</p>
              {code ? (
                <p className="mt-3 inline-block rounded-xl border-2 border-dashed border-white/40 px-5 py-3 font-mono text-3xl font-bold tracking-[0.25em]">{code}</p>
              ) : (
                <p className="mt-1 text-white/70">Your club or company gives it to you.</p>
              )}
              <p className="mt-2 text-sm text-white/55">In the app: Tribe › Communities › Have an invite code?</p>
            </div>
          </li>
        </ol>
      </div>
    </main>
  );
}
