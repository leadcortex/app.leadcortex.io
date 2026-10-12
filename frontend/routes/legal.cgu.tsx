//frontend\routes\legal.cgu.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/legal/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions Générales d'Utilisation — LeadCortex" },
      {
        name: "description",
        content:
          "Les conditions générales d'utilisation de LeadCortex : accès au service, engagements, résiliation et responsabilités.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "objet", title: "1. Objet" },
  { id: "acces", title: "2. Accès au service" },
  { id: "compte", title: "3. Compte et sécurité" },
  { id: "usage", title: "4. Usage autorisé" },
  { id: "byok", title: "5. Clés IA (BYOK)" },
  { id: "abonnement", title: "6. Abonnement et facturation" },
  { id: "resiliation", title: "7. Résiliation" },
  { id: "propriete", title: "8. Propriété intellectuelle" },
  { id: "responsabilite", title: "9. Responsabilité" },
  { id: "modification", title: "10. Modification des CGU" },
  { id: "droit", title: "11. Droit applicable" },
];

function Page() {
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Conditions Générales d'Utilisation"
      subtitle="Les règles qui encadrent l'utilisation de LeadCortex, écrites pour être lues jusqu'au bout."
      lastUpdated="1er août 2026"
      sections={sections}
      currentHref="/legal/cgu"
    >
      <p>
        Ces conditions régissent l'accès et l'utilisation de la plateforme LeadCortex (« le Service
        »), éditée par LeadCortex SAS (« nous », « l'éditeur »). En créant un compte, vous acceptez
        l'intégralité des dispositions ci-dessous.
      </p>

      <section>
        <h2 id="objet">1. Objet</h2>
        <p>
          LeadCortex est un logiciel de prospection commerciale B2B qui permet de rechercher,
          enrichir et contacter des prospects professionnels, ainsi que d'automatiser ces actions
          via un éditeur de workflows. Le Service est fourni en mode SaaS (logiciel en tant que
          service), accessible par navigateur.
        </p>
      </section>

      <section>
        <h2 id="acces">2. Accès au service</h2>
        <p>
          L'accès est réservé à toute personne physique ou morale agissant dans un cadre
          professionnel. La création d'un compte suppose d'avoir la capacité juridique de contracter
          et, pour une personne morale, d'être habilité à l'engager.
        </p>
        <p>
          Un essai gratuit peut être proposé, dans les limites de fonctionnalités et de durée
          indiquées lors de l'inscription. À l'issue de l'essai, l'accès est conditionné à la
          souscription d'un plan payant décrit sur la page tarifs.
        </p>
      </section>

      <section>
        <h2 id="compte">3. Compte et sécurité</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants et de toute activité
          réalisée depuis votre compte. Toute suspicion d'accès non autorisé doit être signalée sans
          délai à <a href="mailto:security@leadcortex.io">security@leadcortex.io</a>.
        </p>
        <p>
          Nous pouvons suspendre un compte en cas d'indice sérieux de compromission, le temps de
          vérifier la situation, sans que cela constitue une résiliation.
        </p>
      </section>

      <section>
        <h2 id="usage">4. Usage autorisé</h2>
        <p>
          Le Service doit être utilisé dans le respect de la réglementation applicable, et notamment
          :
        </p>
        <ul>
          <li>
            de la réglementation relative à la prospection commerciale (opt-out, mentions
            obligatoires dans les emails, respect des listes de suppression) ;
          </li>
          <li>
            du RGPD et des réglementations équivalentes pour les données hors Union européenne ;
          </li>
          <li>
            des conditions d'utilisation des fournisseurs tiers dont les données sont exposées dans
            le Service (bases d'enrichissement, fournisseurs IA).
          </li>
        </ul>
        <p>
          Sont interdits : l'extraction massive de données à des fins de revente, l'usage du Service
          pour de l'envoi de contenu trompeur ou frauduleux, et toute tentative de contournement des
          limites techniques (quotas, rate-limiting, mesures de sécurité).
        </p>
      </section>

      <section>
        <h2 id="byok">5. Clés IA (BYOK)</h2>
        <p>
          Lorsque vous connectez une clé API d'un fournisseur de modèle de langage tiers, cette clé
          reste sous votre responsabilité. Vous demeurez seul contractant avec ce fournisseur pour
          l'usage et la facturation associés. LeadCortex se limite à transmettre les requêtes
          nécessaires au fonctionnement du Service et ne conserve pas le contenu des réponses
          au-delà de ce qui est strictement nécessaire à l'exécution des fonctionnalités demandées.
        </p>
      </section>

      <section>
        <h2 id="abonnement">6. Abonnement et facturation</h2>
        <p>
          Les plans disponibles, leurs quotas et leurs tarifs sont décrits sur la page tarifs et
          font partie intégrante des présentes conditions. Sauf mention contraire, les abonnements
          sont facturés mensuellement et sans engagement de durée : la résiliation prend effet à la
          fin de la période déjà payée.
        </p>
        <p>
          Les crédits d'enrichissement non consommés sur un cycle ne sont pas reportés au cycle
          suivant, sauf disposition contraire indiquée sur votre plan.
        </p>
      </section>

      <section>
        <h2 id="resiliation">7. Résiliation</h2>
        <p>
          Vous pouvez résilier votre abonnement à tout moment depuis <em>Réglages → Facturation</em>
          , sans justification. Nous pouvons résilier ou suspendre un compte en cas de manquement
          grave aux présentes conditions, après notification, sauf urgence justifiant une suspension
          immédiate (fraude, atteinte à la sécurité du Service).
        </p>
        <p>
          À la résiliation, vos données sont conservées 30 jours pour permettre une éventuelle
          récupération, puis supprimées définitivement, sous réserve des obligations légales de
          conservation.
        </p>
      </section>

      <section>
        <h2 id="propriete">8. Propriété intellectuelle</h2>
        <p>
          LeadCortex, sa marque, son interface et son code restent la propriété exclusive de
          l'éditeur. Vous conservez l'entière propriété des données que vous importez ou générez via
          le Service (listes de prospects, séquences, workflows).
        </p>
      </section>

      <section>
        <h2 id="responsabilite">9. Responsabilité</h2>
        <p>
          Le Service est fourni avec une obligation de moyens. Nous mettons en œuvre les mesures
          raisonnables pour assurer sa disponibilité et son bon fonctionnement, sans garantir une
          disponibilité absolue. Notre responsabilité, dans les limites permises par la loi, est
          plafonnée aux sommes versées au titre de l'abonnement au cours des douze derniers mois.
        </p>
        <p>
          Nous ne sommes pas responsables de l'exactitude des données firmographiques fournies par
          des sources tierces, ni du contenu des messages que vous rédigez ou envoyez via le
          Service.
        </p>
      </section>

      <section>
        <h2 id="modification">10. Modification des CGU</h2>
        <p>
          Ces conditions peuvent évoluer pour refléter des changements du Service ou de la
          réglementation. Toute modification substantielle est notifiée par email au moins 15 jours
          avant son entrée en vigueur. La poursuite de l'utilisation du Service après cette date
          vaut acceptation.
        </p>
      </section>

      <section>
        <h2 id="droit">11. Droit applicable</h2>
        <p>
          Les présentes conditions sont soumises au droit français. En cas de litige, une résolution
          amiable sera recherchée en priorité avant toute action contentieuse devant les
          juridictions compétentes.
        </p>
      </section>
    </LegalLayout>
  );
}
