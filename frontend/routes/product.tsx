//frontend\routes\product.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
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
} from "lucide-react";
import { ContentPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Produit — LeadCortex" },
      {
        name: "description",
        content:
          "Une équipe d'agents IA pour la prospection B2B : une IA de recherche, une IA de travail. Prospects, entreprises, séquences, emails, appels, deals. Un seul workspace, partageable en équipe.",
      },
    ],
  }),
  pendingComponent: () => <ContentPageSkeleton />,
  component: ProductPage,
});

const pillars = [
  {
    label: "Votre équipe d'agents",
    subtitle: "Deux IA, deux rôles. Composez-les comme vous voulez.",
    items: [
      {
        icon: Search,
        name: "IA de recherche",
        desc: "Collecte, vérifie et synthétise. Elle scanne les bases, croise les sources, score les leads et détecte les signaux d'achat. C'est elle qui alimente tout le reste.",
      },
      {
        icon: Sparkles,
        name: "IA de travail",
        desc: "Analyse, rédige et structure. Elle transforme les données brutes en emails personnalisés, en notes de meeting et en plans d'action concrets.",
      },
      {
        icon: KeyRound,
        name: "Modèles inclus ou BYOK",
        desc: "Utilisez les modèles inclus par défaut, ou branchez vos propres clés Anthropic, OpenAI, Google, Groq, DeepSeek ou Mistral. Attribuez une clé à chaque rôle pour un contrôle total.",
      },
      {
        icon: Brain,
        name: "Mémoire et compétences",
        desc: "L'équipe retient vos préférences, votre ICP, votre ton et vos objections fréquentes. Elle s'améliore à chaque échange sans que vous ayez à répéter.",
      },
    ],
  },
  {
    label: "Prospecter & enrichir",
    subtitle: "Trouvez les bons comptes, les bons contacts, la bonne donnée.",
    items: [
      {
        icon: Users,
        name: "Prospects",
        desc: "Recherche par langage naturel, filtres firmographiques et signaux d'achat. L'IA de recherche score chaque lead selon votre thèse.",
      },
      {
        icon: Building2,
        name: "Entreprises",
        desc: "Bases enrichies avec effectifs, tech stack, funding, recrutements en cours. Suivi par industrie.",
      },
      {
        icon: ListChecks,
        name: "Listes",
        desc: "Segmentation dynamique, tags partagés, exports CSV natifs. Vos listes travaillent pour vous.",
      },
      {
        icon: Wand2,
        name: "Enrichissement",
        desc: "Waterfall de providers, vérification SMTP, téléphones directs. Vous ne payez que ce qui aboutit.",
      },
    ],
  },
  {
    label: "Engager",
    subtitle: "Écrivez, envoyez, appelez. Les agents orchestrent, vous validez.",
    items: [
      {
        icon: Send,
        name: "Séquences",
        desc: "Multi-touch email + LinkedIn, personnalisées par lead par l'IA de travail. A/B testing intégré.",
      },
      {
        icon: Mail,
        name: "Emails",
        desc: "Inbox unifiée multi-comptes (Gmail, Outlook, IMAP), réponses suggérées, warmup automatique. La deliverability, pas les templates plaqués.",
      },
      {
        icon: Phone,
        name: "Appels",
        desc: "Numérotation intégrée, notes structurées, transcription. Chaque conversation nourrit le CRM.",
      },
      {
        icon: CheckSquare,
        name: "Tâches",
        desc: "Ce que les agents vous demandent de faire aujourd'hui. Rien de plus, rien de moins.",
      },
    ],
  },
  {
    label: "Gagner",
    subtitle: "Transformez les réponses en revenus.",
    items: [
      {
        icon: CalendarDays,
        name: "Meetings",
        desc: "Liens de réservation, rappels automatiques, sync calendrier. Zero back-and-forth.",
      },
      {
        icon: MessageSquare,
        name: "Conversations",
        desc: "Messagerie unifiée multicanal : LinkedIn, WhatsApp, Email, SMS, Instagram. Le contexte complet, un scroll.",
      },
      {
        icon: Target,
        name: "Opportunités",
        desc: "Pipeline par étapes, prévisionnel simple, alertes de risque. Le CRM que vous ne remplirez pas à contrecœur.",
        wide: true,
      },
    ],
  },
  {
    label: "Collaborer",
    subtitle: "Solo, duo ou équipe complète — le workspace s'adapte.",
    items: [
      {
        icon: Users,
        name: "Workspaces partagés",
        desc: "Invitez vos collègues, chacun avec un rôle : édition ou lecture. Une seule base de données, tout le monde dessus.",
      },
      {
        icon: ListChecks,
        name: "Projets communs",
        desc: "Campagnes, comptes stratégiques, workflows : tout se pilote à plusieurs sans dupliquer la donnée.",
      },
      {
        icon: BarChart3,
        name: "Analyses d'équipe",
        desc: "Filtrez par SDR ou AE, voyez la performance par personne et par segment. Les chiffres sans la friction.",
      },
      {
        icon: Workflow,
        name: "Workflows partagés",
        desc: "Un workflow s'ouvre dans un onglet dédié : vous pouvez continuer à piloter une campagne sans perdre votre brouillon.",
      },
    ],
  },
  {
    label: "Automatiser & mesurer",
    subtitle: "Le socle qui fait tenir tout le reste.",
    items: [
      {
        icon: Workflow,
        name: "Workflows",
        desc: "Déclencheurs et actions en langage naturel. Les agents construisent les règles pour vous.",
      },
      {
        icon: BarChart3,
        name: "Analyses",
        desc: "Funnel, cohortes, ROI par séquence. Voyez ce qui convertit avant de scaler.",
      },
      {
        icon: Eye,
        name: "Visiteurs",
        desc: "Identification anonyme des visiteurs de votre site, alertes en temps réel sur les comptes cibles.",
      },
      {
        icon: FileInput,
        name: "Formulaires",
        desc: "Capture inbound, routage automatique vers l'équipe IA. Vos leads chauds arrivent qualifiés.",
      },
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
            LeadCortex remplace votre stack — Apollo, Lemlist, Clay, Instantly, HubSpot — par un
            seul workspace piloté par une équipe d'agents IA. Une IA de recherche qui collecte et
            vérifie, une IA de travail qui analyse et rédige. Solo ou à plusieurs, vous décrivez ce
            que vous voulez, les agents exécutent, vous validez.
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

      {}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-10 md:pb-16">
        <div className="rounded-2xl md:rounded-3xl border border-border bg-surface/40 p-2 md:p-4">
          <div className="rounded-xl md:rounded-2xl border border-border overflow-hidden bg-background">
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2.5 md:py-3.5 border-b border-border bg-surface/60">
              <Sparkles className="size-3.5 md:size-4 text-primary shrink-0" strokeWidth={1.5} />
              <span className="text-xs md:text-sm text-muted-foreground leading-snug">
                « Trouve-moi 30 CTO de PME industrielles françaises qui recrutent en R&D, et prépare
                une séquence de 4 emails. »
              </span>
              <span className="ml-auto shrink-0 text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wide">
                Équipe
              </span>
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {[
                {
                  t: "1 · Recherche",
                  d: "127 comptes correspondants. 89 avec signaux d'intention.",
                },
                { t: "2 · Enrichissement", d: "84 emails vérifiés. 46 mobiles directs." },
                { t: "3 · Rédaction", d: "4 emails contextualisés par prospect, prêts à valider." },
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
          50 crédits offerts. Aucune carte bancaire. Modèles inclus par défaut, BYOK disponible en
          30 secondes.
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
