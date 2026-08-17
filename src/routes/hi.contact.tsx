import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages/contact";
import { langHead } from "@/lib/site-seo";

// Hindi tree: /hi/… mirrors the English pages under a prefix.
export const Route = createFileRoute("/hi/contact")({
  head: () => langHead({ lang: "hi", page: "/contact", title: "Contact Us — Love Match", description: "Get in touch with the Love Match team at TalkToGuruji for support, order questions, or feedback.", twitterCard: "summary" }),
  component: ContactPage,
});
