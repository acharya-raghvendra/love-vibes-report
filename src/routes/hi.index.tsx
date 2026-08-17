import { createFileRoute } from "@tanstack/react-router";
import { Index } from "@/pages/index";
import { validateCouponSearch } from "@/lib/coupon-link";
import { META } from "@/lib/site-copy";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/")({
  validateSearch: validateCouponSearch,
  head: () => langHead({ lang: "hi", page: "", ...META.landing.hi }),
  component: Index,
});
