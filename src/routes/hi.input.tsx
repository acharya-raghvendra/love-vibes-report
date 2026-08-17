import { createFileRoute } from "@tanstack/react-router";
import { InputPage } from "@/pages/input";
import { validateCouponSearch } from "@/lib/coupon-link";
import { META } from "@/lib/site-copy";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/input")({
  validateSearch: validateCouponSearch,
  head: () => langHead({ lang: "hi", page: "/input", ...META.input.hi }),
  component: InputPage,
});
