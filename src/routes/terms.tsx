import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/pages/terms";
import { langHead } from "@/lib/site-seo";

// English lives on the original unprefixed URLs — never redirect these.
export const Route = createFileRoute("/terms")({
  head: () => langHead({ lang: "en", page: "/terms", title: "Terms & Conditions — Love Match", description: "The terms and conditions governing your use of the Love Match compatibility report service.", twitterCard: "summary" }),
  component: TermsPage,
});
