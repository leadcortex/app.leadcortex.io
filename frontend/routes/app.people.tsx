//frontend\routes\app.people.tsx
import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import {
  Download,
  Plus,
  Bookmark,
  Mail,
  Phone,
  Sparkles,
  Users,
  MapPin,
  Radio,
  LayoutGrid,
  List as ListIcon,
  X,
  Send,
  Trash2,
  CheckSquare,
  Undo2,
  Redo2,
  Copy,
  SlidersHorizontal,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { CustomSelect } from "@/components/custom-select";
import { EmptyState } from "@/components/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";
import { KnownPeopleExplorer } from "@/components/known-people";
import { CompanyLogo } from "@/components/company-logo";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { cn } from "@/lib/utils";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCardList } from "@/components/mobile/mobile-card-list";
import { MobileListRow } from "@/components/mobile/mobile-list-row";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { MobileStickyBar } from "@/components/mobile/mobile-sticky-bar";
import { MobileFilterSheet } from "@/components/mobile/mobile-filter-sheet";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { MobileConfirmDialog } from "@/components/mobile/mobile-confirm-dialog";
import { MobileSelectSheet } from "@/components/mobile/mobile-select-sheet";

export const Route = createFileRoute("/app/people")({
  head: () => ({ meta: [{ title: "Prospects — LeadCortex" }] }),
  pendingComponent: () => (
    <TableViewSkeleton
      label="Chargement des prospects"
      kpis={4}
      kpiVariant="stat"
      rows={10}
      columns={6}
      filters={4}
      comfortable
    />
  ),
  component: PeoplePage,
});

const SCROLL_THRESHOLD = 10;
const SCROLL_MAX_HEIGHT = "640px";

const industries = [
  "Tous",
  "Aerospace",
  "Automotive",
  "Metallurgy",
  "Defense",
  "Logistics",
  "Energy",
  "Manufacturing",
  "Electrical",
  "Technology",
  "Software",
  "Finance",
  "Ecommerce",
  "Media",
  "Transport",
];
const stages = ["Tous", "new", "contacted", "replied", "meeting", "won", "lost"];
const stageLabels: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  replied: "Répondu",
  meeting: "Rendez-vous",
  won: "Gagné",
  lost: "Perdu",
};

type Snapshot = { leads: any[] };

