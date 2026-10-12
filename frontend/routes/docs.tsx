//frontend\routes\docs.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LifeBuoy, ShieldCheck, Scale } from "lucide-react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { docSections } from "@/lib/docs-content";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — LeadCortex" },
      {
        name: "description",
        content:
          "Guides, ressources et références pour tirer le meilleur de LeadCortex : prospection, enrichissement, séquences, workflows et équipes d'agents IA.",
      },
      { property: "og:title", content: "Documentation — LeadCortex" },
      {
        property: "og:description",
        content: "Tout ce qu'il faut savoir pour prospecter avec LeadCortex.",
      },
    ],
  }),
  component: DocsHubPage,
});

const otherResources = [
  {
    icon: LifeBuoy,
    title: "Centre d'aide",
    desc: "Une question précise ? L'équipe répond directement.",
    href: "/support",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité",
    desc: "Chiffrement, hébergement, gestion des accès et des clés.",
    href: "/security",
  },
  {
    icon: Scale,
    title: "Ressources légales",
    desc: "CGU, confidentialité, DPA et cookies.",
    href: "/legal/cgu",
  },
];

function DocsHubPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-28">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
            Documentation
          </p>
          <h1 className="mt-4 font-display text-6xl md:text-7xl leading-[0.95] tracking-tight">
            Tout comprendre.
            <br />
            <span className="italic">Sans y perdre une journée.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-[56ch]">
            Des guides écrits pour des équipes commerciales — solo, duo ou plus — qui n'ont pas de
            temps à perdre. Pas de jargon inutile, juste ce qu'il faut savoir pour prospecter
            efficacement avec l'équipe d'agents IA.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="space-y-14">
          {docSections.map((section) => (
            <div key={section.id}>
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <h2 className="font-display text-2xl md:text-3xl italic tracking-tight">
                  {section.title}
                </h2>
                <p className="hidden sm:block text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="group rounded-2xl border border-border p-6 hover:bg-surface hover:border-foreground/20 transition-all animate-fade-in-up"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-base font-semibold text-foreground">{link.title}</h3>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-surface/40 p-8 md:p-10">
          <h2 className="font-display text-2xl md:text-3xl italic tracking-tight mb-6">
            Le reste des ressources.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {otherResources.map((r) => (
              <Link
                key={r.href}
                to={r.href}
                className="group rounded-xl border border-border bg-background p-5 hover:border-foreground/20 transition-colors"
              >
                <r.icon className="size-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
