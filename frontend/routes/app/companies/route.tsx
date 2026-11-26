// frontend/routes/app/companies/route.tsx

import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/ui-primitives";
import {
  ArrowDown,
  Bookmark,
  Building2,
  CheckSquare,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Redo2,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Undo2,
  Users,
  X,
} from "@/components/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/state/store";
import { EmptyState } from "@/components/common/empty-state";
import { TableViewSkeleton } from "@/components/skeletons";
import { KnownCompaniesExplorer } from "@/components/discovery/known-companies";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { type Column } from "@/components/common/data-table";
import { ScoreStepper } from "@/components/ui/score-stepper";
import { CompanyAvatar } from "@/components/company-logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useDockHeight, useFadeBeforeOverlap } from "@/hooks/use-scroll-dock";
import { ContextMenu } from "@/components/common/context-menu";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { MobileEmptyState } from "@/components/mobile/mobile-empty-state";
import { MobileStickyBar } from "@/components/mobile/mobile-sticky-bar";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { MobileConfirmDialog } from "@/components/mobile/mobile-confirm-dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { MobileSelectSheet } from "@/components/mobile/mobile-select-sheet";
import {
  industries,
  intents,
  intentLabels,
  readCompanyPreferences,
  writeCompanyPreferences,
  syncAutoHideKnownCompanies,
  type CompanyPreferences,
} from "@/lib/companies/preferences";
import {
  FilterDropdown,
  MobileFilterSheetLocal,
  PageSizeSelect,
} from "@/components/companies/companies-filters";
import { SettingsMenu, buildCompanyContextMenu } from "@/components/companies/companies-shared";
import {
  CompaniesSearchDropdown,
  useFuzzyCompanySearch,
} from "@/components/companies/companies-search-dropdown";
import {
  CARDS_PER_ROW,
  CARDS_PER_ROW_MOBILE,
  CardsView,
} from "@/components/companies/companies-cards";
import { MobileCompanyStack } from "@/components/companies/companies-mobile";
import DataTable from "@/components/common/data-table";
import { AutoScrollOnDrag, ScrollbarStyles } from "@/components/people/people-table-layout";
import { cn } from "@/lib/core/utils";
import { Button } from "@/components/ui/button";

export const Route
 = createFileRoute("/app/companies")({
  head: () => ({ meta: [{ title: "Entreprises · LeadCortex" }] }),
  pendingComponent: () => (
    <TableViewSkeleton
      label="Chargement des entreprises"
      rows={10}
      columns={6}
      filters={4}
      comfortable
    />
  ),
  component: CompaniesPage,
});

type Snapshot = { companies: any[] };

function CompaniesPage() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isIndexRoute = pathname === "/app/companies" || pathname === "/app/companies/";
  if (!isIndexRoute) return <Outlet />;
  return <CompaniesListContent />;
}

function CompaniesListContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const store = useAppStore();
  const {
    companies,
    toggleCompanySaved,
    updateCompany,
    addActivity,
    deleteCompany,
    setCompanies,
    hydrated,
  } = store;

  const [prefs, setPrefs] = useState<CompanyPreferences>(() => readCompanyPreferences());
  const updatePrefs = useCallback((patch: Partial<CompanyPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writeCompanyPreferences(next);
      return next;
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<{ snapshot: Snapshot; count: number }[]>([]);
  const [redoStack, setRedoStack] = useState<{ snapshot: Snapshot; count: number }[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null);
  const [mobileActions, setMobileActions] = useState<{ ids: string[] } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const tableDockRef = useRef<HTMLDivElement>(null);
  const floatingActionsRef = useRef<HTMLDivElement>(null);

  const ctx = useContextMenu<{ id: string; multi: boolean }>({
    onBeforeOpen: (payload) => {
      if (!payload.multi) {
        setSelectedIds(new Set([payload.id]));
      }
    },
  });

  const filtered = useMemo(() => {
    const result = companies
      .filter((c) => (prefs.industry === "Tous" ? true : c.industry === prefs.industry))
      .filter((c) => (prefs.intent === "Tous" ? true : c.intent === prefs.intent))
      .filter((c) => (c.employees ?? 0) >= prefs.minEmployees);

    if (prefs.sortBy === "manual") return result;

    return [...result].sort((a, b) => {
      switch (prefs.sortBy) {
        case "intent": {
          const order: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
          return (order[a.intent] ?? 9) - (order[b.intent] ?? 9);
        }
        case "employees":
          return (b.employees ?? 0) - (a.employees ?? 0);
        case "revenue": {
          const parse = (r?: string) => Number((r ?? "").replace(/[^\d.]/g, "")) || 0;
          return parse(b.revenue) - parse(a.revenue);
        }
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [companies, prefs.industry, prefs.intent, prefs.minEmployees, prefs.sortBy]);

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase().trim();
    return filtered.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q),
    );
  }, [filtered, searchQuery]);

  const searchResults = useFuzzyCompanySearch(searchQuery, companies);

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  const closeSearchDropdown = useCallback(() => {
    setSearchDropdownOpen(false);
  }, []);

  const handleSelectSearchResult = useCallback(
    (company: any) => {
      setSearchDropdownOpen(false);
      setSearchQuery("");
      navigate({ to: "/app/companies/$id", params: { id: company.id } });
    },
    [navigate],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!searchDropdownOpen || searchResults.length === 0) {
        if (e.key === "Escape") setSearchDropdownOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSearchActiveIndex((i) => Math.min(i + 1, searchResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSearchActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = searchResults[searchActiveIndex];
        if (hit) handleSelectSearchResult(hit.company);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSearchDropdownOpen(false);
      }
    },
    [searchDropdownOpen, searchResults, searchActiveIndex, handleSelectSearchResult],
  );

  const prevCompanyCountRef = useRef<number>(companies.length);
  useEffect(() => {
    if (!hydrated) return;
    const prev = prevCompanyCountRef.current;
    const current = companies.length;
    prevCompanyCountRef.current = current;

    const freshPrefs = readCompanyPreferences();
    const result = syncAutoHideKnownCompanies(prev, current, freshPrefs);

    if (result.patch) {
      const next = { ...freshPrefs, ...result.patch };
      writeCompanyPreferences(next);
      setPrefs(next);
      if (result.justHidden) {
        toast.info("Suggestions d'entreprises masquées", {
          description: `Vous avez ${current} comptes. Vous pouvez réafficher les suggestions dans les préférences.`,
          duration: 6000,
        });
      }
    }
  }, [companies.length, hydrated]);

  const doUndo = useCallback(() => {
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
  }, [companies, setCompanies]);

  const doRedo = useCallback(() => {
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
  }, [companies, setCompanies]);

  const askDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      toast.error("Aucune entreprise sélectionnée");
      return;
    }
    setDeleteConfirm({ ids });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    const ids = deleteConfirm.ids;
    setUndoStack((s) => [...s, { snapshot: { companies: companies.slice() }, count: ids.length }]);
    setRedoStack([]);
    ids.forEach((id) => deleteCompany(id));
    addActivity("Entreprises supprimées", `${ids.length} entreprise(s)`);
    setSelectedIds(new Set());
    setDeleteConfirm(null);
    setMobileActions(null);
    toast.success(
      `${ids.length} entreprise${ids.length > 1 ? "s" : ""} supprimée${ids.length > 1 ? "s" : ""}`,
      { action: { label: "Annuler", onClick: doUndo } },
    );
  }, [deleteConfirm, companies, deleteCompany, addActivity, doUndo]);

  const bulkExport = useCallback(() => {
    const count = selectedIds.size || searched.length;
    toast.success(`${count} ligne${count > 1 ? "s" : ""} exportée${count > 1 ? "s" : ""} en CSV`);
    addActivity("Export", `${count} entreprises exportées`);
    setSelectedIds(new Set());
  }, [selectedIds.size, searched.length, addActivity]);

  const bulkEnrich = useCallback(() => {
    addActivity("Enrichissement lancé", `${selectedIds.size} entreprises`);
    toast.success(`Enrichissement lancé pour ${selectedIds.size} entreprise(s)`);
    setSelectedIds(new Set());
  }, [selectedIds.size, addActivity]);

  const bulkSave = useCallback(() => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const c = companies.find((x) => x.id === id);
      if (c && !c.saved) toggleCompanySaved(id);
    });
    toast.success(`${selectedIds.size} entreprises sauvegardées`);
    setSelectedIds(new Set());
  }, [selectedIds, companies, toggleCompanySaved]);

  const toggleSelectRow = useCallback((id: string, sel: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (sel) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const reorderCompanies = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const fromIdx = companies.findIndex((c) => c.id === fromId);
      const toIdx = companies.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;
      const next = [...companies];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      setCompanies(next);
      if (prefs.sortBy !== "manual") updatePrefs({ sortBy: "manual" });
      toast.success("Ordre mis à jour");
    },
    [companies, setCompanies, prefs.sortBy, updatePrefs],
  );

  const bindContext = useCallback(
    (payload: { id: string }) => {
      const multi = selectedIds.has(payload.id) && selectedIds.size > 1;
      // Sur mobile, pas de menu contextuel à l'appui long : il ferait doublon
      // avec les cases à cocher et la barre d'actions de sélection.
      return ctx.bind({ id: payload.id, multi }, { disabled: isMobile });
    },
    [ctx, selectedIds, isMobile],
  );

  useKeyboardShortcuts([
    { key: "z", mod: true, handler: doUndo },
    { key: "y", mod: true, handler: doRedo },
  ]);

  const columns: Column<(typeof companies)[number]>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Entreprise",
        sortable: true,
        accessor: (row) => (
          <Link
            to={`/app/companies/$id`}
            params={{ id: row.id }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 hover:text-primary transition-colors min-w-0"
          >
            <CompanyAvatar
              name={row.name}
              domain={row.domain}
              logoUrl={row.companyLogoUrl}
              size={32}
              shape="rounded"
            />
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{row.name}</div>
              {row.domain && (
                <div className="text-xs text-muted-foreground truncate">{row.domain}</div>
              )}
            </div>
          </Link>
        ),
        cellClassName: "min-w-[160px] md:min-w-[200px]",
      },
      {
        key: "industry",
        header: "Industrie",
        sortable: true,
        compactHide: true,
        hideOnMobile: true,
        accessor: (row) => (
          <div className="min-w-0">
            <div className="truncate text-sm">{row.industry || "Non renseigné"}</div>
            {row.location && (
              <div className="text-xs text-muted-foreground truncate">{row.location}</div>
            )}
          </div>
        ),
        cellClassName: "min-w-[140px] md:min-w-[180px]",
      },
      ...(prefs.showEmployees
        ? [
            {
              key: "employees",
              header: "Effectif",
              sortable: true,
              compactHide: true,
              accessor: (row: any) => (
                <span className="text-sm tabular-nums">
                  {(Number(row.employees) || 0).toLocaleString("fr-FR")}
                </span>
              ),
              cellClassName: "min-w-[90px] md:min-w-[120px]",
            } as Column<any>,
          ]
        : []),
      ...(prefs.showRevenue
        ? [
            {
              key: "revenue",
              header: "Revenu",
              sortable: true,
              compactHide: true,
              hideOnMobile: true,
              accessor: (row: any) => (
                <span className="text-sm tabular-nums">
                  {row.revenue || <span className="text-muted-foreground">Inconnu</span>}
                </span>
              ),
              cellClassName: "min-w-[90px] md:min-w-[110px]",
            } as Column<any>,
          ]
        : []),
      ...(prefs.showIntent
        ? [
            {
              key: "intent",
              header: "Intention",
              sortable: true,
              accessor: (row: any) => (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    row.intent === "hot"
                      ? "bg-primary/10 text-primary"
                      : row.intent === "warm"
                        ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      row.intent === "hot"
                        ? "bg-primary"
                        : row.intent === "warm"
                          ? "bg-amber-500"
                          : "bg-muted-foreground",
                    )}
                  />
                  {intentLabels[row.intent] ?? row.intent}
                </span>
              ),
              cellClassName: "min-w-[90px] md:min-w-[120px]",
            } as Column<any>,
          ]
        : []),
      {
        key: "actions",
        header: "",
        sortable: false,
        accessor: (row) => (
          <div className="flex items-center justify-center pr-4">
            <button
              data-range-action="saved"
              data-range-active={String(!!row.saved)}
              onClick={(e) => {
                e.stopPropagation();
                toggleCompanySaved(row.id);
              }}
              title={row.saved ? "Retirer des favoris" : "Sauvegarder"}
              aria-label={row.saved ? "Retirer des favoris" : "Sauvegarder"}
              className="grid size-8 place-items-center rounded-lg hover:bg-surface/70 transition-colors"
            >
              <Bookmark
                className={`size-4 ${row.saved ? "fill-primary text-primary" : "text-muted-foreground"}`}
              />
            </button>
          </div>
        ),
        className: "w-14 md:w-20",
        cellClassName: "text-center",
      },
    ],
    [toggleCompanySaved, prefs.showIntent, prefs.showEmployees, prefs.showRevenue],
  );

  const contextMenuNode = useMemo(() => {
    if (!ctx.state) return null;
    const { id, multi } = ctx.state.payload;
    const company = companies.find((c) => c.id === id);
    if (!company) return null;
    const count = multi ? selectedIds.size : 1;

    return (
      <ContextMenu
        open
        position={{ x: ctx.state.x, y: ctx.state.y }}
        onClose={ctx.close}
        title={multi ? `${count} éléments` : company.name}
        sections={buildCompanyContextMenu({
          onOpen: () => navigate({ to: "/app/companies/$id", params: { id } }),
          onEmail: () => {
            addActivity("Email envoyé", company.name);
            toast.success("Email préparé");
          },
          onVisitSite: () => {
            if (!company.domain) return toast.error("Aucun domaine");
            window.open(`https://${company.domain}`, "_blank", "noopener");
          },
          onSave: () => {
            toggleCompanySaved(id);
            toast.success(company.saved ? "Retiré des favoris" : "Ajouté aux favoris");
          },
          onCopyDomain: () => {
            if (!company.domain) return toast.error("Aucun domaine");
            navigator.clipboard?.writeText(company.domain);
            toast.success("Domaine copié");
          },
          onExport: bulkExport,
          onEnrich: bulkEnrich,
          onDelete: () => askDelete(multi ? Array.from(selectedIds) : [id]),
          onAddContact: () => toast.success(`Formulaire de contact pour ${company.name} ouvert`),
          isSaved: !!company.saved,
          hasDomain: !!company.domain,
          selectionCount: count,
        })}
      />
    );
  }, [
    ctx.state,
    ctx.close,
    companies,
    selectedIds,
    navigate,
    addActivity,
    toggleCompanySaved,
    bulkExport,
    bulkEnrich,
    askDelete,
  ]);

  const searchDropdownNode = (
    <CompaniesSearchDropdown
      open={searchDropdownOpen && searchQuery.trim().length > 0}
      query={searchQuery}
      inputElRef={searchInputRef}
      companies={companies}
      results={searchResults}
      activeIndex={searchActiveIndex}
      onActiveChange={setSearchActiveIndex}
      onSelect={handleSelectSearchResult}
      onClose={closeSearchDropdown}
    />
  );

  const hasItems = companies.length > 0;
  const savedCount = companies.filter((c) => c.saved).length;

  const tableDockActive = !isMobile && hasItems && prefs.view === "table";
  const tableDockHeight = useDockHeight(tableDockRef, { active: tableDockActive });
  const tableDockMaxHeight: string | number =
    tableDockHeight === undefined ? "calc(100dvh - 180px)" : tableDockHeight;
  useFadeBeforeOverlap(floatingActionsRef, tableDockRef, { active: tableDockActive });

  if (isMobile) {
    const activeFilterCount =
      (prefs.industry !== "Tous" ? 1 : 0) +
      (prefs.intent !== "Tous" ? 1 : 0) +
      (prefs.minEmployees > 0 ? 1 : 0) +
      (prefs.sortBy !== "intent" ? 1 : 0);

    return (
      <>
        <ScrollbarStyles />
        <div className="sticky top-2 z-30 flex justify-end items-center gap-2 pointer-events-none -mb-10">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSettingsOpen(true)}
              aria-label="Préférences"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground shadow-float active:bg-surface"
            >
              <Settings className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/app/companies/new" })}
              aria-label="Ajouter une entreprise"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-float active:opacity-90"
            >
              <Plus className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <MobilePageHeader
          title="Entreprises"
          subtitle={
            hasItems
              ? `${filtered.length} sur ${companies.length} · ${savedCount} favoris`
              : "Aucune entreprise"
          }
          actions={
            <>
              <MobileSelectSheet
                value={prefs.intent}
                onChange={(v) => updatePrefs({ intent: v })}
                options={intents.map((i) =>
                  i === "Tous" ? "Toutes les intentions" : (intentLabels[i] ?? i),
                )}
                placeholder="Toutes les intentions"
                title="Filtrer par intention"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-medium transition-colors active:bg-surface"
              >
                <span>Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </>
          }
          className="pr-24"
        />

        <MobileSheet
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
          title="Préférences"
        >
          <div className="space-y-2 px-4 pt-2">
            <button
              type="button"
              onClick={() => updatePrefs({ hideKnownCompanies: !prefs.hideKnownCompanies })}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-[14px] active:bg-surface"
            >
              <span className="min-w-0 flex-1">Masquer les suggestions d'entreprises</span>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                  prefs.hideKnownCompanies
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {prefs.hideKnownCompanies && (
                  <span className="block size-2 rounded-full bg-current" />
                )}
              </span>
            </button>

            <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
              <p className="text-[13px] font-medium text-muted-foreground">Affichage</p>
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-border bg-surface/40">
                <button
                  type="button"
                  onClick={() => updatePrefs({ view: "table" })}
                  className={cn(
                    "h-9 px-2 text-[13px] rounded-md transition-colors inline-flex items-center justify-center gap-1.5",
                    prefs.view === "table"
                      ? "bg-background text-foreground font-medium"
                      : "text-muted-foreground active:bg-surface",
                  )}
                >
                  <ListIcon className="size-3.5" /> Tableau
                </button>
                <button
                  type="button"
                  onClick={() => updatePrefs({ view: "cards" })}
                  className={cn(
                    "h-9 px-2 text-[13px] rounded-md transition-colors inline-flex items-center justify-center gap-1.5",
                    prefs.view === "cards"
                      ? "bg-background text-foreground font-medium"
                      : "text-muted-foreground active:bg-surface",
                  )}
                >
                  <LayoutGrid className="size-3.5" /> Cartes
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updatePrefs({ tablesInOwnContainer: !prefs.tablesInOwnContainer })}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-[14px] active:bg-surface"
            >
              <span className="min-w-0 flex-1">Encadrer chaque tableau</span>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                  prefs.tablesInOwnContainer
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {prefs.tablesInOwnContainer && (
                  <span className="block size-2 rounded-full bg-current" />
                )}
              </span>
            </button>
          </div>
        </MobileSheet>

        {!hasItems ? (
          <div className="pt-4 pb-6">
            <MobileEmptyState
              icon={Building2}
              title="Aucune entreprise"
              description="Ajoutez une première entreprise à prospecter."
              action={{
                label: "Créer une entreprise",
                onClick: () => navigate({ to: "/app/companies/new" }),
                icon: Plus,
              }}
            />
          </div>
        ) : (
          <>
            <div className="pt-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchQuery(v);
                    setSearchDropdownOpen(v.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setSearchDropdownOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Rechercher une entreprise…"
                  className="w-full h-11 rounded-full border border-border bg-background pl-10 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchDropdownOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground active:bg-surface"
                    aria-label="Effacer"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {prefs.view === "table" ? (
              <MobileCompanyStack
                companies={searched}
                selectedIds={selectedIds}
                onSelectRow={toggleSelectRow}
                onOpen={(company) =>
                  navigate({ to: "/app/companies/$id", params: { id: company.id } })
                }
                bindContext={bindContext}
                tablesInOwnContainer={prefs.tablesInOwnContainer}
              />
            ) : (
              <CardsView
                companies={searched}
                selectedIds={selectedIds}
                onSelectRow={toggleSelectRow}
                bindContext={bindContext}
                onReorder={reorderCompanies}
                cardsPerRow={CARDS_PER_ROW_MOBILE}
              />
            )}
          </>
        )}

        {selectedIds.size > 0 && (
          <>
            <MobileStickyBar
              actions={[
                { label: "Enrichir", icon: Sparkles, onClick: bulkEnrich },
                {
                  label: "Plus",
                  icon: CheckSquare,
                  variant: "secondary",
                  onClick: () => setMobileActions({ ids: Array.from(selectedIds) }),
                },
              ]}
              hint={
                <div className="flex w-full items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-muted-foreground transition-colors active:bg-surface"
                  >
                    <X className="size-3.5" />
                    <span className="whitespace-nowrap">Tout désélectionner</span>
                  </button>
                </div>
              }
            />
            <MobileStickyBar.Spacer />
          </>
        )}

        <MobileFilterSheetLocal
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          industry={prefs.industry}
          setIndustry={(v) => updatePrefs({ industry: v })}
          intent={prefs.intent}
          setIntent={(v) => updatePrefs({ intent: v })}
          minEmployees={prefs.minEmployees}
          setMinEmployees={(v) => updatePrefs({ minEmployees: v })}
          sortBy={prefs.sortBy}
          setSortBy={(v) => updatePrefs({ sortBy: v })}
        />

        {mobileActions && (
          <MobileActionSheet
            open
            onOpenChange={(o) => !o && setMobileActions(null)}
            title={
              mobileActions.ids.length > 1
                ? `${mobileActions.ids.length} entreprises`
                : (companies.find((c) => c.id === mobileActions.ids[0])?.name ?? "Actions")
            }
            sections={[
              {
                label: "Actions",
                items: [
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
          title={`Supprimer ${deleteConfirm?.ids.length ?? 0} entreprise${(deleteConfirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
          description="Les fiches seront retirées de votre base. Vous pourrez annuler juste après."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="destructive"
        />

        {!prefs.hideKnownCompanies && (
          <div className="pb-6 mt-8">
            <KnownCompaniesExplorer />
          </div>
        )}

        {contextMenuNode}
        {searchDropdownNode}
      </>
    );
  }

  return (
    <>
      <ScrollbarStyles />
      <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-10">
        <div
          ref={floatingActionsRef}
          className="sticky top-3 z-30 flex justify-end items-center gap-2 pointer-events-none -mb-10"
        >
          <div className="pointer-events-auto flex items-center gap-2">
            <SettingsMenu prefs={prefs} onChange={updatePrefs} />
            <Link
              to="/app/companies/new"
              className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium bg-foreground text-background rounded-lg shadow-float hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" /> Ajouter une entreprise
            </Link>
          </div>
        </div>

        <PageHeader
          eyebrow="Entreprises"
          title="Vos comptes cibles."
          description={
            hasItems
              ? `${searched.length} sur ${companies.length} · ${savedCount} sauvegardés`
              : "Aucune entreprise pour l'instant"
          }
          actions={
            <>
              {(undoStack.length > 0 || redoStack.length > 0) && (
                <div className="inline-flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={doUndo}
                    disabled={undoStack.length === 0}
                    title="Annuler"
                    aria-label="Annuler"
                    className="px-2"
                  >
                    <Undo2 />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={doRedo}
                    disabled={redoStack.length === 0}
                    title="Rétablir"
                    aria-label="Rétablir"
                    className="px-2"
                  >
                    <Redo2 />
                  </Button>
                </div>
              )}
              {hasItems && (
                <Button variant="outline" size="sm" onClick={bulkExport}>
                  <Download /> Exporter
                </Button>
              )}
            </>
          }
        />

        {!hasItems ? (
          <EmptyState
            icon={Building2}
            title="Aucune entreprise"
            description="Ajoutez une première entreprise à prospecter."
            actionLabel="Ajouter une entreprise"
            onAction={() => navigate({ to: "/app/companies/new" })}
          />
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <FilterDropdown
                  label="Industrie"
                  icon={Building2}
                  value={prefs.industry}
                  onChange={(v) => updatePrefs({ industry: v })}
                  options={industries.map((i) => ({ value: i, label: i }))}
                  allLabel="Toutes les industries"
                />
                <FilterDropdown
                  label="Intention"
                  icon={CheckSquare}
                  value={prefs.intent}
                  onChange={(v) => updatePrefs({ intent: v })}
                  options={intents.map((i) => ({
                    value: i,
                    label: i === "Tous" ? "Toutes" : (intentLabels[i] ?? i),
                  }))}
                  allLabel="Toutes les intentions"
                  width={220}
                />

                <div className="inline-flex items-center gap-2 text-[13px] h-9 px-3 border border-border rounded-lg bg-background">
                  <span className="text-muted-foreground">Effectif min.</span>
                  <ScoreStepper
                    value={String(prefs.minEmployees)}
                    onChange={(v) => updatePrefs({ minEmployees: Number(v) || 0 })}
                    min={0}
                    max={10000}
                    step={10}
                    size="sm"
                  />
                </div>

                <button
                  onClick={() =>
                    updatePrefs({
                      sortBy:
                        prefs.sortBy === "intent"
                          ? "name"
                          : prefs.sortBy === "name"
                            ? "employees"
                            : prefs.sortBy === "employees"
                              ? "revenue"
                              : prefs.sortBy === "revenue"
                                ? "manual"
                                : "intent",
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-[13px] h-9 px-3 rounded-lg border border-border bg-background hover:bg-surface/70 transition-colors"
                  title="Changer le tri : intention, nom, effectif, revenu, manuel"
                >
                  <span className="text-muted-foreground">Trier par</span>
                  <ArrowDown className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {prefs.sortBy === "intent"
                      ? "Intention"
                      : prefs.sortBy === "name"
                        ? "Nom"
                        : prefs.sortBy === "employees"
                          ? "Effectif"
                          : prefs.sortBy === "revenue"
                            ? "Revenu"
                            : "Manuel"}
                  </span>
                </button>

                <PageSizeSelect
                  value={prefs.pageSize}
                  onChange={(n) => updatePrefs({ pageSize: n })}
                />

                <div className="ml-auto inline-flex rounded-lg border border-border p-0.5 bg-surface/40 h-9">
                  <button
                    onClick={() => updatePrefs({ view: "table" })}
                    title="Vue tableau"
                    aria-label="Vue tableau"
                    className={cn(
                      "rounded-md px-3 transition-colors",
                      prefs.view === "table"
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ListIcon className="size-4" />
                  </button>
                  <button
                    onClick={() => updatePrefs({ view: "cards" })}
                    title="Vue cartes"
                    aria-label="Vue cartes"
                    className={cn(
                      "rounded-md px-3 transition-colors",
                      prefs.view === "cards"
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                </div>
              </div>

              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchQuery(v);
                    setSearchDropdownOpen(v.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setSearchDropdownOpen(true);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Rechercher par nom, domaine ou ville…"
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchDropdownOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </section>

            {prefs.view === "table" && (
              <div
                ref={tableDockRef}
                className="relative z-40 flex min-h-0 flex-col"
                style={{ maxHeight: tableDockMaxHeight, overflowAnchor: "none" }}
              >
                <AutoScrollOnDrag className="force-visible-scrollbar relative bg-background p-0 rounded-xl border border-border overflow-hidden flex min-h-0 flex-col">
                  <DataTable
                    data={searched}
                    columns={columns}
                    keyExtractor={(row: any) => row.id}
                    onRowClick={() => {}}
                    onRowContextMenu={(e: React.MouseEvent, id: string) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const multi = selectedIds.has(id) && selectedIds.size > 1;
                      if (!multi) setSelectedIds(new Set([id]));
                      ctx.open(e.clientX, e.clientY, { id, multi });
                    }}
                    reorderable
                    onReorder={reorderCompanies}
                    selectedIds={selectedIds}
                    onSelectRow={toggleSelectRow}
                    onSelectRange={(updates) => {
                      setSelectedIds((previous) => {
                        const next = new Set(previous);
                        updates.forEach(({ id, selected }) => {
                          if (selected) next.add(id);
                          else next.delete(id);
                        });
                        return next;
                      });
                    }}
                    onRangeAction={(action, id, active) => {
                      if (action === "saved") updateCompany(id, { saved: active });
                    }}
                    emptyMessage="Aucune entreprise ne correspond à ces filtres."
                    stickyHeader
                    compact={prefs.density === "compact"}
                    comfortable={prefs.density === "comfortable"}
                    pageSize={prefs.pageSize}
                    showPagination
                    forceVisibleScrollbar
                    disableHorizontalScroll={false}
                  />
                </AutoScrollOnDrag>
              </div>
            )}

            {prefs.view === "cards" && (
              <CardsView
                companies={searched}
                selectedIds={selectedIds}
                onSelectRow={toggleSelectRow}
                bindContext={bindContext}
                onReorder={reorderCompanies}
                cardsPerRow={CARDS_PER_ROW}
              />
            )}
          </>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => updatePrefs({ hideKnownCompanies: !prefs.hideKnownCompanies })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-pressed={!prefs.hideKnownCompanies}
          >
            {prefs.hideKnownCompanies ? (
              <Eye className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
            {prefs.hideKnownCompanies
              ? "Afficher les suggestions d'entreprises"
              : "Masquer les suggestions d'entreprises"}
          </button>
        </div>

        {!prefs.hideKnownCompanies && <KnownCompaniesExplorer />}
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-50 h-0 w-full pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <div className="pointer-events-auto inline-flex max-w-full items-center gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-background px-2 py-2 shadow-float scrollbar-hide animate-in slide-in-from-bottom-4 fade-in">
              <span className="shrink-0 whitespace-nowrap px-2 text-[13px] font-medium tabular-nums">
                {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
              </span>
              <span className="w-px h-5 bg-border shrink-0" />
              <button
                onClick={bulkEnrich}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg h-8 px-3 text-[13px] text-foreground hover:bg-surface/70 transition-colors"
              >
                <Sparkles className="size-3.5" /> Enrichir
              </button>
              <button
                onClick={bulkSave}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg h-8 px-3 text-[13px] text-foreground hover:bg-surface/70 transition-colors"
              >
                <Bookmark className="size-3.5" /> Sauvegarder
              </button>
              <button
                onClick={bulkExport}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg h-8 px-3 text-[13px] text-foreground hover:bg-surface/70 transition-colors"
              >
                <Download className="size-3.5" /> Exporter
              </button>
              <span className="w-px h-5 bg-border shrink-0" />
              <button
                onClick={() => askDelete(Array.from(selectedIds))}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg h-8 px-3 text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3.5" /> Supprimer
              </button>
              <span className="w-px h-5 bg-border shrink-0" />
              <button
                onClick={() => setSelectedIds(new Set())}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                title="Tout désélectionner"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenuNode}
      {searchDropdownNode}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title={`Supprimer ${deleteConfirm?.ids.length ?? 0} entreprise${(deleteConfirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
        description="Les fiches seront retirées de votre base. Ctrl+Z permet d'annuler."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </>
  );
}
