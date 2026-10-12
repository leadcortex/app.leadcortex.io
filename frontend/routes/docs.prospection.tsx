//frontend\routes\docs.prospection.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout, DocCallout } from "@/components/docs-layout";

export const Route = createFileRoute("/docs/prospection")({
  head: () => ({
    meta: [
      { title: "Recherche par langage naturel — Documentation" },
      {
        name: "description",
        content:
          "Écrire des requêtes de prospection efficaces sur LeadCortex et affiner avec les filtres firmographiques et les signaux d'intention.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsLayout
      eyebrow="Prospection & données"
      title="Recherche par langage naturel"
      description="Écrire des requêtes efficaces et affiner avec les bons filtres."
      currentHref="/docs/prospection"
      readingTime="5 min"
    >
      <p>
        La recherche de LeadCortex part d'une phrase, pas d'un formulaire. L'IA de recherche
        interprète votre description de cible, la traduit en critères structurés, puis vous laisse
        ajuster manuellement chaque filtre. L'objectif : obtenir une liste pertinente en une
        itération, pas en dix.
      </p>

      <h2 id="ecrire">Écrire une bonne requête</h2>
      <p>
        Une requête efficace combine trois éléments : <strong>qui</strong> (fonction, séniorité),{" "}
        <strong>où</strong> (entreprise, secteur, taille) et <strong>pourquoi maintenant</strong>{" "}
        (signal). Plus ces trois éléments sont explicites, plus la première liste sera exploitable
        sans retouche.
      </p>
      <ul>
        <li>
          <strong>Trop vague :</strong> « des décideurs marketing »
        </li>
        <li>
          <strong>Efficace :</strong> « responsables marketing dans des scale-up SaaS B2B de 50 à
          200 personnes en Europe, ayant recruté un poste growth dans les 3 derniers mois »
        </li>
      </ul>

      <h2 id="filtres">Les filtres firmographiques</h2>
      <p>
        Une fois la requête interprétée, affinez avec les filtres classiques : taille d'équipe,
        secteur d'activité (NAF/SIC), localisation, stack technique détectée, ancienneté de
        l'entreprise. Ces filtres se combinent librement et se sauvegardent dans une recherche pour
        être réutilisés.
      </p>

      <h2 id="signaux">Signaux d'intention</h2>
      <p>
        Au-delà des données statiques, LeadCortex surface des signaux qui indiquent un moment
        propice à la prise de contact : levée de fonds récente, recrutement actif sur un poste lié à
        votre offre, changement de poste d'un décideur, mention dans la presse spécialisée. Ces
        signaux sont disponibles à partir du plan Founder.
      </p>
      <DocCallout tone="info" title="Pourquoi les signaux comptent">
        <p>
          Un message envoyé dans les jours qui suivent un signal pertinent obtient structurellement
          un meilleur taux de réponse qu'un message envoyé « à froid ». Les signaux ne remplacent
          pas un bon ciblage : ils indiquent le bon moment sur une cible déjà qualifiée.
        </p>
      </DocCallout>

      <h2 id="scoring">Le scoring de correspondance</h2>
      <p>
        Chaque prospect affiche un score basé sur la proximité avec votre ICP déclaré et sur votre
        historique de validation. Marquer des profils comme pertinents ou non affine progressivement
        ce score pour les recherches suivantes — l'équipe IA apprend de vos décisions, pas
        l'inverse.
      </p>

      <h2 id="collaboration">Recherches partagées</h2>
      <p>
        Dans un workspace d'équipe, les recherches sauvegardées sont visibles par tous les membres.
        Chacun peut les relancer, les dupliquer ou les modifier, sans dupliquer la donnée. Pratique
        pour aligner une équipe commerciale sur les mêmes segments prioritaires.
      </p>

      <h2 id="listes">Depuis la recherche vers l'action</h2>
      <p>
        Une fois votre liste stabilisée, trois chemins s'offrent à vous : l'enrichir (voir{" "}
        <Link to="/docs/enrichissement">Comprendre les crédits d'enrichissement</Link>), l'ajouter à
        une séquence existante (voir <Link to="/docs/sequences">Séquences & outreach</Link>), ou
        l'exporter en CSV pour un usage externe.
      </p>
    </DocsLayout>
  );
}
