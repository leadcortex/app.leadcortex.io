//frontend\routes\app.companies.tsx
import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { PageHeader, Badge } from "@/components/ui-primitives";
import DataTable, { type Column } from "@/components/data-table";
import { SearchSelect, type SearchSelectOption } from "@/components/search-select";
import {
  Download,
  Plus,
  Building2,
  MapPin,
  Users,
  Bookmark,
  Trash2,
  X,
  Undo2,
  Redo2,
  Sparkles,
  Send,
  Copy,
  LayoutGrid,
  List as ListIcon,
  CheckSquare,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { EmptyState } from "@/components/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";
import { KnownCompaniesExplorer } from "@/components/known-companies";
import { CompanyAvatar } from "@/components/ui/letter-avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/companies")({
  head: () => ({ meta: [{ title: "Entreprises — LeadCortex" }] }),
  pendingComponent: () => (
    <TableViewSkeleton
      label="Chargement des entreprises"
      kpis={4}
      kpiVariant="stat"
      rows={10}
      columns={6}
      filters={4}
    />
  ),
  component: CompaniesPage,
});

const INTENT_TABS = ["all", "hot", "warm", "cold"] as const;
type IntentKey = (typeof INTENT_TABS)[number];

const INTENT_LABELS: Record<IntentKey, string> = {
  all: "Toutes",
  hot: "Chaudes",
  warm: "Tièdes",
  cold: "Froides",
};

const SCROLL_THRESHOLD = 10;
const SCROLL_MAX_HEIGHT = "640px";

type Snapshot = { companies: any[] };

function CompaniesPage() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isIndexRoute = pathname === "/app/companies" || pathname === "/app/companies/";
  if (!isIndexRoute) return <Outlet />;
  return <CompaniesListContent />;
}

