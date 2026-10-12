//frontend\components\settings\settings-modal.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Settings as SettingsIcon,
  CircleUserRound,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Brain,
  Lightbulb,
  Clock,
  Wrench,
  Plug,
  Boxes,
  Bell,
  Monitor,
  Search,
  X,
  Link2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SETTINGS_GROUPS,
  SETTINGS_SECTIONS,
  useSettings,
  type SettingsSection,
  type SettingsSectionMeta,
} from "./settings-context";
import { SettingsPanel } from "./settings-panels";
import { MobileSettingsSheet } from "./mobile-settings-sheet";

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

export function SettingsModal() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSettingsSheet /> : <DesktopSettingsModal />;
}

function DesktopSettingsModal() {
  const { open, section, setSection, closeSettings } = useSettings();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const nested = document.querySelector('[role="dialog"][data-state="open"]');
      if (nested) return;
      closeSettings();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeSettings]);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: SettingsSectionMeta) =>
      !q ||
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      (s.keywords ?? "").toLowerCase().includes(q);

    return SETTINGS_GROUPS.map((g) => ({
      ...g,
      items: SETTINGS_SECTIONS.filter((s) => s.group === g.key && match(s)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  if (!open) return null;

  const active = SETTINGS_SECTIONS.find((s) => s.key === section) ?? SETTINGS_SECTIONS[0]!;
  const activeGroup = SETTINGS_GROUPS.find((g) => g.key === active.group);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paramètres"
      className="fixed inset-0 z-[60] flex items-center justify-center p-2 md:p-6"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
        onClick={closeSettings}
      />

      <div className="relative z-10 flex h-[min(92vh,860px)] w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border bg-background shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-150">
        <aside className="flex w-14 shrink-0 flex-col border-r border-border/70 bg-surface/30 md:w-[270px]">
          <div className="hidden p-3 md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un réglage"
                className="h-9 w-full rounded-lg border border-transparent bg-background pl-8 pr-8 text-sm outline-none transition focus:border-border focus:ring-2 focus:ring-ring/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-1.5 py-2 md:px-2 md:py-1">
            {grouped.length === 0 && (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                Aucun réglage ne correspond à votre recherche.
              </p>
            )}
            {grouped.map((g) => (
              <NavGroup key={g.key} label={g.label}>
                {g.items.map((m) => (
                  <NavItem
                    key={m.key}
                    meta={m}
                    active={section === m.key}
                    onClick={() => setSection(m.key)}
                  />
                ))}
              </NavGroup>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {activeGroup?.label ?? "Paramètres"}
              </p>
              <h2 className="mt-0.5 truncate text-sm font-semibold md:text-base">{active.label}</h2>
            </div>
            <button
              type="button"
              onClick={closeSettings}
              aria-label="Fermer les paramètres"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </header>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 md:px-8 md:py-7">
            <SettingsPanel section={section} />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2 md:mb-3">
      <p className="hidden px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 md:block">
        {label}
      </p>
      <div className="mx-2 my-1 h-px bg-border/60 md:hidden" />
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function NavItem({
  meta,
  active,
  onClick,
}: {
  meta: SettingsSectionMeta;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[meta.key];
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={meta.label}
        className={cn(
          "flex w-full items-center justify-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors md:justify-start md:py-1.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-background font-medium text-foreground shadow-sm"
            : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="hidden min-w-0 flex-1 truncate md:inline">{meta.label}</span>
        {meta.badge && (
          <span
            className={cn(
              "hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide md:inline-flex",
              meta.badge === "new" && "bg-primary/10 text-primary",
              meta.badge === "beta" && "bg-warning/15 text-warning",
              meta.badge === "soon" && "bg-secondary text-muted-foreground",
            )}
          >
            {meta.badge === "new" ? "Nouveau" : meta.badge === "beta" ? "Bêta" : "Bientôt"}
          </span>
        )}
      </button>
    </li>
  );
}
