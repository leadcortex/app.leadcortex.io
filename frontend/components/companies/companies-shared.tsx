// frontend/components/companies/companies-shared.tsx

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Briefcase,
  Building2,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Globe,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Maximize2,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  Users,
  type LucideIcon,
} from "@/components/icons";
import type { ContextMenuSection } from "@/components/common/context-menu";
import { cn } from "@/lib/core/utils";
import {
  PAGE_SIZE_OPTIONS,
  type CompanyDensity,
  type CompanyPreferences,
  type CompanyView,
} from "@/lib/companies/preferences";

export type CompanyContextActions = {
  onOpen: () => void;
  onEmail: () => void;
  onVisitSite: () => void;
  onSave: () => void;
  onCopyDomain: () => void;
  onExport: () => void;
  onEnrich: () => void;
  onDelete: () => void;
  onAddContact: () => void;
  isSaved: boolean;
  hasDomain: boolean;
  selectionCount: number;
};

export function buildCompanyContextMenu(actions: CompanyContextActions): ContextMenuSection[] {
  const multi = actions.selectionCount > 1;
  return [
    {
      id: "quick",
      label: multi ? `${actions.selectionCount} éléments` : undefined,
      items: [
        {
          id: "open",
          label: "Ouvrir la fiche",
          icon: Building2,
          onSelect: actions.onOpen,
          disabled: multi,
        },
        {
          id: "email",
          label: "Envoyer un email",
          icon: Mail,
          onSelect: actions.onEmail,
          disabled: multi,
        },
        {
          id: "visit",
          label: "Visiter le site",
          icon: Globe,
          onSelect: actions.onVisitSite,
          disabled: multi || !actions.hasDomain,
        },
      ],
    },
    {
      id: "qualif",
      label: "Qualification",
      items: [
        {
          id: "add-contact",
          label: "Ajouter un contact",
          icon: Users,
          onSelect: actions.onAddContact,
          disabled: multi,
        },
        {
          id: "enrich",
          label: "Enrichir",
          icon: Sparkles,
          onSelect: actions.onEnrich,
        },
        {
          id: "save",
          label: actions.isSaved ? "Retirer des favoris" : "Ajouter aux favoris",
          icon: Bookmark,
          onSelect: actions.onSave,
        },
      ],
    },
    {
      id: "utils",
      label: "Copier / exporter",
      items: [
        {
          id: "copy-domain",
          label: "Copier le domaine",
          icon: Copy,
          onSelect: actions.onCopyDomain,
          disabled: !actions.hasDomain,
        },
        {
          id: "export",
          label: "Exporter CSV",
          icon: Download,
          onSelect: actions.onExport,
        },
      ],
    },
    {
      id: "danger",
      items: [
        {
          id: "delete",
          label: "Supprimer",
          icon: Trash2,
          tone: "danger",
          onSelect: actions.onDelete,
        },
      ],
    },
  ];
}

export type SettingsMenuProps = {
  prefs: CompanyPreferences;
  onChange: (patch: Partial<CompanyPreferences>) => void;
};

export function SettingsMenu({ prefs, onChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const WIDTH = 280;

  const computeStyle = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const openUp = spaceBelow < 400 && spaceAbove > spaceBelow;

    setStyle({
      position: "fixed",
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? vh - r.top + 6 : undefined,
      left: Math.max(8, Math.min(r.left, vw - WIDTH - 8)),
      width: WIDTH,
      maxHeight: Math.min(520, openUp ? spaceAbove - 4 : spaceBelow - 4),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    computeStyle();
    const onResize = () => computeStyle();
    const onScroll = () => computeStyle();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, computeStyle]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Paramètres d'affichage"
        title="Paramètres d'affichage"
        className={cn(
          "pointer-events-auto grid size-9 md:size-10 shrink-0 place-items-center rounded-full",
          "border border-border bg-background text-foreground",
          "shadow-float",
          "hover:bg-surface active:translate-y-[1px] transition-all",
          open && "border-primary/50 bg-primary/5 text-primary",
        )}
      >
        <Settings className="size-4 md:size-[15px]" />
      </button>

      {open &&
        style &&
        createPortal(
          <div
            ref={panelRef}
            style={style}
            className="overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95 p-1"
          >
            <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              Vue
            </p>
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-border bg-surface/40 mx-1.5 mb-2">
              <SegBtn
                active={prefs.view === "table"}
                onClick={() => onChange({ view: "table" })}
                icon={ListIcon}
                label="Tableau"
              />
              <SegBtn
                active={prefs.view === "cards"}
                onClick={() => onChange({ view: "cards" })}
                icon={LayoutGrid}
                label="Cartes"
              />
            </div>

            <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              Densité
            </p>
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg border border-border bg-surface/40 mx-1.5 mb-2">
              <SegBtn
                active={prefs.density === "comfortable"}
                onClick={() => onChange({ density: "comfortable" })}
                icon={Maximize2}
                label="Confort"
              />
              <SegBtn
                active={prefs.density === "compact"}
                onClick={() => onChange({ density: "compact" })}
                icon={ListIcon}
                label="Compact"
              />
            </div>

            <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              Lignes par page
            </p>
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg border border-border bg-surface/40 mx-1.5 mb-2">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ pageSize: n })}
                  className={cn(
                    "px-2 py-1 text-[11px] rounded-md transition-colors",
                    prefs.pageSize === n
                      ? "bg-background shadow-sm text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              Colonnes visibles
            </p>
            <div className="space-y-0.5 px-1.5 mb-2">
              <ToggleRow
                label="Intention"
                icon={Sparkles}
                active={prefs.showIntent}
                onToggle={() => onChange({ showIntent: !prefs.showIntent })}
              />
              <ToggleRow
                label="Effectif"
                icon={Users}
                active={prefs.showEmployees}
                onToggle={() => onChange({ showEmployees: !prefs.showEmployees })}
              />
              <ToggleRow
                label="Chiffre d'affaires"
                icon={Briefcase}
                active={prefs.showRevenue}
                onToggle={() => onChange({ showRevenue: !prefs.showRevenue })}
              />
              <ToggleRow
                label="Contacts liés"
                icon={Users}
                active={prefs.showContacts}
                onToggle={() => onChange({ showContacts: !prefs.showContacts })}
              />
            </div>

            <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">
              Affichage avancé
            </p>
            <div className="space-y-0.5 px-1.5">
              <ToggleRow
                label={
                  prefs.hideKnownCompanies
                    ? "Afficher les suggestions d'entreprises"
                    : "Masquer les suggestions d'entreprises"
                }
                icon={prefs.hideKnownCompanies ? Eye : EyeOff}
                active={prefs.hideKnownCompanies}
                onToggle={() => onChange({ hideKnownCompanies: !prefs.hideKnownCompanies })}
              />
              <ToggleRow
                label="Encadrer chaque tableau"
                icon={Maximize2}
                active={prefs.tablesInOwnContainer}
                onToggle={() =>
                  onChange({ tablesInOwnContainer: !prefs.tablesInOwnContainer })
                }
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function SegBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-[11px] rounded-md transition-colors inline-flex items-center justify-center gap-1",
        active
          ? "bg-background shadow-sm text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface"
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
          active ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {active && <Check className="size-2.5" strokeWidth={3} />}
      </span>
    </button>
  );
}

export { Plus, Trash2, Users, Building2 };
export type { CompanyView, CompanyDensity };
