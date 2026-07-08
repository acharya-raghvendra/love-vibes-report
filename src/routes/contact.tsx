import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Love Match" },
      { name: "description", content: "Get in touch with the Love Match team at TalkToGuruji for support, order questions, or feedback." },
      { property: "og:title", content: "Contact Us — Love Match" },
      { property: "og:description", content: "Get in touch with the Love Match team for support and order questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Contact Us — Love Match" },
      { name: "twitter:description", content: "Get in touch with the Love Match team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="relative min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-[860px] px-5 pt-28 pb-24 lg:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 text-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
          Back to Home
        </Link>

        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg mb-4">
          Contact Us
        </h1>
        <p className="text-on-surface-variant font-body-lg text-body-lg mb-10 max-w-2xl">
          Questions about your Love Match compatibility report, an order, or a refund request?
          We're here to help.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <InfoCard icon="mail" title="Email">
            <a href="mailto:info@talktoguruji.com" className="text-primary hover:underline">
              info@talktoguruji.com
            </a>
            <p className="text-body-sm text-on-surface-variant mt-2">
              We typically respond within 24–48 hours.
            </p>
          </InfoCard>

          <InfoCard icon="schedule" title="Business Hours">
            <p className="text-on-surface">
              Monday – Saturday: 10:00 AM – 6:00 PM IST<br />
              Sunday: Closed
            </p>
          </InfoCard>

          <InfoCard icon="location_on" title="Address" wide>
            <p className="text-on-surface">
              <strong>Inno-One Service LLP</strong><br />
              ALtF 142 NOIDA, Plot no. 21 and 21A,<br />
              Sector 142, Maharishi Nagar, Noida,<br />
              Gautam Buddha Nagar - 201304,<br />
              Uttar Pradesh, India
            </p>
          </InfoCard>
        </div>

        <section className="mt-10 p-6 rounded-2xl border border-primary/20 bg-primary/5">
          <h2 className="text-title-lg font-semibold text-on-surface mb-2">Quick support tips</h2>
          <ul className="list-disc pl-6 space-y-2 text-on-surface-variant">
            <li>For order-related queries, include your order ID and the email used for purchase.</li>
            <li>For refund requests, please read our{" "}
              <Link to="/refund" className="text-primary hover:underline">Refund & Cancellation Policy</Link>{" "}
              first — no refunds are issued once the report has been delivered.
            </li>
            <li>Check your spam / promotions folder before reporting a missing report email.</li>
          </ul>

          <a
            href="mailto:info@talktoguruji.com"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-label-lg font-semibold text-on-primary hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>send</span>
            Email us
          </a>
        </section>
      </main>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
  wide,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`glass-card rounded-2xl border border-primary/20 p-6 ${wide ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>
          {icon}
        </span>
        <h2 className="text-title-md font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="text-body-md">{children}</div>
    </div>
  );
}
