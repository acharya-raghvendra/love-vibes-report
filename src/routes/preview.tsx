import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy unprefixed URL — permanently redirected into the Hindi tree so old
// ads, WhatsApp and email links keep working. Search params are preserved.
export const Route = createFileRoute("/preview")({
  beforeLoad: ({ location }) => {
    throw redirect({
      href: `/hi${location.pathname}${location.searchStr}`,
      statusCode: 301,
    });
  },
});
