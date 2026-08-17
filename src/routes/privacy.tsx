import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/pages/privacy";
import { langHead } from "@/lib/site-seo";

// English lives on the original unprefixed URLs — never redirect these.
export const Route = createFileRoute("/privacy")({
  head: () => langHead({ lang: "en", page: "/privacy", title: "Privacy Policy — Love Match", description: "How Love Match collects, uses, and protects the personal data you share to generate your compatibility report.", twitterCard: "summary" }),
  component: PrivacyPage,
});
