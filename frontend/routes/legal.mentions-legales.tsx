//frontend\routes\legal.mentions-legales.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/legal/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — LeadCortex" },
      {
        name: "description",
        content: "Éditeur, hébergeur et directeur de publication du site LeadCortex.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "editeur", title: "1. Éditeur du site" },
  { id: "hebergeur", title: "2. Hébergement" },
  { id: "publication", title: "3. Directeur de publication" },
  { id: "propriete", title: "4. Propriété intellectuelle" },
  { id: "mediation", title: "5. Médiation" },
];

function Page() {
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Mentions légales"
      subtitle="Les informations d'identification requises pour tout site accessible depuis la France."
      lastUpdated="1er août 2026"
      sections={sections}
      currentHref="/legal/mentions-legales"
    >
      <p>
        Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie
        numérique, les informations suivantes sont mises à disposition des utilisateurs du site{" "}
        <em>app.leadcortex.io</em>.
      </p>

      <section>
        <h2 id="editeur">1. Éditeur du site</h2>
        <p>
          LeadCortex SAS
          <br />
          Siège social : [adresse à compléter]
          <br />
          SIREN : [à compléter] — RCS [ville à compléter]
          <br />
          Capital social : [à compléter]
          <br />
          Contact : <a href="mailto:contact@leadcortex.io">contact@leadcortex.io</a>
        </p>
      </section>

      <section>
        <h2 id="hebergeur">2. Hébergement</h2>
        <p>
          Le Service est hébergé par [nom de l'hébergeur à compléter], dont le siège social est
          situé [adresse de l'hébergeur à compléter]. Les données sont hébergées au sein de l'Union
          européenne.
        </p>
      </section>

      <section>
        <h2 id="publication">3. Directeur de publication</h2>
        <p>
          Le directeur de la publication est [nom à compléter], représentant légal de LeadCortex
          SAS.
        </p>
      </section>

      <section>
        <h2 id="propriete">4. Propriété intellectuelle</h2>
        <p>
          L'ensemble des éléments composant le site (textes, structure, identité visuelle, logo) est
          protégé au titre du droit d'auteur et du droit des marques. Toute reproduction non
          autorisée est susceptible de constituer une contrefaçon.
        </p>
      </section>

      <section>
        <h2 id="mediation">5. Médiation de la consommation</h2>
        <p>
          Conformément à l'article L. 616-1 du Code de la consommation, tout client peut recourir
          gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un
          litige, sans préjudice de la faculté de saisir la juridiction compétente. Les coordonnées
          du médiateur applicable sont communiquées sur demande à{" "}
          <a href="mailto:legal@leadcortex.io">legal@leadcortex.io</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
