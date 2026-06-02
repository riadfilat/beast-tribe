import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Beast Tribe',
  description: 'Terms of Service and End User License Agreement for the Beast Tribe app by Operation Beast.',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white text-gray-800">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service &amp; EULA</h1>
          <p className="mt-2 text-sm text-gray-500">Beast Tribe by Operation Beast</p>
          <p className="text-sm text-gray-500">Last updated: June 2026</p>
        </header>

        <div className="space-y-8 leading-relaxed">
          <section className="space-y-3">
            <p>
              These Terms of Service and End User License Agreement (the &ldquo;Terms&rdquo;) govern your
              use of the Beast Tribe mobile application (the &ldquo;App&rdquo;) provided by Operation Beast
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). By creating an account or using the
              App, you agree to be bound by these Terms. If you do not agree, do not use the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">1. Age Requirement</h2>
            <p>
              You must be at least 13 years old to use Beast Tribe. By using the App, you confirm that you
              meet this age requirement. If you are under the age of majority in your jurisdiction, you may
              use the App only with the involvement of a parent or guardian.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">2. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activity that occurs under your account. You agree to provide accurate information and to
              keep it up to date. You may delete your account at any time from within the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">3. Acceptable Use</h2>
            <p>Beast Tribe is a community fitness app. When using the App, you agree that you will not:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Post or share content that is unlawful, harmful, threatening, abusive, harassing, defamatory, hateful, or discriminatory.</li>
              <li>Post sexually explicit, violent, or otherwise objectionable content.</li>
              <li>Harass, bully, intimidate, impersonate, or threaten other users.</li>
              <li>Post spam, scams, or misleading information.</li>
              <li>Infringe the intellectual property or privacy rights of others.</li>
              <li>Attempt to gain unauthorized access to the App, other accounts, or our systems.</li>
              <li>Use the App for any illegal purpose or in violation of any applicable law.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">
              4. Zero Tolerance for Objectionable Content and Abusive Behavior
            </h2>
            <p>
              <strong>
                There is zero tolerance for objectionable content or abusive users on Beast Tribe.
              </strong>{' '}
              Any content or behavior that violates the Acceptable Use rules above is strictly prohibited.
              We reserve the right to remove any content and to suspend or permanently terminate any
              account that engages in such conduct, without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">5. Reporting and Blocking</h2>
            <p>
              Every user can report objectionable content and abusive users, and can block other users
              directly within the App. Reporting tools are available on posts, comments, and user
              profiles. Blocking a user prevents them from interacting with you.
            </p>
            <p>
              Our moderation team reviews all flagged content and reports. We remove content that violates
              these Terms and eject offending users within 24 hours of a report being reviewed. Users who
              post objectionable content or engage in abusive behavior may have that content removed and
              their accounts suspended or permanently terminated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">6. Content You Post</h2>
            <p>
              You retain ownership of the content you create and post on Beast Tribe. By posting content,
              you grant us a non-exclusive license to host, display, and distribute that content within the
              App for the purpose of operating the service. You are solely responsible for the content you
              post and confirm you have the right to share it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">7. Removal and Termination</h2>
            <p>
              We may remove any content and suspend or terminate any account at our discretion for
              violations of these Terms. We may also remove content that is reported or that we determine,
              in good faith, to be objectionable. If your account is terminated for a violation, you may
              not be permitted to create a new account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">8. Health and Fitness Disclaimer</h2>
            <p>
              Beast Tribe provides community and fitness-related features for informational and
              motivational purposes only. It is not a substitute for professional medical advice. Consult a
              qualified healthcare provider before beginning any exercise program. You participate in
              activities at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">9. Disclaimers and Limitation of Liability</h2>
            <p>
              The App is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of
              any kind. To the fullest extent permitted by law, Operation Beast shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">10. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
              updated&rdquo; date above. Continued use of the App after changes take effect constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, or to report content or a user, contact us at{' '}
              <a href="mailto:support@operationbeast.com" className="text-teal-700 underline">
                support@operationbeast.com
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-500">
          <Link href="/legal/privacy" className="text-teal-700 underline">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <span>© {new Date().getFullYear()} Operation Beast</span>
        </footer>
      </div>
    </main>
  );
}
