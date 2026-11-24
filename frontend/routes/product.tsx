// frontend/routes/product.tsx

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/layout/site-nav";
import {
  Users,
  Building2,
  ListChecks,
  Wand2,
  Send,
  Mail,
  Phone,
  CheckSquare,
  CalendarDays,
  MessageSquare,
  Target,
  Workflow,
  BarChart3,
  Eye,
  FileInput,
  ArrowRight,
  Sparkles,
  Search,
  KeyRound,
  Brain,
} from "@/components/icons";
import { ContentPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Produit — LeadCortex" },
      {
        name: "description",
        content:
          "Une équipe d'agents IA pour la prospection B2B : une IA qui cherche, une IA qui écrit. Un seul workspace, partageable en équipe.",
      },
    ],
  }),
  pendingComponent: () => <ContentPageSkeleton />,
  component: ProductPage,
});

const pillars = [
  {
    label: "Votre équipe d'agents",
    subtitle: "Deux IA, deux rôles.",
    items: [
      { icon: Search, name: "IA de recherche", desc: "Trouve, vérifie et classe vos prospects." },
      { icon: Sparkles, name: "IA de travail", desc: "Écrit vos messages et vos notes." },
      {
        icon: KeyRound,
        name: "Modèles inclus ou vos clés",
        desc: "Rien à configurer. Vos clés en option.",
      },
      { icon: Brain, name: "Mémoire", desc: "Retient votre cible et votre ton." },
    ],
  },
  {
    label: "Prospecter",
    subtitle: "Les bons contacts, la bonne donnée.",
    items: [
      { icon: Users, name: "Prospects", desc: "Recherche en langage naturel." },
      { icon: Building2, name: "Entreprises", desc: "Effectifs, levées, recrutements." },
      { icon: ListChecks, name: "Listes", desc: "Segments partagés, export CSV." },
      { icon: Wand2, name: "Enrichissement", desc: "Vous ne payez que ce qui aboutit." },
    ],
  },
  {
    label: "Engager",
    subtitle: "Les agents préparent. Vous validez.",
    items: [
      { icon: Send, name: "Séquences", desc: "Email et LinkedIn, personnalisés par prospect." },
      { icon: Mail, name: "Emails", desc: "Gmail et Outlook dans une seule boîte." },
      { icon: Phone, name: "Appels", desc: "Notes et transcription automatiques." },
      { icon: CheckSquare, name: "Tâches", desc: "Ce qu'il reste à faire aujourd'hui." },
    ],
  },
  {
    label: "Conclure",
    subtitle: "Des réponses aux rendez-vous.",
    items: [
      { icon: CalendarDays, name: "Meetings", desc: "Liens de réservation et rappels." },
      { icon: MessageSquare, name: "Conversations", desc: "Tous vos canaux au même endroit." },
      { icon: Target, name: "Opportunités", desc: "Un pipeline qui se remplit seul.", wide: true },
    ],
  },
  {
    label: "Automatiser",
    subtitle: "Seul ou en équipe.",
    items: [
      { icon: Workflow, name: "Workflows", desc: "Un canevas visuel, partagé avec l'équipe." },
      { icon: BarChart3, name: "Analyses", desc: "Ce qui marche, par personne et par séquence." },
      { icon: Eye, name: "Visiteurs", desc: "Qui visite votre site, en temps réel." },
      { icon: FileInput, name: "Formulaires", desc: "Les leads entrants arrivent qualifiés." },
    ],
  },
];

function ProductPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-12 md:pt-20 pb-10 md:pb-16">
        <div className="max-w-3xl">
          <p className="text-[9px] md:text-xs font-medium uppercase tracking-[0.15em] text-primary">
            Produit
          </p>
          <h1 className="mt-2 md:mt-4 font-display text-3xl md:text-7xl leading-[0.95] tracking-tight">
            Une équipe d'agents.
            <br />
            <span className="italic">Toute la prospection.</span>
          </h1>
          <p className="mt-3 md:mt-6 text-base md:text-lg text-muted-foreground max-w-[54ch]">
            Vous décrivez. Les agents exécutent. Vous validez.
          </p>
          <div className="mt-4 md:mt-8 flex flex-wrap gap-2 md:gap-3">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-1.5 md:gap-2 rounded-xl bg-foreground text-background px-4 md:px-5 py-2 md:py-3 text-xs md:text-sm font-medium hover:opacity-90 transition-all"
            >
              Créer mon workspace
              <ArrowRight className="size-3.5 md:size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 md:gap-2 rounded-xl border border-border bg-background px-4 md:px-5 py-2 md:py-3 text-xs md:text-sm font-medium hover:bg-surface transition-colors"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-10 md:pb-16">
        <div className="rounded-2xl md:rounded-3xl border border-border bg-surface/40 p-2 md:p-4">
          <div className="rounded-xl md:rounded-2xl border border-border overflow-hidden bg-background">
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2.5 md:py-3.5 border-b border-border bg-surface/60">
              <Sparkles className="size-3.5 md:size-4 text-primary shrink-0" strokeWidth={1.5} />
              <span className="text-xs md:text-sm text-muted-foreground leading-snug">
                « Trouve-moi des CTO de PME industrielles qui recrutent, et prépare une séquence. »
              </span>
              <span className="ml-auto shrink-0 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wide">
                Équipe
              </span>
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {[
                { t: "Recherche", d: "Les comptes qui recrutent, repérés." },
                { t: "Enrichissement", d: "Emails et téléphones vérifiés." },
                { t: "Rédaction", d: "Un message par prospect, prêt à valider." },
              ].map((s) => (
                <div key={s.t} className="p-4 md:p-6">
                  <p className="text-[9px] md:text-xs font-medium uppercase tracking-[0.15em] text-primary">
                    {s.t}
                  </p>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm text-foreground/90 leading-relaxed">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {pillars.map((p) => (
        <section key={p.label} className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-20">
            <div className="max-w-2xl mb-8 md:mb-12">
              <p className="text-[9px] md:text-xs font-medium uppercase tracking-[0.15em] text-primary">
                {p.label}
              </p>
              <h2 className="mt-2 md:mt-3 font-display text-2xl md:text-5xl italic leading-tight">
                {p.subtitle}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60">
              {p.items.map(({ icon: Icon, name, desc, wide }) => (
                <div
                  key={name}
                  className={`group bg-background p-4 md:p-10 transition-colors hover:bg-surface/60 ${
                    wide ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="size-8 md:size-10 rounded-xl bg-primary/8 grid place-items-center transition-colors group-hover:bg-primary/15">
                      <Icon className="size-4 md:size-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display text-lg md:text-2xl italic">{name}</h3>
                  </div>
                  <p
                    className={`mt-2 md:mt-4 text-xs md:text-sm text-muted-foreground leading-relaxed ${
                      wide ? "max-w-[72ch]" : "max-w-[48ch]"
                    }`}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-28 text-center border-t border-border/60">
        <h2 className="font-display text-3xl md:text-6xl italic leading-tight">
          Voyez l'équipe tourner.
        </h2>
        <p className="mt-2 md:mt-4 text-xs md:text-sm text-muted-foreground max-w-[46ch] mx-auto">
          Essai gratuit. Sans carte bancaire.
        </p>
        <div className="mt-4 md:mt-8">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-1.5 md:gap-2 rounded-xl bg-foreground text-background px-4 md:px-6 py-2.5 md:py-3.5 text-xs md:text-sm font-medium hover:opacity-90 transition-all"
          >
            Créer mon workspace
            <ArrowRight className="size-3.5 md:size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
