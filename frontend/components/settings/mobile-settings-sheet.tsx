//frontend\components\settings\mobile-settings-sheet.tsx
// • Flèche retour : setView("menu"), sans jamais re-déclencher la vue section.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  Brain,
  ChevronRight,
  CircleUserRound,
  Clock,
  CreditCard,
  Info,
  Lightbulb,
  Link2,
  Monitor,
  Plug,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Wand2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import {
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  useSettings,
  type SettingsGroupKey,
  type SettingsSection,
  type SettingsSectionMeta,
} from "./settings-context";
import { SettingsPanel } from "./settings-panels";

const ICONS: Record<SettingsSection, LucideIcon> = {
  account: CircleUserRound,
  billing: CreditCard,
  general: SettingsIcon,
  display: Monitor,
  notifications: Bell,
  security: ShieldCheck,
  integrations: Link2,
  capabilities: Sparkles,
  memory: Brain,
  thinking: Lightbulb,
  time: Clock,
  skills: Wrench,
  connectors: Plug,
  plugins: Boxes,
};

type View = "menu" | SettingsSection;

type GroupedSection = {
  key: SettingsGroupKey;
  label: string;
  description: string;
  items: SettingsSectionMeta[];
};

export function MobileSettingsSheet() {
  const { open, section, setSection, closeSettings } = useSettings();

  const [view, setView] = useState<View>("menu");
  const [query, setQuery] = useState("");

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      if (section !== "general" && section !== "account") {
        setView(section);
      } else {
        setView("menu");
      }
      setQuery("");
    }

    if (!open && wasOpenRef.current) {
      setView("menu");
      setQuery("");
    }

    wasOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, section]);

  const openSection = (key: SettingsSection) => {
    setSection(key);
    setView(key);
  };

  const handleClose = () => {
    closeSettings();
  };

  const handleBack = () => {
    setView("menu");
  };

  const grouped = useMemo<GroupedSection[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (s: SettingsSectionMeta) =>
      !q ||
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.keywords ?? "").toLowerCase().includes(q);

    return SETTINGS_GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      description: g.description,
      items: SETTINGS_SECTIONS.filter((s) => s.group === g.key && match(s)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const activeSection =
    view !== "menu" ? (SETTINGS_SECTIONS.find((s) => s.key === view) ?? null) : null;

  return (
    <MobileSheet
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
      title={view === "menu" ? "Paramètres" : (activeSection?.label ?? "Paramètres")}
      onBack={view !== "menu" ? handleBack : undefined}
      headerAction={
        view === "menu" ? (
          <button
            type="button"
            aria-label="À propos"
            onClick={() => toast.info("LeadCortex · version de développement")}
            className="grid size-10 place-items-center rounded-full bg-surface/70 text-foreground transition-colors active:bg-surface"
          >
            <Info className="size-4" strokeWidth={2} />
          </button>
        ) : undefined
      }
    >
      {view === "menu" ? (
        <MenuView query={query} setQuery={setQuery} grouped={grouped} onSelect={openSection} />
      ) : (
        <SectionView section={view} />
      )}
    </MobileSheet>
  );
}

function MenuView({
  query,
  setQuery,
  grouped,
  onSelect,
}: {
  query: string;
  setQuery: (v: string) => void;
  grouped: GroupedSection[];
  onSelect: (s: SettingsSection) => void;
}) {
  return (
    <div className="px-3 py-4">
      {}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un réglage"
          className="h-10 w-full rounded-xl border border-border bg-surface/40 pl-10 pr-9 text-sm outline-none transition focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {}
      {grouped.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucun réglage ne correspond.
        </p>
      )}

      <div className="space-y-5">
        {grouped.map((g) => (
          <section key={g.key}>
            <h3 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {g.label}
            </h3>
            <ul className="overflow-hidden rounded-2xl border border-border/70 bg-surface/30">
              {g.items.map((item, i) => {
                const Icon = ICONS[item.key];
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.key)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface/70",
                        i < g.items.length - 1 && "border-b border-border/50",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary">
                        <Icon className="size-4" strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground/70"
                        strokeWidth={1.8}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function SectionView({ section }: { section: SettingsSection }) {
  return (
    <div className="px-3 py-4 md:px-5">
      <SettingsPanel section={section} />
    </div>
  );
}
