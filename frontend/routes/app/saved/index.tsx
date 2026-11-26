// frontend/routes/app/saved/index.tsx

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/common/ui-primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/core/utils";
import { Users, Building2, Bookmark, Star } from "@/components/icons";
import { useState } from "react";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { SavedPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/saved/")({
  head: () => ({ meta: [{ title: "Sauvegardés · LeadCortex" }] }),
  pendingComponent: () => <SavedPageSkeleton />,
  component: SavedPage,
});

const intentLabels: Record<string, string> = { hot: "Forte", warm: "Moyenne", cold: "Faible" };

function SavedPage() {
  const navigate = useNavigate();
  const { leads, companies, toggleLeadSaved, toggleCompanySaved } = useAppStore();
  const [tab, setTab] = useState<"people" | "company">("people");
  const savedPeople = leads.filter((l) => l.saved);
  const savedCompanies = companies.filter((c) => c.saved);

  const tabs = [
    { key: "people" as const, label: "Prospects", icon: Users, count: savedPeople.length },
    { key: "company" as const, label: "Entreprises", icon: Building2, count: savedCompanies.length },
  ];

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Sauvegardés"
        title="Vos favoris."
        description={`${savedPeople.length} prospects · ${savedCompanies.length} entreprises`}
      />

      <div
        role="tablist"
        className="mb-4 inline-flex items-center gap-1 rounded-lg border border-border bg-surface/40 p-0.5"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] transition-colors",
              tab === t.key
                ? "bg-background font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
            <span className="tabular-nums text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "people" ? (
        savedPeople.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Aucun prospect favori"
            description="Ajoutez un prospect aux favoris pour le retrouver ici."
            action={{
              label: "Voir les prospects",
              onClick: () => navigate({ to: "/app/people" }),
              icon: Users,
            }}
            size="lg"
          />
        ) : (
          <Table className="min-w-[520px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedPeople.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link
                      to="/app/people/$id"
                      params={{ id: l.id }}
                      className="block text-[13px] font-medium hover:underline"
                    >
                      {l.name}
                    </Link>
                    {l.title && <p className="text-xs text-muted-foreground">{l.title}</p>}
                  </TableCell>
                  <TableCell className="text-[13px]">{l.company}</TableCell>
                  <TableCell>
                    {l.signal && <Badge tone="primary">{l.signal}</Badge>}
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">
                    {l.score?.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleLeadSaved(l.id)}
                      aria-label={`Retirer ${l.name} des favoris`}
                      title="Retirer des favoris"
                      className="grid size-8 place-items-center rounded-lg text-primary hover:bg-surface/70"
                    >
                      <Bookmark className="size-4" fill="currentColor" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : savedCompanies.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Aucune entreprise favorite"
          description="Ajoutez une entreprise aux favoris pour la retrouver ici."
          action={{
            label: "Voir les entreprises",
            onClick: () => navigate({ to: "/app/companies" }),
            icon: Building2,
          }}
          size="lg"
        />
      ) : (
        <Table className="min-w-[520px]">
          <TableHeader>
            <TableRow>
              <TableHead>Entreprise</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead className="text-right">Chiffre d'affaires</TableHead>
              <TableHead>Intention</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedCompanies.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="text-[13px] font-medium">{c.name}</p>
                  {c.domain && <p className="text-xs text-muted-foreground">{c.domain}</p>}
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{c.industry}</TableCell>
                <TableCell className="text-right text-[13px] tabular-nums">{c.revenue}</TableCell>
                <TableCell>
                  <Badge tone={c.intent === "hot" ? "primary" : "warning"}>
                    {intentLabels[c.intent] ?? c.intent}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => toggleCompanySaved(c.id)}
                    aria-label={`Retirer ${c.name} des favoris`}
                    title="Retirer des favoris"
                    className="grid size-8 place-items-center rounded-lg text-primary hover:bg-surface/70"
                  >
                    <Bookmark className="size-4" fill="currentColor" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <p className="mt-6 text-[13px] text-muted-foreground">
        Pour ajouter un favori, cliquez sur le signet d'une ligne dans{" "}
        <Link to="/app/people" className="text-primary hover:underline">
          Prospects
        </Link>{" "}
        ou{" "}
        <Link to="/app/companies" className="text-primary hover:underline">
          Entreprises
        </Link>
        .
      </p>
    </div>
  );
}