function PeoplePage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isIndexRoute = pathname === "/app/people" || pathname === "/app/people/";

  const { leads, toggleLeadSaved, addActivity, deleteLead, setLeads } = useAppStore();
  const isMobile = useIsMobile();

  const [industry, setIndustry] = useState("Tous");
  const [stage, setStage] = useState("Tous");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "cards">("table");

  const [undoStack, setUndoStack] = useState<{ snapshot: Snapshot; count: number }[]>([]);
  const [redoStack, setRedoStack] = useState<{ snapshot: Snapshot; count: number }[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    ids: string[];
  } | null>(null);

  const [mobileActions, setMobileActions] = useState<{ ids: string[] } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return leads
      .filter((l) => (industry === "Tous" ? true : l.industry === industry))
      .filter((l) => (stage === "Tous" ? true : l.stage === stage))
      .filter((l) => (l.score ?? 0) >= minScore)
      .sort((a, b) =>
        sortBy === "score" ? (b.score ?? 0) - (a.score ?? 0) : a.name.localeCompare(b.name),
      );
  }, [leads, industry, stage, minScore, sortBy]);

  const doUndo = () => {
    setUndoStack((stack) => {
      const last = stack[stack.length - 1];
      if (!last) return stack;
      setRedoStack((r) => [...r, { snapshot: { leads: leads.slice() }, count: last.count }]);
      setLeads(last.snapshot.leads);
      toast.success(
        `${last.count} prospect${last.count > 1 ? "s" : ""} restauré${last.count > 1 ? "s" : ""}`,
      );
      return stack.slice(0, -1);
    });
  };

  const doRedo = () => {
    setRedoStack((stack) => {
      const last = stack[stack.length - 1];
      if (!last) return stack;
      setUndoStack((u) => [...u, { snapshot: { leads: leads.slice() }, count: last.count }]);
      setLeads(last.snapshot.leads);
      toast.success(
        `${last.count} prospect${last.count > 1 ? "s" : ""} supprimé${last.count > 1 ? "s" : ""}`,
      );
      return stack.slice(0, -1);
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
        return;

      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      } else if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        doRedo();
      } else if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(new Set(filtered.map((l) => l.id)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, filtered]);

  const askDelete = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error("Aucun prospect sélectionné");
      return;
    }
    setDeleteConfirm({ ids });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const ids = deleteConfirm.ids;
    const snapshot: Snapshot = { leads: leads.slice() };
    setUndoStack((s) => [...s, { snapshot, count: ids.length }]);
    setRedoStack([]);
    ids.forEach((id) => deleteLead(id));
    addActivity("Prospects supprimés", `${ids.length} prospect(s)`);
    setSelectedIds(new Set());
    setDeleteConfirm(null);
    setContextMenu(null);
    setMobileActions(null);
    toast.success(
      `${ids.length} prospect${ids.length > 1 ? "s" : ""} supprimé${ids.length > 1 ? "s" : ""}`,
      {
        action: { label: "Annuler", onClick: doUndo },
      },
    );
  };

  const openContextMenu = (e: React.MouseEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();

    let ids: string[];
    if (selectedIds.has(rowId) && selectedIds.size > 0) {
      ids = Array.from(selectedIds);
    } else {
      ids = [rowId];
      setSelectedIds(new Set([rowId]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, ids });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const onDown = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  if (!isIndexRoute) return <Outlet />;

  const savedCount = leads.filter((l) => l.saved).length;
  const hasItems = leads.length > 0;
  const needsScroll = leads.length > SCROLL_THRESHOLD;

  const avgScore = useMemo(() => {
    const withScore = leads.filter((l) => typeof l.score === "number");
    if (withScore.length === 0) return 0;
    return withScore.reduce((s, l) => s + (l.score ?? 0), 0) / withScore.length;
  }, [leads]);
  const hotCount = leads.filter((l) => (l.score ?? 0) >= 8).length;
  const enrichedCount = leads.filter((l) => l.email && l.phone).length;

  const stats = [
    {
      label: "Total",
      value: leads.length.toLocaleString("fr-FR"),
      hint: `${savedCount} favoris`,
      icon: Users,
    },
    { label: "Score moyen", value: avgScore.toFixed(1), hint: "sur 10", icon: Sparkles },
    { label: "Priorité haute", value: hotCount.toString(), hint: "score ≥ 8", icon: Radio },
    { label: "Enrichis", value: enrichedCount.toString(), hint: "email + tel", icon: CheckSquare },
  ];

  const columns: Column<(typeof leads)[number]>[] = [
    {
      key: "name",
      header: "Prospect",
      sortable: true,
      accessor: (row) => (
        <Link
          to={`/app/people/$id`}
          params={{ id: row.id }}
          className="flex items-center gap-2.5 md:gap-3 hover:text-primary transition-colors group"
        >
          <LetterAvatar name={row.name} size={36} shape="circle" />
          <div className="min-w-0">
            <div className="font-medium text-xs md:text-sm truncate group-hover:underline">
              {row.name}
            </div>
            <div className="text-[9px] md:text-xs text-muted-foreground truncate">{row.title}</div>
          </div>
        </Link>
      ),
      cellClassName: "min-w-[160px] md:min-w-[220px]",
    },
    {
      key: "company",
      header: "Entreprise",
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <CompanyLogo name={row.company} size={28} className="shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-xs md:text-sm font-medium">{row.company}</div>
            <div className="flex items-center gap-1 text-[9px] md:text-xs text-muted-foreground truncate">
              <span className="truncate">{row.industry}</span>
              <span>·</span>
              <MapPin className="size-2.5 shrink-0" />
              <span className="truncate">{row.location}</span>
            </div>
          </div>
        </div>
      ),
      cellClassName: "min-w-[160px] md:min-w-[220px]",
      hideOnMobile: true,
    },
    {
      key: "contact",
      header: "Contact",
      sortable: false,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5 text-[10px] md:text-xs">
          {row.email ? (
            <span className="inline-flex items-center gap-1 font-mono text-foreground/80 truncate max-w-[140px] md:max-w-[200px]">
              <Mail className="size-2.5 md:size-3 text-primary shrink-0" /> {row.email}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {row.phone && (
            <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
              <Phone className="size-2.5 md:size-3 text-primary shrink-0" /> {row.phone}
            </span>
          )}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "signal",
      header: "Signal",
      sortable: true,
      accessor: (row) =>
        row.signal ? (
          <Badge tone="primary">
            <Radio className="size-2.5 mr-1" /> {row.signal}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-[9px] md:text-xs">—</span>
        ),
    },
    {
      key: "stage",
      header: "Étape",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full shrink-0 ${
              row.stage === "won"
                ? "bg-emerald-500"
                : row.stage === "lost"
                  ? "bg-destructive"
                  : row.stage === "meeting" || row.stage === "replied"
                    ? "bg-primary"
                    : "bg-muted-foreground"
            }`}
          />
          <Badge
            tone={
              row.stage === "won"
                ? "success"
                : row.stage === "meeting" || row.stage === "replied"
                  ? "primary"
                  : "muted"
            }
          >
            {stageLabels[row.stage ?? "new"] ?? row.stage ?? "Nouveau"}
          </Badge>
        </span>
      ),
    },
    {
      key: "score",
      header: "Score",
      sortable: true,
      accessor: (row) => {
        const score = row.score ?? 0;
        const pct = Math.max(0, Math.min(100, (score / 10) * 100));
        return (
          <div className="flex items-center gap-2 w-full max-w-[110px] mx-auto">
            <span
              className={`font-mono text-xs md:text-sm shrink-0 w-7 text-right ${
                row.score && row.score >= 9 ? "text-primary font-semibold" : ""
              }`}
            >
              {row.score?.toFixed(1) ?? "—"}
            </span>
            <span className="hidden md:block h-1 flex-1 rounded-full bg-secondary overflow-hidden">
              <span
                className={`block h-full rounded-full ${
                  score >= 9
                    ? "bg-primary"
                    : score >= 6
                      ? "bg-primary/60"
                      : "bg-muted-foreground/40"
                }`}
                style={{ width: `${pct}%` }}
              />
            </span>
          </div>
        );
      },
      className: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLeadSaved(row.id);
          }}
          title={row.saved ? "Retirer des favoris" : "Sauvegarder"}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <Bookmark
            className={`size-3.5 md:size-4 ${row.saved ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        </button>
      ),
      className: "w-8 md:w-10",
      cellClassName: "text-center",
    },
  ];

  /* Colonnes minimales pour MobileCardList (le rendu réel passe par renderCard). */
  const mobileColumns: Column<(typeof leads)[number]>[] = [{ key: "name", header: "Nom" }];

  const bulkSave = () => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const l = leads.find((x) => x.id === id);
      if (l && !l.saved) toggleLeadSaved(id);
    });
    toast.success(`${selectedIds.size} prospects sauvegardés`);
    addActivity("Sauvegarde de masse", `${selectedIds.size} prospects ajoutés aux favoris`);
    setSelectedIds(new Set());
  };

  const bulkExport = () => {
    const count = selectedIds.size || filtered.length;
    toast.success(`Export CSV — ${count} lignes`);
    addActivity("Export", `${count} prospects exportés`);
    setSelectedIds(new Set());
  };

  const bulkEnrich = () => {
    addActivity("Enrichissement lancé", `${selectedIds.size} prospects`);
    toast.success(`Enrichissement lancé pour ${selectedIds.size} prospect(s)`);
    setSelectedIds(new Set());
  };

  const bulkAddToSequence = () => {
    toast.success(`${selectedIds.size} prospect(s) ajouté(s) à une séquence`);
    setSelectedIds(new Set());
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *  MOBILE LAYOUT
   * ═══════════════════════════════════════════════════════════════════════ */
  if (isMobile) {
    const activeFilterCount =
      (industry !== "Tous" ? 1 : 0) + (minScore > 0 ? 1 : 0) + (sortBy !== "score" ? 1 : 0);

    const handleMobileLongPress = (leadId: string) => {
      setMobileActions({ ids: [leadId] });
    };

    return (
      <>
        <MobilePageHeader
          title="Prospects"
          subtitle={
            hasItems
              ? `${filtered.length} sur ${leads.length} · ${savedCount} favoris`
              : "Aucun prospect"
          }
          action={
            <button
              type="button"
              onClick={() => navigate({ to: "/app/people/new" })}
              aria-label="Ajouter un prospect"
              className="grid size-10 place-items-center rounded-full bg-foreground text-background active:opacity-90"
            >
              <Plus className="size-4" strokeWidth={2.2} />
            </button>
          }
          actions={
            <>
              <MobileSelectSheet
                value={stage}
                onChange={setStage}
                options={stages.map((s) =>
                  s === "Tous" ? "Toutes les étapes" : (stageLabels[s] ?? s),
                )}
                placeholder="Toutes les étapes"
                title="Filtrer par étape"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full",
                  "border border-border bg-background px-3",
                  "text-[13px] font-medium transition-colors active:bg-surface",
                )}
              >
                <SlidersHorizontal className="size-3.5 shrink-0" strokeWidth={2} />
                <span>Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </>
          }
        />

        {!hasItems ? (
          <div className="px-3 pt-4">
            <MobileEmptyState
              icon={Users}
              title="Aucun prospect"
              description="Créez votre premier prospect pour commencer à construire votre base de données."
              action={{
                label: "Créer un prospect",
                onClick: () => navigate({ to: "/app/people/new" }),
                icon: Plus,
              }}
            />
          </div>
        ) : (
          <div className="px-3 pb-4 pt-3">
            <MobileCardList
              data={filtered}
              columns={mobileColumns}
              keyExtractor={(row) => row.id}
              selectedIds={selectedIds}
              onSelectRow={(id, sel) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (sel) next.add(id);
                  else next.delete(id);
                  return next;
                });
              }}
              pageSize={20}
              showPagination={true}
              showSearch={true}
              searchPlaceholder="Rechercher un prospect…"
              searchFields={["name", "company", "title", "email"]}
              emptyMessage="Aucun prospect ne correspond à ces filtres."
              renderCard={(lead) => (
                <MobileListRow
                  leading={<LetterAvatar name={lead.name} size={40} shape="circle" />}
                  title={lead.name}
                  subtitle={`${lead.title} · ${lead.company}`}
                  meta={typeof lead.score === "number" ? lead.score.toFixed(1) : undefined}
                  trailing={
                    lead.saved ? <Bookmark className="size-4 fill-primary text-primary" /> : null
                  }
                  onClick={() => navigate({ to: "/app/people/$id", params: { id: lead.id } })}
                  onLongPress={() => handleMobileLongPress(lead.id)}
                />
              )}
            />
          </div>
        )}

        {selectedIds.size > 0 && (
          <>
            <MobileStickyBar
              actions={[
                {
                  label: "Enrichir",
                  icon: Sparkles,
                  onClick: bulkEnrich,
                },
                {
                  label: "Plus",
                  icon: MoreHorizontal,
                  variant: "secondary",
                  onClick: () => setMobileActions({ ids: Array.from(selectedIds) }),
                },
              ]}
              hint={
                <span className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2 text-[12px] text-muted-foreground active:bg-surface"
                  >
                    <X className="size-3.5" /> Tout désélectionner
                  </button>
                </span>
              }
            />
            <MobileStickyBar.Spacer />
          </>
        )}

        <MobileFilterSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          title="Filtres"
          sections={[
            {
              key: "industry",
              label: "Industrie",
              mode: "single",
              options: industries.map((i) => ({
                value: i,
                label: i === "Tous" ? "Toutes les industries" : i,
              })),
            },
            {
              key: "minScore",
              label: "Score minimum",
              mode: "single",
              options: [
                { value: "0", label: "Tous" },
                { value: "6", label: "≥ 6" },
                { value: "8", label: "≥ 8" },
                { value: "9", label: "≥ 9" },
              ],
            },
            {
              key: "sortBy",
              label: "Trier par",
              mode: "single",
              options: [
                { value: "score", label: "Score décroissant" },
                { value: "name", label: "Nom (A → Z)" },
              ],
            },
          ]}
          value={{
            industry,
            minScore: minScore ? String(minScore) : "0",
            sortBy,
          }}
          onApply={(v) => {
            const nextIndustry = (v.industry as string) ?? "Tous";
            const nextScore = Number(v.minScore ?? 0) || 0;
            const nextSort = (v.sortBy as "score" | "name") ?? "score";
            setIndustry(nextIndustry);
            setMinScore(nextScore);
            setSortBy(nextSort);
          }}
        />

        {mobileActions && (
          <MobileActionSheet
            open={!!mobileActions}
            onOpenChange={(o) => !o && setMobileActions(null)}
            title={
              mobileActions.ids.length > 1
                ? `${mobileActions.ids.length} prospects`
                : (leads.find((l) => l.id === mobileActions.ids[0])?.name ?? "Actions")
            }
            sections={[
              {
                label: "Actions",
                items: [
                  {
                    label: "Ajouter à une séquence",
                    icon: Send,
                    onSelect: () => {
                      bulkAddToSequence();
                      setMobileActions(null);
                    },
                  },
                  {
                    label: "Enrichir",
                    icon: Sparkles,
                    onSelect: () => {
                      bulkEnrich();
                      setMobileActions(null);
                    },
                  },
                  {
                    label: "Sauvegarder",
                    icon: Bookmark,
                    onSelect: () => {
                      bulkSave();
                      setMobileActions(null);
                    },
                  },
                  {
                    label: "Exporter",
                    icon: Download,
                    onSelect: () => {
                      bulkExport();
                      setMobileActions(null);
                    },
                  },
                ],
              },
              {
                label: "Zone de danger",
                items: [
                  {
                    label: "Supprimer",
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => {
                      const ids = mobileActions.ids;
                      setMobileActions(null);
                      // Petit délai pour laisser la sheet se fermer.
                      window.setTimeout(() => askDelete(ids), 240);
                    },
                  },
                ],
              },
            ]}
          />
        )}

        <MobileConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={(v) => !v && setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title={`Supprimer ${deleteConfirm?.ids.length ?? 0} prospect${(deleteConfirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
          description="Cette action est réversible via Ctrl+Z, mais les fiches seront retirées de votre base."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="destructive"
        />

        <div className="px-3 pb-6">
          <KnownPeopleExplorer />
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
   *  DESKTOP LAYOUT — INCHANGÉ
   * ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-full space-y-3">
      <PageHeader
        eyebrow="Prospects"
        title="Vos prospects."
        description={
          hasItems
            ? `${filtered.length} sur ${leads.length} · ${savedCount} sauvegardés`
            : "0 prospect · 0 sauvegardés"
        }
        actions={
          <>
            <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-surface/40">
              <button
                onClick={doUndo}
                disabled={undoStack.length === 0}
                title="Annuler (Ctrl+Z)"
                className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Undo2 className="size-3.5" />
              </button>
              <button
                onClick={doRedo}
                disabled={redoStack.length === 0}
                title="Rétablir (Ctrl+Y)"
                className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Redo2 className="size-3.5" />
              </button>
            </div>
            {hasItems && (
              <button
                onClick={bulkExport}
                className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs border border-border rounded-md hover:bg-surface transition-colors"
              >
                <Download className="size-3 md:size-3.5" /> Exporter
              </button>
            )}
            <Link
              to="/app/people/new"
              className="inline-flex items-center gap-1 px-2 md:px-3 py-1 text-[9px] md:text-xs bg-foreground text-background rounded-md hover:opacity-90 transition-all"
            >
              <Plus className="size-3 md:size-3.5" /> Ajouter
            </Link>
          </>
        }
      />

      <div
        className={cn("space-y-4", needsScroll && "overflow-y-auto overscroll-contain pr-1")}
        style={needsScroll ? { maxHeight: SCROLL_MAX_HEIGHT } : undefined}
      >
        {!hasItems ? (
          <div className="relative isolate overflow-hidden rounded-2xl">
            <img
              src="/images/prospects.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
            />
            <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
              <EmptyState
                icon={Users}
                title="Aucun prospect"
                description="Créez votre premier prospect pour commencer à construire votre base de données."
                actionLabel="Créer un prospect"
                onAction={() => navigate({ to: "/app/people/new" })}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-background p-3 md:p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] md:text-xs text-muted-foreground">{s.label}</span>
                    <s.icon className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="mt-1.5 font-display text-xl md:text-2xl tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
                    {s.hint}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <CustomSelect
                label="Industrie"
                value={industry}
                onChange={setIndustry}
                options={industries}
                title="Filtrer par industrie"
              />
              <CustomSelect
                label="Étape"
                value={stage}
                onChange={setStage}
                options={stages}
                title="Filtrer par étape"
              />
              <label className="inline-flex items-center gap-1.5 md:gap-2 text-[9px] md:text-xs px-2 py-1 border border-border rounded-md">
                <span className="text-muted-foreground">Score ≥</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-8 md:w-10 bg-transparent focus:outline-none font-mono text-xs"
                />
              </label>
              <div className="h-4 w-px bg-border hidden md:block" />
              <button
                onClick={() => setSortBy(sortBy === "score" ? "name" : "score")}
                className="text-[9px] md:text-xs px-2 py-1 rounded-md border border-border hover:bg-surface"
              >
                Trier: {sortBy === "score" ? "Score ↓" : "Nom A-Z"}
              </button>
              <div className="ml-auto inline-flex rounded-md border border-border p-0.5 bg-surface/40">
                <button
                  onClick={() => setView("table")}
                  title="Vue tableau"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    view === "table" ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                >
                  <ListIcon className="size-3.5" />
                </button>
                <button
                  onClick={() => setView("cards")}
                  title="Vue carte"
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    view === "cards" ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Astuce :{" "}
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono">
                Ctrl+Z
              </kbd>{" "}
              annuler ·{" "}
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono">
                Ctrl+Y
              </kbd>{" "}
              rétablir · clic droit pour actions
            </p>

            {view === "table" && (
              <DataTable
                data={filtered}
                columns={columns}
                keyExtractor={(row) => row.id}
                onRowClick={() => {}}
                selectedIds={selectedIds}
                onSelectRow={(id, selected) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (selected) next.add(id);
                    else next.delete(id);
                    return next;
                  });
                }}
                onSelectAll={(selected) => {
                  if (selected) setSelectedIds(new Set(filtered.map((l) => l.id)));
                  else setSelectedIds(new Set());
                }}
                pageSize={10}
                showPagination={!needsScroll}
                showSearch={true}
                searchPlaceholder="Nom, entreprise, titre, email..."
                searchFields={["name", "company", "title", "email"]}
                emptyMessage="Aucun prospect ne correspond à ces filtres."
                comfortable
              />
            )}

            {view === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((lead) => (
                  <Link
                    key={lead.id}
                    to={`/app/people/$id`}
                    params={{ id: lead.id }}
                    onContextMenu={(e) => openContextMenu(e, lead.id)}
                    className={cn(
                      "group rounded-xl border bg-background p-4 hover:shadow-md hover:border-primary/30 transition-all",
                      selectedIds.has(lead.id)
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <LetterAvatar name={lead.name} size={40} shape="circle" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate group-hover:text-primary">
                          {lead.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {lead.title}
                        </div>
                      </div>
                      {typeof lead.score === "number" && (
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                            lead.score >= 9
                              ? "bg-primary/15 text-primary"
                              : lead.score >= 8
                                ? "bg-amber-500/15 text-amber-600"
                                : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {lead.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <CompanyLogo name={lead.company} size={18} className="shrink-0" />
                      <span className="text-xs font-medium truncate">{lead.company}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge tone="muted">{lead.industry}</Badge>
                      <Badge tone="muted">{lead.location}</Badge>
                    </div>
                    {lead.signal && (
                      <div className="mt-3 rounded-lg bg-primary/5 p-2 flex items-center gap-1.5">
                        <Radio className="size-3 text-primary shrink-0" />
                        <span className="text-[10px] text-primary truncate">{lead.signal}</span>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-1.5">
                      <Badge
                        tone={
                          lead.stage === "won"
                            ? "success"
                            : lead.stage === "meeting"
                              ? "primary"
                              : "muted"
                        }
                      >
                        {stageLabels[lead.stage ?? "new"] ?? "Nouveau"}
                      </Badge>
                      {lead.saved && (
                        <Bookmark className="size-3 fill-primary text-primary ml-auto" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-border bg-background shadow-2xl px-3 py-2 flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <span className="w-px h-5 bg-border" />
          <button
            onClick={bulkAddToSequence}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
          >
            <Send className="size-3.5" /> Séquence
          </button>
          <button
            onClick={bulkEnrich}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
          >
            <Sparkles className="size-3.5" /> Enrichir
          </button>
          <button
            onClick={bulkSave}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
          >
            <Bookmark className="size-3.5" /> Sauvegarder
          </button>
          <button
            onClick={bulkExport}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
          >
            <Download className="size-3.5" /> Exporter
          </button>
          <span className="w-px h-5 bg-border" />
          <button
            onClick={() => askDelete(Array.from(selectedIds))}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3.5" /> Supprimer
          </button>
          <span className="w-px h-5 bg-border" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
            title="Tout désélectionner"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {contextMenu &&
        createPortal(
          <div
            style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
            className="min-w-[220px] rounded-xl border border-border bg-popover p-1 shadow-2xl animate-in fade-in-0 zoom-in-95"
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
              {contextMenu.ids.length} élément{contextMenu.ids.length > 1 ? "s" : ""}
            </div>
            <CtxButton
              icon={Send}
              label="Ajouter à une séquence"
              onClick={() => {
                toast.success("Ajouté à une séquence");
                setContextMenu(null);
              }}
            />
            <CtxButton
              icon={Sparkles}
              label="Enrichir"
              onClick={() => {
                toast.success("Enrichissement lancé");
                setContextMenu(null);
              }}
            />
            <CtxButton
              icon={Bookmark}
              label="Sauvegarder"
              onClick={() => {
                bulkSave();
                setContextMenu(null);
              }}
            />
            <CtxButton
              icon={Download}
              label="Exporter"
              onClick={() => {
                toast.success(`Export CSV — ${contextMenu.ids.length} lignes`);
                setContextMenu(null);
              }}
            />
            <CtxButton
              icon={Copy}
              label="Copier les emails"
              onClick={() => {
                const emails = leads
                  .filter((l) => contextMenu.ids.includes(l.id) && l.email)
                  .map((l) => l.email)
                  .join(", ");
                if (emails) navigator.clipboard?.writeText(emails);
                toast.success("Emails copiés");
                setContextMenu(null);
              }}
            />
            <div className="my-1 h-px bg-border" />
            <CtxButton
              icon={Trash2}
              label="Supprimer"
              destructive
              onClick={() => {
                askDelete(contextMenu.ids);
                setContextMenu(null);
              }}
            />
          </div>,
          document.body,
        )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={`Supprimer ${deleteConfirm?.ids.length ?? 0} prospect${(deleteConfirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
        description={`Cette action est réversible via Ctrl+Z, mais les fiches seront retirées de votre base. Êtes-vous sûr de vouloir continuer ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />

      <KnownPeopleExplorer />
    </div>
  );
}

function CtxButton({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-surface",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
