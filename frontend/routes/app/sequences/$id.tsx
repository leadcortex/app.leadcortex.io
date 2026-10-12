//frontend\routes\app\sequences\$id.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Kpi } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  Play,
  Pause,
  Edit,
  MoreHorizontal,
  Mail,
  Users,
  Eye,
  MessageSquare,
  Clock,
  Calendar,
  AlertCircle,
  BarChart3,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DetailViewSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/sequences/$id")({
  head: () => ({
    meta: [{ title: "Séquence — LeadCortex" }],
  }),
  pendingComponent: () => <DetailViewSkeleton />,
  component: SequencesDetailPage,
});

function SequencesDetailPage() {
  const { id } = Route.useParams();
  const { sequences, toggleSequenceStatus } = useAppStore();
  const sequence = sequences.find((s) => s.id === id);

  const [activeTab, setActiveTab] = useState<"overview" | "steps" | "analytics">("overview");

  if (!sequence) {
    return (
      <div className="p-4 md:p-8 text-center">
        <AlertCircle className="size-10 md:size-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
        <h2 className="font-display text-xl md:text-2xl italic">Séquence introuvable</h2>
        <p className="text-muted-foreground text-xs md:text-sm mt-2">
          Cette séquence n'existe pas ou a été supprimée.
        </p>
        <Link
          to="/app/sequences"
          className="inline-flex items-center gap-2 mt-4 md:mt-6 text-xs md:text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5 md:size-4" /> Retour aux séquences
        </Link>
      </div>
    );
  }

  const isActive = sequence.status === "active";

  return (
    <div className="max-w-6xl">
      {}
      <Link
        to="/app/sequences"
        className="inline-flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 md:mb-6"
      >
        <ArrowLeft className="size-3.5 md:size-4" /> Retour aux séquences
      </Link>

      {}
      <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4 mb-4 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-4xl italic break-words">{sequence.name}</h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1.5 md:mt-2 text-xs md:text-sm text-muted-foreground">
            <span className="flex items-center gap-1 md:gap-1.5">
              <Mail className="size-3.5 md:size-4" /> Email + LinkedIn
            </span>
            <span className="flex items-center gap-1 md:gap-1.5">
              <Users className="size-3.5 md:size-4" /> {sequence.leads} leads
            </span>
            <span className="flex items-center gap-1 md:gap-1.5 hide-on-xs">
              <Clock className="size-3.5 md:size-4" /> {sequence.steps} étapes
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={() => {
              toggleSequenceStatus(sequence.id);
              toast.success(isActive ? "Séquence mise en pause" : "Séquence activée");
            }}
            className={`inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm rounded-lg transition-colors ${
              isActive
                ? "bg-amber-500/10 text-amber-600 border border-amber-200 hover:bg-amber-500/20"
                : "bg-primary text-primary-foreground hover:brightness-110"
            }`}
          >
            {isActive ? (
              <Pause className="size-3 md:size-4" />
            ) : (
              <Play className="size-3 md:size-4" />
            )}
            {isActive ? "Pauser" : "Activer"}
          </button>
          <button className="p-1.5 md:p-2 rounded-lg border border-border hover:bg-surface transition-colors">
            <Edit className="size-3.5 md:size-4" />
          </button>
          <button className="p-1.5 md:p-2 rounded-lg border border-border hover:bg-surface transition-colors">
            <MoreHorizontal className="size-3.5 md:size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-8">
        <Kpi label="Taux d'ouverture" value={sequence.opens} delta="+4%" up />
        <Kpi label="Taux de réponse" value={sequence.replies} delta="+2%" up />
        <Kpi label="Leads actifs" value={String(sequence.leads)} />
        <Kpi label="Étapes" value={String(sequence.steps)} />
      </div>

      <div className="mb-4 md:mb-8">
        <Badge tone={isActive ? "primary" : "muted"}>{isActive ? "Actif" : "En pause"}</Badge>
      </div>

      <div className="border-b border-border mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 md:gap-6 min-w-max">
          {(["overview", "steps", "analytics"] as const).map((tab) => {
            const labels = { overview: "Aperçu", steps: "Étapes", analytics: "Analyses" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 md:pb-3 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-in-up">
        {activeTab === "overview" && <OverviewTab sequence={sequence} />}
        {activeTab === "steps" && <StepsTab sequence={sequence} />}
        {activeTab === "analytics" && <AnalyticsTab sequence={sequence} />}
      </div>
    </div>
  );
}

function OverviewTab({ sequence }: { sequence: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      <div className="rounded-xl border border-border bg-background p-4 md:p-6">
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 md:mb-4">
          Détails
        </h3>
        <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium">{sequence.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Statut</span>
            <Badge tone={sequence.status === "active" ? "primary" : "muted"}>
              {sequence.status === "active" ? "Actif" : "En pause"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Leads</span>
            <span>{sequence.leads}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Étapes</span>
            <span>{sequence.steps}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taux d'ouverture</span>
            <span>{sequence.opens}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taux de réponse</span>
            <span>{sequence.replies}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-4 md:p-6">
        <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-3 md:mb-4">
          Actions rapides
        </h3>
        <div className="space-y-2 md:space-y-3">
          <button
            onClick={() => toast.info("Ajout de leads...")}
            className="w-full inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <Users className="size-3.5 md:size-4" /> Ajouter des leads
          </button>
          <button
            onClick={() => toast.info("Édition de la séquence...")}
            className="w-full inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <Edit className="size-3.5 md:size-4" /> Modifier la séquence
          </button>
          <button
            onClick={() => toast.info("Export en cours...")}
            className="w-full inline-flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <Send className="size-3.5 md:size-4" /> Exporter les données
          </button>
        </div>
      </div>
    </div>
  );
}

function StepsTab({ sequence }: { sequence: any }) {
  const steps = [
    { number: 1, label: "Email de prospection", channel: "Email", delay: "Jour 1" },
    { number: 2, label: "Relance LinkedIn", channel: "LinkedIn", delay: "Jour 3" },
    { number: 3, label: "Email de suivi", channel: "Email", delay: "Jour 5" },
    { number: 4, label: "Relance finale", channel: "Email", delay: "Jour 8" },
    { number: 5, label: "Appel de clôture", channel: "Call", delay: "Jour 12" },
  ];

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide table-scroll">
        <table className="w-full text-left text-xs md:text-sm min-w-[400px]">
          <thead className="bg-surface/50 text-muted-foreground text-[8px] md:text-[10px] uppercase tracking-[0.12em]">
            <tr>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">#</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Étape</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Canal</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border">Délai</th>
              <th className="px-3 md:px-4 py-2 font-medium border-b border-border"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {steps.map((s) => (
              <tr key={s.number} className="hover:bg-surface/40 transition-colors">
                <td className="px-3 md:px-4 py-2 md:py-3 text-center font-mono text-xs md:text-sm">
                  {s.number}
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm">
                  {s.label}
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <Badge
                    tone={
                      s.channel === "Email"
                        ? "primary"
                        : s.channel === "LinkedIn"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {s.channel}
                  </Badge>
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-muted-foreground text-[10px] md:text-xs">
                  {s.delay}
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3 text-right">
                  <button className="text-[10px] md:text-xs text-primary hover:underline">
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab({ sequence }: { sequence: any }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <Kpi label="Total leads" value={String(sequence.leads)} />
        <Kpi label="Taux d'ouverture" value={sequence.opens} delta="+4%" up />
        <Kpi label="Taux de réponse" value={sequence.replies} delta="+2%" up />
      </div>

      <div className="space-y-3 md:space-y-4">
        <div className="p-3 md:p-4 rounded-lg bg-surface/40 border border-border">
          <h4 className="text-xs md:text-sm font-medium mb-2">Distribution par étape</h4>
          <div className="space-y-1.5 md:space-y-2">
            {[
              { label: "Email 1 envoyé", value: 42, total: 42 },
              { label: "Email 1 ouvert", value: 28, total: 42 },
              { label: "Relance LinkedIn", value: 18, total: 42 },
              { label: "Email 2 envoyé", value: 12, total: 42 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 md:gap-3">
                <span className="text-[10px] md:text-xs text-muted-foreground w-20 md:w-32 truncate">
                  {item.label}
                </span>
                <div className="flex-1 h-1.5 md:h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] md:text-xs font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => toast.info("Rapport détaillé en cours...")}
            className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-primary hover:underline"
          >
            <BarChart3 className="size-3.5 md:size-4" /> Voir le rapport complet
          </button>
        </div>
      </div>
    </div>
  );
}
