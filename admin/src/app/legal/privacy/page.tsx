import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Beast Tribe',
  description: 'Privacy Policy for the Beast Tribe app by Operation Beast.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Beast Tribe by Operation Beast</p>
          <p className="text-sm text-gray-500">Last updated: June 2026</p>
        </header>

        <div className="space-y-8 leading-relaxed">
          <section className="space-y-3">
            <p>
              This Privacy Policy explains how Operation Beast (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;) collects, uses, and protects your information when you use the Beast
              Tribe mobile application (the &ldquo;App&rdquo;). By using Beast Tribe, you agree to the
              practices described below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
            <p>We collect only the information needed to operate the App and provide its features:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Account information</strong> — your email address and the name you choose to
                display to your tribe.
              </li>
              <li>
                <strong>Profile information</strong> — optional details you add to your profile, such as
                your bio, sports interests, goals, and community or pack membership.
              </li>
              <li>
                <strong>Photos and content you upload</strong> — profile pictures, event images, and any
                posts, comments, or messages you create within the App.
              </li>
              <li>
                <strong>Event participation</strong> — the events you create, join, or attend, and your
                activity within community packs.
              </li>
              <li>
                <strong>Device push token</strong> — an anonymous device identifier used solely to send you
                push notifications (for example, event reminders and community activity).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Create and maintain your account and profile.</li>
              <li>Display your content and activity to other members of your community.</li>
              <li>Enable core features such as events, packs, posts, and messaging.</li>
              <li>Send you push notifications you have opted into.</li>
              <li>Keep the community safe by moderating content and enforcing our Terms of Service.</li>
              <li>Diagnose technical issues and improve the App.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">3. Where Your Data Is Stored</h2>
            <p>
              Your data is stored securely using Supabase, our backend and database provider. Access to
              your data is restricted by row-level security policies so that you and authorized community
              moderators can only access what is appropriate. Data is transmitted over encrypted
              connections (HTTPS).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">4. We Do Not Sell Your Data</h2>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We do not use your
              data for third-party advertising.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">5. Deleting Your Account and Data</h2>
            <p>
              You can permanently delete your account at any time directly within the App. When you delete
              your account, your profile, uploaded photos, posts, comments, and associated personal data
              are permanently removed from our systems. This action cannot be undone.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">6. Children&rsquo;s Privacy</h2>
            <p>
              Beast Tribe is intended for users aged 13 and older. We do not knowingly collect personal
              information from children under 13. If we learn that we have collected such information, we
              will delete it promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the
              &ldquo;Last updated&rdquo; date above. Continued use of the App after changes take effect
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how your data is handled, contact us at{' '}
              <a href="mailto:support@operationbeast.com" className="text-teal-700 underline">
                support@operationbeast.com
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-500">
          <Link href="/legal/terms" className="text-teal-700 underline">
            Terms of Service
          </Link>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} Operation Beast</span>
        </footer>
      </div>
    </main>
  );
}
