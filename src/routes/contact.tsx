import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages/contact";
import { langHead } from "@/lib/site-seo";

// English lives on the original unprefixed URLs — never redirect these.
export const Route = createFileRoute("/contact")({
  head: () => langHead({ lang: "en", page: "/contact", title: "Contact Us — Love Match", description: "Get in touch with the Love Match team at TalkToGuruji for support, order questions, or feedback.", twitterCard: "summary" }),
  component: ContactPage,
});
