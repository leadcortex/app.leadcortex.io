//frontend\routes\index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import {
  ArrowRight,
  Check,
  Zap,
  Target,
  Layers,
  Sparkles,
  Video,
  KeyRound,
  Brain,
  Users,
  TrendingDown,
  ShieldCheck,
  Play,
  Star,
  Quote,
  Search,
  Mail,
  Workflow,
  Lock,
  Clock,
  Building2,
  Command,
  Percent,
  Calendar,
  Info,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LandingSkeleton } from "@/components/skeletons";
import {
  PLANS,
  formatEur,
  loyaltyDiscount,
  LOYALTY_CAP_LABEL,
  LOYALTY_MAX_MONTHS,
  type Plan,
} from "@/lib/pricing-strategy";
import {
  PaymentLogos,
  ApolloLogo,
  HunterLogo,
  LemlistLogo,
  ClayLogo,
} from "@/components/pricing-logos";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { LeadMascot } from "@/components/ui/lead-mascot";

export const Route = createFileRoute("/")({
  pendingComponent: () => <LandingSkeleton />,
  component: LandingPage,
});

function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(end: number, duration = 1800, decimals = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(end * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);

  return { ref, formatted: value.toFixed(decimals) };
}

function useStickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.5);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return show;
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(20px)" : "translateY(0)",
        transition: `opacity 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function StatNumber({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const { ref, formatted } = useCountUp(value, 1800, decimals);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/** Cadre navigateur + fallback image + vidéo superposée. */
function VideoFrame({
  src,
  fallback,
  aspect = "aspect-[16/10]",
  className = "",
  label,
  badge,
}: {
  src: string;
  fallback: string;
  aspect?: string;
  className?: string;
  label?: string;
  badge?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-surface/70 px-3 py-2.5 backdrop-blur">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        {label && (
          <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">{label}</span>
        )}
        {badge && (
          <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
            {badge}
          </span>
        )}
      </div>

      <div className={`relative w-full ${aspect} bg-surface/50`}>
        <img
          src={fallback}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/30" />
        <video
          className="absolute inset-0 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO MOCKUP — reconstruction HTML de l'app
   ═══════════════════════════════════════════════════════════════════════════ */

function HeroMockup() {
  const rows = [
    { name: "Marie Laurent", company: "Wavestone", title: "CTO", score: 9.4, verified: true },
    {
      name: "Thomas Dubois",
      company: "Scaleway",
      title: "VP Engineering",
      score: 8.7,
      verified: true,
    },
    {
      name: "Sophie Bernard",
      company: "Doctolib",
      title: "Head of R&D",
      score: 8.2,
      verified: true,
    },
    { name: "Julien Moreau", company: "Qonto", title: "CTO", score: 7.9, verified: false },
    { name: "Emma Petit", company: "Alan", title: "VP Product", score: 7.5, verified: true },
  ];

  const sidebar = [
    { icon: Target, label: "Prospection", active: true },
    { icon: Layers, label: "Enrichissement" },
    { icon: Mail, label: "Séquences" },
    { icon: Workflow, label: "Workflows" },
    { icon: Users, label: "Équipe" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-surface/70 px-3 py-2.5 backdrop-blur">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground">
          app.leadcortex.io — Prospection
        </span>
        <span className="ml-auto hidden shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary md:inline">
          Démo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] lg:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-border/60 bg-surface/30 p-3 md:block">
          <div className="mb-4 flex items-center gap-2 px-2 py-1">
            <div className="grid size-5 place-items-center rounded-md bg-primary/15">
              <Sparkles className="size-3 text-primary" strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold">LeadCortex</span>
          </div>
          <nav className="space-y-0.5">
            {sidebar.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </nav>
        </aside>

        <div className="space-y-3 p-3 md:p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-sm">
            <Sparkles className="size-3.5 shrink-0 text-primary" strokeWidth={2} />
            <span className="truncate text-[11px] text-muted-foreground md:text-xs">
              Trouve-moi 30 CTO de PME industrielles françaises qui recrutent…
            </span>
            <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded border border-border bg-surface/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground md:inline-flex">
              <Command className="size-2.5" /> K
            </kbd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Résultats
              </p>
              <p className="truncate text-sm font-semibold">
                127 prospects ·{" "}
                <span className="text-emerald-600 dark:text-emerald-400">84 vérifiés</span>
              </p>
            </div>
            <div className="flex -space-x-1.5">
              {["ML", "TD", "SB"].map((i) => (
                <div
                  key={i}
                  className="grid size-6 place-items-center rounded-full border-2 border-background bg-primary/15 font-mono text-[8px] font-semibold text-primary"
                >
                  {i}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {rows.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background px-2.5 py-2 transition-colors hover:bg-surface/40 md:gap-3 md:px-3"
              >
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[9px] font-semibold text-primary">
                  {row.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium md:text-xs">{row.name}</p>
                  <p className="truncate text-[9px] text-muted-foreground md:text-[10px]">
                    {row.title} · {row.company}
                  </p>
                </div>
                {row.verified && (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 md:inline-flex">
                    <Check className="size-2.5" strokeWidth={3} />
                    Vérifié
                  </span>
                )}
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {row.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2">
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              L'IA de travail rédige 4 accroches contextualisées…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{`
        @keyframes lc-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes lc-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes lc-pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        .lc-marquee-track {
          animation: lc-marquee 40s linear infinite;
        }
        .lc-marquee-track:hover {
          animation-play-state: paused;
        }
        .lc-float {
          animation: lc-float 5s ease-in-out infinite;
        }
        .lc-pulse-dot {
          animation: lc-pulse-dot 2s ease-in-out infinite;
        }
      `}</style>

      <SiteNav />
      <Hero />
      <LogoRow />
      <ProductShowcase />
      <CompetitorComparison />
      <FeaturesGrid />
      <WorkflowSection />
      <SocialProof />
      <PricingTeaser />
      <FAQSection />
      <CTASection />
      <StickyCTA />
      <SiteFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute right-0 top-40 h-[300px] w-[400px] rounded-full bg-accent/[0.06] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <div>
            <div className="mb-6 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.04] px-3.5 py-1.5 text-xs font-medium text-primary">
              <span className="relative flex size-1.5">
                <span className="lc-pulse-dot absolute inline-flex size-full rounded-full bg-primary" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Nouveau · IA de recherche + IA de travail
            </div>

            <h1 className="animate-fade-in-up font-display text-[clamp(3rem,10vw,8.5rem)] leading-[0.92] tracking-[-0.02em]">
              Deux IA.
              <br />
              <span className="italic text-primary">Toute votre prospection.</span>
            </h1>

            <p className="mt-6 max-w-[54ch] animate-fade-in-up text-base leading-relaxed text-muted-foreground md:mt-8 md:text-lg">
              L'IA de recherche trouve et vérifie vos prospects. L'IA de travail rédige et
              personnalise vos accroches. Un seul workspace, partageable en équipe — sans les cinq
              abonnements qui vont avec.
            </p>

            <div className="mt-6 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="size-3.5" />
              Prix dégressif : jusqu'à -20 % avec la fidélité
            </div>

            <div className="mt-8 flex flex-col gap-3 animate-fade-in-up md:mt-10 md:flex-row md:items-center md:gap-4">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-all hover:opacity-90"
              >
                Démarrer gratuitement
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/product"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-surface"
              >
                <Play className="size-3.5 fill-current" />
                Voir le produit
              </Link>
            </div>

            <p className="mt-4 animate-fade-in-up text-xs text-muted-foreground">
              50 crédits offerts · Sans carte bancaire · Modèles IA inclus
            </p>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="relative flex size-[420px] items-center justify-center">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/[0.08] blur-3xl" />
              <div className="pointer-events-none absolute inset-4 rounded-full border border-dashed border-primary/25" />
              <div className="pointer-events-none absolute inset-12 rounded-full border border-primary/[0.08]" />
              <div className="pointer-events-none absolute bottom-6 left-1/2 h-4 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />
              <LeadMascot
                pose="happy"
                preserveAspectRatio="xMidYMid meet"
                className="lc-float relative h-[380px] w-auto drop-shadow-[0_20px_40px_rgba(193,122,74,0.18)]"
              />
            </div>
          </div>
        </div>

        <div className="relative mt-12 animate-fade-in-up md:mt-20">
          <div className="pointer-events-none absolute -inset-x-8 -bottom-8 top-1/3 -z-10 bg-gradient-to-t from-primary/[0.08] to-transparent blur-2xl" />
          <HeroMockup />
          <video
            className="pointer-events-none absolute inset-0 size-full rounded-2xl object-cover opacity-0 transition-opacity duration-300"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            style={{ zIndex: 1 }}
            onCanPlay={(e) => {
              (e.currentTarget as HTMLVideoElement).style.opacity = "1";
            }}
          >
            <source src="/videos/hero-demo.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGO ROW
   ═══════════════════════════════════════════════════════════════════════════ */

function LogoRow() {
  const competitors = [
    { id: "apollo", label: "Apollo", Logo: ApolloLogo },
    { id: "clay", label: "Clay", Logo: ClayLogo },
    { id: "lemlist", label: "Lemlist", Logo: LemlistLogo },
    { id: "hunter", label: "Hunter", Logo: HunterLogo },
  ];
  const track = [...competitors, ...competitors, ...competitors, ...competitors];

  return (
    <section className="border-y border-border/60 bg-surface/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 md:flex-row md:justify-between md:px-6 md:py-12">
        <p className="shrink-0 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground md:text-xs lg:text-left">
          L'alternative aux outils enterprise
        </p>

        <div
          className="relative w-full overflow-hidden md:max-w-2xl lg:max-w-none"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <ul className="lc-marquee-track flex w-max items-center gap-8 md:gap-12">
            {track.map(({ id, label, Logo }, i) => (
              <li
                key={`${id}-${i}`}
                title={label}
                className="flex shrink-0 items-center gap-3 text-foreground/70"
              >
                <Logo className="size-9 rounded-xl md:size-11" />
                <span className="text-sm font-semibold md:text-base">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCT SHOWCASE — 4 onglets avec fallbacks
   ═══════════════════════════════════════════════════════════════════════════ */

function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: "recherche",
      label: "Recherche",
      icon: Search,
      video: "/videos/demo-recherche.mp4",
      fallback: "/images/prospects.webp",
      title: "Décrivez. L'agent trouve.",
      desc: "Langage naturel, filtres firmographiques, signaux d'achat. La liste se construit pendant que vous buvez votre café.",
      bullets: [
        "Recherche par intention en une phrase",
        "Filtres : taille, secteur, stack, funding",
        "Signaux : levées, recrutements, actualités",
      ],
    },
    {
      id: "enrichissement",
      label: "Enrichissement",
      icon: Layers,
      video: "/videos/demo-enrichissement.mp4",
      fallback: "/images/companies.webp",
      title: "Emails vérifiés. Zéro rebond.",
      desc: "Waterfall multi-providers avec vérification SMTP. Vous ne payez que les enrichissements qui aboutissent.",
      bullets: [
        "Emails vérifiés SMTP en cascade",
        "Téléphones directs quand disponibles",
        "Waterfall jusqu'à 5 fournisseurs",
      ],
    },
    {
      id: "sequence",
      label: "Séquence",
      icon: Mail,
      video: "/videos/demo-sequence.mp4",
      fallback: "/images/e-mail.webp",
      title: "Accroches contextualisées.",
      desc: "L'IA de travail rédige chaque email à partir de signaux réels. Pas de template plaqué, pas de « Bonjour {Prénom} ».",
      bullets: [
        "Personnalisation par lead",
        "Variables depuis les données enrichies",
        "Génération de variantes A/B",
      ],
    },
    {
      id: "workflow",
      label: "Workflow",
      icon: Workflow,
      video: "/videos/demo-workflow.mp4",
      fallback: "/images/catalogue-reseaux.webp",
      title: "Automatisez le pipeline.",
      desc: "Déclencheurs, actions, conditions. Un canevas visuel pour orchestrer toute la chaîne, du signal jusqu'au premier email.",
      bullets: ["Blocs glisser-déposer", "Exécution en continu", "Historique complet par passage"],
    },
  ];

  const active = tabs[activeTab];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <div className="mb-10 max-w-2xl md:mb-14">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
            Le workspace
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.02] tracking-tight md:text-6xl">
            Un seul écran.
            <br />
            <span className="italic">Toute votre prospection.</span>
          </h2>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = i === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-center md:gap-12">
        <Reveal delay={150}>
          <VideoFrame
            src={active.video}
            fallback={active.fallback}
            aspect="aspect-[16/10]"
            label={`app.leadcortex.io — ${active.label}`}
            badge="Démo"
          />
        </Reveal>

        <Reveal delay={250}>
          <div>
            <h3 className="font-display text-2xl italic leading-tight md:text-3xl">
              {active.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              {active.desc}
            </p>
            <ul className="mt-6 space-y-3">
              {active.bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10">
                    <Check className="size-3 text-emerald-500" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/90">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPETITOR COMPARISON — Avant / Après
   ═══════════════════════════════════════════════════════════════════════════ */

function CompetitorComparison() {
  const stack = [
    { id: "apollo", name: "Apollo", price: 49, Logo: ApolloLogo },
    { id: "clay", name: "Clay", price: 149, Logo: ClayLogo },
    { id: "lemlist", name: "Lemlist", price: 59, Logo: LemlistLogo },
    { id: "hunter", name: "Hunter", price: 34, Logo: HunterLogo },
  ];

  const total = stack.reduce((acc, s) => acc + s.price, 0);
  const lcPrice = PLANS[0]!.monthlyPrice;
  const savings = total - lcPrice;

  return (
    <section className="border-y border-border/60 bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-16">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
              Comparaison honnête
            </p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight md:text-6xl">
              Vous payez <span className="italic">combien</span>, aujourd'hui ?
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              Prix publics indicatifs, tier d'entrée payant, par utilisateur et par mois.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-5xl items-stretch gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <Reveal delay={100}>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 md:p-8">
              <div className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Votre stack actuel
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  5 abonnements. 5 factures. 5 interfaces.
                </p>
              </div>

              <ul className="flex-1 space-y-3">
                {stack.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface/30 px-3 py-3 md:px-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <item.Logo className="size-8 shrink-0 rounded-lg md:size-9" />
                      <span className="truncate text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground md:text-sm">
                      {item.price}€
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
                <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  Total
                </span>
                <span className="font-display text-3xl md:text-4xl">
                  {total}
                  <span className="ml-1 text-base text-muted-foreground">€/mois</span>
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="flex items-center justify-center md:h-full">
              <div className="grid size-12 place-items-center rounded-full border border-border bg-background shadow-sm md:size-14">
                <ArrowRight className="size-5 text-primary md:size-6" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/[0.05] to-background p-6 md:p-8">
              <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/10 blur-3xl" />

              <div className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary">
                  Avec LeadCortex
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Un seul workspace. Une seule facture.
                </p>
              </div>

              <div className="flex flex-1 items-center justify-center py-6">
                <div className="text-center">
                  <div className="font-display text-5xl leading-none md:text-7xl">
                    {formatEur(lcPrice)}
                    <span className="ml-1 text-lg text-muted-foreground md:text-2xl">€/mois</span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    Plan Starter
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-center">
                <p className="text-xs uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                  Vous économisez
                </p>
                <p className="mt-1 font-display text-2xl text-emerald-600 dark:text-emerald-400 md:text-3xl">
                  {formatEur(savings)}€/mois
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  soit {formatEur(savings * 12)}€ par an
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={400}>
          <p className="mt-8 text-center text-[10px] text-muted-foreground/70 md:text-xs">
            Les marques citées appartiennent à leurs propriétaires respectifs. Tarifs publics
            indicatifs au tier d'entrée, hors promotions.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURES GRID
   ═══════════════════════════════════════════════════════════════════════════ */

function FeaturesGrid() {
  const features = [
    {
      icon: Target,
      title: "Recherche par intention",
      desc: "Décrivez votre ICP en langage naturel. L'IA de recherche identifie les prospects, les vérifie et scanne les signaux d'achat.",
    },
    {
      icon: Zap,
      title: "Enrichissement autonome",
      desc: "Emails vérifiés SMTP, téléphones directs, données firmographiques. Waterfall multi-providers, sans copier-coller entre 4 onglets.",
    },
    {
      icon: Sparkles,
      title: "Accroches contextuelles",
      desc: "L'IA de travail rédige chaque email à partir de signaux réels : levées, embauches, actualités produit. Zéro template plaqué.",
    },
    {
      icon: KeyRound,
      title: "Modèles inclus ou BYOK",
      desc: "Utilisez les modèles inclus par défaut, ou branchez vos propres clés Anthropic, OpenAI, Google, Groq, DeepSeek ou Mistral.",
    },
    {
      icon: Users,
      title: "Conçu pour les équipes",
      desc: "Travaillez seul ou à plusieurs. Workspaces partagés, projets communs, rôles différenciés. Une seule base de données.",
    },
    {
      icon: Brain,
      title: "Mémoire et compétences",
      desc: "L'équipe retient vos préférences, votre ICP, votre ton. Elle s'améliore à chaque échange sans que vous ayez à répéter.",
    },
  ];

  return (
    <section className="border-y border-border/60 bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <div className="mb-10 max-w-2xl md:mb-16">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
              Fonctionnalités
            </p>
            <h2 className="mt-3 font-display text-3xl leading-[1.02] tracking-tight md:text-6xl">
              Des agents qui <span className="italic">travaillent en équipe</span>.
              <br />
              Pas un outil de plus.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-2">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 60}>
              <div className="group h-full bg-background p-5 transition-all duration-300 hover:bg-surface/60 md:p-10">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/5 transition-colors group-hover:bg-primary/10 md:size-11">
                    <Icon className="size-4 text-primary md:size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-medium tracking-tight md:text-lg">{title}</h3>
                    <p className="mt-1 max-w-[48ch] text-xs leading-relaxed text-muted-foreground md:mt-2 md:text-sm">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORKFLOW SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function WorkflowSection() {
  const steps = [
    {
      n: "01",
      title: "Décrivez votre ICP",
      desc: "Une phrase. Les agents la traduisent en filtres firmographiques, personas et signaux d'intention.",
    },
    {
      n: "02",
      title: "L'IA de recherche collecte",
      desc: "Scan LinkedIn, bases publiques, sources d'actualité. Chaque lead est scoré selon votre thèse commerciale.",
    },
    {
      n: "03",
      title: "L'IA de travail rédige",
      desc: "Enrichissement + accroche. Email vérifié, contexte entreprise, séquence personnalisée. Prêt à envoyer ou à review.",
    },
    {
      n: "04",
      title: "Vous validez, on envoie",
      desc: "Revue à plusieurs si besoin, envoi depuis votre domaine. Réponses centralisées, relances automatiques.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="grid items-start gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
        <Reveal>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
              Le flow
            </p>
            <h2 className="mt-3 font-display text-3xl leading-[1.02] tracking-tight md:text-5xl">
              De l'idée
              <br />
              au <span className="italic">reply</span>.
              <br />
              En 4 gestes.
            </h2>

            <div className="mt-6 md:mt-10">
              <VideoFrame
                src="/videos/workflow-flow.mp4"
                fallback="/images/Listes.webp"
                aspect="aspect-video"
                label="flow.leadcortex — Automatisation"
                badge="Démo"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="space-y-px">
            {steps.map((s) => (
              <div
                key={s.n}
                className="grid grid-cols-[auto_1fr] gap-4 border-b border-border py-5 last:border-0 md:gap-8 md:py-8"
              >
                <span className="font-mono text-xs text-muted-foreground md:text-sm">{s.n}</span>
                <div>
                  <h3 className="font-display text-lg italic md:text-2xl">{s.title}</h3>
                  <p className="mt-1 max-w-[52ch] text-xs text-muted-foreground md:mt-2 md:text-sm">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SOCIAL PROOF
   ═══════════════════════════════════════════════════════════════════════════ */

function SocialProof() {
  const testimonials = [
    {
      quote:
        "J'ai remplacé 4 outils par LeadCortex. Mon équipe a récupéré 8 heures par semaine sur la prospection.",
      name: "Marie D.",
      role: "Head of Sales",
      company: "[Entreprise]",
      initials: "MD",
    },
    {
      quote:
        "Les accroches générées sont vraiment contextualisées. Mon taux de réponse est passé de 4 % à 11 % en deux mois.",
      name: "Thomas L.",
      role: "Founder",
      company: "[Entreprise]",
      initials: "TL",
    },
    {
      quote:
        "On prospecte en duo avec un associé, sur le même workspace. Plus de doublons, plus de copier-coller.",
      name: "Sarah K.",
      role: "Co-fondatrice",
      company: "[Entreprise]",
      initials: "SK",
    },
  ];

  const trustBadges = [
    { icon: ShieldCheck, label: "Conforme RGPD" },
    { icon: Lock, label: "Chiffrement AES-256" },
    { icon: Building2, label: "Hébergé en UE" },
    { icon: Clock, label: "Support < 24h" },
  ];

  return (
    <section className="relative overflow-hidden border-y border-border/60">
      <img
        src="/images/prospects.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.06] dark:opacity-[0.10]"
      />
      <video
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.10] dark:opacity-[0.16]"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/videos/ambient-team.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <div className="mb-14 grid grid-cols-2 gap-6 md:mb-20 md:grid-cols-4 md:gap-8">
            {[
              { value: 12400, suffix: "+", label: "Prospects enrichis / semaine" },
              { value: 3200, suffix: "+", label: "Séquences lancées" },
              { value: 94, suffix: " %", label: "Délivrabilité moyenne" },
              { value: 2.4, suffix: "s", label: "Temps moyen d'enrichissement", decimals: 1 },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="font-display text-3xl md:text-5xl">
                  <StatNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals ?? 0}
                  />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground md:text-xs">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mb-8 max-w-2xl md:mb-12">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
              Ils utilisent LeadCortex
            </p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight md:text-5xl">
              Ce qu'en disent les <span className="italic">premiers utilisateurs</span>.
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-foreground/20 md:p-7">
                <Quote className="size-5 text-primary/40" strokeWidth={1.5} />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90 md:text-base">
                  « {t.quote} »
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-medium text-primary">
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.role} · {t.company}
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="size-3 fill-primary text-primary" strokeWidth={0} />
                    ))}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl border border-border bg-background/60 p-5 backdrop-blur-sm md:mt-14 md:p-6">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm"
              >
                <Icon className="size-4 text-emerald-500" strokeWidth={1.75} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRICING TEASER — REFONTE
   ───────────────────────────────────────────────────────────────────────────
   • Toggle mensuel / annuel
   • Chaque carte affiche : prix actuel (formatEur), badge remise, prix barré
     + économie en € si annuel
   • Petite barre visuelle de comparaison
   • Hint cumul fidélité
   • CTA vers /pricing pour la comparaison complète
   ═══════════════════════════════════════════════════════════════════════════ */

function PricingTeaser() {
  // Défaut = mensuel — ne pas passer à `true`.
  const [annual, setAnnual] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <Reveal>
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
            Tarifs
          </p>
          <h2 className="mt-3 font-display text-3xl leading-[1.02] tracking-tight md:text-6xl">
            Un prix <span className="italic">honnête</span>.
            <br />
            Qui baisse avec le temps.
          </h2>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Percent className="size-3.5" />
              Annuel : -10 % à -35 % selon le plan
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] px-3.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="size-3.5" />
              Fidélité : jusqu'à {LOYALTY_CAP_LABEL} en plus
            </span>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/40 p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                aria-pressed={!annual}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all md:px-5 ${
                  !annual
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="size-3.5" />
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                aria-pressed={annual}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all md:px-5 ${
                  annual
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="size-3.5" />
                Annuel
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {annual
              ? "Facturation annuelle — vous payez une fois pour 12 mois."
              : "Facturation mensuelle — sans engagement, résiliable à tout moment."}
          </p>
        </div>
      </Reveal>

      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
        {PLANS.map((plan, i) => (
          <PricingTeaserCard key={plan.id} plan={plan} annual={annual} index={i} />
        ))}
      </div>

      <Reveal delay={300}>
        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface/30 p-5 md:flex-row md:p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>Paiement sécurisé · Aucun engagement · Prix dégressif automatique</span>
          </div>
          <PaymentLogos size="sm" className="md:justify-end" />
        </div>

        <p className="mt-6 text-center text-[10px] text-muted-foreground md:text-xs">
          Modèles inclus par défaut. BYOK disponible sur tous les plans.{" "}
          <Link to="/pricing" className="text-primary underline-offset-2 hover:underline">
            Voir la comparaison complète
          </Link>
        </p>
      </Reveal>

      <Reveal delay={400}>
        <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-3">
          {[
            {
              icon: Percent,
              title: "Remise annuelle",
              desc: "Payez 12 mois d'avance : -10 % Starter, -20 % Founder, -35 % Studio.",
            },
            {
              icon: TrendingDown,
              title: "Remise fidélité",
              desc: `-2 % par mois de présence, jusqu'à ${LOYALTY_CAP_LABEL} après ${LOYALTY_MAX_MONTHS} mois.`,
            },
            {
              icon: Wallet,
              title: "Les deux se cumulent",
              desc: "Votre prix final combine les deux remises. Utilisez le simulateur pour voir.",
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/20"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-3.5" strokeWidth={2} />
                </span>
                <p className="mt-3 text-xs font-semibold">{step.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </Reveal>

      {}
      <Reveal delay={500}>
        <div className="mt-8 flex justify-center">
          <Link
            to="/pricing"
            className="group inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-surface"
          >
            <Info className="size-3.5" />
            Essayer le simulateur de prix
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function PricingTeaserCard({
  plan,
  annual,
  index,
}: {
  plan: Plan;
  annual: boolean;
  index: number;
}) {
  const isFounder = plan.id === "founder";

  const basePrice = annual ? plan.annualMonthly : plan.monthlyPrice;

  const percentOfFull = Math.min(1, basePrice / plan.monthlyPrice);

  return (
    <Reveal delay={index * 100}>
      <div
        className={`flex h-full flex-col rounded-2xl border bg-background p-6 transition-all duration-300 md:p-7 ${
          isFounder ? "border-primary/40 shadow-sm" : "border-border hover:border-foreground/20"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground md:text-xs">
            {plan.name}
          </p>
          {isFounder && (
            <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-primary">
              Recommandé
            </span>
          )}
          {annual && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Percent className="size-3" strokeWidth={2.5} />
              {plan.annualDiscountLabel}
            </span>
          )}
        </div>

        <div className="mt-4 md:mt-5">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl md:text-5xl">{formatEur(basePrice)}</span>
            <span className="text-xs text-muted-foreground md:text-sm">€/mois</span>
          </div>

          {annual ? (
            <>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground line-through">
                  {formatEur(plan.monthlyPrice)}€
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingDown className="size-3" />
                  {plan.annualDiscountLabel}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Facturé{" "}
                <strong className="text-foreground">
                  {formatEur(plan.annualPrice)}€ pour 12 mois
                </strong>
                {" · "}vous économisez{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatEur(plan.annualSavings)}€
                </strong>
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              En annuel :{" "}
              <strong className="text-foreground">{formatEur(plan.annualMonthly)}€/mois</strong>{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                (économie {formatEur(plan.annualSavings)}€)
              </span>
            </p>
          )}
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground/70">
            <span>Prix plein</span>
            <span>Vous payez</span>
          </div>
          <div className="relative h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-500"
              style={{ width: `${percentOfFull * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-surface/40 p-2.5">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            <TrendingDown className="mr-1 inline size-3 text-emerald-500" />
            Cumulable avec <strong className="text-foreground">-2 %/mois de fidélité</strong>{" "}
            (plafond {LOYALTY_CAP_LABEL})
          </p>
        </div>

        <ul className="mt-5 flex-1 space-y-2">
          {plan.highlights.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs md:text-sm">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/signup"
          className={`mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-all md:mt-7 md:text-sm ${
            isFounder
              ? "bg-foreground text-background hover:opacity-90"
              : "border border-border hover:bg-surface"
          }`}
        >
          {plan.ctaLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Reveal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════════════════ */

function FAQSection() {
  const faqs = [
    {
      q: "Qu'est-ce qui différencie LeadCortex d'Apollo ou Clay ?",
      a: "Apollo et Clay vendent des données. LeadCortex vend une équipe d'agents qui utilise ces données pour vous. Concrètement : une IA de recherche qui collecte et vérifie, une IA de travail qui rédige et personnalise. Un seul workspace, un seul abonnement, une seule facture.",
    },
    {
      q: "Comment fonctionne le prix dégressif ?",
      a: "Votre mensualité baisse automatiquement de 2 % par mois de fidélité, jusqu'à -20 % après 10 mois. Aucune action requise, aucune condition cachée. La réduction reste acquise tant que votre abonnement est actif.",
    },
    {
      q: "Comment fonctionne la remise annuelle ?",
      a: "Si vous payez 12 mois d'avance, une remise immédiate s'applique sur chaque mensualité équivalente : -10 % sur Starter, -20 % sur Founder, -35 % sur Studio. Elle se cumule avec la remise fidélité pour faire baisser encore le prix final.",
    },
    {
      q: "Qu'est-ce que le BYOK, et est-ce obligatoire ?",
      a: "BYOK = « bring your own key ». Vous branchez vos propres clés API Anthropic, OpenAI, Google, Groq, DeepSeek ou Mistral, sans marge sur les tokens. Ce n'est PAS obligatoire : les modèles inclus fonctionnent par défaut sur tous les plans.",
    },
    {
      q: "Puis-je travailler en équipe sur le même workspace ?",
      a: "Oui. Founder inclut 1 siège édition + 1 invité en lecture. Studio inclut 5 sièges avec rôles différenciés. Les membres partagent les mêmes prospects, listes, séquences et workflows — sans doublons.",
    },
    {
      q: "Y a-t-il un essai gratuit ?",
      a: "Oui. 50 crédits offerts à l'inscription, sans carte bancaire. Les modèles IA inclus sont disponibles immédiatement. L'éditeur de workflows est réservé aux plans payants (coûts d'infrastructure).",
    },
  ];

  return (
    <section className="border-t border-border/60 bg-surface/30">
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
        <Reveal>
          <div className="mb-10 flex items-center gap-6 md:mb-14 md:gap-8">
            <div className="hidden shrink-0 md:block">
              <div className="relative flex size-[160px] items-center justify-center">
                <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/[0.06] blur-2xl" />
                <div className="pointer-events-none absolute bottom-2 left-1/2 h-2 w-20 -translate-x-1/2 rounded-full bg-primary/15 blur-xl" />
                <LeadMascot
                  pose="curious"
                  preserveAspectRatio="xMidYMid meet"
                  className="relative h-[140px] w-auto"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-primary md:text-xs">
                FAQ
              </p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight md:text-5xl">
                Les questions <span className="italic">qu'on nous pose</span>.
              </h2>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border border-border bg-background px-5 md:px-6"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className={i === faqs.length - 1 ? "border-b-0" : ""}
              >
                <AccordionTrigger className="py-5 text-left text-sm font-medium md:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-xs leading-relaxed text-muted-foreground md:text-sm">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 text-center text-xs text-muted-foreground md:text-sm">
            Pas la réponse que vous cherchiez ?{" "}
            <Link to="/support" className="text-primary underline underline-offset-2">
              Voir le centre d'aide complet
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTA FINAL
   ═══════════════════════════════════════════════════════════════════════════ */

function CTASection() {
  return (
    <section className="relative overflow-hidden">
      <img
        src="/images/login-signup.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.14] dark:opacity-[0.20]"
      />
      <video
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.16] dark:opacity-[0.22]"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/videos/ambient-cta.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/75 to-background" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center md:mb-10">
              <div className="relative flex size-[220px] items-center justify-center md:size-[260px]">
                <div className="pointer-events-none absolute inset-0 rounded-full bg-primary/[0.10] blur-3xl" />
                <div className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-primary/20" />
                <div className="pointer-events-none absolute bottom-4 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />
                <LeadMascot
                  pose="success"
                  preserveAspectRatio="xMidYMid meet"
                  className="lc-float relative h-[200px] w-auto drop-shadow-[0_20px_40px_rgba(193,122,74,0.20)] md:h-[240px]"
                />
              </div>
            </div>

            <h2 className="font-display text-3xl leading-[0.95] tracking-tight md:text-7xl">
              Votre prochaine réponse
              <br />
              <span className="italic text-primary">commence maintenant.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-[46ch] text-sm text-muted-foreground md:mt-6 md:text-base">
              50 crédits offerts. Aucune carte bancaire. Modèles IA inclus par défaut, BYOK
              disponible en 30 secondes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:mt-10">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-all hover:opacity-90 md:px-6 md:py-3.5"
              >
                Créer mon workspace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-surface md:px-6 md:py-3.5"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STICKY CTA
   ═══════════════════════════════════════════════════════════════════════════ */

function StickyCTA() {
  const show = useStickyCTA();
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl transition-transform duration-500 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-3.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium md:text-sm">
            Prêt à essayer ?{" "}
            <span className="text-muted-foreground">50 crédits offerts, sans CB.</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/pricing"
            className="hidden rounded-xl border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-surface md:inline-flex md:text-sm"
          >
            Tarifs
          </Link>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-medium text-background transition-all hover:opacity-90 md:text-sm"
          >
            Démarrer
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
