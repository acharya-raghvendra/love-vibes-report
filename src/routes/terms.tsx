import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Love Match" },
      { name: "description", content: "The terms and conditions governing your use of the Love Match compatibility report service." },
      { property: "og:title", content: "Terms & Conditions — Love Match" },
      { property: "og:description", content: "The terms governing your use of the Love Match compatibility report service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Terms & Conditions — Love Match" },
      { name: "twitter:description", content: "The terms governing your use of Love Match." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="relative min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-[860px] px-5 pt-28 pb-24 lg:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Home
        </Link>

        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg mb-8">
          Terms & Conditions
        </h1>

        <div className="space-y-8 text-on-surface-variant font-body-md text-body-md leading-relaxed">
          <p>
            <strong>Effective Date:</strong> January 1, 2026<br />
            <strong>Last Updated:</strong> January 1, 2026
          </p>

          <p>
            Welcome to <strong>Love Match</strong>. These Terms and Conditions ("Terms") govern your
            use of our website and services operated by <strong>Inno-One Service LLP</strong>. By
            accessing or using our website, you agree to be bound by these Terms. If you do not
            agree with any part of these Terms, please do not use our services.
          </p>

          <Section title="1. Definitions">
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>"Company," "we," "us," or "our"</strong> refers to Inno-One Service LLP, operating as Love Match (a TalkToGuruji product).</li>
              <li><strong>"User," "you," or "your"</strong> refers to any individual accessing or using our website and services.</li>
              <li><strong>"Services"</strong> refers to the love compatibility reports and related content provided through our website.</li>
              <li><strong>"Website"</strong> refers to the Love Match website and all associated pages.</li>
            </ul>
          </Section>

          <Section title="2. Eligibility">
            <p>By using our services, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>You are at least 18 years of age or have parental/guardian consent</li>
              <li>You have the legal capacity to enter into a binding agreement</li>
              <li>You will provide accurate and complete information when using our services</li>
              <li>You will use our services only for lawful purposes</li>
            </ul>
          </Section>

          <Section title="3. Description of Services">
            <p>Love Match provides personalized love compatibility reports based on information you provide, including names and dates of birth for both partners. Our services include:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Comprehensive numerology-based compatibility analysis</li>
              <li>Overall compatibility score and band</li>
              <li>Chemistry, communication, and shared-path insights</li>
              <li>Strengths and friction points between partners</li>
              <li>Guidance for growing the relationship</li>
            </ul>
            <p className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-on-surface">
              <strong>Important:</strong> Our compatibility reports are for educational and entertainment
              purposes only. They should not be considered as professional advice for medical, legal,
              financial, psychological, or relationship-counselling matters.
            </p>
          </Section>

          <Section title="4. Payment Terms">
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>All prices are displayed in Indian Rupees (INR) unless otherwise stated</li>
              <li>Payment is required at the time of order placement</li>
              <li>We accept payments through Razorpay, which supports UPI, credit cards, debit cards, and net banking</li>
              <li>All transactions are processed securely through Razorpay's payment gateway</li>
              <li>Prices are subject to change without prior notice; however, changes will not affect orders already placed</li>
            </ul>
          </Section>

          <Section title="5. Delivery of Services">
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Compatibility reports are digital products delivered electronically</li>
              <li>Reports are typically generated shortly after successful payment</li>
              <li>Reports will be accessible through our website and/or sent to your registered email address</li>
              <li>We are not responsible for delays caused by incorrect email addresses or technical issues on your end</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property Rights">
            <p>All content on this website, including but not limited to text, graphics, logos, images, audio clips, digital downloads, and software, is the property of Inno-One Service LLP and is protected by Indian and international copyright laws.</p>
            <p className="mt-4">You may not:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Reproduce, distribute, or publicly display any content without written permission</li>
              <li>Modify or create derivative works based on our content</li>
              <li>Use our content for commercial purposes without authorization</li>
              <li>Remove any copyright or proprietary notices from our materials</li>
            </ul>
          </Section>

          <Section title="7. User Responsibilities">
            <p>When using our services, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Provide accurate personal information for report generation</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Not share, resell, or distribute purchased reports</li>
              <li>Not use our services for any illegal or unauthorized purpose</li>
              <li>Not attempt to hack, interfere with, or disrupt our website or servers</li>
            </ul>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>Our services are provided on an "as is" and "as available" basis. We make no representations or warranties of any kind, express or implied, regarding:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>The accuracy, reliability, or completeness of our compatibility reports</li>
              <li>That our services will meet your specific expectations or requirements</li>
              <li>That our website will be uninterrupted, secure, or error-free</li>
              <li>Any results or outcomes from using our compatibility guidance</li>
            </ul>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>To the maximum extent permitted by law, Inno-One Service LLP and its directors, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your use or inability to use our services</li>
              <li>Any decisions made based on our compatibility reports</li>
              <li>Unauthorized access to or alteration of your personal data</li>
              <li>Any third-party content or conduct</li>
            </ul>
            <p className="mt-4">Our total liability shall not exceed the amount paid by you for the specific service in question.</p>
          </Section>

          <Section title="10. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless Inno-One Service LLP, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, or expenses arising from your use of our services or violation of these Terms.</p>
          </Section>

          <Section title="11. Modifications to Terms">
            <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after any modifications indicates your acceptance of the updated Terms.</p>
          </Section>

          <Section title="12. Termination">
            <p>We reserve the right to terminate or suspend your access to our services at any time, without prior notice or liability, for any reason, including breach of these Terms.</p>
          </Section>

          <Section title="13. Governing Law and Jurisdiction">
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or your use of our services shall be subject to the exclusive jurisdiction of the courts in Gautam Buddha Nagar, Uttar Pradesh, India.</p>
          </Section>

          <Section title="14. Severability">
            <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue to be valid and enforceable.</p>
          </Section>

          <Section title="15. Entire Agreement">
            <p>These Terms, together with our Privacy Policy and Refund & Cancellation Policy, constitute the entire agreement between you and Inno-One Service LLP regarding the use of our services.</p>
          </Section>

          <ContactCard title="Contact Us" intro="If you have any questions about these Terms & Conditions, please contact us:" />
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
