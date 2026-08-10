import { Outlet, createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "../../lib/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    return requireAuth(
      `${location.pathname}${location.searchStr}${location.hash}`,
    );
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
