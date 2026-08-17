import { createFileRoute } from "@tanstack/react-router";
import { PREVIEW_META, PreviewPage } from "@/pages/preview";
import { validateCouponSearch } from "@/lib/coupon-link";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/preview")({
  validateSearch: validateCouponSearch,
  head: () => langHead({ lang: "hi", page: "/preview", noindex: true, ...PREVIEW_META.hi }),
  component: PreviewPage,
});
