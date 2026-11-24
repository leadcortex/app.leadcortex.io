// frontend/routes/app/leadex-ia/route.tsx

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { LeadexPage } from "@/components/leadex-ia/leadex-page";

export const Route = createFileRoute("/app/leadex-ia")({
  head: () => ({ meta: [{ title: "Leadex IA — LeadCortex" }] }),
  component: LeadexRoute,
});

function LeadexRoute() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isIndexRoute = pathname === "/app/leadex-ia" || pathname === "/app/leadex-ia/";
  if (!isIndexRoute) return <Outlet />;
  return <LeadexPage />;
}
