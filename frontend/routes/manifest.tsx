//frontend\routes\manifest.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";

export const Route = createFileRoute("/manifest")({
  head: () => ({
    meta: [
      { title: "Manifeste — LeadCortex" },
      {
        name: "description",
        content:
          "Pourquoi LeadCortex existe. Ce que nous refusons de faire. Ce que nous promettons aux équipes commerciales.",
      },
    ],
  }),
  component: ManifestPage,
});

function ManifestPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <article className="mx-auto max-w-3xl px-4 md:px-6 py-12 md:py-32">
        <p className="text-[9px] md:text-xs font-medium uppercase tracking-[0.15em] text-primary">
          Manifeste
        </p>
        <h1 className="mt-3 md:mt-6 font-display text-3xl md:text-7xl leading-[0.95] tracking-tight italic">
          Les équipes commerciales méritent mieux.
        </h1>

        <div className="mt-10 md:mt-16 space-y-6 md:space-y-10 text-base md:text-lg leading-relaxed text-foreground/90">
          <p>
            La prospection B2B moderne est cassée. Cinq outils, deux abonnements enterprise, une
            équipe SDR qu'aucun founder solo ne peut se payer — et au bout, un email générique
            envoyé par un stagiaire.
          </p>
          <p>
            <em className="font-display text-xl md:text-2xl not-italic italic">Nous refusons</em>{" "}
            les tableaux de bord qui remplacent le travail. Les templates plaqués. Les prix opaques.
            Les outils pensés uniquement pour les grosses boîtes, ou uniquement pour les solo
            founders.
          </p>
          <p>
            LeadCortex est une équipe d'agents, pas un outil. Elle œuvre pendant que vous
            construisez. Composez votre équipe : une IA de recherche et une IA de travail,
            alimentées par vos clés ou les modèles inclus. Une transparence totale, sans marge
            cachée. Chaque action est traçable, ligne par ligne, pour que vous restiez aux
            commandes.
          </p>
          <p>
            Que vous soyez seul, à deux, ou une petite équipe commerciale, le workspace s'adapte :
            partage des prospects, projets communs, rôles différenciés. Pas besoin de choisir entre
            la puissance d'un outil d'entreprise et la simplicité d'un outil solo.
          </p>
          <p>
            <em className="font-display text-xl md:text-2xl not-italic italic">Nous promettons</em>{" "}
            trois choses. Un prix honnête. Un produit qui fait avancer les réponses, pas les
            métriques. Un design qui respecte votre temps.
          </p>
          <p className="text-muted-foreground text-sm md:text-base">— L'équipe LeadCortex</p>
        </div>

        <div className="mt-10 md:mt-16">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 md:gap-2 rounded-xl bg-foreground text-background px-4 md:px-5 py-2 md:py-3 text-xs md:text-sm font-medium hover:opacity-90 transition-all"
          >
            Rejoindre la bêta
          </Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
