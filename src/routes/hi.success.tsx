import { createFileRoute } from "@tanstack/react-router";
import { SUCCESS_META, SuccessPage, successSearchSchema } from "@/pages/success";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/success")({
  validateSearch: successSearchSchema,
  head: () => langHead({ lang: "hi", page: "/success", noindex: true, ...SUCCESS_META.hi }),
  component: SuccessPage,
});
