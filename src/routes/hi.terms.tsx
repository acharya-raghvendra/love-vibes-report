import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/pages/terms";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/terms")({
  head: () => langHead({ lang: "hi", page: "/terms", title: "Terms & Conditions — Love Match", description: "The terms and conditions governing your use of the Love Match compatibility report service.", twitterCard: "summary" }),
  component: TermsPage,
});
