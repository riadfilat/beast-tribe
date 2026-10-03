import type { Metadata } from 'next';
import Link from 'next/link';
import { Lockup } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Privacy Policy — Beast Tribe',
  description: 'Privacy Policy for the Beast Tribe app by Operation Beast.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <Lockup height={22} id="bt-privacy" className="mb-6" />
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Beast Tribe by Operation Beast</p>
          <p className="text-sm text-gray-500">Last updated: October 2026</p>
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
                <strong>About you</strong> — optional details such as your city, country, date of birth and
                gender (gender is used for women-only and men-only sessions and packs).
              </li>
              <li>
                <strong>Training and nutrition</strong> — the workouts and sets you log, your training plan,
                meal and water logs, nutrition targets, and body measurements you or a coach you work with
                record.
              </li>
              <li>
                <strong>Steps from Apple Health</strong> — only if you choose to connect Apple Health, we read
                your daily step count. We read nothing else from Apple Health and never write to it.
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
            <h2 className="text-xl font-semibold text-gray-900">Who Can See What</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Other members</strong> see your name and photo, the sessions you join and the posts
                you share, only in the communities and packs you share with them. They never see your date
                of birth, gender, training log, food log or measurements.
              </li>
              <li>
                <strong>A gym, club or company whose community you join</strong> sees that you are a member,
                your bookings and attendance at its sessions, and your posts in its community. It does not
                see what you train on your own, what you eat, or your measurements.
              </li>
              <li>
                <strong>Step challenges</strong> — your steps appear on a challenge ranking only if you choose
                to join that challenge. Community step averages are shown only when at least five members
                are included, so no one person&rsquo;s steps can be worked out.
              </li>
              <li>
                <strong>A coach or nutritionist</strong> sees your food log or measurements only if you switch
                that on for them, and you can switch it off or stop working with them at any time.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Apple Health</h2>
            <p>
              Step counts read from Apple Health are used only to show your steps to you and to run the
              challenges you join. We do not use Apple Health data for advertising or marketing, we do not
              sell it, and we do not share it with third parties. You can disconnect at any time in the
              iPhone Health app under Sharing › Apps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Training Partners and Level Ratings</h2>
            <p>
              Training partners is off until you switch it on. When it is on, other members who switched it on can
              see your name, photo, sports, the times you usually train, your running pace if you add it, and the
              short line you write. Women can choose to be matched with women only. Switch it off at any time.
            </p>
            <p>
              After a session, people who took part can rate each other&rsquo;s level in that sport. These ratings
              are private: no member can see them, including the person rated. We use them only to suggest
              training partners at a similar level.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Ask Beast (AI Assistant)</h2>
            <p>
              When you use Ask Beast, your question and the results it looks up for you (sessions, workouts,
              clubs and training partners you can already see in the app) are sent to Anthropic, the company
              that provides the AI model, to write the answer. We do not send your email, date of birth, body
              measurements, nutrition logs or level ratings. Anthropic does not use this data to train its
              models. Ask Beast is optional.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">3. Where Your Data Is Stored</h2>
            <p>
              Your data is stored with Supabase, our database provider, on Amazon Web Services servers in
              Mumbai, India. Access is restricted so that each person and organisation can only reach what
              is described above. Data is transmitted over encrypted connections (HTTPS).
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
