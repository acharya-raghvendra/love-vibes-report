import { createFileRoute } from "@tanstack/react-router";
import { RefundPage } from "@/pages/refund";
import { langHead } from "@/lib/site-seo";

// English lives on the original unprefixed URLs — never redirect these.
export const Route = createFileRoute("/refund")({
  head: () => langHead({ lang: "en", page: "/refund", title: "Refund & Cancellation Policy — Love Match", description: "Love Match compatibility reports are digital products. No refunds are issued once the report has been delivered.", twitterCard: "summary" }),
  component: RefundPage,
});
