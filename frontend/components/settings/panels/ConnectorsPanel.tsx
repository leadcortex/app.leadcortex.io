//frontend\components\settings\panels\ConnectorsPanel.tsx
import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelIntro, PanelGroup, SettingsCard } from "./primitives";

export function ConnectorsPanel() {
  const connectors = [
    { name: "Slack", desc: "Notifications et commandes slash.", connected: true },
    { name: "Notion", desc: "Import de bases et pages.", connected: false },
    { name: "HubSpot", desc: "Synchronisation des contacts.", connected: false },
  ];

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Plug}
        title="Connecteurs"
        description="Connectez vos services externes à LeadCortex."
      />

      <PanelGroup label="Services disponibles">
        <SettingsCard
          title="Connexions tierces"
          description="Activez ou gérez les services connectés."
        >
          <div className="divide-y divide-border">
            {connectors.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.connected && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-medium text-success">
                        Connecté
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <Button size="sm" variant={c.connected ? "outline" : "default"}>
                  {c.connected ? "Gérer" : "Connecter"}
                </Button>
              </div>
            ))}
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Comptes de connexion">
        <SettingsCard>
          <p className="text-[11px] text-muted-foreground">
            Les connexions Google, Microsoft et LinkedIn se trouvent dans{" "}
            <b className="text-foreground">Sécurité &amp; Vie privée → Intégrations</b>.
          </p>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
