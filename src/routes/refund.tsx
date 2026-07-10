import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Love Match" },
      { name: "description", content: "Love Match compatibility reports are digital products. No refunds are issued once the report has been delivered." },
      { property: "og:title", content: "Refund & Cancellation Policy — Love Match" },
      { property: "og:description", content: "No refunds once the compatibility report has been delivered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Refund & Cancellation Policy — Love Match" },
      { name: "twitter:description", content: "No refunds once the compatibility report has been delivered." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="relative min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-[860px] px-5 pt-28 pb-24 lg:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Home
        </Link>

        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg mb-8">
          Refund & Cancellation Policy
        </h1>

        <div className="space-y-8 text-on-surface-variant font-body-md text-body-md leading-relaxed">
          <p>
            <strong>Effective Date:</strong> July 9, 2026<br />
            <strong>Last Updated:</strong> July 9, 2026
          </p>

          <p>
            At <strong>Love Match</strong> (operated by <strong>Inno-One Service LLP</strong>), we
            strive to provide you with high-quality love compatibility reports. Please read this
            Refund and Cancellation Policy carefully before making a purchase.
          </p>

          <section className="p-6 rounded-2xl border border-primary/30 bg-primary/10">
            <h2 className="text-title-lg font-semibold text-primary mb-3">
              Important Notice: No Refunds After Delivery
            </h2>
            <p className="text-on-surface">
              Our compatibility reports are <strong>digital products</strong> generated and delivered
              shortly after successful payment. <strong>Once your report has been delivered, the sale
              is final and no refunds will be issued.</strong> Please review your order details
              carefully before completing payment.
            </p>
          </section>

          <Section title="1. Cancellation Policy">
            <h3 className="text-label-lg text-primary font-semibold mt-2 mb-2">Before Payment</h3>
            <p>You may cancel your order at any time before completing the payment. No charges will be applied.</p>

            <h3 className="text-label-lg text-primary font-semibold mt-4 mb-2">After Payment</h3>
            <p>
              Once payment is successfully processed, your compatibility report is generated and
              delivered. Due to the immediate digital delivery nature of our service,{" "}
              <strong>cancellations are not possible after payment has been made</strong>.
            </p>
          </Section>

          <Section title="2. Refund Policy">
            <h3 className="text-label-lg text-primary font-semibold mt-2 mb-2">General Policy</h3>
            <p>
              Because our compatibility reports are personalized digital products generated based on
              the information you provide,{" "}
              <strong>we do not offer refunds once the report has been delivered</strong>. This
              includes cases where you change your mind, feel the report did not meet your
              expectations, or disagree with its interpretations.
            </p>

            <h3 className="text-label-lg text-primary font-semibold mt-6 mb-2">Exceptions — When Refunds May Be Considered</h3>
            <p>We may consider refunds only in the following exceptional circumstances, all of which occur <strong>before</strong> a working report has been delivered:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Technical Failure:</strong> If you did not receive your report due to a technical error on our end</li>
              <li><strong>Duplicate Payment:</strong> If you were accidentally charged multiple times for the same order</li>
              <li><strong>Report Generation Failure:</strong> If our system failed to generate your report after payment and we are unable to deliver it</li>
            </ul>
          </Section>

          <Section title="3. Non-Refundable Situations">
            <p>Refunds will <strong>NOT</strong> be provided in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>The report has already been delivered to you (via download link, email, or on-site)</li>
              <li>You provided incorrect personal information (names, dates of birth)</li>
              <li>You changed your mind after receiving the report</li>
              <li>You did not read or understand the report content</li>
              <li>The report did not meet your personal expectations (compatibility guidance is subjective)</li>
              <li>You were unable to access the report due to issues on your device or email settings</li>
              <li>You forgot to check your spam/junk folder for the report email</li>
            </ul>
          </Section>

          <Section title="4. How to Request a Refund">
            <p>If you believe you qualify for a refund based on the exceptions mentioned above:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-2">
              <li>
                Email us at{" "}
                <a href="mailto:info@talktoguruji.com" className="text-primary hover:underline">info@talktoguruji.com</a>{" "}
                within <strong>7 days</strong> of purchase
              </li>
              <li>Include your order ID / transaction reference number</li>
              <li>Provide the email address used for the purchase</li>
              <li>Clearly explain the reason for your refund request</li>
              <li>Include any relevant screenshots or documentation</li>
            </ol>
          </Section>

          <Section title="5. Refund Processing">
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>All refund requests will be reviewed within <strong>3-5 business days</strong></li>
              <li>If approved, refunds will be processed to the original payment method</li>
              <li>Refunds may take <strong>5-10 business days</strong> to reflect in your account, depending on your bank or payment provider</li>
              <li>You will receive an email confirmation once the refund is processed</li>
            </ul>
          </Section>

          <Section title="6. Report Regeneration">
            <p>If you entered incorrect information during checkout and realize the error immediately after payment:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Contact us within <strong>24 hours</strong> of purchase</li>
              <li>We may, at our discretion, regenerate your report with the correct information <strong>one time only</strong></li>
              <li>This is a courtesy service and not guaranteed</li>
            </ul>
          </Section>

          <Section title="7. Payment Disputes">
            <p>If you initiate a chargeback or payment dispute with your bank or payment provider without first contacting us, we reserve the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Contest the dispute with supporting documentation</li>
              <li>Suspend your access to our services</li>
              <li>Take appropriate legal action if necessary</li>
            </ul>
            <p className="mt-4">We encourage you to contact us directly to resolve any issues before initiating a dispute.</p>
          </Section>

          <Section title="8. Changes to This Policy">
            <p>We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services constitutes acceptance of any modifications.</p>
          </Section>

          <ContactCard title="Contact Us" intro="For refund requests or questions about this policy, please contact us:" />
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
