//frontend\routes\legal.confidentialite.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/legal/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — LeadCortex" },
      {
        name: "description",
        content:
          "Ce que LeadCortex collecte, pourquoi, combien de temps, et comment exercer vos droits sur vos données personnelles.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "donnees-collectees", title: "1. Données collectées" },
  { id: "finalites", title: "2. Finalités du traitement" },
  { id: "conservation", title: "3. Durée de conservation" },
  { id: "sous-traitants", title: "4. Sous-traitants" },
  { id: "droits", title: "5. Droits des utilisateurs" },
  { id: "contact-dpo", title: "6. Contact DPO / RGPD" },
];

function Page() {
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Politique de confidentialité"
      subtitle="Ce que nous collectons, pourquoi, et comment exercer vos droits sur vos données."
      lastUpdated="[À compléter]"
      sections={sections}
      currentHref="/legal/confidentialite"
    >
      <p>
        Cette politique décrit comment{" "}
        <strong>[À compléter — dénomination sociale de l'éditeur]</strong> traite les données
        personnelles collectées dans le cadre de l'utilisation de LeadCortex (« le Service »),
        conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
        Informatique et Libertés.
      </p>

      <section>
        <h2 id="donnees-collectees">1. Données collectées</h2>
        <p>Nous collectons les catégories de données suivantes :</p>
        <ul>
          <li>
            <strong>Données de compte :</strong> nom, prénom, email professionnel, mot de passe
            (stocké de façon chiffrée), entreprise déclarée.
          </li>
          <li>
            <strong>Données de facturation :</strong> informations nécessaires au paiement, traitées
            par notre prestataire de paiement.{" "}
            <strong>[À compléter — préciser les données exactes transmises et conservées]</strong>
          </li>
          <li>
            <strong>Données d'usage :</strong> journaux de connexion, actions réalisées dans
            l'application. <strong>[À compléter — détail des événements trackés]</strong>
          </li>
          <li>
            <strong>Données techniques :</strong> adresse IP, type d'appareil, navigateur, cookies.{" "}
            <strong>[À compléter — renvoi vers la politique de cookies]</strong>
          </li>
          <li>
            <strong>Données de prospection :</strong> données relatives aux prospects que vous
            importez, recherchez ou enrichissez via le Service.{" "}
            <strong>
              [À compléter — préciser le rôle de l'éditeur (sous-traitant) pour cette catégorie]
            </strong>
          </li>
        </ul>
      </section>

      <section>
        <h2 id="finalites">2. Finalités du traitement</h2>
        <p>Les données collectées sont traitées pour les finalités suivantes :</p>
        <ul>
          <li>fournir, sécuriser et maintenir l'accès au Service ;</li>
          <li>gérer la relation contractuelle et la facturation des abonnements ;</li>
          <li>assurer la prévention de la fraude et la sécurité des comptes ;</li>
          <li>
            améliorer le produit à partir de statistiques d'usage.{" "}
            <strong>[À compléter — préciser si anonymisées/agrégées]</strong>
          </li>
          <li>
            répondre aux demandes adressées au support et informer des évolutions importantes du
            Service.
          </li>
        </ul>
        <p>
          <strong>
            [À compléter — préciser la base légale associée à chaque finalité : exécution
            contractuelle, intérêt légitime, consentement, obligation légale]
          </strong>
        </p>
      </section>

      <section>
        <h2 id="conservation">3. Durée de conservation</h2>
        <p>
          Les données de compte sont conservées pendant toute la durée de l'abonnement, puis{" "}
          <strong>[À compléter — durée, ex. 30 jours]</strong> après résiliation avant suppression
          définitive, sauf obligation légale de conservation plus longue.
        </p>
        <ul>
          <li>
            <strong>Données de facturation :</strong>{" "}
            <strong>[À compléter — durée légale, ex. 10 ans pour les documents comptables]</strong>
          </li>
          <li>
            <strong>Journaux de sécurité :</strong>{" "}
            <strong>[À compléter — durée, ex. 12 mois]</strong>
          </li>
          <li>
            <strong>Données de prospection :</strong>{" "}
            <strong>
              [À compléter — durée définie par le Client en tant que responsable de traitement]
            </strong>
          </li>
        </ul>
      </section>

      <section>
        <h2 id="sous-traitants">4. Sous-traitants</h2>
        <p>
          Nous faisons appel aux sous-traitants suivants, chacun lié par un accord encadrant l'usage
          des données :
        </p>
        <ul>
          <li>
            <strong>Stripe</strong> (traitement des paiements) —{" "}
            <strong>
              [À compléter — localisation des serveurs, garanties de transfert hors UE le cas
              échéant]
            </strong>
          </li>
          <li>
            <strong>Hébergeur</strong> —{" "}
            <strong>[À compléter — nom de l'hébergeur, ex. OVHcloud, AWS, Vercel]</strong>,{" "}
            <strong>[À compléter — localisation des données hébergées]</strong>
          </li>
          <li>
            <strong>[À compléter — outils d'analytics produit, le cas échéant]</strong>
          </li>
          <li>
            <strong>[À compléter — fournisseurs de données d'enrichissement tiers]</strong>
          </li>
          <li>
            <strong>[À compléter — fournisseur(s) IA en cas de connexion BYOK]</strong>
          </li>
        </ul>
        <p>
          La liste complète et à jour de nos sous-traitants, ainsi que les garanties associées aux
          éventuels transferts hors Union européenne, est disponible sur demande à l'adresse
          indiquée à la section 6.
        </p>
      </section>

      <section>
        <h2 id="droits">5. Droits des utilisateurs</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de
          portabilité.
        </p>
        <p>
          Vous pouvez exercer ces droits{" "}
          <strong>
            [À compléter — préciser le parcours, ex. depuis Réglages → Confidentialité]
          </strong>{" "}
          ou en écrivant à l'adresse de contact ci-dessous. Une réponse vous sera apportée dans un
          délai maximum d'un mois, conformément au délai légal.
        </p>
        <p>
          Vous disposez également du droit d'introduire une réclamation auprès de la CNIL
          (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés.
        </p>
      </section>

      <section>
        <h2 id="contact-dpo">6. Contact DPO / RGPD</h2>
        <p>
          Pour toute question relative à cette politique ou à l'exercice de vos droits, vous pouvez
          contacter{" "}
          <strong>[À compléter — nom du DPO ou du responsable RGPD, le cas échéant]</strong> à
          l'adresse suivante : <a href="mailto:privacy@leadcortex.io">privacy@leadcortex.io</a>.
        </p>
        <p>
          <strong>
            [À compléter — coordonnées postales du DPO si une désignation formelle est requise]
          </strong>
        </p>
      </section>
    </LegalLayout>
  );
}
