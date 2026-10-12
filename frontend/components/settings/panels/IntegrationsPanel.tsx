//frontend\components\settings\panels\IntegrationsPanel.tsx
import { AlertCircle, Link2, LockKeyhole, ShieldCheck } from "lucide-react";
import { ConnectionsBlock } from "./ConnectionsBlock";
import { PanelIntro, PanelGroup, SettingsCard } from "./primitives";

export function IntegrationsPanel() {
  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Link2}
        title="Intégrations"
        description="Connectez vos comptes Google, Microsoft ou LinkedIn pour activer la connexion OAuth et l'accès à votre boîte mail."
      />

      <PanelGroup label="Comptes connectés">
        <ConnectionsBlock />
      </PanelGroup>

      <PanelGroup label="Configuration OAuth">
        <SettingsCard title="Scope Gmail restreint" icon={AlertCircle}>
          <p className="text-xs leading-relaxed text-muted-foreground">
            L'accès complet à Gmail (lecture et envoi) est un scope restreint chez Google. En
            production, il nécessite une{" "}
            <b className="text-foreground">vérification d'application</b>. En phase de test, l'accès
            est limité à 100 utilisateurs.
          </p>
        </SettingsCard>

        <SettingsCard title="Stockage chiffré" icon={ShieldCheck}>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Access tokens et refresh tokens sont stockés chiffrés au repos. Aucune clé n'est jamais
            exposée au navigateur.
          </p>
        </SettingsCard>

        <SettingsCard title="Révocation" icon={LockKeyhole}>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Vous pouvez révoquer un accès à tout moment. Les mails copiés et les tokens associés
            sont alors supprimés (conformité RGPD).
          </p>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
