//frontend\components\settings\panels\PluginsPanel.tsx
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PanelIntro, PanelGroup, SettingsCard } from "./primitives";

export function PluginsPanel() {
  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Boxes}
        title="Plugins"
        description="Étendez les fonctionnalités de LeadCortex avec des modules tiers."
      />

      <PanelGroup label="Bibliothèque">
        <SettingsCard>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Boxes className="size-6" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-sm font-medium">Aucun plugin installé</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Parcourez la bibliothèque de plugins communautaires.
              </p>
            </div>
            <Button size="sm">Parcourir la bibliothèque</Button>
          </div>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
