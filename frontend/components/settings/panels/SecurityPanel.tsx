//frontend\components\settings\panels\SecurityPanel.tsx
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { PanelIntro, PanelGroup, SettingsCard, Row } from "./primitives";

export function SecurityPanel() {
  const [sessions, setSessions] = useState([
    {
      id: "s_current",
      device: "Chrome · Maurice",
      meta: "Session actuelle · ouverte à l'instant",
      current: true,
    },
    {
      id: "s_other",
      device: "Safari · Paris",
      meta: "Dernière activité : il y a 3 jours",
      current: false,
    },
  ]);
  const [toRevoke, setToRevoke] = useState<(typeof sessions)[number] | null>(null);

  const confirmRevoke = () => {
    if (!toRevoke) return;
    setSessions((prev) => prev.filter((s) => s.id !== toRevoke.id));
    toast.success("Session révoquée");
    setToRevoke(null);
  };

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={ShieldCheck}
        title="Sécurité"
        description="Contrôlez les accès à votre espace et l'usage de vos données."
      />

      <PanelGroup label="Authentification">
        <SettingsCard
          title="Protection du compte"
          description="Renforcez la sécurité de votre connexion."
        >
          <div className="divide-y divide-border">
            <Row
              title="Authentification à deux facteurs"
              description="Vérification supplémentaire à chaque connexion."
            >
              <Switch aria-label="Activer l'authentification à deux facteurs" />
            </Row>
            <Row
              title="Alertes de connexion"
              description="Recevez un e-mail lors d'une connexion inhabituelle."
            >
              <Switch defaultChecked aria-label="Activer les alertes de connexion" />
            </Row>
            <Row
              title="Verrouillage automatique"
              description="Verrouille après 30 minutes d'inactivité."
            >
              <Switch defaultChecked aria-label="Activer le verrouillage automatique" />
            </Row>
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Données">
        <SettingsCard
          title="Préférences de données"
          description="Contrôlez l'usage qui est fait de vos données."
        >
          <div className="divide-y divide-border">
            <Row
              title="Métadonnées de localisation"
              description="Utiliser la localisation approximative pour améliorer les résultats."
            >
              <Switch defaultChecked aria-label="Utiliser les métadonnées de localisation" />
            </Row>
            <Row
              title="Contribuer à l'amélioration des modèles"
              description="Autoriser l'usage anonymisé pour entraîner les modèles."
            >
              <Switch defaultChecked aria-label="Contribuer à l'amélioration des modèles" />
            </Row>
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Sessions actives">
        <SettingsCard
          title="Appareils connectés"
          description="Révoquez un accès si vous ne reconnaissez pas une session."
        >
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg",
                      s.current ? "bg-success/10 text-success" : "bg-surface text-muted-foreground",
                    )}
                  >
                    <ShieldCheck className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.device}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{s.meta}</p>
                  </div>
                </div>
                {s.current ? (
                  <span className="shrink-0 text-[10px] font-medium text-success">Active</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setToRevoke(s)}
                  >
                    Révoquer
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </SettingsCard>
      </PanelGroup>

      <ConfirmDialog
        open={!!toRevoke}
        onOpenChange={(v) => !v && setToRevoke(null)}
        onConfirm={confirmRevoke}
        title="Révoquer cette session ?"
        description={`L'appareil « ${toRevoke?.device ?? ""} » devra se reconnecter à votre prochaine utilisation.`}
        confirmLabel="Révoquer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </div>
  );
}
