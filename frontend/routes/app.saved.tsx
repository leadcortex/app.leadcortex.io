//frontend\routes\app.saved.tsx
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge, TableCard } from "@/components/ui-primitives";
import { Users, Building2, Bookmark, Star } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { SavedPageSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/app/saved")({
  head: () => ({ meta: [{ title: "Sauvegardés — LeadCortex" }] }),
  pendingComponent: () => <SavedPageSkeleton />,
  component: SavedPage,
});

function SavedPage() {
  const navigate = useNavigate();
  const { leads, companies, toggleLeadSaved, toggleCompanySaved } = useAppStore();
  const [tab, setTab] = useState<"people" | "company">("people");
  const savedPeople = leads.filter((l) => l.saved);
  const savedCompanies = companies.filter((c) => c.saved);

  return (
    <div className="max-w-full">
      <PageHeader
        eyebrow="Sauvegardés"
        title="Vos favoris."
        description={`${savedPeople.length} prospects · ${savedCompanies.length} entreprises`}
      />

      <div className="mb-3 md:mb-4 flex items-center gap-1 border border-border rounded-md p-0.5 bg-surface/40 w-fit">
        <button
          onClick={() => setTab("people")}
          className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs rounded ${
            tab === "people" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
          }`}
        >
          <Users className="size-3 md:size-3.5" /> Prospects ({savedPeople.length})
        </button>
        <button
          onClick={() => setTab("company")}
          className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-xs rounded ${
            tab === "company" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
          }`}
        >
          <Building2 className="size-3 md:size-3.5" /> Entreprises ({savedCompanies.length})
        </button>
      </div>

      {tab === "people" ? (
        savedPeople.length === 0 ? (
          <EmptyState
            icon={Star}
            title="Aucun prospect favori"
            description="Sauvegardez des prospects pour les retrouver rapidement ici."
            action={{
              label: "Explorer les prospects",
              onClick: () => navigate({ to: "/app/people" }),
              icon: Users,
            }}
            size="lg"
          />
        ) : (
          <TableCard>
            <div className="overflow-x-auto scrollbar-hide table-scroll">
              <table className="w-full text-left text-xs md:text-sm min-w-[500px]">
                <thead className="bg-surface/50 text-muted-foreground text-[8px] md:text-[10px] uppercase tracking-[0.12em]">
                  <tr>
                    <th className="px-3 md:px-4 py-2 border-b border-border font-medium">Nom</th>
                    <th className="px-3 md:px-4 py-2 border-b border-border font-medium">
                      Entreprise
                    </th>
                    <th className="px-3 md:px-4 py-2 border-b border-border font-medium">Signal</th>
                    <th className="px-3 md:px-4 py-2 border-b border-border font-medium text-center">
                      Score
                    </th>
                    <th className="px-3 md:px-4 py-2 border-b border-border w-6 md:w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {savedPeople.map((l) => (
                    <tr key={l.id} className="hover:bg-surface/40 transition-colors">
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <p className="font-medium text-xs md:text-sm">{l.name}</p>
                        <p className="text-[9px] md:text-xs text-muted-foreground">{l.title}</p>
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">{l.company}</td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        {l.signal ? <Badge tone="primary">{l.signal}</Badge> : "—"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-center font-mono text-xs md:text-sm">
                        {l.score?.toFixed(1) ?? "—"}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <button
                          onClick={() => toggleLeadSaved(l.id)}
                          className="text-primary p-0.5 md:p-1"
                        >
                          <Bookmark className="size-3 md:size-3.5" fill="currentColor" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )
      ) : savedCompanies.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Aucune entreprise favorite"
          description="Sauvegardez des entreprises pour les retrouver rapidement ici."
          action={{
            label: "Explorer les entreprises",
            onClick: () => navigate({ to: "/app/companies" }),
            icon: Building2,
          }}
          size="lg"
        />
      ) : (
        <TableCard>
          <div className="overflow-x-auto scrollbar-hide table-scroll">
            <table className="w-full text-left text-xs md:text-sm min-w-[500px]">
              <thead className="bg-surface/50 text-muted-foreground text-[8px] md:text-[10px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="px-3 md:px-4 py-2 border-b border-border font-medium">
                    Entreprise
                  </th>
                  <th className="px-3 md:px-4 py-2 border-b border-border font-medium">
                    Industrie
                  </th>
                  <th className="px-3 md:px-4 py-2 border-b border-border font-medium text-right">
                    Revenu
                  </th>
                  <th className="px-3 md:px-4 py-2 border-b border-border font-medium">
                    Intention
                  </th>
                  <th className="px-3 md:px-4 py-2 border-b border-border w-6 md:w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {savedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/40 transition-colors">
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <p className="font-medium text-xs md:text-sm">{c.name}</p>
                      <p className="text-[9px] md:text-xs text-muted-foreground font-mono">
                        {c.domain}
                      </p>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-muted-foreground text-xs md:text-sm">
                      {c.industry}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3 text-right font-mono text-[10px] md:text-xs">
                      {c.revenue}
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <Badge tone={c.intent === "hot" ? "primary" : "warning"}>{c.intent}</Badge>
                    </td>
                    <td className="px-3 md:px-4 py-2 md:py-3">
                      <button
                        onClick={() => toggleCompanySaved(c.id)}
                        className="text-primary p-0.5 md:p-1"
                      >
                        <Bookmark className="size-3 md:size-3.5" fill="currentColor" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      <div className="mt-4 md:mt-8 text-xs md:text-sm text-muted-foreground">
        Astuce : depuis{" "}
        <Link to="/app/people" className="text-primary hover:underline">
          Prospects
        </Link>{" "}
        ou{" "}
        <Link to="/app/companies" className="text-primary hover:underline">
          Entreprises
        </Link>
        , cliquez sur l'icône signet pour ajouter à vos favoris.
      </div>
    </div>
  );
}
