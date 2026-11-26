// frontend/components/landing/landing-docs.tsx

import { ArrowRight } from "./landing-icons";
import { SiteLink, routes } from "./landing-link";

const docsGettingStarted = "/images/site/docs/getting-started.avif";
const docsProspecting = "/images/site/docs/prospecting.avif";
const docsEnrichment = "/images/site/docs/enrichment.avif";

export function LandingDocs() {
  const pb = [
    {
      t: "Bien démarrer sur LeadCortex",
      by: "Démarrage",
      to: routes.docsStart,
      img: docsGettingStarted,
    },
    {
      t: "Recherche par langage naturel",
      by: "Prospection",
      to: routes.docsSearch,
      img: docsProspecting,
    },
    {
      t: "Comprendre les crédits d'enrichissement",
      by: "Enrichissement",
      to: routes.docsEnrichment,
      img: docsEnrichment,
    },
  ];
  return (
    <section id="resources" className="bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="max-w-3xl">
          Pour <em>bien démarrer</em>.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pb.map((p) => (
            <article
              key={p.t}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="overflow-hidden">
                <img
                  src={p.img}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="text-sm text-brand">{p.by}</p>
                <h3 className="mt-1 text-2xl leading-tight">{p.t}</h3>
                <div className="flex-1" />
                <SiteLink
                  to={p.to}
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
                >
                  Lire la documentation <ArrowRight className="h-4 w-4" />
                </SiteLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
