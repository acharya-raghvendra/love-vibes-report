import { createFileRoute, redirect } from "@tanstack/react-router";

// Root entry point: Hindi is the default language tree.
export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/hi${location.searchStr}`, statusCode: 301 });
  },
});
