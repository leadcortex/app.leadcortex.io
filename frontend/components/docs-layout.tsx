//frontend\components\docs-layout.tsx
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { docSections, findAdjacentDocs } from "@/lib/docs-content";

type DocsLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  currentHref: string;
  readingTime?: string;
  children: ReactNode;
};

export function DocsLayout({
  eyebrow,
  title,
  description,
  currentHref,
  readingTime = "4 min",
  children,
}: DocsLayoutProps) {
  const { prev, next } = findAdjacentDocs(currentHref);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8"
        >
          <Link to="/docs" className="hover:text-foreground transition-colors">
            Documentation
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground/80">{eyebrow}</span>
        </nav>

        <div className="grid md:grid-cols-[220px_1fr] gap-12 lg:gap-16">
          {}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              {docSections.map((section) => (
                <div key={section.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5">
                    {section.title}
                  </p>
                  <ul className="space-y-1.5">
                    {section.links.map((link) => {
                      const active = link.href === currentHref;
                      return (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            className={`block text-sm py-0.5 border-l-2 pl-3 -ml-px transition-colors ${
                              active
                                ? "border-primary text-foreground font-medium"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                            }`}
                          >
                            {link.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <div className="pt-2 border-t border-border/60">
                <Link
                  to="/legal/cgu"
                  className="block text-sm py-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ressources légales →
                </Link>
              </div>
            </div>
          </aside>

          <article className="min-w-0 max-w-[68ch]">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl leading-[1.02] tracking-tight">
              {title}
            </h1>
            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{readingTime} de lecture</span>
              <span className="size-1 rounded-full bg-border" />
              <span>{description}</span>
            </div>

            <div className="mt-10 space-y-7 text-[15px] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:italic [&_h2]:text-foreground [&_h2]:pt-4 [&_h2]:tracking-tight [&_h3]:text-base [&_h3]:md:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:pt-1 [&_strong]:text-foreground [&_strong]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-surface [&_code]:border [&_code]:border-border [&_code]:rounded-md [&_code]:px-1.5 [&_code]:py-0.5 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:pl-1">
              {children}
            </div>

            <div className="mt-16 grid sm:grid-cols-2 gap-3 border-t border-border/60 pt-8">
              {prev ? (
                <Link
                  to={prev.href}
                  className="group rounded-xl border border-border p-4 hover:bg-surface transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowLeft className="size-3.5" /> Précédent
                  </span>
                  <span className="mt-1 block text-sm font-medium group-hover:text-primary transition-colors">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  to={next.href}
                  className="group rounded-xl border border-border p-4 text-right hover:bg-surface transition-colors sm:col-start-2"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                    Suivant <ArrowRight className="size-3.5" />
                  </span>
                  <span className="mt-1 block text-sm font-medium group-hover:text-primary transition-colors">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </article>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

/** Petit encart de mise en avant (astuce, avertissement, note) utilisé dans les articles. */
export function DocCallout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "success";
  title: string;
  children: ReactNode;
}) {
  const toneStyles = {
    info: "border-border bg-surface/60",
    warning: "border-warning/30 bg-warning/5",
    success: "border-success/30 bg-success/5",
  } as const;

  return (
    <div className={`rounded-xl border p-4 not-prose ${toneStyles[tone]}`}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-1.5 text-sm text-foreground/80 leading-relaxed [&_p]:m-0">{children}</div>
    </div>
  );
}
