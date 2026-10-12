//frontend\routes\app.settings.tsx
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSettings } from "@/components/settings/settings-context";

/**
 * Ancienne page « Réglages ». Elle est désormais remplacée par une modale
 * globale pilotée par `SettingsProvider` + `SettingsModal`.
 *
 * Cette route reste déclarée pour :
 *  - supporter les deep-links (`/app/settings`, `/app/settings/billing`)
 *  - préserver les appels `navigate({ to: "/app/settings" })` existants
 *
 * Au montage, elle ouvre la modale sur la section appropriée puis redirige
 * vers le dashboard pour ne pas laisser l'URL sur une page vide.
 */
export const Route = createFileRoute("/app/settings")({
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
