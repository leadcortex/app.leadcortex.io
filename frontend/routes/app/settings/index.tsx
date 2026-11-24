// frontend/routes/app/settings/index.tsx

import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSettings } from "@/components/settings/settings-context";

export const Route = createFileRoute("/app/settings/")({
  component: SettingsRedirect,
});

function SettingsRedirect() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { openSettings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const isBilling = pathname.startsWith("/app/settings/billing");
    openSettings(isBilling ? "billing" : "general");
    navigate({ to: "/app", replace: true });
  }, [pathname, openSettings, navigate]);

  return null;
}
