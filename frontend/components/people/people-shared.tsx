// frontend/components/people/people-shared.tsx

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Copy,
  Download,
  Eye,
  EyeOff,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Maximize2,
  Minus,
  Phone,
  Plus,
  Radio,
  Send,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  type LucideIcon,
} from "@/components/icons";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { CompanyLogo } from "@/components/company-logo";
import type { ContextMenuSection } from "@/components/common/context-menu";
import { cn } from "@/lib/core/utils";
import {
  PAGE_SIZE_OPTIONS,
  type PeopleDensity,
  type PeoplePreferences,
  type PeopleView,
} from "@/lib/people/preferences";

export function ProspectAvatarBadge({
  name,
  avatarUrl,
  company,
  companyLogoUrl,
  size = 36,
}: {
  name: string;
  avatarUrl?: string;
  company: string;
  companyLogoUrl?: string;
  size?: number;
}) {
  const logoSize = Math.max(14, Math.round(size * 0.5));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          draggable={false}
          className="size-full rounded-full object-cover ring-1 ring-border/50"
        />
      ) : (
        <LetterAvatar name={name} size={size} shape="circle" />
      )}
      <span
        aria-hidden
        className="absolute -bottom-0.5 -right-0.5 grid place-items-center overflow-hidden rounded-full border-2 border-background bg-background shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_20%,transparent)]"
        style={{ width: logoSize, height: logoSize }}
      >
        {companyLogoUrl ? (
          <img
            src={companyLogoUrl}
            alt={company}
            draggable={false}
            className="block size-full object-cover"
          />
        ) : (
          <CompanyLogo name={company} size={logoSize - 4} className="rounded-full" />
        )}
      </span>
    </div>
  );
}

export type LeadContextActions = {
  onOpen: () => void;
  onEmail: () => void;
  onCall: () => void;
  onSave: () => void;
  onCopyEmail: () => void;
  onExport: () => void;
  onEnrich: () => void;
  onDelete: () => void;
  onSequence: () => void;
  isSaved: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  selectionCount: number;
};

export function buildLeadContextMenu(
  actions: LeadContextActions,
): ContextMenuSection[] {
  const multi = actions.selectionCount > 1;
  return [
    {
      id: "quick",
      label: multi ? `${actions.selectionCount} éléments` : undefined,
      items: [
        {
          id: "open",
          label: "Ouvrir la fiche",
          icon: UserRound,
          onSelect: actions.onOpen,
          disabled: multi,
        },
        {
          id: "email",
          label: "Envoyer un email",
          icon: Send,
          onSelect: actions.onEmail,
          disabled: multi || !actions.hasEmail,
        },
        {
          id: "call",
          label: "Appeler",
          icon: Phone,
          onSelect: actions.onCall,
          disabled: multi || !actions.hasPhone,
        },
      ],
    },
    {
      id: "qualif",
      label: "Qualification",
      items: [
        {
          id: "sequence",
          label: "Ajouter à une séquence",
          icon: Send,
          onSelect: actions.onSequence,
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
          id: "copy-email",
          label: "Copier l'email",
          icon: Copy,
          onSelect: actions.onCopyEmail,
          disabled: !actions.hasEmail,
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
  prefs: PeoplePreferences;
  onChange: (patch: Partial<PeoplePreferences>) => void;
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
          "shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--foreground)_25%,transparent)]",
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
            <p className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
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

            <p className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
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

            <p className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
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

            <p className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Colonnes visibles
            </p>
            <div className="space-y-0.5 px-1.5 mb-2">
              <ToggleRow
                label="Signaux"
                icon={Radio}
                active={prefs.showSignals}
                onToggle={() => onChange({ showSignals: !prefs.showSignals })}
              />
              <ToggleRow
                label="Scores"
                icon={Sparkles}
                active={prefs.showScores}
                onToggle={() => onChange({ showScores: !prefs.showScores })}
              />
              <ToggleRow
                label="Étapes"
                icon={Bookmark}
                active={prefs.showStages}
                onToggle={() => onChange({ showStages: !prefs.showStages })}
              />
            </div>

            <p className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Affichage avancé
            </p>
            <div className="space-y-0.5 px-1.5">
              <ToggleRow
                label={
                  prefs.hideKnownPeople
                    ? "Afficher les décideurs connus"
                    : "Masquer les décideurs connus"
                }
                icon={prefs.hideKnownPeople ? Eye : EyeOff}
                active={prefs.hideKnownPeople}
                onToggle={() => onChange({ hideKnownPeople: !prefs.hideKnownPeople })}
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
        {active && (
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor">
            <path d="M2 6l3 3 5-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export { Bookmark, Mail, Phone, Trash2, Minus, Plus, Users, UserRound };
export type { PeopleView, PeopleDensity };
