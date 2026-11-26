// frontend/components/settings/panels/IntegrationsPanel.tsx

import { AlertCircle, Link2, LockKeyhole, ShieldCheck } from "@/components/icons";
import { ConnectionsBlock } from "./ConnectionsBlock";
import { PanelIntro, PanelGroup, SettingsCard } from "./primitives";

export function IntegrationsPanel() {
  return (
    <div className="space-y-8 md:space-y-12">
      <PanelIntro
        title="Intégrations"
        description="Connectez Google, Microsoft ou LinkedIn pour vous connecter avec ces comptes et lire votre boîte mail."
      />

      <PanelGroup label="Comptes connectés">
        <ConnectionsBlock />
      </PanelGroup>

      <PanelGroup label="Configuration OAuth">
        <SettingsCard title="Scope Gmail restreint">
          <p className="text-xs leading-relaxed text-muted-foreground">
            La première version demande uniquement le scope de lecture Gmail. Google le classe parmi
            les scopes sensibles ou restreints selon l’usage ; une{" "}
            <b className="text-foreground">vérification d'application</b> peut être exigée avant la
            production. En phase de test, l’accès est limité aux utilisateurs de test configurés.
          </p>
        </SettingsCard>

        <SettingsCard title="Stockage chiffré">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Access tokens et refresh tokens sont stockés chiffrés au repos. Aucune clé n'est jamais
            exposée au navigateur.
          </p>
        </SettingsCard>

        <SettingsCard title="Révocation">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Vous pouvez révoquer un accès à tout moment. La révocation supprime les jetons et les
            métadonnées du compte stockés par LeadCortex ; les messages ne sont pas copiés en base.
          </p>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