function CompaniesListContent() {
  const navigate = useNavigate();
  const { companies, toggleCompanySaved, deleteCompany, setCompanies, addActivity } = useAppStore();
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState<IntentKey>("all");
  const [industry, setIndustry] = useState("Tous");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "cards">("table");

  const [undoStack, setUndoStack] = useState<{ snapshot: Snapshot; count: number }[]>([]);
  const [redoStack, setRedoStack] = useState<{ snapshot: Snapshot; count: number }[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ids: string[] } | null>(
    null,
  );

  const industries = useMemo(
    () => ["Tous", ...Array.from(new Set(companies.map((c) => c.industry)))],
    [companies],
  );

  const industryOptions: SearchSelectOption[] = useMemo(
    () =>
      industries.map((i) => ({
        value: i,
        label: i === "Tous" ? "Toutes les industries" : i,
        description:
          i === "Tous"
            ? "Afficher tous les secteurs"
            : `${companies.filter((c) => c.industry === i).length} compte(s)`,
      })),
    [industries, companies],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return companies
      .filter((c) => (intent === "all" ? true : c.intent === intent))
      .filter((c) => (industry === "Tous" ? true : c.industry === industry))
      .filter(
        (c) => q === "" || c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q),
      );
  }, [companies, query, intent, industry]);

  const doUndo = () => {
    setUndoStack((stack) => {
      const last = stack[stack.length - 1];
      if (!last) return stack;
      setRedoStack((r) => [
        ...r,
        { snapshot: { companies: companies.slice() }, count: last.count },
      ]);
      setCompanies(last.snapshot.companies);
      toast.success(
        `${last.count} entreprise${last.count > 1 ? "s" : ""} restaurée${last.count > 1 ? "s" : ""}`,
      );
      return stack.slice(0, -1);
    });
  };

  const doRedo = () => {
    setRedoStack((stack) => {
      const last = stack[stack.length - 1];
      if (!last) return stack;
      setUndoStack((u) => [
        ...u,
        { snapshot: { companies: companies.slice() }, count: last.count },
      ]);
      setCompanies(last.snapshot.companies);
      toast.success(
        `${last.count} entreprise${last.count > 1 ? "s" : ""} supprimée${last.count > 1 ? "s" : ""}`,
      );
      return stack.slice(0, -1);
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
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
        setSelectedIds(new Set(filtered.map((c) => c.id)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, filtered]);

  const openContextMenu = (e: React.MouseEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    let ids: string[];
    if (selectedIds.has(rowId) && selectedIds.size > 0) ids = Array.from(selectedIds);
    else {
      ids = [rowId];
      setSelectedIds(new Set([rowId]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, ids });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const onDown = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setContextMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  const askDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    setDeleteConfirm({ ids });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const ids = deleteConfirm.ids;
    setUndoStack((s) => [...s, { snapshot: { companies: companies.slice() }, count: ids.length }]);
    setRedoStack([]);
    ids.forEach((id) => deleteCompany(id));
    addActivity("Entreprises supprimées", `${ids.length} entreprise(s)`);
    setSelectedIds(new Set());
    setDeleteConfirm(null);
    setContextMenu(null);
    toast.success(
      `${ids.length} entreprise${ids.length > 1 ? "s" : ""} supprimée${ids.length > 1 ? "s" : ""}`,
      {
        action: { label: "Annuler", onClick: doUndo },
      },
    );
  };

  const columns: Column<(typeof companies)[number]>[] = [
    {
      key: "name",
      header: "Entreprise",
      sortable: true,
      accessor: (row) => (
        <Link
          to={`/app/companies/$id`}
          params={{ id: row.id }}
          className="flex items-center gap-2 hover:text-primary transition-colors group"
        >
          <CompanyAvatar name={row.name} domain={row.domain} size={28} shape="rounded" />
          <div>
            <div className="font-medium text-xs md:text-sm group-hover:underline">{row.name}</div>
            <div className="text-[9px] md:text-xs text-muted-foreground font-mono">
              {row.domain}
            </div>
          </div>
        </Link>
      ),
      cellClassName: "min-w-[140px] md:min-w-[220px]",
    },
    {
      key: "industry",
      header: "Industrie",
      sortable: true,
      accessor: (row) => row.industry,
      hideOnMobile: true,
    },
    {
      key: "location",
      header: "Localisation",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
          <MapPin className="size-2.5 md:size-3" /> {row.location}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "employees",
      header: "Effectif",
      sortable: true,
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs">
          <Users className="size-2.5 md:size-3 text-muted-foreground" />{" "}
          {(Number(row.employees) || 0).toLocaleString("fr-FR")}
        </span>
      ),
      className: "text-right",
      cellClassName: "text-right",
      hideOnMobile: true,
    },
    {
      key: "revenue",
      header: "Revenu",
      sortable: true,
      accessor: (row) => <span className="font-mono text-[10px] md:text-xs">{row.revenue}</span>,
      className: "text-right",
      cellClassName: "text-right",
      hideOnMobile: true,
    },
    {
      key: "intent",
      header: "Intention",
      sortable: true,
      accessor: (row) => (
        <Badge
          tone={row.intent === "hot" ? "primary" : row.intent === "warm" ? "warning" : "muted"}
        >
          <span
            className={`size-1 rounded-full mr-0.5 md:mr-1 inline-block ${
              row.intent === "hot"
                ? "bg-primary"
                : row.intent === "warm"
                  ? "bg-amber-500"
                  : "bg-muted-foreground"
            }`}
          />
          {row.intent}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      accessor: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCompanySaved(row.id);
          }}
          title={row.saved ? "Retirer" : "Sauvegarder"}
          className="p-1 rounded hover:bg-secondary transition-colors"
        >
          <Bookmark
            className={`size-3 md:size-3.5 ${row.saved ? "fill-primary text-primary" : "text-muted-foreground"}`}
          />
        </button>
      ),
      className: "w-6 md:w-8",
      cellClassName: "text-center",
    },
  ];

  const bulkExport = () => {
    const count = selectedIds.size || filtered.length;
    toast.success(`Export CSV — ${count} lignes`);
    addActivity("Export", `${count} entreprises exportées`);
    setSelectedIds(new Set());
  };

  const bulkEnrich = () => {
    toast.success(`Enrichissement lancé pour ${selectedIds.size} entreprise(s)`);
    setSelectedIds(new Set());
  };

  const bulkSave = () => {
    selectedIds.forEach((id) => {
      const c = companies.find((x) => x.id === id);
      if (c && !c.saved) toggleCompanySaved(id);
    });
    toast.success(`${selectedIds.size} sauvegardées`);
    setSelectedIds(new Set());
  };

  const hasItems = companies.length > 0;
  const needsScroll = companies.length > SCROLL_THRESHOLD;

  const stats = useMemo(() => {
    const total = companies.length;
    const hot = companies.filter((c) => c.intent === "hot").length;
    const saved = companies.filter((c) => c.saved).length;
    const employees = companies.reduce((sum, c) => sum + (Number(c.employees) || 0), 0);
    return [
      {
        label: "Comptes",
        value: total.toLocaleString("fr-FR"),
        hint: `${saved} sauvegardés`,
        icon: Building2,
      },
      {
        label: "Intention forte",
        value: hot.toLocaleString("fr-FR"),
        hint: total ? `${Math.round((hot / total) * 100)}%` : "—",
        icon: Bookmark,
      },
      {
        label: "Effectif cumulé",
        value: employees.toLocaleString("fr-FR"),
        hint: "Salariés couverts",
        icon: Users,
      },
      {
        label: "Couverture",
        value: `${Math.min(100, 40 + total * 6)}%`,
        hint: "Enrichissement",
        icon: CheckSquare,
      },
    ];
  }, [companies]);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((c) => map.set(c.industry, (map.get(c.industry) ?? 0) + 1));
    const max = Math.max(1, ...Array.from(map.values()));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ind, count]) => ({ industry: ind, count, pct: (count / max) * 100 }));
  }, [companies]);

  return (
    <div className="max-w-full space-y-3">
      <PageHeader
        eyebrow="Entreprises"
        title="Les comptes cibles."
        description={
          hasItems
            ? `${filtered.length} sur ${companies.length} · ${companies.filter((c) => c.intent === "hot").length} avec intention forte`
            : "0 entreprise"
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
              to="/app/companies/new"
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
              src="/images/companies.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
            />
            <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
              <EmptyState
                icon={Building2}
                title="Aucune entreprise"
                description="Ajoutez votre première entreprise cible pour commencer à prospecter."
                actionLabel="Ajouter une entreprise"
                onAction={() => navigate({ to: "/app/companies/new" })}
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

            <div className="rounded-xl border border-border bg-background p-3 md:p-4">
              <div className="text-[10px] md:text-xs text-muted-foreground mb-2.5">
                Répartition par industrie
              </div>
              <div className="space-y-1.5">
                {breakdown.map((b) => (
                  <div key={b.industry} className="flex items-center gap-2">
                    <span className="w-24 md:w-32 shrink-0 truncate text-[10px] md:text-xs">
                      {b.industry}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[10px] md:text-xs text-muted-foreground">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <div className="min-w-[220px]">
                <SearchSelect
                  value={industry}
                  onChange={setIndustry}
                  options={industryOptions}
                  placeholder="Toutes les industries"
                  searchPlaceholder="Rechercher une industrie…"
                  title="Filtrer par industrie"
                  minPanelWidth={280}
                  maxPanelWidth={380}
                />
              </div>
              <div className="inline-flex rounded-md border border-border p-0.5 bg-surface/40">
                {INTENT_TABS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setIntent(k)}
                    className={`px-2 py-0.5 text-[9px] md:text-xs rounded transition-colors ${
                      intent === k
                        ? "bg-background shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {INTENT_LABELS[k]}
                  </button>
                ))}
              </div>
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
                  if (selected) setSelectedIds(new Set(filtered.map((c) => c.id)));
                  else setSelectedIds(new Set());
                }}
                pageSize={10}
                showPagination={!needsScroll}
                showSearch={true}
                searchPlaceholder="Nom ou domaine..."
                searchFields={["name", "domain"]}
                emptyMessage="Aucune entreprise ne correspond."
              />
            )}

            {view === "cards" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map((c) => (
                  <Link
                    key={c.id}
                    to={`/app/companies/$id`}
                    params={{ id: c.id }}
                    onContextMenu={(e) => openContextMenu(e, c.id)}
                    className={cn(
                      "group rounded-xl border bg-background p-4 hover:shadow-md hover:border-primary/30 transition-all",
                      selectedIds.has(c.id)
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <CompanyAvatar name={c.name} domain={c.domain} size={40} shape="rounded" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate group-hover:text-primary">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {c.domain}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge tone="muted">{c.industry}</Badge>
                      <Badge tone="muted">{c.size}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <Badge
                        tone={
                          c.intent === "hot" ? "primary" : c.intent === "warm" ? "warning" : "muted"
                        }
                      >
                        {c.intent}
                      </Badge>
                      {c.saved && <Bookmark className="size-3 fill-primary text-primary ml-auto" />}
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
            title="Désélectionner"
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
              label="Copier les domaines"
              onClick={() => {
                const doms = companies
                  .filter((c) => contextMenu.ids.includes(c.id))
                  .map((c) => c.domain)
                  .join(", ");
                if (doms) navigator.clipboard?.writeText(doms);
                toast.success("Domaines copiés");
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
        title={`Supprimer ${deleteConfirm?.ids.length ?? 0} entreprise${(deleteConfirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
        description={`Cette action est réversible via Ctrl+Z, mais les fiches seront retirées de votre base. Êtes-vous sûr de vouloir continuer ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />

      <KnownCompaniesExplorer />
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
