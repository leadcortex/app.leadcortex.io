// frontend/components/onboarding/empty-dashboard.tsx

import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Compass, FileText, Play } from "@/components/icons";

import { useAppStore } from "@/lib/state/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ONBOARDING_STEPS } from "@/lib/onboarding";
import { PageHeader } from "@/components/common/ui-primitives";
import { Button } from "@/components/ui/button";
import { StepCard } from "./step-card";

import {
  leads as demoLeads,
  companies as demoCompanies,
  sequences as demoSequences,
  workflows as demoWorkflows,
  deals as demoDeals,
  tasks as demoTasks,
} from "@/lib/data/mock-data";

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
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Icon className="text-muted-foreground" strokeWidth={1.7} />
      {label}
    </Button>
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
    <div className="@container mx-auto w-full min-w-0 max-w-[1180px] pb-12">
      <PageHeader
        eyebrow="Bienvenue"
        title={`Bonjour, ${firstName}.`}
        description="Quatre étapes pour lancer votre prospection."
      />

      <section aria-label="Étapes du démarrage" className="grid gap-4 @3xl:grid-cols-2">
        {ONBOARDING_STEPS.map((step, i) => (
          <StepCard key={step.id} step={step} index={i + 1} featured={i === 0} />
        ))}
      </section>

      <section
        aria-label="Accès rapides"
        className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 @3xl:flex-row @3xl:items-center @3xl:justify-between"
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Déjà des données ?</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Importez vos contacts ou chargez un jeu de démonstration.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BandAction icon={FileText} label="Importer un CSV" onClick={goImportCsv} />
          <BandAction icon={Play} label="Voir la démo" onClick={loadDemo} />
          <BandAction icon={Compass} label="Explorer les outils" onClick={goExploreTools} />
        </div>
      </section>
    </div>
  );
}
