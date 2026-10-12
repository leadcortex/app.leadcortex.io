//frontend\components\onboarding\empty-dashboard.tsx
/**
 * Page d'accueil affichée tant que le store ne contient AUCUNE donnée
 * métier. Remplace l'ancien dashboard vide (6 zéros, 4 graphiques plats).
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Structure (fidèle à la maquette « Tableau de bord chaleureux »)
 * ─────────────────────────────────────────────────────────────────────────
 *  • Salutation : « BIENVENUE » / « Bonjour, {prénom}. » / sous-titre
 *  • WelcomeHero    — « Votre pipeline en 4 mouvements »
 *  • Grille 2×2     — 4 StepCard (étape 1 en bouton plein)
 *  • Bandeau        — « Déjà des données ? » : import CSV, démo, outils
 *
 *  Les textes viennent de `ONBOARDING_STEPS` (src/lib/onboarding.ts).
 *
 *  ⚠️ Anti-débordement
 *  La racine est un `@container` : toutes les grilles de la page réagissent
 *  à la largeur RÉELLE disponible (entre sidebar et panneau Cortex), pas à
 *  celle de la fenêtre. C'est ce qui évite les textes qui dépassent de leur
 *  conteneur quand le panneau latéral est ouvert.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Compass, FileText, Play, Sparkles } from "lucide-react";

import { useAppStore } from "@/lib/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ONBOARDING_STEPS } from "@/lib/onboarding";
import { WelcomeHero } from "./welcome-hero";
import { StepCard } from "./step-card";

import {
  leads as demoLeads,
  companies as demoCompanies,
  sequences as demoSequences,
  workflows as demoWorkflows,
  deals as demoDeals,
  tasks as demoTasks,
} from "@/lib/mock-data";

function BandAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-w-0 items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-foreground/90 transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export function EmptyDashboard() {
  const navigate = useNavigate();
  const { firstName } = useCurrentUser();
  const { setLeads, setCompanies, addSequence, addWorkflow, addDeal, addTask } = useAppStore();

  const loadDemo = () => {
    setLeads(demoLeads);
    setCompanies(demoCompanies);

    demoWorkflows.forEach((w) => addWorkflow(w));
    demoDeals.forEach((d) => addDeal(d));
    demoTasks.forEach((t) => addTask(t));

    demoSequences.forEach((s) => {
      addSequence({
        name: s.name,
        description: "",
        objective: "",
        audience: "",
        tags: [],
        status: "draft",
        stepsDetail: [],
      });
    });

    toast.success("Jeu de démonstration chargé", {
      description: "Vous pouvez tout supprimer depuis les paramètres.",
    });
  };

  const goImportCsv = () => {
    toast.info("Import CSV disponible depuis la page Prospects", {
      description: "Cliquez sur « Ajouter » puis « Importer ».",
    });
    navigate({ to: "/app/people/new" });
  };

  const goExploreTools = () => {
    navigate({ to: "/app/enrichment" });
  };

  return (
    <div className="@container mx-auto w-full min-w-0 max-w-[1180px]">
      <div className="space-y-6 pb-10 @2xl:space-y-8">
        {}
        <header className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Bienvenue
          </p>
          <h1 className="mt-3 text-balance break-words text-[1.75rem] font-bold leading-tight tracking-tight @2xl:text-[2.5rem]">
            Bonjour, {firstName}.
          </h1>
          <p className="mt-2 text-pretty text-base text-muted-foreground @2xl:text-lg">
            Votre équipe d&apos;agents IA est prête. Voici comment démarrer.
          </p>
        </header>

        {}
        <WelcomeHero />

        {}
        <section aria-label="Étapes du démarrage" className="grid gap-4 @3xl:grid-cols-2">
          {ONBOARDING_STEPS.map((step, i) => (
            <StepCard key={step.id} step={step} index={i + 1} featured={i === 0} />
          ))}
        </section>

        {}
        <section
          aria-label="Accès rapides"
          className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-primary/[0.05] px-5 py-4 @5xl:flex-row @5xl:items-center @5xl:justify-between @5xl:gap-6"
        >
          {}
          <div className="flex min-w-0 flex-col gap-1.5 @3xl:flex-row @3xl:items-center @3xl:gap-4">
            <div className="flex shrink-0 items-center gap-3">
              <Sparkles className="size-5 shrink-0 text-[#CC9B5C]" strokeWidth={1.7} />
              <p className="whitespace-nowrap text-[15px] font-semibold">Déjà des données ?</p>
            </div>
            <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-border @3xl:block" />
            <p className="min-w-0 text-pretty text-xs leading-relaxed text-muted-foreground">
              Vous avez déjà des prospects, des séquences ou des contacts ? Accédez directement à
              vos outils.
            </p>
          </div>

          {}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 @5xl:shrink-0 @5xl:flex-nowrap">
            <BandAction icon={FileText} label="Importer un CSV" onClick={goImportCsv} />
            <span aria-hidden="true" className="hidden h-5 w-px bg-border @2xl:block" />
            <BandAction icon={Play} label="Voir la démo" onClick={loadDemo} />
            <span aria-hidden="true" className="hidden h-5 w-px bg-border @2xl:block" />
            <BandAction icon={Compass} label="Explorer les outils" onClick={goExploreTools} />
          </div>
        </section>
      </div>
    </div>
  );
}
