// frontend/routes/legal.paiement.tsx

import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/layout/legal-layout";
import { LEGAL, publisherLabel } from "@/lib/core/legal-config";

export const Route = createFileRoute("/legal/paiement")({
  head: () => ({
    meta: [
      { title: "Conditions de paiement — LeadCortex" },
      {
        name: "description",
        content:
          "Moyens de paiement, renouvellement automatique, prélèvement SEPA, facturation, retards de paiement, résiliation et rétractation chez LeadCortex.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "vendeur", title: "1. Qui encaisse" },
  { id: "prix", title: "2. Prix et TVA" },
  { id: "moyens", title: "3. Moyens de paiement" },
  { id: "renouvellement", title: "4. Renouvellement automatique" },
  { id: "securite", title: "5. Sécurité et authentification" },
  { id: "sepa", title: "6. Prélèvement SEPA" },
  { id: "virement", title: "7. Virement bancaire" },
  { id: "facturation", title: "8. Factures" },
  { id: "incidents", title: "9. Retard ou échec de paiement" },
  { id: "resiliation", title: "10. Résiliation" },
  { id: "retractation", title: "11. Droit de rétractation" },
  { id: "changement-prix", title: "12. Évolution des prix" },
  { id: "reclamations", title: "13. Réclamations et médiation" },
  { id: "donnees", title: "14. Données de paiement" },
];

const Todo = ({ children }: { children: React.ReactNode }) => (
  <strong>[À compléter — {children}]</strong>
);

function Page() {
  const { entity, contacts, processors } = LEGAL;
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Conditions de paiement"
      subtitle="Comment vous payez, quand vous êtes débité, et comment arrêter. Ces conditions complètent les Conditions Générales de Vente."
      lastUpdated={LEGAL.lastUpdated}
      sections={sections}
      currentHref="/legal/paiement"
    >
      <p>
        Cette page précise les modalités de paiement des abonnements à {LEGAL.brand}. Elle fait
        partie intégrante des Conditions Générales de Vente, que vous acceptez avant tout paiement.
        En cas de contradiction, les présentes conditions prévalent pour ce qui concerne le
        paiement.
      </p>

      <section>
        <h2 id="vendeur">1. Qui encaisse vos paiements</h2>
        <p>
          Les paiements sont encaissés par <strong>{publisherLabel()}</strong>, {entity.form} au
          capital de <strong>{entity.capital}</strong>, immatriculée sous le numéro{" "}
          <strong>{entity.siren}</strong> ({entity.registry}), siège social :{" "}
          <strong>{entity.address}</strong>, n° de TVA intracommunautaire :{" "}
          <strong>{entity.vatNumber}</strong>. Contact facturation :{" "}
          <a href={`mailto:${contacts.general}`}>{contacts.general}</a>.
        </p>
        <p>
          Le traitement technique des paiements est confié à {processors.payment}, établissement
          agréé. {LEGAL.brand} ne reçoit ni ne conserve vos numéros de carte complets ni vos codes
          de sécurité.
        </p>
      </section>

      <section>
        <h2 id="prix">2. Prix et TVA</h2>
        <p>
          Les prix sont indiqués en euros. Le montant affiché au moment du paiement est le montant
          toutes taxes comprises (TTC) que vous payez ; le détail hors taxes et la TVA (20 % en
          France métropolitaine) figurent sur le récapitulatif et sur la facture.
        </p>
        <p>
          Pour un client professionnel établi dans un autre État membre de l'Union européenne et
          disposant d'un numéro de TVA intracommunautaire valide, la facture est émise hors taxes
          avec la mention « autoliquidation » (article 283-2 du Code général des impôts / article
          196 de la directive 2006/112/CE).
        </p>
        <p>
          Les remises (paiement annuel, fidélité) sont affichées ligne par ligne avant le paiement
          et déjà déduites du total.
        </p>
      </section>

      <section>
        <h2 id="moyens">3. Moyens de paiement acceptés</h2>
        <ul>
          <li>
            <strong>Carte bancaire</strong> : Visa, Mastercard, American Express, CB. Débit
            immédiat, puis automatique à chaque échéance.
          </li>
          <li>
            <strong>Prélèvement SEPA</strong> : depuis un compte bancaire de la zone SEPA, après
            signature électronique d'un mandat.
          </li>
          <li>
            <strong>Virement bancaire</strong> : sur le compte indiqué au moment du paiement, avec
            la référence fournie. Pas de débit automatique.
          </li>
        </ul>
        <p>
          Aucun frais supplémentaire n'est appliqué selon le moyen de paiement choisi (article
          L112-12 du Code monétaire et financier).
        </p>
      </section>

      <section>
        <h2 id="renouvellement">4. Renouvellement automatique et prélèvements</h2>
        <p>
          L'abonnement est souscrit pour une période d'un mois ou d'un an, selon votre choix. Il se
          renouvelle automatiquement pour une période identique, jusqu'à résiliation.
        </p>
        <p>
          Lorsque vous payez par carte ou par prélèvement SEPA, vous autorisez {LEGAL.brand} à
          débiter automatiquement le montant de l'abonnement à chaque échéance, à la date indiquée
          dans votre espace Facturation. Ces paiements récurrents sont initiés par nous, sans
          nouvelle action de votre part, conformément à l'autorisation donnée lors du premier
          paiement.
        </p>
        <p>
          Pour un abonnement annuel, nous vous rappelons la date et le montant du renouvellement par
          e-mail au moins <Todo>délai, ex. 30 jours</Todo> avant l'échéance. Pour les clients
          consommateurs, ce rappel intervient en tout état de cause entre trois mois et un mois
          avant le terme (article L215-1 du Code de la consommation).
        </p>
      </section>

      <section>
        <h2 id="securite">5. Sécurité et authentification forte</h2>
        <p>
          Les données de carte sont saisies dans un formulaire chiffré (TLS) et traitées par notre
          prestataire, certifié PCI DSS niveau 1. Conformément à la directive européenne sur les
          services de paiement (DSP2), le premier paiement par carte peut nécessiter une
          authentification forte auprès de votre banque (3-D Secure : code par SMS, validation dans
          l'application bancaire…). Les échéances suivantes sont en principe exemptées
          d'authentification, mais votre banque peut la redemander.
        </p>
      </section>

      <section>
        <h2 id="sepa">6. Prélèvement SEPA : mandat et remboursement</h2>
        <p>
          En signant le mandat, vous autorisez {LEGAL.brand} à envoyer des instructions à votre
          banque pour débiter votre compte, et votre banque à le débiter conformément à ces
          instructions. Identifiant créancier SEPA : <Todo>ICS délivré par la banque</Todo>. Une
          référence unique de mandat vous est communiquée par e-mail.
        </p>
        <p>
          Vous êtes informé du montant et de la date de chaque prélèvement au moins{" "}
          <Todo>délai de pré-notification, ex. 2 jours ouvrés</Todo> avant le débit, sur votre
          facture ou par e-mail.
        </p>
        <p>
          Vous pouvez demander à votre banque le remboursement d'un prélèvement autorisé dans les{" "}
          <strong>8 semaines</strong> suivant la date de débit, sans avoir à vous justifier, et d'un
          prélèvement non autorisé dans un délai de <strong>13 mois</strong> (articles L133-24 et
          L133-25 du Code monétaire et financier). Un remboursement obtenu alors que l'abonnement a
          bien été fourni laisse la somme due ; nous vous contacterons pour la régulariser.
        </p>
      </section>

      <section>
        <h2 id="virement">7. Virement bancaire</h2>
        <p>
          Le virement doit comporter la référence indiquée et le montant exact. L'abonnement est
          activé dès que le virement est reçu et rapproché : quelques secondes pour un virement
          instantané, généralement un à deux jours ouvrés pour un virement classique. Les frais
          éventuels facturés par votre banque restent à votre charge.
        </p>
        <p>
          Le virement ne se renouvelle pas automatiquement : la facture de chaque nouvelle période
          vous est envoyée 7 jours avant l'échéance et doit être réglée au plus tard à cette date.
        </p>
      </section>

      <section>
        <h2 id="facturation">8. Factures</h2>
        <p>
          Une facture est émise à chaque paiement et envoyée à l'adresse e-mail de facturation. Elle
          reste téléchargeable dans votre espace Facturation. Elle comporte les mentions prévues à
          l'article 242 nonies A de l'annexe II du Code général des impôts, notamment le numéro
          unique, la date, l'identité et l'adresse des parties, le numéro SIREN, le détail HT, le
          taux et le montant de TVA, et le total TTC.
        </p>
        <p>
          Les informations de facturation (raison sociale, adresse, numéros SIRET et de TVA) doivent
          être exactes : une facture ne peut plus être modifiée après émission, seul un avoir peut
          la corriger. Dans le cadre de la généralisation de la facturation électronique entre
          entreprises, les factures sont transmises via une plateforme agréée lorsque la
          réglementation l'impose à {LEGAL.brand} ou au client.
        </p>
      </section>

      <section>
        <h2 id="incidents">9. Retard ou échec de paiement</h2>
        <p>
          Si un paiement échoue (carte expirée, provision insuffisante, opposition), nous vous
          prévenons par e-mail et réessayons automatiquement pendant{" "}
          <Todo>durée, ex. 14 jours</Todo>. Vous pouvez mettre à jour votre moyen de paiement à tout
          moment. Sans régularisation à l'issue de ce délai, l'accès au service est suspendu, puis
          l'abonnement résilié après mise en demeure restée sans effet.
        </p>
        <p>
          <strong>Clients professionnels</strong> : toute somme impayée à l'échéance entraîne de
          plein droit des pénalités de retard au taux de la Banque centrale européenne majoré de 10
          points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de{" "}
          <strong>40 €</strong> (articles L441-10 et D441-5 du Code de commerce).
        </p>
      </section>

      <section>
        <h2 id="resiliation">10. Résiliation</h2>
        <p>
          Vous pouvez résilier à tout moment, en quelques clics, depuis Paramètres → Facturation,
          sans justification ni frais. Une confirmation vous est envoyée par e-mail (article
          L215-1-1 du Code de la consommation).
        </p>
        <p>
          <strong>
            Le montant déjà payé reste acquis : vous continuez à profiter de votre forfait jusqu'à
            la fin de la période réglée
          </strong>
          , puis aucun nouveau prélèvement n'a lieu. Il n'y a pas de remboursement au prorata de la
          période en cours, sauf exercice du droit de rétractation décrit ci-dessous.
        </p>
        <p>
          Le mandat SEPA devient caduc à la résiliation. Vous pouvez aussi révoquer votre mandat
          auprès de votre banque, ce qui ne résilie pas à lui seul l'abonnement.
        </p>
      </section>

      <section>
        <h2 id="retractation">11. Droit de rétractation</h2>
        <p>
          <strong>Consommateurs</strong> : vous disposez de 14 jours à compter de la souscription
          pour vous rétracter, sans motif (article L221-18 du Code de la consommation), en nous
          écrivant à <a href={`mailto:${contacts.legal}`}>{contacts.legal}</a> ou depuis votre
          espace Facturation. Si vous avez demandé l'accès immédiat au service, vous payez
          uniquement la part correspondant à la période déjà utilisée (article L221-25). Le
          remboursement intervient sous 14 jours, avec le même moyen de paiement.
        </p>
        <p>
          <strong>Professionnels</strong> : le droit de rétractation ne s'applique pas, sauf pour
          les entreprises de cinq salariés au plus souscrivant hors établissement un contrat qui
          n'entre pas dans le champ de leur activité principale (article L221-3).
        </p>
      </section>

      <section>
        <h2 id="changement-prix">12. Évolution des prix</h2>
        <p>
          Toute modification de prix vous est notifiée par e-mail au moins{" "}
          <Todo>délai, ex. 30 jours</Todo> avant de s'appliquer, et seulement à partir de la période
          suivante. Si vous la refusez, vous pouvez résilier avant son entrée en vigueur. Les
          remises de fidélité acquises sont conservées.
        </p>
      </section>

      <section>
        <h2 id="reclamations">13. Réclamations et médiation</h2>
        <p>
          Pour toute question ou contestation sur un paiement, écrivez à{" "}
          <a href={`mailto:${contacts.general}`}>{contacts.general}</a> : nous répondons sous{" "}
          <Todo>délai, ex. 5 jours ouvrés</Todo>. Merci de nous contacter avant d'engager une
          procédure de contestation auprès de votre banque.
        </p>
        <p>
          Les clients consommateurs peuvent recourir gratuitement au médiateur de la consommation :{" "}
          <Todo>nom, adresse et site du médiateur</Todo> (article L612-1 du Code de la
          consommation).
        </p>
      </section>

      <section>
        <h2 id="donnees">14. Données de paiement</h2>
        <p>
          Les données nécessaires au paiement (identité, adresse de facturation, quatre derniers
          chiffres de la carte ou de l'IBAN, historique des transactions) sont traitées pour
          exécuter le contrat et respecter nos obligations comptables, puis conservées 10 ans
          (article L123-22 du Code de commerce). Les données de carte complètes sont conservées
          uniquement par notre prestataire de paiement. Pour en savoir plus et exercer vos droits,
          consultez la <a href="/legal/confidentialite">politique de confidentialité</a> ou écrivez
          à <a href={`mailto:${contacts.privacy}`}>{contacts.privacy}</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
