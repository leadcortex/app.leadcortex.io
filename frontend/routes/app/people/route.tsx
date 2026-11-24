// frontend/routes/app/people/route.tsx

import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/ui-primitives";
import {
  ArrowDown,
  Bookmark,
  Building2,
  CheckSquare,
  Download,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Redo2,
  Search,
  Send,
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
import { KnownPeopleExplorer } from "@/components/discovery/known-people";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ScoreStepper } from "@/components/ui/score-stepper";
import { ReliefGlyph } from "@academy/components/academy/glyphs/relief-glyph";
import { useIsMobile } from "@/hooks/use-mobile";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useDockHeight, useFadeBeforeOverlap } from "@/hooks/use-scroll-dock";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
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
  readPeoplePreferences,
  stageLabels,
  stages,
  syncAutoHideKnownPeople,
  writePeoplePreferences,
  type PeoplePreferences,
} from "@/lib/people/preferences";
import {
  FilterDropdown,
  MobileFilterSheetLocal,
  PageSizeSelect,
} from "@/components/people/people-filters";
import {
  SettingsMenu,
  buildLeadContextMenu,
} from "@/components/people/people-shared";
import {
  PeopleSearchDropdown,
  useFuzzyLeadSearch,
} from "@/components/people/people-search-dropdown";
import { CARDS_PER_ROW, CARDS_PER_ROW_MOBILE, CardsView } from "@/components/people/people-cards";
import { MobileNotificationStack } from "@/components/people/people-mobile";
import { getPeopleColumns } from "@/components/people/people-columns";
import DataTable, { type Column } from "@/components/common/data-table";
import { estimateDataTableContentHeight } from "@/lib/data-table-layout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutoScrollOnDrag, ScrollbarStyles } from "@/components/people/people-table-layout";
import { cn } from "@/lib/core/utils";

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

type Snapshot = { leads: any[] };

function PeoplePage() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isIndexRoute = pathname === "/app/people" || pathname === "/app/people/";
  if (!isIndexRoute) return <Outlet />;
  return <PeopleListContent />;
}

function PeopleListContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const store = useAppStore();
  const { leads, toggleLeadSaved, updateLead, addActivity, deleteLead, setLeads, hydrated } = store;

  const [prefs, setPrefs] = useState<PeoplePreferences>(() => readPeoplePreferences());
  const updatePrefs = useCallback((patch: Partial<PeoplePreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writePeoplePreferences(next);
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
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

  const ctx = useContextMenu<{ id: string; multi: boolean }>({
    onBeforeOpen: (payload) => {
      if (!payload.multi) {
        setSelectedIds(new Set([payload.id]));
      }
    },
  });

  const filtered = useMemo(() => {
    const result = leads
      .filter((l) => (prefs.industry === "Tous" ? true : l.industry === prefs.industry))
      .filter((l) => (prefs.stage === "Tous" ? true : l.stage === prefs.stage))
      .filter((l) => (l.score ?? 0) >= prefs.minScore);

    if (prefs.sortBy === "manual") return result;
    return result.sort((a, b) => {
      if (prefs.sortBy === "score") return (b.score ?? 0) - (a.score ?? 0);
      if (prefs.sortBy === "company") return (a.company || "").localeCompare(b.company || "");
      return a.name.localeCompare(b.name);
    });
  }, [leads, prefs.industry, prefs.stage, prefs.minScore, prefs.sortBy]);

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase().trim();
    return filtered.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q),
    );
  }, [filtered, searchQuery]);

  const searchResults = useFuzzyLeadSearch(searchQuery, leads);

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  const closeSearchDropdown = useCallback(() => {
    setSearchDropdownOpen(false);
  }, []);

  const handleSelectSearchResult = useCallback(
    (lead: any) => {
      setSearchDropdownOpen(false);
      setSearchQuery("");
      navigate({ to: "/app/people/$id", params: { id: lead.id } });
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
        if (hit) handleSelectSearchResult(hit.lead);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSearchDropdownOpen(false);
      }
    },
    [searchDropdownOpen, searchResults, searchActiveIndex, handleSelectSearchResult],
  );

  const prevLeadCountRef = useRef<number>(leads.length);
  useEffect(() => {
    if (!hydrated) return;
    const prev = prevLeadCountRef.current;
    const current = leads.length;
    prevLeadCountRef.current = current;

    const freshPrefs = readPeoplePreferences();
    const result = syncAutoHideKnownPeople(prev, current, freshPrefs);

    if (result.patch) {
      const next = { ...freshPrefs, ...result.patch };
      writePeoplePreferences(next);
      setPrefs(next);

      if (result.justHidden) {
        toast.info("Suggestions de décideurs masquées", {
          description: `Vous avez maintenant ${current} prospects dans votre base. Les suggestions sont masquées automatiquement pour garder la liste lisible. Vous pouvez les réactiver dans les préférences de la section Prospects.`,
          duration: 6000,
        });
      }
    }
  }, [leads.length, hydrated]);

  const doUndo = useCallback(() => {
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
  }, [leads, setLeads]);

  const doRedo = useCallback(() => {
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
  }, [leads, setLeads]);

  const askDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      toast.error("Aucun prospect sélectionné");
      return;
    }
    setDeleteConfirm({ ids });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    const ids = deleteConfirm.ids;
    setUndoStack((s) => [...s, { snapshot: { leads: leads.slice() }, count: ids.length }]);
    setRedoStack([]);
    ids.forEach((id) => deleteLead(id));
    addActivity("Prospects supprimés", `${ids.length} prospect(s)`);
    setSelectedIds(new Set());
    setDeleteConfirm(null);
    setMobileActions(null);
    toast.success(
      `${ids.length} prospect${ids.length > 1 ? "s" : ""} supprimé${ids.length > 1 ? "s" : ""}`,
      {
        action: { label: "Annuler", onClick: doUndo },
      },
    );
  }, [deleteConfirm, leads, deleteLead, addActivity, doUndo]);

  const bulkExport = useCallback(() => {
    const count = selectedIds.size || searched.length;
    toast.success(`Export CSV — ${count} lignes`);
    addActivity("Export", `${count} prospects exportés`);
    setSelectedIds(new Set());
  }, [selectedIds.size, searched.length, addActivity]);

  const bulkEnrich = useCallback(() => {
    addActivity("Enrichissement lancé", `${selectedIds.size} prospects`);
    toast.success(`Enrichissement lancé pour ${selectedIds.size} prospect(s)`);
    setSelectedIds(new Set());
  }, [selectedIds.size, addActivity]);

  const bulkSave = useCallback(() => {
    if (selectedIds.size === 0) return;
    selectedIds.forEach((id) => {
      const l = leads.find((x) => x.id === id);
      if (l && !l.saved) toggleLeadSaved(id);
    });
    toast.success(`${selectedIds.size} prospects sauvegardés`);
    setSelectedIds(new Set());
  }, [selectedIds, leads, toggleLeadSaved]);

  const toggleSelectRow = useCallback((id: string, sel: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (sel) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const reorderLeads = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const fromIdx = leads.findIndex((l) => l.id === fromId);
      const toIdx = leads.findIndex((l) => l.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;
      const next = [...leads];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      setLeads(next);
      if (prefs.sortBy !== "manual") updatePrefs({ sortBy: "manual" });
      toast.success("Ordre mis à jour");
    },
    [leads, setLeads, prefs.sortBy, updatePrefs],
  );

  const bindContext = useCallback(
    (payload: { id: string }) => {
      const multi = selectedIds.has(payload.id) && selectedIds.size > 1;
      return ctx.bind({ id: payload.id, multi });
    },
    [ctx, selectedIds],
  );

  useKeyboardShortcuts([
    { key: "z", mod: true, handler: doUndo },
    { key: "y", mod: true, handler: doRedo },
  ]);

  const columns: Column<(typeof leads)[number]>[] = useMemo(
    () =>
      getPeopleColumns(
        prefs,
        {
          onFindEmail: (_id) => {
            toast.success("Recherche d'email lancée en arrière-plan");
          },
          onFindPhone: (_id) => {
            toast.success("Recherche de numéro lancée");
          },
        },
        toggleLeadSaved,
      ),
    [toggleLeadSaved, prefs],
  );

  const contextMenuNode = useMemo(() => {
    if (!ctx.state) return null;
    const { id, multi } = ctx.state.payload;
    const lead = leads.find((l) => l.id === id);
    if (!lead) return null;
    const count = multi ? selectedIds.size : 1;

    return (
      <ContextMenu
        open
        position={{ x: ctx.state.x, y: ctx.state.y }}
        onClose={ctx.close}
        title={multi ? `${count} éléments` : lead.name}
        sections={buildLeadContextMenu({
          onOpen: () => navigate({ to: "/app/people/$id", params: { id } }),
          onEmail: () => {
            addActivity("Email envoyé", lead.name);
            toast.success("Email préparé");
          },
          onCall: () => toast.info("Appel disponible depuis la fiche"),
          onSave: () => {
            toggleLeadSaved(id);
            toast.success(lead.saved ? "Retiré des favoris" : "Ajouté aux favoris");
          },
          onCopyEmail: () => {
            if (!lead.email) return toast.error("Aucun email");
            navigator.clipboard?.writeText(lead.email);
            toast.success("Email copié");
          },
          onExport: bulkExport,
          onEnrich: bulkEnrich,
          onDelete: () => askDelete(multi ? Array.from(selectedIds) : [id]),
          onSequence: () => toast.success("Ajouté à une séquence"),
          isSaved: !!lead.saved,
          hasEmail: !!lead.email,
          hasPhone: !!lead.phone,
          selectionCount: count,
        })}
      />
    );
  }, [
    ctx.state,
    ctx.close,
    leads,
    selectedIds,
    navigate,
    addActivity,
    toggleLeadSaved,
    bulkExport,
    bulkEnrich,
    askDelete,
  ]);

  const searchDropdownNode = (
    <PeopleSearchDropdown
      open={searchDropdownOpen && searchQuery.trim().length > 0}
      query={searchQuery}
      inputElRef={searchInputRef}
      leads={leads}
      results={searchResults}
      activeIndex={searchActiveIndex}
      onActiveChange={setSearchActiveIndex}
      onSelect={handleSelectSearchResult}
      onClose={closeSearchDropdown}
    />
  );

  const hasItems = leads.length > 0;
  const savedCount = leads.filter((l) => l.saved).length;

  const tableDockActive = !isMobile && hasItems && prefs.view === "table";
  const tableDockRef = useRef<HTMLDivElement>(null);
  const floatingActionsRef = useRef<HTMLDivElement>(null);
  const tableDockHeight = useDockHeight(tableDockRef, { active: tableDockActive });
  const maxTableContentHeight = estimateDataTableContentHeight({
    rowCount: searched.length,
    pageSize: prefs.pageSize,
    compact: prefs.density === "compact",
    comfortable: prefs.density === "comfortable",
  });
  const tableDockStyleHeight =
    tableDockHeight === undefined
      ? `min(calc(100dvh - 180px), ${maxTableContentHeight}px)`
      : Math.min(tableDockHeight, maxTableContentHeight);
  useFadeBeforeOverlap(floatingActionsRef, tableDockRef, { active: tableDockActive });

  if (isMobile) {
    const activeFilterCount =
      (prefs.industry !== "Tous" ? 1 : 0) +
      (prefs.minScore > 0 ? 1 : 0) +
      (prefs.sortBy !== "score" ? 1 : 0) +
      (prefs.stage !== "Tous" ? 1 : 0);

    return (
      <>
        <ScrollbarStyles />
        <div className="sticky top-2 z-30 flex justify-end items-center gap-2 px-4 pointer-events-none -mb-10">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSettingsOpen(true)}
              aria-label="Préférences"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--foreground)_25%,transparent)] active:bg-surface"
            >
              <Settings className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/app/people/new" })}
              aria-label="Ajouter un prospect"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--foreground)_45%,transparent)] active:opacity-90"
            >
              <Plus className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <MobilePageHeader
          title="Prospects"
          subtitle={
            hasItems
              ? `${filtered.length} sur ${leads.length} · ${savedCount} favoris`
              : "Aucun prospect"
          }
          actions={
            <>
              <MobileSelectSheet
                value={prefs.stage}
                onChange={(v) => updatePrefs({ stage: v })}
                options={stages.map((s) =>
                  s === "Tous" ? "Toutes les étapes" : (stageLabels[s] ?? s),
                )}
                placeholder="Toutes les étapes"
                title="Filtrer par étape"
              />
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[13px] font-medium transition-colors active:bg-surface"
              >
                <span>Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
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
              onClick={() => updatePrefs({ hideKnownPeople: !prefs.hideKnownPeople })}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-[14px] active:bg-surface"
            >
              <span className="min-w-0 flex-1">Masquer les suggestions de décideurs</span>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                  prefs.hideKnownPeople
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {prefs.hideKnownPeople && (
                  <span className="block size-2 rounded-full bg-current" />
                )}
              </span>
            </button>

            <div className="rounded-xl border border-border bg-background px-4 py-3 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Vue des prospects
              </p>
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-border bg-surface/40">
                <button
                  type="button"
                  onClick={() => updatePrefs({ view: "table" })}
                  className={cn(
                    "px-2 py-1.5 text-[12px] rounded-md transition-colors inline-flex items-center justify-center gap-1",
                    prefs.view === "table"
                      ? "bg-background shadow-sm text-foreground font-medium"
                      : "text-muted-foreground active:bg-surface",
                  )}
                >
                  <ListIcon className="size-3.5" /> Tableau
                </button>
                <button
                  type="button"
                  onClick={() => updatePrefs({ view: "cards" })}
                  className={cn(
                    "px-2 py-1.5 text-[12px] rounded-md transition-colors inline-flex items-center justify-center gap-1",
                    prefs.view === "cards"
                      ? "bg-background shadow-sm text-foreground font-medium"
                      : "text-muted-foreground active:bg-surface",
                  )}
                >
                  <LayoutGrid className="size-3.5" /> Cartes
                </button>
              </div>
            </div>
          </div>
        </MobileSheet>

        {!hasItems ? (
          <div className="px-3 pt-4 pb-6">
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
          <>
            <div className="px-3 pt-3">
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
                  placeholder="Rechercher un prospect…"
                  className="w-full h-10 rounded-full border border-border bg-background pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              <MobileNotificationStack
                leads={searched}
                selectedIds={selectedIds}
                onSelectRow={toggleSelectRow}
                onOpen={(lead) =>
                  navigate({ to: "/app/people/$id", params: { id: lead.id } })
                }
                bindContext={bindContext}
                tablesInOwnContainer={false}
              />
            ) : (
              <CardsView
                leads={searched}
                selectedIds={selectedIds}
                onSelectRow={toggleSelectRow}
                bindContext={bindContext}
                onReorder={reorderLeads}
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
                  icon: Send,
                  variant: "secondary",
                  onClick: () => setMobileActions({ ids: Array.from(selectedIds) }),
                },
              ]}
              hint={
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.08] px-3 text-[12px] font-semibold text-primary tabular-nums">
                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-muted-foreground shadow-[0_2px_0_var(--border)] transition-all active:translate-y-[2px] active:shadow-none"
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
          minScore={prefs.minScore}
          setMinScore={(v) => updatePrefs({ minScore: v })}
          sortBy={prefs.sortBy}
          setSortBy={(v) => updatePrefs({ sortBy: v })}
        />

        {mobileActions && (
          <MobileActionSheet
            open
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
                      toast.success(`${mobileActions.ids.length} ajouté(s) à une séquence`);
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

        {!prefs.hideKnownPeople && (
          <div className="px-3 pb-6 mt-3">
            <KnownPeopleExplorer />
          </div>
        )}

        {contextMenuNode}
        {searchDropdownNode}
      </>
    );
  }

  return (
    <TooltipProvider>
      <ScrollbarStyles />
      <div className="mx-auto w-full max-w-[1400px] space-y-4 md:space-y-6 pb-10">
        <div
          ref={floatingActionsRef}
          className="sticky top-3 z-30 flex justify-end items-center gap-2.5 pointer-events-none -mb-10"
        >
          <div className="pointer-events-auto flex items-center gap-2.5">
            <SettingsMenu prefs={prefs} onChange={updatePrefs} />
            <Link
              to="/app/people/new"
              className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold bg-foreground text-background rounded-xl shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--foreground)_45%,transparent)] hover:opacity-90 active:translate-y-[1px] transition-all"
            >
              <Plus className="size-4" strokeWidth={2.2} /> Ajouter
            </Link>
          </div>
        </div>

        <PageHeader
          eyebrow="Prospects"
          title="Vos prospects."
          description={
            hasItems
              ? `${searched.length} sur ${leads.length} · ${savedCount} sauvegardés`
              : "0 prospect · 0 sauvegardés"
          }
          actions={
            <>
              <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-surface/40">
                <button
                  onClick={doUndo}
                  disabled={undoStack.length === 0}
                  title="Annuler"
                  className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Undo2 className="size-3.5" />
                </button>
                <button
                  onClick={doRedo}
                  disabled={redoStack.length === 0}
                  title="Rétablir"
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
            </>
          }
        />

        {!hasItems ? (
          <EmptyState
            icon={Users}
            title="Aucun prospect"
            description="Créez votre premier prospect pour commencer à construire votre base de données."
            actionLabel="Créer un prospect"
            onAction={() => navigate({ to: "/app/people/new" })}
          />
        ) : (
          <>
            <section className="section-atelier p-3 md:p-4 space-y-3">
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
                  label="Étape"
                  icon={CheckSquare}
                  value={prefs.stage}
                  onChange={(v) => updatePrefs({ stage: v })}
                  options={stages.map((s) => ({
                    value: s,
                    label: s === "Tous" ? "Tous" : (stageLabels[s] ?? s),
                  }))}
                  allLabel="Toutes les étapes"
                  width={220}
                />

                <div className="inline-flex items-center gap-1.5 text-xs md:text-sm h-10 px-3 border border-border rounded-lg bg-background">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    Score
                    <ReliefGlyph kind="gte" size={12} tone="gold" />
                  </span>
                  <ScoreStepper
                    value={String(prefs.minScore)}
                    onChange={(v) => updatePrefs({ minScore: Number(v) || 0 })}
                    size="sm"
                  />
                </div>

                <button
                  onClick={() =>
                    updatePrefs({
                      sortBy:
                        prefs.sortBy === "score"
                          ? "name"
                          : prefs.sortBy === "name"
                            ? "manual"
                            : "score",
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs md:text-sm h-10 px-3 rounded-lg border border-border bg-background hover:bg-surface transition-colors"
                  title="Basculer Score → Nom → Manuel"
                >
                  <span className="text-muted-foreground">Trier</span>
                  <ReliefGlyph kind="arrow" size={10} tone="gold" />
                  <span className="font-medium">
                    {prefs.sortBy === "score"
                      ? "Score"
                      : prefs.sortBy === "name"
                        ? "Nom"
                        : "Manuel"}
                  </span>
                  <ArrowDown className="size-3 text-muted-foreground" />
                </button>

                <PageSizeSelect
                  value={prefs.pageSize}
                  onChange={(n) => updatePrefs({ pageSize: n })}
                />

                <div className="ml-auto inline-flex rounded-lg border border-border p-0.5 bg-surface/40 h-10">
                  <button
                    onClick={() => updatePrefs({ view: "table" })}
                    title="Vue tableau"
                    className={cn(
                      "rounded px-3 py-1 transition-colors",
                      prefs.view === "table"
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    <ListIcon className="size-4" />
                  </button>
                  <button
                    onClick={() => updatePrefs({ view: "cards" })}
                    title="Vue carte"
                    className={cn(
                      "rounded px-3 py-1 transition-colors",
                      prefs.view === "cards"
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    <LayoutGrid className="size-4" />
                  </button>
                </div>
              </div>

              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
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
                  placeholder="Rechercher un prospect par nom, entreprise, email…"
                  className="w-full h-12 pl-12 pr-12 rounded-xl border border-border bg-background text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 shadow-[0_2px_0_var(--border)] focus:shadow-none focus:translate-y-[2px] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
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
                className="relative z-40 min-h-0"
                style={{ height: tableDockStyleHeight }}
              >
                <AutoScrollOnDrag className="force-visible-scrollbar relative bg-background section-atelier p-0 shadow-sm rounded-2xl border border-border overflow-hidden h-full flex flex-col">
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
                      if (action === "saved") updateLead(id, { saved: active });
                    }}
                    emptyMessage="Aucun prospect ne correspond à ces filtres."
                    stickyHeader={true}
                    compact={prefs.density === "compact"}
                    comfortable={prefs.density === "comfortable"}
                    pageSize={prefs.pageSize}
                    showPagination={true}
                    forceVisibleScrollbar
                    disableHorizontalScroll={false}
                    onColumnsChange={(newCols) => {
                      console.log(
                        "Nouvel ordre des colonnes :",
                        newCols.map((c) => c.key),
                      );
                    }}
                    extraHeader={
                      <Popover open={columnsMenuOpen} onOpenChange={setColumnsMenuOpen}>
                        <PopoverTrigger asChild>
                          <button className="grid size-6 place-items-center rounded hover:bg-surface text-muted-foreground border border-dashed border-border">
                            <Plus className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                            Colonnes
                          </p>
                          <div className="space-y-1">
                            {[
                              { key: "showPoste", label: "Poste" },
                              { key: "showLangue", label: "Langue" },
                              { key: "showPays", label: "Pays" },
                              { key: "showSite", label: "Site Web" },
                              { key: "showCompanySize", label: "Taille entreprise" },
                              { key: "showIndustry", label: "Secteur" },
                              { key: "showTrader", label: "Trader" },
                            ].map((col) => (
                              <label
                                key={col.key}
                                className="flex items-center gap-2 px-1 py-1.5 hover:bg-surface rounded cursor-pointer text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={(prefs as any)[col.key]}
                                  onChange={(e) =>
                                    updatePrefs({ [col.key]: e.target.checked } as any)
                                  }
                                  className="rounded border-border text-primary focus:ring-primary"
                                />
                                {col.label}
                              </label>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    }
                  />
                </AutoScrollOnDrag>
              </div>
            )}

            {prefs.view === "cards" && (
              <CardsView
                leads={searched}
                selectedIds={selectedIds}
                onSelectRow={toggleSelectRow}
                bindContext={bindContext}
                onReorder={reorderLeads}
                cardsPerRow={CARDS_PER_ROW}
              />
            )}
          </>
        )}

        {!prefs.hideKnownPeople && <KnownPeopleExplorer />}
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-50 h-0 w-full pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <div className="pointer-events-auto inline-flex max-w-full items-center gap-2 overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-background/95 px-3 py-2 shadow-[0_12px_40px_-12px_color-mix(in_oklab,var(--foreground)_35%,transparent)] backdrop-blur scrollbar-hide animate-in slide-in-from-bottom-4 fade-in">
              <span className="shrink-0 whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
              </span>
              <span className="w-px h-5 bg-border shrink-0" />
              <button
                onClick={() => toast.success(`${selectedIds.size} ajouté(s) à une séquence`)}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
              >
                <Send className="size-3.5" /> Séquence
              </button>
              <button
                onClick={bulkEnrich}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
              >
                <Sparkles className="size-3.5" /> Enrichir
              </button>
              <button
                onClick={bulkSave}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
              >
                <Bookmark className="size-3.5" /> Sauvegarder
              </button>
              <button
                onClick={bulkExport}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-foreground hover:bg-surface transition-colors"
              >
                <Download className="size-3.5" /> Exporter
              </button>
              <span className="w-px h-5 bg-border shrink-0" />
              <button
                onClick={() => askDelete(Array.from(selectedIds))}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-destructive hover:bg-destructive/10 transition-colors"
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
        title={`Supprimer ${deleteConfirm?.ids.length ?? 0} prospect${(deleteConfirm?.ids.length ?? 0) > 1 ? "s" : ""} ?`}
        description="Cette action est réversible via Ctrl+Z, mais les fiches seront retirées de votre base. Êtes-vous sûr de vouloir continuer ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
      />
    </TooltipProvider>
  );
}
