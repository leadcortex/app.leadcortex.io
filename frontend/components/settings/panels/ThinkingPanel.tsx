//frontend\components\settings\panels\ThinkingPanel.tsx
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PanelIntro, PanelGroup, SettingsCard, RowsCard, Row } from "./primitives";

export function ThinkingPanel() {
  const [depth, setDepth] = useState("balanced");
  const [showSteps, setShowSteps] = useState(true);
  const [extended, setExtended] = useState(false);

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Lightbulb}
        title="Réfléchir"
        description="Contrôlez la profondeur d'analyse et la façon dont LeadCortex raisonne."
      />

      <PanelGroup label="Profondeur d'analyse">
        <SettingsCard description="Compromis entre vitesse et précision.">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "fast", label: "Rapide", desc: "Réponses immédiates" },
              { value: "balanced", label: "Équilibré", desc: "Bon compromis" },
              { value: "deep", label: "Approfondi", desc: "Analyse complète" },
            ].map((opt) => {
              const active = depth === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDepth(opt.value)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-surface/50",
                  )}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Options avancées">
        <RowsCard>
          <Row
            title="Afficher le raisonnement"
            description="Dérouler les étapes intermédiaires avant la réponse finale."
          >
            <Switch
              checked={showSteps}
              onCheckedChange={setShowSteps}
              aria-label="Afficher le raisonnement"
            />
          </Row>
          <Row
            title="Réflexion étendue"
            description="Allouer plus de temps de calcul pour les tâches complexes."
          >
            <Switch
              checked={extended}
              onCheckedChange={setExtended}
              aria-label="Réflexion étendue"
            />
          </Row>
        </RowsCard>
      </PanelGroup>
    </div>
  );
}
