//frontend\routes\legal.cookies.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Politique de cookies — LeadCortex" },
      {
        name: "description",
        content:
          "Les cookies et traceurs utilisés sur le site et l'application LeadCortex, et comment gérer vos préférences.",
      },
    ],
  }),
  component: Page,
});

const sections = [
  { id: "definition", title: "1. Qu'est-ce qu'un cookie" },
  { id: "categories", title: "2. Les cookies utilisés" },
  { id: "duree", title: "3. Durée de conservation" },
  { id: "gestion", title: "4. Gérer vos préférences" },
];

function Page() {
  return (
    <LegalLayout
      eyebrow="Ressources légales"
      title="Politique de cookies"
      subtitle="Les traceurs utilisés sur le site et l'application, sans plus ni moins."
      lastUpdated="1er août 2026"
      sections={sections}
      currentHref="/legal/cookies"
    >
      <p>
        LeadCortex utilise un nombre volontairement restreint de cookies. Nous ne déposons pas de
        traceurs publicitaires tiers et ne revendons aucune donnée de navigation.
      </p>

      <section>
        <h2 id="definition">1. Qu'est-ce qu'un cookie</h2>
        <p>
          Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site, qui
          permet de conserver une information (session connectée, préférence d'affichage) entre deux
          pages ou deux visites.
        </p>
      </section>

      <section>
        <h2 id="categories">2. Les cookies utilisés</h2>
        <ul>
          <li>
            <strong>Cookies strictement nécessaires :</strong> maintien de votre session connectée,
            protection contre la falsification de requêtes (CSRF), mémorisation de vos préférences
            d'interface (thème, langue). Ils ne nécessitent pas de consentement préalable,
            conformément à la réglementation.
          </li>
          <li>
            <strong>Cookies de mesure d'audience :</strong> statistiques de fréquentation
            anonymisées, utilisées pour comprendre l'usage général du site et prioriser les
            améliorations produit. Configurés pour ne pas nécessiter de consentement lorsqu'ils
            respectent les critères d'exemption de la CNIL ; sinon, soumis à votre consentement.
          </li>
          <li>
            <strong>Cookies fonctionnels tiers :</strong> le cas échéant, pour l'intégration de
            certains services (par exemple un widget de support), soumis à votre consentement
            préalable.
          </li>
        </ul>
        <p>
          LeadCortex ne dépose aucun cookie publicitaire ni de traçage cross-site à des fins
          commerciales.
        </p>
      </section>

      <section>
        <h2 id="duree">3. Durée de conservation</h2>
        <p>
          Les cookies de session expirent à la fermeture du navigateur ou à la déconnexion. Les
          cookies de préférence et de mesure d'audience sont conservés 13 mois maximum, conformément
          aux recommandations de la CNIL, avant d'être automatiquement supprimés ou de nécessiter un
          nouveau consentement.
        </p>
      </section>

      <section>
        <h2 id="gestion">4. Gérer vos préférences</h2>
        <p>
          Vous pouvez à tout moment modifier vos préférences de cookies non essentiels depuis le
          bandeau affiché lors de votre première visite, ou en réinitialisant les cookies du site
          depuis les réglages de votre navigateur. Le blocage des cookies strictement nécessaires
          peut empêcher le bon fonctionnement de l'application (perte de session notamment).
        </p>
      </section>
    </LegalLayout>
  );
}
