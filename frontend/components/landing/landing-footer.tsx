// frontend/components/landing/landing-footer.tsx

import { BrandLogo } from "@/components/brand/brand-logo";
import { SiteLink, routes } from "./landing-link";
import { btnLight, btnOutline } from "./landing-styles";

const footerImage = "/images/site/decor/footer.webp";

const footerCols: { title: string; links: [string, string][] }[] = [
  {
    title: "Produit",
    links: [
      ["Produit", routes.product],
      ["Tarifs", routes.pricing],
      ["Manifeste", routes.manifest],
      ["Documentation", routes.docs],
      ["Sécurité", routes.security],
      ["Support", routes.support],
    ],
  },
  {
    title: "Légal",
    links: [
      ["Mentions légales", routes.legalNotice],
      ["CGU/CGV", routes.legalTerms],
      ["Politique de confidentialité", routes.legalPrivacy],
      ["Gestion des cookies", routes.legalCookies],
    ],
  },
];

export function LandingFooter() {
  return (
    <footer>
      <div className="relative overflow-hidden bg-ink text-ink-foreground">
        <img
          src={footerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          loading="lazy"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-32 text-center">
          <h2>
            Votre prochaine réponse
            <br />
            <em>commence maintenant.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-base text-ink-foreground/80">
            Essai gratuit. Sans carte bancaire.
          </p>
          <div className="lc-cta-row mt-8 justify-center">
            <SiteLink to={routes.signup} className={btnLight}>
              Créer mon workspace
            </SiteLink>
            <SiteLink to={routes.pricing} className={btnOutline}>
              Voir les tarifs
            </SiteLink>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 bg-surface/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4 sm:col-span-2">
              <BrandLogo />
              <p className="max-w-[28ch] text-sm text-muted-foreground">
                L'équipe d'agents IA de prospection B2B.
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      <SiteLink
                        to={to}
                        className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {label}
                      </SiteLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-col gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 LeadCortex. Tous droits réservés.</p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Édité par LeadCortex.</span>
              <a
                href="mailto:contact@leadcortex.io"
                className="text-foreground/80 underline underline-offset-2 transition-colors hover:text-foreground"
              >
                contact@leadcortex.io
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
