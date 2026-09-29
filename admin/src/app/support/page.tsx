import type { Metadata } from 'next';
import Link from 'next/link';
import { Lockup } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Support — Beast Tribe',
  description: 'Get help with the Beast Tribe app by Operation Beast.',
};

const SUPPORT_EMAIL = 'support@operationbeast.com';

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <Lockup height={22} id="bt-support" className="mb-6" />
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="mt-2 text-sm text-gray-500">Beast Tribe by Operation Beast</p>
          <p className="text-sm text-gray-500">We&rsquo;re here to help.</p>
        </header>

        <div className="space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Contact us</h2>
            <p>
              Need help, found a bug, or have a question about Beast Tribe? Email our team and
              we&rsquo;ll get back to you within 1&ndash;2 business days.
            </p>
            <p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-block rounded-lg bg-[#012A2A] px-5 py-3 font-semibold text-white hover:opacity-90"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Common questions</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">How do I report a post or user?</h3>
                <p>
                  Tap the three-dot menu (&hellip;) on any post in the <strong>Tribe</strong> tab and
                  choose <strong>Report</strong> to flag it, or <strong>Block</strong> to stop seeing
                  someone&rsquo;s posts. Reported content is reviewed within 24 hours.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">How do I delete my account?</h3>
                <p>
                  Open <strong>You &rarr; Settings</strong> and tap <strong>Delete account</strong>.
                  This permanently removes your account, profile, posts, and session history. It
                  cannot be undone.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">How do I join or host a session?</h3>
                <p>
                  Sessions near you are on the <strong>Board</strong> and in <strong>Explore</strong>.
                  Open one and tap <strong>I&rsquo;m in</strong>; if it&rsquo;s full you can join the
                  waitlist and you&rsquo;re in automatically when a spot opens. To host, tap
                  <strong> Host</strong> on the Board.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">What does my coach see?</h3>
                <p>
                  Only what you choose. When a coach sends you a request, you pick whether to share
                  your nutrition log and body measurements. Change it or stop anytime from
                  <strong> You &rarr; Your coach</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">I forgot my password.</h3>
                <p>
                  On the sign-in screen, use the password reset option, or email us at{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#1A7A7A] underline">
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  and we&rsquo;ll help.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Policies</h2>
            <p className="flex flex-wrap gap-4">
              <Link href="/legal/privacy" className="text-[#1A7A7A] underline">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="text-[#1A7A7A] underline">
                Terms of Service
              </Link>
            </p>
          </section>
        </div>

        <footer className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-400">
          &copy; {2026} Operation Beast. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
