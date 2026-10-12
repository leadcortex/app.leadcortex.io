//frontend\components\legal-layout.tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { legalLinks } from "@/lib/docs-content";

type LegalSection = {
  id: string;
  title: string;
};

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
  currentHref: string;
  children: ReactNode;
};

export function LegalLayout({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
  currentHref,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-[220px_1fr] gap-12 lg:gap-16">
          {}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
                  Sur cette page
                </p>
                <ul className="space-y-1.5">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block text-sm py-0.5 border-l-2 border-transparent pl-3 -ml-px text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-border/60">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
                  Autres documents
                </p>
                <ul className="space-y-1.5">
                  {legalLinks
                    .filter((l) => l.href !== currentHref)
                    .map((l) => (
                      <li key={l.href}>
                        <Link
                          to={l.href}
                          className="block text-sm py-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {l.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </aside>

          <article className="min-w-0 max-w-[70ch]">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-6xl leading-[0.98] tracking-tight italic">
              {title}
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-[55ch]">{subtitle}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Dernière mise à jour : {lastUpdated}
            </p>

            <div className="mt-12 space-y-12 text-[15px] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:not-italic [&_h2]:text-foreground [&_h2]:tracking-tight [&_h2]:scroll-mt-24 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:pl-1 [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
              {children}
            </div>

            <div className="mt-16 rounded-xl border border-border bg-surface/50 p-5">
              <p className="text-sm text-foreground/90">
                Une question sur l'un de ces documents ?{" "}
                <a
                  href="mailto:legal@leadcortex.io"
                  className="text-primary underline underline-offset-2"
                >
                  legal@leadcortex.io
                </a>
              </p>
            </div>
          </article>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
