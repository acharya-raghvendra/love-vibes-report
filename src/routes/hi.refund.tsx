import { createFileRoute } from "@tanstack/react-router";
import { RefundPage } from "@/pages/refund";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/refund")({
  head: () => langHead({ lang: "hi", page: "/refund", title: "Refund & Cancellation Policy — Love Match", description: "Love Match compatibility reports are digital products. No refunds are issued once the report has been delivered.", twitterCard: "summary" }),
  component: RefundPage,
});
