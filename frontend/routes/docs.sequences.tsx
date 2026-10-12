//frontend\routes\docs.sequences.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout, DocCallout } from "@/components/docs-layout";

export const Route = createFileRoute("/docs/sequences")({
  head: () => ({
    meta: [
      { title: "Séquences & outreach — Documentation" },
      {
        name: "description",
        content:
          "Construire des séquences multi-étapes sur LeadCortex, personnaliser les messages avec l'IA de travail et suivre les réponses.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsLayout
      eyebrow="Prospection & données"
      title="Séquences & outreach"
      description="Construire des séquences multi-étapes et suivre les réponses."
      currentHref="/docs/sequences"
      readingTime="5 min"
    >
      <p>
        Une séquence est une suite d'étapes programmées — email, tâche manuelle, appel, délai
        d'attente — que LeadCortex exécute automatiquement pour chaque prospect qui y entre. C'est
        le mécanisme qui transforme une liste de contacts enrichis en conversations réelles.
      </p>

      <h2 id="structure">Structure d'une séquence</h2>
      <p>
        Chaque étape a un type et un délai par rapport à l'étape précédente. Une séquence type
        ressemble à : email d'ouverture → attente de 3 jours → relance conditionnée à l'absence de
        réponse → attente de 4 jours → tâche manuelle « appeler » pour les comptes prioritaires.
      </p>
      <p>
        Les conditions de branchement (a répondu / n'a pas répondu / a ouvert sans répondre)
        permettent d'adapter automatiquement la suite du parcours sans intervention manuelle.
      </p>

      <h2 id="personnalisation">Personnalisation des messages</h2>
      <p>
        Chaque email peut inclure des variables issues des données enrichies du prospect (prénom,
        entreprise, poste, signal détecté) ainsi qu'une génération assistée par l'IA de travail, qui
        rédige une accroche contextualisée à partir du signal ayant motivé la prise de contact. Vous
        restez toujours en contrôle final : rien n'est envoyé sans validation du template.
      </p>
      <DocCallout tone="warning" title="Personnalisation vs volume">
        <p>
          Une séquence hyper-personnalisée sur 30 comptes stratégiques convertit presque toujours
          mieux qu'un envoi générique sur 300 comptes. LeadCortex facilite le volume, mais ne le
          rend pas automatiquement plus efficace que le ciblage.
        </p>
      </DocCallout>

      <h2 id="ab">Tests A/B</h2>
      <p>
        À partir du plan Founder, chaque étape d'email peut recevoir plusieurs variantes, réparties
        automatiquement sur les prospects entrants. Les taux d'ouverture, de réponse et de clic sont
        suivis par variante pour identifier l'accroche la plus efficace.
      </p>

      <h2 id="delivrabilite">Délivrabilité</h2>
      <p>
        L'envoi passe par votre propre domaine connecté (SPF, DKIM et DMARC configurés via
        l'assistant de <em>Réglages → Capacités</em>) et un warmup progressif est recommandé avant
        tout envoi en volume sur un domaine neuf. Les plans Founder et Studio incluent un warmup
        automatique.
      </p>

      <h2 id="suivi">Suivi et pilotage</h2>
      <p>
        Le tableau <em>Séquences</em> affiche pour chaque campagne le nombre de prospects actifs, le
        taux de réponse et les prochaines actions prévues. Les métriques détaillées par étape sont
        disponibles dans <em>Analyses</em>, utile pour repérer l'étape où la conversation décroche
        le plus souvent.
      </p>

      <h2 id="collaboration">Séquences partagées</h2>
      <p>
        Dans un workspace d'équipe, chaque séquence est visible par tous les membres, avec un
        indicateur du créateur. Le filtrage par propriétaire permet de séparer ce qui relève de
        chaque SDR ou AE. Les modifications sont tracées dans l'historique du workspace.
      </p>

      <p>
        Pour automatiser l'entrée en séquence directement depuis un signal détecté ou un
        enrichissement réussi, voir <Link to="/docs/workflows">L'éditeur de workflows</Link>.
      </p>
    </DocsLayout>
  );
}
