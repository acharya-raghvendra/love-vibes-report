import { createFileRoute } from "@tanstack/react-router";

const PAGES: Record<string, { title: string; body: string }> = {
  privacy: {
    title: "Privacy Policy",
    body: "We treat your personal data with the highest level of care. Full policy coming soon.",
  },
  terms: {
    title: "Terms of Service",
    body: "By using Love Match you agree to our terms. Full terms coming soon.",
  },
  refund: {
    title: "Refund Policy",
    body: "If the insights don't resonate within 7 days, contact us for a full refund.",
  },
  contact: {
    title: "Contact",
    body: "Reach us on WhatsApp or email support@love-match.app.",
  },
};

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => {
    const p = PAGES[params.slug];
    const title = p ? `${p.title} — Love Match` : "Love Match";
    return {
      meta: [
        { title },
        { name: "description", content: p?.body ?? "Love Match legal information." },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: LegalPage,
});

function LegalPage() {
  const { slug } = Route.useParams();
  const page = PAGES[slug] ?? { title: "Coming soon", body: "This page is coming soon." };

  return (
    <div className="relative min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-[720px] px-margin-mobile pt-28 pb-24 lg:px-6">
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface lg:text-display-lg">
          {page.title}
        </h1>
        <p className="mt-6 font-body-lg text-body-lg text-on-surface-variant">{page.body}</p>
      </main>
    </div>
  );
}
