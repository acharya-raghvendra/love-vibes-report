import { useSearch } from "@tanstack/react-router";
import { Icon } from "@/components/icon";
import { LangLink } from "@/components/lang-link";
import { langPath } from "@/lib/lang-path";
import { usePageLanguage, type SiteLanguage } from "@/lib/site-language";
import { langHead } from "@/lib/site-seo";


export function ContactPage() {
  const lang = usePageLanguage();
  return (
    <div className="relative min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-[860px] px-5 pt-28 pb-24 lg:px-6">
        <LangLink to={langPath(lang, "")} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 text-body-md">
          <Icon name="arrow_back" size={18} />
          Back to Home
        </LangLink>

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
              <LangLink to={langPath(lang, "/refund")} className="text-primary hover:underline">Refund & Cancellation Policy</LangLink>{" "}
              first — no refunds are issued once the report has been delivered.
            </li>
            <li>Check your spam / promotions folder before reporting a missing report email.</li>
          </ul>

          <a
            href="mailto:info@talktoguruji.com"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-label-lg font-semibold text-on-primary hover:opacity-90 transition-opacity"
          >
            <Icon name="send" size={20} />
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
        <Icon name={icon} size={22} className="text-primary" />
        <h2 className="text-title-md font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="text-body-md">{children}</div>
    </div>
  );
}
