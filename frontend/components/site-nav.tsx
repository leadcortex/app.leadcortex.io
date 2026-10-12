//frontend\components\site-nav.tsx
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

function Logo() {
  return <BrandLogo />;
}

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/40 backdrop-blur-3xl backdrop-saturate-150 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 shrink items-center gap-10">
          <Logo />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Connexion
          </Link>
          <Link
            to="/signup"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-foreground text-background px-2.5 py-1.5 text-xs sm:px-3.5 sm:text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Essayer gratuitement
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4 sm:col-span-2 md:col-span-2">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-[28ch]">
              L'équipe d'agents IA de prospection B2B. Pour founders solo, duos et petites équipes
              commerciales.
            </p>
          </div>
          <FooterCol
            title="Produit"
            links={[
              ["Produit", "/product"],
              ["Tarifs", "/pricing"],
              ["Manifeste", "/manifest"],
              ["Documentation", "/docs"],
            ]}
          />
          <FooterCol
            title="Légal"
            links={[
              ["Mentions légales", "/legal/mentions-legales"],
              ["CGU/CGV", "/legal/cgv"],
              ["Politique de confidentialité", "/legal/confidentialite"],
              ["Gestion des cookies", "/legal/cookies"],
            ]}
          />
        </div>
        <div className="mt-16 flex flex-col gap-4 pt-8 border-t border-border/60 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 LeadCortex. Tous droits réservés.</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Édité par LeadCortex.</span>
            <a
              href="mailto:contact@leadcortex.io"
              className="text-foreground/80 hover:text-foreground transition-colors underline underline-offset-2"
            >
              contact@leadcortex.io
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="text-sm text-foreground/80 hover:text-foreground transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
