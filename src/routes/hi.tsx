import { createFileRoute, Outlet } from "@tanstack/react-router";

// Hindi language tree. The /hi prefix is the single source of truth for the
// page language; everything unprefixed is English.
export const Route = createFileRoute("/hi")({
  component: () => <Outlet />,
});
