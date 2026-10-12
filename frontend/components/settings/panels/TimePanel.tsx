//frontend\components\settings\panels\TimePanel.tsx
import { useState } from "react";
import { Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PanelIntro, PanelGroup, SettingsCard, RowsCard, Row } from "./primitives";

export function TimePanel() {
  const [length, setLength] = useState("concise");

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Clock}
        title="Temps et concision"
        description="Définissez la longueur et le niveau de détail des réponses générées."
      />

      <PanelGroup label="Longueur des réponses">
        <SettingsCard>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "concise", label: "Concis" },
              { value: "normal", label: "Normal" },
              { value: "detailed", label: "Détaillé" },
            ].map((opt) => {
              const active = length === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLength(opt.value)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 text-center text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/5 font-medium text-primary"
                      : "border-border hover:border-primary/30 hover:bg-surface/50",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Options">
        <RowsCard>
          <Row
            title="Inclure des exemples"
            description="Ajouter des illustrations concrètes dans les réponses."
          >
            <Switch defaultChecked aria-label="Inclure des exemples" />
          </Row>
          <Row
            title="Résumer en fin de message"
            description="Ajouter un TL;DR à la fin des réponses longues."
          >
            <Switch aria-label="Résumer en fin de message" />
          </Row>
        </RowsCard>
      </PanelGroup>
    </div>
  );
}
