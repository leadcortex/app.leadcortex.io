//frontend\routes\docs.enrichissement.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout, DocCallout } from "@/components/docs-layout";

export const Route = createFileRoute("/docs/enrichissement")({
  head: () => ({
    meta: [
      { title: "Comprendre les crédits d'enrichissement — Documentation" },
      {
        name: "description",
        content:
          "Comment sont consommés les crédits d'enrichissement sur LeadCortex, le fonctionnement du waterfall de providers et comment éviter le gaspillage.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsLayout
      eyebrow="Démarrage"
      title="Comprendre les crédits d'enrichissement"
      description="Ce qui consomme un crédit, ce qui n'en consomme pas, et comment optimiser."
      currentHref="/docs/enrichissement"
      readingTime="4 min"
    >
      <p>
        L'enrichissement est l'étape où l'IA de recherche va chercher — email vérifié, téléphone
        direct, données firmographiques — auprès de plusieurs fournisseurs de données. C'est la
        seule action de la plateforme qui consomme des crédits, et ce mécanisme mérite d'être bien
        compris pour ne pas en gaspiller.
      </p>

      <h2 id="waterfall">Le principe du waterfall</h2>
      <p>
        Plutôt que d'interroger un seul fournisseur, LeadCortex utilise un{" "}
        <strong>waterfall</strong> : plusieurs sources de données sont interrogées dans un ordre
        optimisé jusqu'à obtenir un résultat vérifié. Dès qu'une source répond avec une donnée
        fiable, la chaîne s'arrête — vous ne payez pas pour des appels redondants aux fournisseurs
        suivants.
      </p>
      <p>
        Ce fonctionnement augmente le taux de succès (un email introuvable chez un fournisseur l'est
        souvent chez un autre) tout en gardant le coût prévisible : un crédit correspond à un
        enrichissement <em>abouti</em>, pas à une tentative.
      </p>

      <h2 id="cout">Ce qui coûte un crédit</h2>
      <ul>
        <li>Un email professionnel trouvé et vérifié par SMTP.</li>
        <li>Un numéro de téléphone direct identifié (plans Founder et Studio).</li>
        <li>Une fiche entreprise enrichie à la demande (effectifs, stack, levées récentes).</li>
      </ul>
      <p>
        À l'inverse, la recherche de prospects, la consultation des fiches déjà enrichies, la
        création de séquences, l'usage de l'éditeur de workflows et les exports CSV sont{" "}
        <strong>gratuits et illimités</strong> — seule la donnée neuve obtenue auprès d'un
        fournisseur externe est facturée en crédits.
      </p>
      <p>
        L'usage des agents IA (rédaction, scoring, résumé, chat) ne consomme <strong>aucun</strong>{" "}
        crédit d'enrichissement : soit vous utilisez les modèles inclus, soit vous branchez vos
        propres clés (BYOK) et payez directement votre fournisseur IA.
      </p>

      <h2 id="echec">Et en cas d'échec ?</h2>
      <p>
        Si aucun fournisseur du waterfall ne parvient à vérifier une donnée, aucun crédit n'est
        décompté. Le profil reste marqué « non enrichi » et vous pouvez retenter plus tard : les
        bases de données de nos fournisseurs évoluent en continu.
      </p>
      <DocCallout tone="success" title="Astuce">
        <p>
          Enrichissez en priorité les listes déjà filtrées et scorées plutôt que des exports bruts.
          Un enrichissement ciblé sur 50 prospects qualifiés vaut mieux qu'un enrichissement en
          masse sur 500 profils dont la moitié ne correspond pas à votre ICP.
        </p>
      </DocCallout>

      <h2 id="quota">Suivre votre consommation</h2>
      <p>
        Le solde de crédits est visible en permanence dans la barre latérale de l'application, et le
        détail par action est consultable dans <em>Réglages → Facturation</em>. Les crédits se
        renouvellent au début de chaque cycle de facturation et ne sont pas cumulables d'un mois sur
        l'autre, sauf mention contraire sur votre plan.
      </p>
      <p>
        Le détail des quotas par plan (Starter, Founder, Studio) est disponible sur la{" "}
        <Link to="/pricing">page tarifs</Link>.
      </p>
    </DocsLayout>
  );
}
