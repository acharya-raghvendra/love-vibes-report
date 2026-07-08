import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Love Match" },
      { name: "description", content: "How Love Match collects, uses, and protects the personal data you share to generate your compatibility report." },
      { property: "og:title", content: "Privacy Policy — Love Match" },
      { property: "og:description", content: "How Love Match collects, uses, and protects the personal data you share." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Privacy Policy — Love Match" },
      { name: "twitter:description", content: "How Love Match collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-[860px] px-5 pt-28 pb-24 lg:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Home
        </Link>

        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg mb-8">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-on-surface-variant font-body-md text-body-md leading-relaxed">
          <p>
            <strong>Effective Date:</strong> January 1, 2026<br />
            <strong>Last Updated:</strong> January 1, 2026
          </p>

          <p>
            Welcome to <strong>Love Match</strong> (operated by <strong>Inno-One Service LLP</strong>).
            We are committed to protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website and use our love compatibility report services.
          </p>

          <Section title="1. Information We Collect">
            <h3 className="text-label-lg text-primary font-semibold mt-2 mb-2">Personal Information</h3>
            <p>When you use our services, we may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Names:</strong> The names of both partners, to personalize your compatibility report</li>
              <li><strong>Dates of Birth:</strong> The dates of birth of both partners, essential for compatibility calculations</li>
              <li><strong>Buyer Email Address:</strong> To deliver your report and communicate with you</li>
              <li><strong>Phone Number (optional):</strong> For customer support and order updates</li>
              <li><strong>Payment Information:</strong> Processed securely through Razorpay payment gateway</li>
            </ul>

            <h3 className="text-label-lg text-primary font-semibold mt-6 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Pages visited and time spent on our website</li>
              <li>Referring website addresses</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>To generate and deliver your personalized love compatibility report</li>
              <li>To process payments securely</li>
              <li>To communicate with you regarding your order</li>
              <li>To provide customer support</li>
              <li>To improve our services and website functionality</li>
              <li>To send promotional communications (only with your consent)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. Information Sharing and Disclosure">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Payment Processors:</strong> We use Razorpay to process payments. Your payment information is handled directly by Razorpay under their privacy policy.</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate our website and deliver services (email delivery, hosting).</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation.</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, or sale of company assets.</li>
            </ul>
          </Section>

          <Section title="4. Cookies and Tracking Technologies">
            <p>We use cookies and similar tracking technologies to enhance your browsing experience. Cookies are small files stored on your device that help us remember your preferences and understand how you use our website.</p>
            <p className="mt-4">You can control cookies through your browser settings. However, disabling cookies may affect some features of our website.</p>
          </Section>

          <Section title="5. Data Security">
            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>SSL encryption for all data transmission</li>
              <li>Secure payment processing through Razorpay</li>
              <li>Regular security assessments</li>
              <li>Limited access to personal information by authorized personnel only</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. After this period, we securely delete or anonymize your data unless retention is required by law.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>Under applicable data protection laws, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Object:</strong> Object to processing of your data for marketing purposes</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where we rely on consent</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:info@talktoguruji.com" className="text-primary hover:underline">info@talktoguruji.com</a>.
            </p>
          </Section>

          <Section title="8. Third-Party Links">
            <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.</p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a minor, please contact us immediately.</p>
          </Section>

          <Section title="10. Changes to This Privacy Policy">
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.</p>
          </Section>

          <Section title="11. Governing Law">
            <p>This Privacy Policy is governed by the laws of India, including the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</p>
          </Section>

          <ContactCard title="Contact Us" intro="If you have any questions about this Privacy Policy, please contact us:" />
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-title-lg font-semibold text-on-surface mt-8 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ContactCard({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="mt-12 p-6 glass-card rounded-2xl border border-primary/20">
      <h2 className="text-title-lg font-semibold text-on-surface mb-4">{title}</h2>
      <p>{intro}</p>
      <div className="mt-4 space-y-2 text-on-surface">
        <p><strong>Inno-One Service LLP</strong></p>
        <p>
          ALtF 142 NOIDA, Plot no. 21 and 21A,<br />
          Sector 142, Maharishi Nagar, Noida,<br />
          Gautam Buddha Nagar - 201304,<br />
          Uttar Pradesh, India
        </p>
        <p>
          Email:{" "}
          <a href="mailto:info@talktoguruji.com" className="text-primary hover:underline">info@talktoguruji.com</a>
        </p>
      </div>
    </section>
  );
}
