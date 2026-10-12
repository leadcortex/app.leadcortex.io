//frontend\routes\legal.cgv.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/legal/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions Générales de Vente — LeadCortex" },
      {
        name: "description",
        content:
          "Les conditions générales de vente de LeadCortex : tarifs, paiement, résiliation, disponibilité et responsabilité.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "objet", title: "1. Objet" },
  { id: "description-service", title: "2. Description du service SaaS" },
  { id: "tarifs-paiement", title: "3. Tarifs et paiement" },
  { id: "retractation", title: "4. Droit de rétractation (B2B)" },
  { id: "resiliation", title: "5. Résiliation" },
  { id: "disponibilite-sla", title: "6. Disponibilité et SLA" },
  { id: "limite-responsabilite", title: "7. Limite de responsabilité" },
  { id: "droit-applicable", title: "8. Droit applicable" },
];

function Page() {
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Conditions Générales de Vente"
      subtitle="Les modalités commerciales applicables à la souscription et à l'utilisation payante de LeadCortex."
      lastUpdated="[À compléter]"
      sections={sections}
      currentHref="/legal/cgv"
    >
      <p>
        Les présentes Conditions Générales de Vente (« CGV ») régissent toute souscription à une
        offre payante de la plateforme LeadCortex (« le Service »), éditée par{" "}
        <strong>[À compléter — dénomination sociale de l'éditeur]</strong>. Elles complètent les
        Conditions Générales d'Utilisation et prévalent sur celles-ci pour tout ce qui concerne les
        aspects commerciaux et financiers de la relation contractuelle.
      </p>

      <section>
        <h2 id="objet">1. Objet</h2>
        <p>
          Les présentes CGV ont pour objet de définir les conditions dans lesquelles{" "}
          <strong>[À compléter — dénomination sociale]</strong>, immatriculée au{" "}
          <strong>[À compléter — RCS / SIREN]</strong>, dont le siège social est situé{" "}
          <strong>[À compléter — adresse du siège social]</strong>, commercialise l'accès au Service
          auprès de sa clientèle professionnelle (« le Client »).
        </p>
        <p>
          Toute souscription à une offre payante implique l'acceptation sans réserve des présentes
          CGV, à l'exclusion de toute autre condition, notamment celles pouvant figurer dans les
          documents du Client.
        </p>
      </section>

      <section>
        <h2 id="description-service">2. Description du service SaaS</h2>
        <p>
          LeadCortex est un logiciel de prospection commerciale B2B fourni en mode SaaS (logiciel en
          tant que service), accessible par navigateur sans installation locale. Le Service permet
          notamment la recherche et l'enrichissement de données de prospects, la construction de
          séquences de prospection et l'automatisation via un éditeur de workflows.
        </p>
        <p>
          Les fonctionnalités précises incluses dans chaque offre, ainsi que les éventuels quotas ou
          limites d'usage associés, sont décrites sur la page tarifs en vigueur au moment de la
          souscription.{" "}
          <strong>[À compléter — préciser le périmètre exact par plan si nécessaire]</strong>.
        </p>
      </section>

      <section>
        <h2 id="tarifs-paiement">3. Tarifs et paiement</h2>
        <p>
          Les tarifs applicables sont ceux affichés sur la page tarifs du site à la date de la
          souscription, exprimés en euros{" "}
          <strong>[À compléter — préciser HT/TTC selon régime de TVA applicable]</strong>.
          LeadCortex se réserve le droit de modifier ses tarifs à tout moment, les nouveaux tarifs
          n'étant applicables aux abonnements en cours qu'à compter du renouvellement suivant, sous
          réserve d'une notification préalable de{" "}
          <strong>[À compléter — délai, ex. 30 jours]</strong>.
        </p>
        <p>
          Le paiement s'effectue par prélèvement automatique via le prestataire de paiement{" "}
          <strong>[À compléter — ex. Stripe]</strong>, selon une périodicité{" "}
          <strong>[À compléter — mensuelle/annuelle]</strong>. Toute période commencée est due dans
          son intégralité. En cas d'échec de paiement, LeadCortex peut suspendre l'accès au Service
          après relance restée sans effet pendant <strong>[À compléter — délai de relance]</strong>.
        </p>
      </section>

      <section>
        <h2 id="retractation">4. Droit de rétractation (B2B)</h2>
        <p>
          Conformément à l'article L221-3 du Code de la consommation, le droit de rétractation prévu
          pour les consommateurs ne s'applique pas aux contrats conclus entre professionnels dans le
          cadre de leur activité principale. Les souscriptions au Service réalisées par un Client
          agissant à titre professionnel ne bénéficient donc pas d'un droit de rétractation légal.
        </p>
        <p>
          <strong>
            [À compléter — préciser si une politique commerciale de rétractation ou de remboursement
            est néanmoins accordée, et sous quelles conditions]
          </strong>
        </p>
      </section>

      <section>
        <h2 id="resiliation">5. Résiliation</h2>
        <p>
          Le Client peut résilier son abonnement à tout moment depuis son espace de facturation, la
          résiliation prenant effet à l'issue de la période en cours déjà payée, sans remboursement
          au prorata sauf disposition contraire prévue à l'article{" "}
          <strong>[À compléter — renvoi éventuel]</strong>.
        </p>
        <p>
          LeadCortex peut résilier ou suspendre l'accès au Service en cas de manquement grave du
          Client à ses obligations contractuelles, notamment en cas de défaut de paiement non
          régularisé, après mise en demeure restée infructueuse pendant{" "}
          <strong>[À compléter — délai]</strong>.
        </p>
      </section>

      <section>
        <h2 id="disponibilite-sla">6. Disponibilité et SLA</h2>
        <p>
          LeadCortex met en œuvre les moyens raisonnables pour assurer une disponibilité du Service
          de <strong>[À compléter — ex. 99,5 %]</strong> sur une base mensuelle, hors opérations de
          maintenance planifiée notifiées au préalable et hors cas de force majeure.
        </p>
        <p>
          <strong>
            [À compléter — préciser les modalités de compensation en cas de non-respect du SLA, le
            cas échéant, ainsi que les canaux de support et délais de réponse associés]
          </strong>
        </p>
      </section>

      <section>
        <h2 id="limite-responsabilite">7. Limite de responsabilité</h2>
        <p>
          Le Service est fourni avec une obligation de moyens. LeadCortex ne saurait être tenue
          responsable des dommages indirects (perte de chiffre d'affaires, perte de clientèle, perte
          de données résultant d'une négligence du Client) subis par le Client dans le cadre de
          l'exécution du contrat.
        </p>
        <p>
          En tout état de cause, la responsabilité totale de LeadCortex au titre des présentes CGV
          est plafonnée à{" "}
          <strong>
            [À compléter — ex. montant total versé par le Client au titre des 12 derniers mois]
          </strong>
          .
        </p>
      </section>

      <section>
        <h2 id="droit-applicable">8. Droit applicable</h2>
        <p>
          Les présentes CGV sont soumises au droit français. À défaut de résolution amiable, tout
          litige relatif à leur validité, leur interprétation ou leur exécution sera porté devant{" "}
          <strong>[À compléter — juridiction compétente, ex. Tribunal de commerce de Paris]</strong>
          , y compris en cas de pluralité de défendeurs ou d'appel en garantie.
        </p>
      </section>
    </LegalLayout>
  );
}
