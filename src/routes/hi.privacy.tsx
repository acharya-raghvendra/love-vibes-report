import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/pages/privacy";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/privacy")({
  head: () => langHead({ lang: "hi", page: "/privacy", title: "Privacy Policy — Love Match", description: "How Love Match collects, uses, and protects the personal data you share to generate your compatibility report.", twitterCard: "summary" }),
  component: PrivacyPage,
});
