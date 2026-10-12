//frontend\components\settings\panels\MemoryPanel.tsx
import { useState } from "react";
import { Brain, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PanelIntro, PanelGroup, SettingsCard, RowsCard, Row } from "./primitives";

export function MemoryPanel() {
  const [enabled, setEnabled] = useState(true);
  const [memories, setMemories] = useState([
    {
      id: "1",
      text: "Préfère les réponses courtes et directes, sans formule de politesse.",
      date: "il y a 2 jours",
    },
    {
      id: "2",
      text: "Cible principalement des fondateurs SaaS B2B en France.",
      date: "il y a 5 jours",
    },
    {
      id: "3",
      text: "Utilise le tutoiement dans les emails de prospection.",
      date: "il y a 1 semaine",
    },
  ]);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [clearAll, setClearAll] = useState(false);

  const confirmDeleteOne = () => {
    if (!toDelete) return;
    setMemories((cur) => cur.filter((x) => x.id !== toDelete));
    toast.success("Souvenir supprimé");
    setToDelete(null);
  };

  const confirmClearAll = () => {
    setMemories([]);
    toast.success("Tous les souvenirs ont été effacés");
    setClearAll(false);
  };

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Brain}
        title="Mémoire"
        description="LeadCortex peut retenir des informations entre les sessions pour personnaliser ses réponses."
      />

      <PanelGroup label="Activation">
        <RowsCard>
          <Row
            title="Activer la mémoire"
            description="Utiliser le contexte des échanges précédents."
          >
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label="Activer la mémoire"
            />
          </Row>
        </RowsCard>
      </PanelGroup>

      <PanelGroup label="Souvenirs enregistrés">
        <SettingsCard
          actions={
            memories.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setClearAll(true)}
              >
                Tout effacer
              </Button>
            ) : null
          }
        >
          {memories.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aucun souvenir enregistré.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {memories.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm">{m.text}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{m.date}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer ce souvenir"
                    onClick={() => setToDelete(m.id)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SettingsCard>
      </PanelGroup>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={confirmDeleteOne}
        title="Supprimer ce souvenir ?"
        description="L'IA ne le prendra plus en compte dans ses réponses futures."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />

      <ConfirmDialog
        open={clearAll}
        onOpenChange={setClearAll}
        onConfirm={confirmClearAll}
        title="Effacer tous les souvenirs ?"
        description="Cette action supprime définitivement tout ce que LeadCortex a mémorisé. Elle est irréversible."
        confirmLabel="Tout effacer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}
