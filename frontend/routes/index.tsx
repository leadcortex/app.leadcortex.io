import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Database,
  Image as ImageIcon,
  Layers,
  Mail,
  Percent,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Video,
  Wallet,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { LandingSkeleton } from "@/components/skeletons";
import { PaymentLogos } from "@/components/pricing-logos";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LeadMascot } from "@/components/ui/lead-mascot";
import { PLANS, formatEur, type Plan } from "@/lib/pricing-strategy";

export const Route = createFileRoute("/")({
  pendingComponent: () => <LandingSkeleton />,
  component: LandingPage,
});

function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -4% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
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
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function useStickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.2);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return show;
}

type MediaKind = "image" | "video";

function MediaSlot({
  kind,
  label,
  hint,
  aspect = "aspect-video",
  className = "",
}: {
  kind: MediaKind;
  label: string;
  hint: string;
  aspect?: string;
  className?: string;
}) {
  const Icon = kind === "video" ? Video : ImageIcon;

  return (
    <div
      role="group"
      aria-label={`${kind === "video" ? "Emplacement vidéo" : "Emplacement image"} : ${label}`}
      className={`lc-media-slot group relative isolate overflow-hidden rounded-[1.35rem] border border-primary/20 ${aspect} ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 54% 48%, color-mix(in oklab, var(--primary) 13%, transparent), transparent 64%), linear-gradient(135deg, var(--canvas), var(--surface))",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--primary) 10%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--primary) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "linear-gradient(to bottom, black, transparent 88%)",
        }}
      />
      <div className="pointer-events-none absolute inset-3 rounded-[1rem] border border-dashed border-primary/25 transition-colors duration-300 group-hover:border-primary/45 sm:inset-4" />

      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-2.5 py-1.5 backdrop-blur-md">
        <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-3" strokeWidth={1.8} />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {kind === "video" ? "Zone vidéo" : "Zone image"}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-6 py-14 text-center">
        <div className="max-w-[19rem]">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/20 bg-background/70 text-primary shadow-sm backdrop-blur-sm transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-3deg]">
            <Icon className="size-5" strokeWidth={1.5} />
          </div>
          <p className="mt-4 font-display text-xl italic leading-tight text-foreground sm:text-2xl">
            {label}
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
            {hint}
          </p>
        </div>
      </div>

      <span className="pointer-events-none absolute bottom-5 right-5 font-mono text-[9px] tracking-[0.16em] text-primary/70">
        LC&nbsp; / &nbsp;MEDIA
      </span>
      <span
        aria-hidden="true"
        className="lc-media-sweep pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary sm:text-[11px]">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      {children}
    </p>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <style>{`
        @keyframes lc-sweep {
          0% { transform: translateY(-8px); opacity: 0; }
          15% { opacity: .7; }
          85% { opacity: .55; }
          100% { transform: translateY(500px); opacity: 0; }
        }
        @keyframes lc-dash {
          to { stroke-dashoffset: -32; }
        }
        @keyframes lc-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes lc-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes lc-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lc-media-sweep { animation: lc-sweep 6.5s ease-in-out infinite; }
        .lc-dash-line { animation: lc-dash 8s linear infinite; }
        .lc-float { animation: lc-float 5s ease-in-out infinite; }
        .lc-orbit { animation: lc-orbit 32s linear infinite; transform-origin: center; }
        .lc-hero-in { animation: lc-in 700ms cubic-bezier(.16,1,.3,1) both; }
        .lc-hero-in-2 { animation: lc-in 700ms 120ms cubic-bezier(.16,1,.3,1) both; }
        .lc-hero-in-3 { animation: lc-in 700ms 220ms cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <SiteNav />
      <main>
        <Hero />
        <CapabilityStrip />
        <ProductShowcase />
        <WorkflowSection />
        <FeaturesGrid />
        <ShowcaseGallery />
        <PricingTeaser />
        <FAQSection />
        <CTASection />
      </main>
      <StickyCTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--primary) 18%, transparent) .7px, transparent .7px)",
          backgroundSize: "21px 21px",
          maskImage: "linear-gradient(to bottom, black, transparent 86%)",
        }}
      />
      <div className="pointer-events-none absolute -right-40 -top-36 -z-10 size-[28rem] rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute -right-24 -top-20 -z-10 size-[21rem] rounded-full border border-dashed border-primary/15 lc-orbit" />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 md:pt-20 lg:pb-20 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="relative z-10">
            <div className="lc-hero-in">
              <SectionLabel>Prospection B2B, pensée comme un vrai métier</SectionLabel>
            </div>

            <h1 className="lc-hero-in-2 mt-5 max-w-[12ch] font-display text-[clamp(3.35rem,8vw,6.8rem)] leading-[0.9] tracking-[-0.045em]">
              La bonne cible.
              <br />
              <span className="italic text-primary">Le bon signal.</span>
              <br />
              Le bon message.
            </h1>

            <p className="lc-hero-in-3 mt-6 max-w-[52ch] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              Décrivez votre cible. L’IA de recherche repère et enrichit les prospects ; l’IA de
              travail prépare une accroche liée à leur contexte. Vous gardez la main avant l’envoi.
            </p>

            <div className="lc-hero-in-3 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Démarrer avec 50 crédits
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#demonstration"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-background/70 px-5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-surface"
              >
                <Play className="size-3.5 fill-current" />
                Voir l’aperçu
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" strokeWidth={2.4} />
                Sans carte bancaire
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" strokeWidth={2.4} />
                Modèles IA inclus
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[42rem] lg:ml-auto">
            <div className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-primary/[0.07] blur-2xl sm:-inset-8" />
            <div className="relative rounded-[1.65rem] border border-border/70 bg-background/70 p-2 shadow-[0_28px_80px_-42px_rgba(80,55,35,.4)] backdrop-blur-sm sm:p-3">
              <div className="mb-2 flex items-center justify-between gap-3 px-2 py-1.5 sm:px-3">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1.5" aria-hidden="true">
                    <i className="size-2 rounded-full bg-red-400/70" />
                    <i className="size-2 rounded-full bg-amber-400/70" />
                    <i className="size-2 rounded-full bg-emerald-500/70" />
                  </span>
                  <span className="font-mono text-[9px] tracking-wide text-muted-foreground sm:text-[10px]">
                    LEADCORTEX&nbsp; / &nbsp;APERÇU
                  </span>
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-primary">
                  En direct
                </span>
              </div>

              <div className="relative">
                <MediaSlot
                  kind="video"
                  label="L’agent en action"
                  hint="Vidéo produit · 16:9"
                  aspect="aspect-[1.25/1] sm:aspect-[1.45/1]"
                  className="rounded-[1.2rem]"
                />
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden size-full overflow-visible md:block"
                  viewBox="0 0 600 420"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M-8 340 C 80 340, 104 260, 180 260 S 294 170, 354 170 S 462 90, 608 90"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                    strokeDasharray="4 7"
                    className="lc-dash-line"
                    opacity=".45"
                  />
                </svg>

                <div className="lc-float absolute -left-3 top-[19%] hidden max-w-[12rem] rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur sm:block md:-left-7">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold">Signal repéré</p>
                      <p className="text-[9px] text-muted-foreground">Un contexte à exploiter</p>
                    </div>
                  </div>
                </div>

                <div className="lc-float absolute -bottom-4 right-3 max-w-[14rem] rounded-xl border border-border/80 bg-background/95 p-3 shadow-lg backdrop-blur sm:right-[-1rem]">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Mail className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold">Accroche contextualisée</p>
                      <p className="text-[9px] text-muted-foreground">Prête à relire avant envoi</p>
                    </div>
                    <Check className="ml-1 size-3.5 shrink-0 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 pb-1 text-[9px] text-muted-foreground sm:px-3">
                <span>RECHERCHE → ENRICHISSEMENT → MESSAGE</span>
                <span className="font-mono">UN WORKSPACE · DEUX AGENTS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-0 border-t border-border/70 pt-5 sm:grid-cols-4 sm:pt-6">
          {[
            ["01", "Décrire sa cible"],
            ["02", "Repérer les signaux"],
            ["03", "Enrichir les contacts"],
            ["04", "Préparer le message"],
          ].map(([number, label]) => (
            <div key={number} className="flex items-center gap-2.5 py-2 pr-3 sm:gap-3 sm:pr-5">
              <span className="font-mono text-[10px] text-primary">{number}</span>
              <span className="text-[10px] text-muted-foreground sm:text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityStrip() {
  const capabilities = [
    { icon: Search, label: "Recherche en langage naturel" },
    { icon: Database, label: "Enrichissement en cascade" },
    { icon: ShieldCheck, label: "Contacts vérifiés" },
    { icon: Sparkles, label: "Accroches contextualisées" },
  ];

  return (
    <section className="border-b border-border/70 bg-surface/35">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
        {capabilities.map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className="flex min-h-[4.6rem] items-center gap-3 border-border/50 px-2 py-4 sm:px-4 md:border-r md:last:border-r-0"
          >
            <span className="font-mono text-[9px] text-primary/70">0{index + 1}</span>
            <Icon className="size-4 shrink-0 text-primary" strokeWidth={1.6} />
            <span className="text-[10px] font-medium leading-tight sm:text-xs">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductShowcase() {
  const tabs = [
    {
      id: "recherche",
      label: "Repérer",
      icon: Search,
      title: "Partez d’une cible, pas d’un tableur.",
      desc: "Décrivez votre ICP en langage naturel. L’agent de recherche transforme votre demande en critères, puis rassemble les comptes qui correspondent.",
      bullets: ["Secteur, taille et zone géographique", "Critères précis sans empiler les filtres", "Signaux à vérifier avant la prise de contact"],
      media: "Capture de la recherche",
      kind: "image" as const,
    },
    {
      id: "enrichissement",
      label: "Enrichir",
      icon: Layers,
      title: "Le contexte utile, au même endroit.",
      desc: "Complétez les fiches avec les coordonnées disponibles et le contexte qui aide à qualifier le bon interlocuteur.",
      bullets: ["Enrichissement multi-fournisseurs", "Vérification des emails", "Données prêtes à exploiter"],
      media: "Vidéo d’enrichissement",
      kind: "video" as const,
    },
    {
      id: "messages",
      label: "Personnaliser",
      icon: Mail,
      title: "Écrivez à la personne, pas à la liste.",
      desc: "L’IA de travail s’appuie sur les informations du prospect pour préparer une accroche concrète, à relire et ajuster avant l’envoi.",
      bullets: ["Contexte de l’entreprise", "Accroche adaptée à chaque prospect", "Message modifiable avant envoi"],
      media: "Aperçu d’une accroche",
      kind: "image" as const,
    },
    {
      id: "workflows",
      label: "Orchestrer",
      icon: Workflow,
      title: "Gardez la chaîne de travail lisible.",
      desc: "Reliez recherche, enrichissement et préparation des séquences avec des workflows visuels, sans disperser le suivi.",
      bullets: ["Déclencheurs et actions", "Conditions adaptées à votre processus", "Historique des étapes du workflow"],
      media: "Vidéo du workflow",
      kind: "video" as const,
    },
  ];
  const [activeTab, setActiveTab] = useState(0);
  const active = tabs[activeTab]!;

  return (
    <section id="demonstration" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-end">
            <div>
              <SectionLabel>Le workspace</SectionLabel>
              <h2 className="mt-4 max-w-[13ch] font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl md:text-6xl">
                Du premier signal au <span className="italic text-primary">message prêt.</span>
              </h2>
            </div>
            <p className="max-w-[50ch] text-sm leading-7 text-muted-foreground md:justify-self-end md:text-base">
              Recherche, enrichissement et personnalisation se suivent dans le même espace. Choisissez
              une étape pour voir où votre démo ou votre capture d’écran prendra place.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-9 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Étapes du produit">
            {tabs.map(({ id, label, icon: Icon }, index) => (
              <button
                key={id}
                id={`lc-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === index}
                aria-controls="lc-product-preview"
                onClick={() => setActiveTab(index)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-medium transition-all sm:text-sm ${
                  activeTab === index
                    ? "border-primary/40 bg-primary/[0.08] text-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/25 hover:text-foreground"
                }`}
              >
                <Icon className={`size-3.5 ${activeTab === index ? "text-primary" : ""}`} />
                {label}
              </button>
            ))}
          </div>
        </Reveal>

        <div
          id="lc-product-preview"
          role="tabpanel"
          aria-labelledby={`lc-tab-${active.id}`}
          className="mt-4 grid gap-6 rounded-[1.6rem] border border-border/80 bg-surface/30 p-3 sm:p-5 md:grid-cols-[1.3fr_0.7fr] md:gap-10 md:p-7"
        >
          <Reveal>
            <MediaSlot
              kind={active.kind}
              label={active.media}
              hint={`${active.kind === "video" ? "Vidéo" : "Capture d’écran"} · 16:10`}
              aspect="aspect-[16/11] md:aspect-[1.28/1]"
              className="h-full min-h-[15rem]"
            />
          </Reveal>
          <Reveal delay={120}>
            <div className="flex h-full flex-col justify-center py-3 md:py-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                ÉTAPE 0{activeTab + 1}
              </span>
              <h3 className="mt-3 max-w-[17ch] font-display text-3xl italic leading-[1.05] sm:text-4xl">
                {active.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{active.desc}</p>
              <ul className="mt-5 space-y-3">
                {active.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-xs leading-5 sm:text-sm">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500/10">
                      <Check className="size-2.5 text-emerald-600" strokeWidth={3} />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <Link
                to="/product"
                className="group mt-7 inline-flex w-fit items-center gap-2 text-xs font-semibold text-primary transition-colors hover:text-foreground sm:text-sm"
              >
                Explorer le produit
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    {
      number: "01",
      icon: Target,
      title: "Définir",
      desc: "Décrivez votre ICP et les critères qui comptent vraiment pour votre équipe.",
    },
    {
      number: "02",
      icon: Search,
      title: "Repérer",
      desc: "L’agent cherche les entreprises et fait ressortir les signaux pertinents.",
    },
    {
      number: "03",
      icon: Database,
      title: "Qualifier",
      desc: "Enrichissez les informations de contact et vérifiez les données disponibles.",
    },
    {
      number: "04",
      icon: Mail,
      title: "Préparer",
      desc: "L’IA de travail rédige une accroche que vous pouvez relire avant l’envoi.",
    },
  ];

  return (
    <section className="relative overflow-hidden border-y border-border/70 bg-surface/35">
      <div className="pointer-events-none absolute -left-28 top-1/2 size-80 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-[0.82fr_1.18fr] md:items-end">
            <div>
              <SectionLabel>Un fil continu</SectionLabel>
              <h2 className="mt-4 max-w-[12ch] font-display text-4xl leading-[0.97] tracking-tight sm:text-5xl md:text-6xl">
                La prospection, <span className="italic">sans les coutures.</span>
              </h2>
            </div>
            <p className="max-w-[50ch] text-sm leading-7 text-muted-foreground md:justify-self-end md:text-base">
              Deux agents spécialisés se passent le relais. Vous gardez la visibilité sur chaque étape
              et le dernier mot sur le message.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden h-10 w-[84%] lg:block"
            viewBox="0 0 1000 40"
            preserveAspectRatio="none"
          >
            <path
              d="M0 20 C 150 20, 170 4, 310 20 S 470 36, 600 20 S 820 4, 1000 20"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeDasharray="4 8"
              className="lc-dash-line"
              opacity=".55"
            />
          </svg>
          {steps.map(({ number, icon: Icon, title, desc }, index) => (
            <Reveal key={number} delay={index * 75}>
              <article className="group relative h-full rounded-2xl border border-border/80 bg-background/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-node sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-primary">{number}</span>
                  <span className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-primary transition-all duration-300 group-hover:rotate-[-4deg] group-hover:border-primary/25 group-hover:bg-primary/[0.08]">
                    <Icon className="size-4" strokeWidth={1.6} />
                  </span>
                </div>
                <h3 className="mt-7 font-display text-2xl italic">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">{desc}</p>
                <div className="mt-5 h-px w-full bg-border">
                  <div
                    className="h-px bg-primary/70 transition-all duration-500 group-hover:w-full"
                    style={{ width: `${32 + index * 14}%` }}
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesGrid() {
  const features = [
    {
      icon: Search,
      number: "A",
      title: "L’IA de recherche",
      desc: "Part d’une demande en langage naturel, collecte des prospects et met en évidence les critères à vérifier.",
      note: "TROUVER",
      large: true,
    },
    {
      icon: BrainCircuit,
      number: "B",
      title: "L’IA de travail",
      desc: "Transforme le contexte collecté en une accroche personnelle, modifiable avant d’être envoyée.",
      note: "PRÉPARER",
      large: true,
    },
    {
      icon: Layers,
      number: "01",
      title: "Enrichissement en cascade",
      desc: "Compléter les fiches à travers plusieurs sources plutôt que tout ressaisir à la main.",
      note: "DONNÉES",
    },
    {
      icon: ShieldCheck,
      number: "02",
      title: "Vérification des emails",
      desc: "Garder le statut de vérification visible au moment de préparer la suite.",
      note: "QUALITÉ",
    },
    {
      icon: Workflow,
      number: "03",
      title: "Workflows visuels",
      desc: "Relier les déclencheurs et les actions dans un flux que l’équipe peut relire.",
      note: "AUTOMATISER",
    },
    {
      icon: Users,
      number: "04",
      title: "Un workspace partagé",
      desc: "Retrouver les recherches, les contacts et les séquences dans un même espace de travail.",
      note: "COLLABORER",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Deux agents, une méthode</SectionLabel>
            <h2 className="mt-4 max-w-[14ch] font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl md:text-6xl">
              Moins de copier-coller. <span className="italic text-primary">Plus de contexte.</span>
            </h2>
          </div>
          <p className="max-w-[42ch] text-sm leading-7 text-muted-foreground md:text-base">
            Les fonctions restent reliées entre elles : chaque étape prépare la suivante au lieu
            d’ajouter un autre onglet à gérer.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-3 md:grid-cols-12">
        {features.map(({ icon: Icon, number, title, desc, note, large }, index) => (
          <Reveal
            key={number}
            delay={index * 45}
            className={large ? "md:col-span-6" : "md:col-span-3"}
          >
            <article
              className={`group relative flex h-full min-h-[13rem] flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface/30 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.035] sm:p-7 ${
                large ? "md:min-h-[16rem] md:p-8" : ""
              }`}
            >
              <div className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full border border-primary/10 transition-transform duration-700 group-hover:scale-125" />
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary">
                  <Icon className="size-4" strokeWidth={1.7} />
                </span>
                <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground">
                  {note}
                </span>
              </div>
              <div className="mt-auto pt-8">
                <p className="font-mono text-[9px] tracking-[0.14em] text-primary/75">{number}</p>
                <h3 className={`mt-1 font-display italic leading-tight ${large ? "text-2xl sm:text-3xl" : "text-xl"}`}>
                  {title}
                </h3>
                <p className="mt-2 max-w-[47ch] text-xs leading-6 text-muted-foreground sm:text-sm">
                  {desc}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ShowcaseGallery() {
  const media = [
    {
      kind: "video" as const,
      label: "Recherche et signaux",
      hint: "Démonstration · vidéo 16:9",
      title: "Voir l’agent chercher",
      span: "md:col-span-7",
    },
    {
      kind: "image" as const,
      label: "Fiche prospect",
      hint: "Interface · image 4:3",
      title: "Montrer le contexte",
      span: "md:col-span-5",
    },
    {
      kind: "image" as const,
      label: "Message personnalisé",
      hint: "Séquence · image 16:9",
      title: "Présenter le résultat",
      span: "md:col-span-5",
    },
    {
      kind: "video" as const,
      label: "Workspace LeadCortex",
      hint: "Aperçu produit · vidéo 16:9",
      title: "Faire visiter l’espace",
      span: "md:col-span-7",
    },
  ];

  return (
    <section className="border-y border-border/70 bg-surface/35">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <div className="mb-9 grid gap-5 md:mb-12 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div>
              <SectionLabel>La preuve par l’écran</SectionLabel>
              <h2 className="mt-4 max-w-[13ch] font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl md:text-6xl">
                Montrez le travail <span className="italic text-primary">en train de se faire.</span>
              </h2>
            </div>
            <p className="max-w-[43ch] text-sm leading-7 text-muted-foreground md:justify-self-end md:text-base">
              Les cadres sont prêts pour vos captures et vos vidéos. Chaque format est indiqué pour
              pouvoir ajouter vos propres médias sans revoir toute la mise en page.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-12">
          {media.map(({ kind, label, hint, title, span }, index) => (
            <Reveal key={label} delay={index * 70} className={span}>
              <article className="group h-full">
                <MediaSlot
                  kind={kind}
                  label={label}
                  hint={hint}
                  aspect={index === 1 ? "aspect-[4/3]" : "aspect-[16/9]"}
                  className="transition-transform duration-500 group-hover:-translate-y-1"
                />
                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <h3 className="font-display text-lg italic sm:text-xl">{title}</h3>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingTeaser() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Des tarifs lisibles</SectionLabel>
            <h2 className="mt-4 max-w-[13ch] font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl md:text-6xl">
              Choisissez votre <span className="italic text-primary">rythme.</span>
            </h2>
            <p className="mt-4 max-w-[47ch] text-sm leading-7 text-muted-foreground">
              Commencez gratuitement, puis choisissez un plan quand votre prospection prend de
              l’ampleur.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface/50 p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              aria-pressed={!annual}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-medium transition-all sm:text-sm ${
                !annual ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-3.5" />
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              aria-pressed={annual}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-medium transition-all sm:text-sm ${
                annual ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Percent className="size-3.5" />
              Annuel
            </button>
          </div>
        </div>
      </Reveal>

      <div className="mt-9 grid gap-3 md:grid-cols-3">
        {PLANS.map((plan, index) => (
          <PricingTeaserCard key={plan.id} plan={plan} annual={annual} index={index} />
        ))}
      </div>

      <Reveal delay={200}>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/80 bg-surface/35 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <CreditCard className="size-4 shrink-0 text-primary" />
            <span>Modèles inclus par défaut · BYOK disponible · Aucun engagement mensuel</span>
          </div>
          <PaymentLogos size="sm" className="sm:justify-end" />
        </div>
        <div className="mt-5 flex justify-center">
          <Link
            to="/pricing"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-xs font-medium transition-colors hover:border-primary/30 hover:bg-surface sm:text-sm"
          >
            Voir tous les tarifs et le simulateur
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
  const price = annual ? plan.annualMonthly : plan.monthlyPrice;

  return (
    <Reveal delay={index * 70}>
      <article
        className={`flex h-full flex-col rounded-2xl border bg-background p-5 transition-all duration-300 hover:-translate-y-1 sm:p-6 ${
          isFounder ? "border-primary/40 shadow-node" : "border-border/80 hover:border-primary/25"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {plan.name}
          </p>
          {isFounder && (
            <span className="rounded-full border border-primary/25 bg-primary/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-primary">
              Recommandé
            </span>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-display text-4xl tracking-tight sm:text-5xl">{formatEur(price)}€</span>
          <span className="text-xs text-muted-foreground">/ mois</span>
        </div>
        <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
          {annual
            ? `Facturé ${formatEur(plan.annualPrice)}€ par an · ${plan.annualDiscountLabel} de remise`
            : "Facturation mensuelle · sans engagement"}
        </p>

        <div className="my-4 h-px bg-border" />
        <ul className="flex-1 space-y-2.5">
          {plan.highlights.slice(0, 4).map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-xs leading-5 sm:text-sm">
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={2.6} />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
        {annual && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400">
            <Wallet className="size-3.5" />
            Économie annuelle : {formatEur(plan.annualSavings)}€
          </p>
        )}
        <Link
          to="/signup"
          className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-all sm:text-sm ${
            isFounder
              ? "bg-foreground text-background hover:opacity-90"
              : "border border-border hover:border-primary/30 hover:bg-surface"
          }`}
        >
          {plan.ctaLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      </article>
    </Reveal>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Comment fonctionne la recherche de prospects ?",
      a: "Vous décrivez votre cible et les critères à privilégier. L’IA de recherche transforme cette demande en recherche structurée et rassemble les contacts à examiner.",
    },
    {
      q: "À quoi sert l’IA de travail ?",
      a: "Elle s’appuie sur le contexte du prospect pour préparer une accroche personnalisée. Le message reste modifiable et peut être relu avant son envoi.",
    },
    {
      q: "Dois-je connecter mes propres clés API ?",
      a: "Non. Les modèles inclus sont disponibles par défaut. Vous pouvez aussi connecter vos propres clés (BYOK) si vous préférez gérer directement vos fournisseurs IA.",
    },
    {
      q: "Que comprend l’offre gratuite ?",
      a: "L’inscription donne 50 crédits, sans carte bancaire. Les fonctionnalités et limites détaillées sont précisées sur la page Tarifs.",
    },
    {
      q: "Puis-je travailler avec mon équipe ?",
      a: "Oui. Les workspaces partagés permettent à plusieurs personnes de retrouver les mêmes prospects, listes, séquences et workflows, selon les sièges prévus dans votre plan.",
    },
  ];

  return (
    <section className="border-t border-border/70 bg-surface/35">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <div className="grid gap-5 md:grid-cols-[0.7fr_1.3fr] md:items-end">
            <div>
              <SectionLabel>Questions fréquentes</SectionLabel>
              <h2 className="mt-4 max-w-[10ch] font-display text-4xl leading-[0.98] tracking-tight sm:text-5xl">
                Clair avant de <span className="italic text-primary">commencer.</span>
              </h2>
            </div>
            <p className="max-w-[42ch] text-sm leading-7 text-muted-foreground md:justify-self-end">
              Une question sur votre cas d’usage ? Retrouvez d’autres réponses dans le centre d’aide.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Accordion
            type="single"
            collapsible
            className="mt-9 rounded-2xl border border-border/80 bg-background px-4 sm:px-6"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${index}`}
                className={index === faqs.length - 1 ? "border-b-0" : ""}
              >
                <AccordionTrigger className="py-5 text-left text-sm font-medium sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[72ch] pb-5 text-xs leading-6 text-muted-foreground sm:text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-5 text-center text-xs text-muted-foreground sm:text-sm">
            Besoin d’un coup de main ?{" "}
            <Link to="/support" className="font-medium text-primary underline underline-offset-4">
              Ouvrir le centre d’aide
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-primary/20 bg-primary/[0.08] px-5 py-10 sm:px-8 md:px-12 md:py-14">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 size-80 rounded-full border border-primary/15" />
          <div className="pointer-events-none absolute -right-5 -top-12 -z-10 size-60 rounded-full border border-dashed border-primary/15 lc-orbit" />
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-10">
            <div>
              <SectionLabel>À vous de jouer</SectionLabel>
              <h2 className="mt-4 max-w-[15ch] font-display text-4xl leading-[0.96] tracking-tight sm:text-5xl md:text-6xl">
                Commencez par une cible. <span className="italic text-primary">Le reste suit.</span>
              </h2>
              <p className="mt-4 max-w-[47ch] text-sm leading-7 text-muted-foreground">
                Créez votre workspace et lancez votre première recherche avec 50 crédits offerts,
                sans carte bancaire.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-all hover:opacity-90"
                >
                  Créer mon workspace
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-5 text-sm font-medium transition-colors hover:bg-background"
                >
                  Consulter les tarifs
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>
            <div className="relative mx-auto hidden size-36 place-items-center md:grid lg:size-44">
              <div className="absolute inset-0 rounded-full border border-dashed border-primary/30" />
              <div className="absolute inset-4 rounded-full bg-primary/[0.08]" />
              <LeadMascot
                pose="success"
                preserveAspectRatio="xMidYMid meet"
                className="lc-float relative h-32 w-auto drop-shadow-[0_16px_28px_rgba(105,75,45,0.16)] lg:h-40"
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function StickyCTA() {
  const show = useStickyCTA();
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 shadow-[0_-10px_32px_-24px_rgba(50,35,20,.35)] backdrop-blur-xl transition-transform duration-500 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-[11px] font-medium sm:text-sm">
          50 crédits offerts
          <span className="ml-2 hidden font-normal text-muted-foreground sm:inline">
            · Sans carte bancaire
          </span>
        </p>
        <Link
          to="/signup"
          tabIndex={show ? 0 : -1}
          className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-[11px] font-medium text-background transition-opacity hover:opacity-90 sm:px-5 sm:text-xs"
        >
          Essayer gratuitement
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
