// frontend/components/settings/panels/GeneralPanel.tsx

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Globe2,
  LayoutPanelLeft,
  Search,
  Sparkles,
} from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/core/utils";
import { useTheme, type ThemeMode } from "@/lib/core/theme";
import {
  PanelIntro,
  PanelGroup,
  SettingsCard,
  Field,
  inputCls,
  SELECT_Z,
} from "./primitives";

type TimezoneOption = { value: string; label: string; region: string };

const TIMEZONES: TimezoneOption[] = [
  { value: "Indian/Mauritius", label: "Maurice (UTC+4)", region: "Afrique / Océan Indien" },
  { value: "Africa/Casablanca", label: "Casablanca (UTC+1)", region: "Afrique" },
  { value: "Africa/Algiers", label: "Alger (UTC+1)", region: "Afrique" },
  { value: "Africa/Tunis", label: "Tunis (UTC+1)", region: "Afrique" },
  { value: "Africa/Dakar", label: "Dakar (UTC+0)", region: "Afrique" },
  { value: "Africa/Abidjan", label: "Abidjan (UTC+0)", region: "Afrique" },
  { value: "Africa/Lagos", label: "Lagos (UTC+1)", region: "Afrique" },
  { value: "Africa/Nairobi", label: "Nairobi (UTC+3)", region: "Afrique" },
  { value: "Europe/Paris", label: "Paris (UTC+1/+2)", region: "Europe" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)", region: "Europe" },
  { value: "Europe/Brussels", label: "Bruxelles (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Rome", label: "Rome (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbonne (UTC+0/+1)", region: "Europe" },
  { value: "Europe/Zurich", label: "Zurich (UTC+1/+2)", region: "Europe" },
  { value: "Europe/Athens", label: "Athènes (UTC+2/+3)", region: "Europe" },
  { value: "America/New_York", label: "New York (UTC-5/-4)", region: "Amérique du Nord" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)", region: "Amérique du Nord" },
  { value: "America/Denver", label: "Denver (UTC-7/-6)", region: "Amérique du Nord" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8/-7)", region: "Amérique du Nord" },
  { value: "America/Toronto", label: "Toronto (UTC-5/-4)", region: "Amérique du Nord" },
  { value: "America/Mexico_City", label: "Mexico (UTC-6)", region: "Amérique du Nord" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)", region: "Amérique du Sud" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)", region: "Amérique du Sud" },
  { value: "Asia/Dubai", label: "Dubaï (UTC+4)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Tel_Aviv", label: "Tel Aviv (UTC+2/+3)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Riyadh", label: "Riyad (UTC+3)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Istanbul", label: "Istanbul (UTC+3)", region: "Asie / Moyen-Orient" },
  { value: "Asia/Kolkata", label: "New Delhi (UTC+5:30)", region: "Asie" },
  { value: "Asia/Singapore", label: "Singapour (UTC+8)", region: "Asie" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (UTC+8)", region: "Asie" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+8)", region: "Asie" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)", region: "Asie" },
  { value: "Asia/Seoul", label: "Séoul (UTC+9)", region: "Asie" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10/+11)", region: "Océanie" },
  { value: "Australia/Melbourne", label: "Melbourne (UTC+10/+11)", region: "Océanie" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)", region: "Océanie" },
  { value: "UTC", label: "UTC", region: "Autres" },
];

const GAP = 4; // écart entre le bouton et le menu
const EDGE = 8; // marge minimale avec le bord visible
const SEARCH_H = 49; // hauteur du champ de recherche du menu
const LIST_MAX = 240;
const LIST_MIN = 120;

function getScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (/(auto|scroll|hidden)/.test(overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = TIMEZONES.find((tz) => tz.value === value) ?? TIMEZONES[0]!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Placement intelligent : ouvre vers le haut s'il y a plus de place au-dessus,
  // et limite la hauteur de la liste à l'espace réellement visible (clavier mobile
  // et zone de défilement du panneau compris). Recalculé au scroll / redimensionnement.
  const [placement, setPlacement] = useState<{ side: "top" | "bottom"; listMax: number }>({
    side: "bottom",
    listMax: LIST_MAX,
  });

  useLayoutEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const scrollParent = getScrollParent(wrap);

    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vv = window.visualViewport;
      let top = vv ? vv.offsetTop : 0;
      let bottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      if (scrollParent) {
        const p = scrollParent.getBoundingClientRect();
        top = Math.max(top, p.top);
        bottom = Math.min(bottom, p.bottom);
      }
      const below = bottom - rect.bottom - GAP - EDGE;
      const above = rect.top - top - GAP - EDGE;
      const side = below >= SEARCH_H + LIST_MAX || below >= above ? "bottom" : "top";
      const space = side === "bottom" ? below : above;
      const listMax = Math.max(LIST_MIN, Math.min(LIST_MAX, Math.floor(space - SEARCH_H)));
      setPlacement((prev) =>
        prev.side === side && prev.listMax === listMax ? prev : { side, listMax },
      );
    };

    update();
    const vv = window.visualViewport;
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TIMEZONES;
    return TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.value.toLowerCase().includes(q) ||
        tz.region.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimezoneOption[]>();
    for (const tz of filtered) {
      const arr = map.get(tz.region) ?? [];
      arr.push(tz);
      map.set(tz.region, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm transition-colors md:h-9",
          "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          "hover:bg-foreground/[0.03]",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Globe2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate text-left">{current.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-[70] flex overflow-hidden rounded-lg border border-border bg-popover shadow-lg animate-in fade-in zoom-in-95",
            // Vers le haut : la recherche reste collée au bouton (en bas du menu)
            // pour qu'elle ne bouge pas quand la liste se raccourcit en tapant.
            placement.side === "bottom"
              ? "top-[calc(100%+4px)] flex-col origin-top"
              : "bottom-[calc(100%+4px)] flex-col-reverse origin-bottom",
          )}
        >
          <div
            className={cn(
              "relative shrink-0 border-border/60 p-2",
              placement.side === "bottom" ? "border-b" : "border-t",
            )}
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un fuseau (Paris, Tokyo…)"
              className="h-8 w-full rounded-md border border-transparent bg-surface/60 pl-8 pr-2 text-xs outline-none transition focus:border-border focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div
            className="overflow-y-auto overscroll-contain p-1"
            style={{ maxHeight: placement.listMax }}
          >
            {grouped.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                Aucun fuseau ne correspond.
              </p>
            )}
            {grouped.map(([region, items]) => (
              <div key={region} className="mb-1 last:mb-0">
                <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground/70">
                  {region}
                </p>
                {items.map((tz) => {
                  const selected = tz.value === value;
                  return (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => {
                        onChange(tz.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        selected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-surface",
                      )}
                    >
                      <span className="truncate">{tz.label}</span>
                      {selected && <Check className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemePreview({ variant }: { variant: ThemeMode }) {
  const isSystem = variant === "system";
  const isDark = variant === "dark";
  const outerBg = isSystem
    ? "linear-gradient(135deg, #f7f6f3 0%, #f7f6f3 50%, #1a1a1c 50%, #1a1a1c 100%)"
    : isDark
      ? "#1a1a1c"
      : "#f7f6f3";
  const innerBg = isSystem
    ? "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #26262a 50%, #26262a 100%)"
    : isDark
      ? "#26262a"
      : "#ffffff";
  const outerBorder = isDark || isSystem ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const innerBorder = isDark || isSystem ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const bar1 = isSystem
    ? "linear-gradient(135deg, #d4d4d4 0%, #d4d4d4 50%, #4a4a4d 50%, #4a4a4d 100%)"
    : isDark
      ? "#4a4a4d"
      : "#d4d4d4";
  const bar2 = isSystem
    ? "linear-gradient(135deg, #e5e5e5 0%, #e5e5e5 50%, #3a3a3d 50%, #3a3a3d 100%)"
    : isDark
      ? "#3a3a3d"
      : "#e5e5e5";

  return (
    <div
      className="relative h-[72px] w-full overflow-hidden rounded-xl"
      style={{ background: outerBg, boxShadow: `inset 0 0 0 1px ${outerBorder}` }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-2 rounded-lg"
        style={{ background: innerBg, boxShadow: `inset 0 0 0 1px ${innerBorder}` }}
      >
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="block h-[6px] w-10 rounded-full" style={{ background: bar1 }} />
          <span className="block h-[6px] w-7 rounded-full" style={{ background: bar2 }} />
        </div>
        <span
          className="absolute bottom-3 right-3 block size-2.5 rounded-full"
          style={{ background: "#BA6651" }}
        />
      </div>
    </div>
  );
}

export function GeneralPanel() {
  const { mode, setMode } = useTheme();
  const [language, setLanguage] = useState("fr");
  const [organization, setOrganization] = useState("Acme B2B");
  const [role, setRole] = useState("Founder");
  const [teamSize, setTeamSize] = useState("1-5");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currency, setCurrency] = useState("EUR");

  return (
    <div className="space-y-8 md:space-y-12">
      <PanelIntro
        title="Général"
        description="Ces réglages valent pour tout votre espace de travail."
      />

      <PanelGroup label="Apparence et langue">
        <SettingsCard
          title="Thème"
        >
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {(
              [
                { value: "light", label: "Clair" },
                { value: "dark", label: "Sombre" },
                { value: "system", label: "Système" },
              ] as const
            ).map((opt) => {
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value as ThemeMode)}
                  aria-pressed={active}
                  aria-label={`Thème ${opt.label}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div
                    className={cn(
                      "w-full rounded-2xl p-1 transition-colors",
                      active
                        ? "ring-2 ring-primary/70"
                        : "ring-1 ring-transparent",
                    )}
                  >
                    <ThemePreview variant={opt.value as ThemeMode} />
                  </div>
                  <span
                    className={cn(
                      "text-xs transition-colors md:text-sm",
                      active
                        ? "font-medium text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Langue"
          description="L'anglais arrive bientôt."
        >
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-11 w-full border-input bg-background md:h-9 md:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
              <SelectItem value="fr">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-base leading-none">
                    🇫🇷
                  </span>
                  Français
                </span>
              </SelectItem>
              <SelectItem value="en" disabled>
                <span className="flex w-full items-center gap-2">
                  <span aria-hidden className="text-base leading-none">
                    🇬🇧
                  </span>
                  <span className="flex-1">English</span>
                  <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Bientôt
                  </span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Organisation et région">
        <SettingsCard
          title="Organisation"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l'organisation">
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className={inputCls}
                placeholder="Acme B2B"
                autoComplete="organization"
              />
            </Field>
            <Field label="Votre rôle">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 w-full border-input bg-background md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {[
                    "Founder",
                    "CEO",
                    "CTO",
                    "Sales Manager",
                    "Growth",
                    "Marketing",
                    "Customer Success",
                    "Autre",
                  ].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Taille de l'équipe">
              <Select value={teamSize} onValueChange={setTeamSize}>
                <SelectTrigger className="h-11 w-full border-input bg-background md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {[
                    { value: "solo", label: "Solo" },
                    { value: "1-5", label: "1 à 5 personnes" },
                    { value: "6-20", label: "6 à 20 personnes" },
                    { value: "21-50", label: "21 à 50 personnes" },
                    { value: "50+", label: "Plus de 50 personnes" },
                  ].map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Région"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Fuseau horaire" hint="Utilisé pour les envois programmés">
                <TimezoneSelect value={timezone} onChange={setTimezone} />
              </Field>
            </div>
            <Field label="Format de date">
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="h-11 w-full border-input bg-background md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Devise">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-11 w-full border-input bg-background md:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
                  {[
                    { value: "EUR", label: "Euro (€)" },
                    { value: "USD", label: "Dollar US ($)" },
                    { value: "GBP", label: "Livre sterling (£)" },
                    { value: "CHF", label: "Franc suisse (CHF)" },
                    { value: "MUR", label: "Roupie mauricienne (Rs)" },
                  ].map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
