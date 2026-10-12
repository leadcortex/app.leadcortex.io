//frontend\routes\docs.workflows.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout, DocCallout } from "@/components/docs-layout";

export const Route = createFileRoute("/docs/workflows")({
  head: () => ({
    meta: [
      { title: "L'éditeur de workflows — Documentation" },
      {
        name: "description",
        content:
          "Comprendre les blocs, les connexions et l'exécution de l'éditeur de workflows visuel de LeadCortex.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsLayout
      eyebrow="Automatisation"
      title="L'éditeur de workflows"
      description="Blocs, connexions, exécution — construire un pipeline visuel."
      currentHref="/docs/workflows"
      readingTime="6 min"
    >
      <p>
        L'éditeur de workflows est un canevas visuel qui permet d'enchaîner des blocs —
        déclencheurs, actions, conditions — pour automatiser un pipeline complet, de la détection
        d'un signal jusqu'à l'entrée en séquence, sans écrire une ligne de code.
      </p>

      {/* ⚠️ ACCÈS : workflow est réservé aux plans payants */}
      <DocCallout tone="warning" title="Accès réservé aux plans payants">
        <p>
          L'éditeur de workflows n'est <strong>pas inclus dans l'essai gratuit</strong>. Il
          nécessite un abonnement actif (Founder ou Studio). Cette exclusion s'explique par les
          coûts d'infrastructure élevés (exécution continue, stockage d'historique, files
          d'attente), qui ne sont pas soutenables sur un essai illimité.
        </p>
        <p className="mt-2">
          Pour comparer les exécutions incluses par plan, voir la{" "}
          <Link to="/pricing">page tarifs</Link>.
        </p>
      </DocCallout>

      <h2 id="blocs">Les catégories de blocs</h2>
      <p>Chaque bloc appartient à une catégorie, identifiable par sa couleur sur le canevas :</p>
      <ul>
        <li>
          <strong>Déclencheurs</strong> — nouveau signal détecté, prospect ajouté à une liste,
          réponse reçue, échéance atteinte.
        </li>
        <li>
          <strong>Actions</strong> — enrichir un profil, ajouter à une séquence, créer une tâche,
          notifier sur Slack, appeler un webhook.
        </li>
        <li>
          <strong>Conditions</strong> — bifurcation selon un score, un secteur, une donnée enrichie
          ou le résultat d'une étape précédente.
        </li>
        <li>
          <strong>IA</strong> — génération de contenu, scoring personnalisé, résumé, extraction de
          données. Ces blocs s'appuient sur votre équipe IA (recherche + travail) et peuvent être
          ciblés différemment selon la nature de la tâche.
        </li>
      </ul>

      <h2 id="connexions">Connexions et contraintes</h2>
      <p>
        Les blocs se relient en tirant un câble d'un port de sortie vers un port d'entrée. Le moteur
        de contraintes empêche les connexions incohérentes — par exemple relier une action d'envoi
        d'email directement à un déclencheur, ou enchaîner deux blocs incompatibles au niveau du
        contexte de données qu'ils manipulent. Une connexion refusée s'accompagne toujours d'une
        explication au survol.
      </p>
      <DocCallout tone="info" title="Insertion sur un câble existant">
        <p>
          Glissez-déposez un nouveau bloc directement sur un câble existant pour l'insérer entre
          deux blocs déjà connectés — les deux connexions se reforment automatiquement autour du
          nouveau bloc.
        </p>
      </DocCallout>

      <h2 id="execution">Exécution et suivi</h2>
      <p>
        Un workflow peut être exécuté manuellement pour un test, ou activé pour tourner en continu
        sur les déclencheurs configurés. L'historique d'exécution conserve, pour chaque passage,
        l'état de chaque bloc et les données qui ont transité — utile pour diagnostiquer pourquoi un
        prospect n'a pas suivi le chemin attendu.
      </p>

      <h2 id="collaboration">Workflows partagés</h2>
      <p>
        Dans un workspace d'équipe, les workflows sont partagés comme le reste : n'importe quel
        membre autorisé peut les consulter, les dupliquer ou les modifier. Un éditeur qui ouvre un
        workflow s'ouvre dans un nouvel onglet, ce qui évite d'interrompre une campagne en cours
        quand on bascule sur un autre chantier.
      </p>

      <h2 id="organisation">Organiser un canevas complexe</h2>
      <p>
        Sur des workflows à plusieurs dizaines de blocs, l'auto-layout réorganise le canevas selon
        une disposition arborescente lisible, et le routage des câbles évite automatiquement de
        passer au-dessus des blocs. Le mode « Curseur intelligent » bascule automatiquement entre
        sélection et déplacement du canevas selon le contexte, avec un pan automatique lorsque vous
        approchez du bord pendant un glisser-déposer.
      </p>

      <h2 id="mobile">Utilisation sur mobile</h2>
      <p>
        Le canevas est utilisable au doigt : pincer pour zoomer, un appui à deux doigts équivaut à
        un clic droit, et un appui long ouvre une sélection par lasso. Les panneaux de configuration
        des blocs s'adaptent au clavier virtuel pour rester visibles pendant la saisie.
      </p>
      <p>
        Pour connecter un workflow à un modèle IA personnalisé, voir{" "}
        <Link to="/docs/integrations-ia">Modèles IA & BYOK</Link>.
      </p>
    </DocsLayout>
  );
}
