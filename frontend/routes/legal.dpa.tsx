//frontend\routes\legal.dpa.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/legal/dpa")({
  head: () => ({
    meta: [
      { title: "Accord de traitement des données (DPA) — LeadCortex" },
      {
        name: "description",
        content:
          "L'accord de traitement des données de LeadCortex : rôle, sous-traitants ultérieurs, garanties de sécurité et assistance RGPD.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "objet", title: "1. Objet et rôles" },
  { id: "instructions", title: "2. Instructions documentées" },
  { id: "sous-traitants", title: "3. Sous-traitants ultérieurs" },
  { id: "securite", title: "4. Mesures de sécurité" },
  { id: "assistance", title: "5. Assistance et notification" },
  { id: "audit", title: "6. Droit d'audit" },
  { id: "restitution", title: "7. Restitution et suppression" },
  { id: "activation", title: "8. Comment l'activer" },
];

function Page() {
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Accord de traitement des données"
      subtitle="Pour les équipes soumises au RGPD ou qui doivent documenter leur revue fournisseur."
      lastUpdated="1er août 2026"
      sections={sections}
      currentHref="/legal/dpa"
    >
      <p>
        Ce document (« DPA », Data Processing Agreement) complète les CGU lorsque LeadCortex agit en
        tant que sous-traitant au sens de l'article 28 du RGPD, pour les données de prospection que
        vous importez ou collectez via le Service. Il s'applique automatiquement à tout client
        professionnel, sans démarche supplémentaire, et peut être cité tel quel dans votre registre
        des traitements ou votre revue fournisseur.
      </p>

      <section>
        <h2 id="objet">1. Objet et rôles</h2>
        <p>
          Vous agissez en tant que <strong>responsable de traitement</strong> pour les données de
          prospection que vous traitez via LeadCortex (contacts, entreprises, historique
          d'échanges). LeadCortex agit en tant que <strong>sous-traitant</strong>, et traite ces
          données exclusivement pour exécuter les instructions documentées correspondant aux
          fonctionnalités du Service que vous activez.
        </p>
      </section>

      <section>
        <h2 id="instructions">2. Instructions documentées</h2>
        <p>
          Les instructions du responsable de traitement sont matérialisées par votre paramétrage du
          Service : recherches lancées, enrichissements déclenchés, séquences configurées, workflows
          activés. LeadCortex ne traite ces données à aucune autre fin, et notamment pas à des fins
          d'entraînement de modèles d'intelligence artificielle propriétaires.
        </p>
      </section>

      <section>
        <h2 id="sous-traitants">3. Sous-traitants ultérieurs</h2>
        <p>
          LeadCortex fait appel à un nombre restreint de sous-traitants ultérieurs pour
          l'hébergement, l'enrichissement de données et, sur activation volontaire, les fournisseurs
          de modèles IA que vous connectez vous-même (BYOK). Chaque sous-traitant ultérieur est lié
          par un contrat imposant des garanties équivalentes à celles du présent accord. La liste à
          jour est communiquée sur demande à{" "}
          <a href="mailto:legal@leadcortex.io">legal@leadcortex.io</a>, avec un préavis en cas
          d'ajout d'un nouveau sous-traitant.
        </p>
      </section>

      <section>
        <h2 id="securite">4. Mesures de sécurité</h2>
        <p>
          Chiffrement en transit et au repos, isolation logique des données par workspace, gestion
          des accès selon le principe du moindre privilège, journalisation des accès sensibles. Le
          détail complet est disponible sur la page <a href="/security">Sécurité</a>.
        </p>
      </section>

      <section>
        <h2 id="assistance">5. Assistance et notification</h2>
        <p>
          LeadCortex vous assiste dans le respect de vos obligations RGPD : réponse aux demandes
          d'exercice de droits concernant les données que vous traitez, mise à disposition des
          informations nécessaires à votre analyse d'impact si requise. En cas de violation de
          données affectant vos données de prospection, vous êtes notifié dans les meilleurs délais
          et au plus tard 72 heures après la détection de l'incident.
        </p>
      </section>

      <section>
        <h2 id="audit">6. Droit d'audit</h2>
        <p>
          Vous pouvez demander une revue documentaire des mesures de sécurité en vigueur. Un audit
          sur site ou par un tiers indépendant peut être organisé sur demande écrite préalable,
          selon des modalités raisonnables convenues entre les parties.
        </p>
      </section>

      <section>
        <h2 id="restitution">7. Restitution et suppression</h2>
        <p>
          À la résiliation du contrat, vos données de prospection peuvent être exportées depuis le
          Service. Elles sont ensuite supprimées définitivement au terme du délai de 30 jours décrit
          dans la politique de confidentialité, sauf obligation légale contraire.
        </p>
      </section>

      <section>
        <h2 id="activation">8. Comment l'activer formellement</h2>
        <p>
          Ce DPA s'applique de plein droit à tout usage professionnel du Service. Si votre processus
          interne exige une version signée nominativement, écrivez à{" "}
          <a href="mailto:legal@leadcortex.io">legal@leadcortex.io</a> en précisant votre raison
          sociale : une version contresignée vous est envoyée sous 5 jours ouvrés.
        </p>
      </section>
    </LegalLayout>
  );
}
