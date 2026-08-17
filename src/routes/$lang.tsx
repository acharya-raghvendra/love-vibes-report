import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";

/**
 * Language tree: /hi/… and /en/…. The prefix is the single source of truth for
 * the page language; anything else 404s instead of rendering a random language.
 */
export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (params.lang !== "hi" && params.lang !== "en") throw notFound();
  },
  component: LangLayout,
});

function LangLayout() {
  return <Outlet />;
}
