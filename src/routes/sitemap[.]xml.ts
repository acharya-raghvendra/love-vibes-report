import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://love.talktoguruji.com";

// Indexable pages inside each language tree. /preview and /success are noindex
// (they need a live session), so they are deliberately excluded.
const PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "", changefreq: "weekly", priority: "1.0" },
  { path: "/input", changefreq: "weekly", priority: "0.9" },
  { path: "/contact", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms", changefreq: "yearly", priority: "0.2" },
  { path: "/refund", changefreq: "yearly", priority: "0.2" },
];

const LANGS = ["hi", "en"] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = LANGS.flatMap((lang) =>
          PAGES.map((p) => {
            const loc = `${BASE_URL}/${lang}${p.path}`;
            const alternates = LANGS.map(
              (l) =>
                `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}${p.path}" />`,
            );
            return [
              `  <url>`,
              `    <loc>${loc}</loc>`,
              ...alternates,
              `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/hi${p.path}" />`,
              `    <changefreq>${p.changefreq}</changefreq>`,
              `    <priority>${p.priority}</priority>`,
              `  </url>`,
            ].join("\n");
          }),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
