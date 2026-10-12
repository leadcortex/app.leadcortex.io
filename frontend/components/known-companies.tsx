//frontend\components\known-companies.tsx
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Users,
  Building2,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Loader2,
  Globe,
  CalendarDays,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui-primitives";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ResizableSplit } from "@/components/resizable-split";
import { CompanyAvatar } from "@/components/ui/letter-avatar";
import { searchCompanies, type CompanyResult, guessDomainFromName } from "@/lib/company-database";

const INITIAL_VISIBLE = 10;
const SEARCH_DEBOUNCE_MS = 320;

const SUGGESTED_QUERIES = [
  "Google France",
  "Apple",
  "Microsoft",
  "Amazon",
  "Stripe",
  "Notion",
  "Figma",
  "Salesforce",
  "OpenAI",
  "Nvidia",
];

function CompanyRow({
  company,
  active,
  onClick,
}: {
  company: CompanyResult;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors",
        active ? "bg-primary/5" : "hover:bg-surface/60",
      )}
    >
      <CompanyAvatar name={company.name} domain={company.domain} size={32} shape="rounded" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">{company.name}</span>
          {!company.active && (
            <Badge tone="muted" className="shrink-0 text-[9px]">
              Radiée
            </Badge>
          )}
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
            {company.category}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{company.industry}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <MapPin className="size-2.5 shrink-0" />
          <span className="truncate">{company.location}</span>
        </div>
      </div>
      <ChevronRight
        className={cn("size-3.5 shrink-0 text-muted-foreground/60", active && "text-primary")}
      />
    </button>
  );
}

function CompanyPreview({
  company,
  onAdd,
}: {
  company: CompanyResult | null;
  onAdd: (c: CompanyResult) => void;
}) {
  if (!company) {
    return (
      <div className="relative isolate h-full w-full overflow-hidden">
        <img
          src="/images/recherche-companies.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.12] md:opacity-20"
        />
        <div className="relative z-10 grid h-full place-items-center bg-background/50 p-6 backdrop-blur-[1px]">
          <div className="max-w-xs text-center">
            <Sparkles className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              Recherchez une entreprise ou choisissez-en une dans la liste.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const domain = company.domain || guessDomainFromName(company.name);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border p-4 md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          <CompanyAvatar name={company.name} domain={domain} size={56} shape="rounded" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg italic md:text-2xl">{company.name}</h2>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground md:text-xs">
              SIREN {company.id}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {company.category !== "—" && <Badge tone="primary">{company.category}</Badge>}
              <Badge tone="muted">{company.industry}</Badge>
              {company.active ? (
                <Badge tone="success">Active</Badge>
              ) : (
                <Badge tone="destructive">Radiée</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 md:p-5">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <Stat icon={MapPin} label="Localisation" value={company.location} />
          <Stat
            icon={Users}
            label="Effectif"
            value={
              company.employees > 0
                ? `${company.size} (${company.employees.toLocaleString("fr-FR")}+)`
                : company.size
            }
          />
          <Stat icon={Briefcase} label="Secteur NAF" value={company.industryCode || "—"} />
          <Stat
            icon={CalendarDays}
            label="Créée"
            value={company.createdAt ? new Date(company.createdAt).getFullYear().toString() : "—"}
          />
        </div>

        <div className="rounded-xl border border-border/70 bg-surface/30 p-3 md:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Domaine probable
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Globe className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate font-mono text-xs md:text-sm">{domain ?? "—"}</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Vérifiez avant d'utiliser cette adresse pour un envoi.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-surface/30 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onAdd(company)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[10px] text-background transition-opacity hover:opacity-90 md:text-xs"
          >
            <Plus className="size-3.5" /> Ajouter à ma base
          </button>
          {domain && (
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] transition-colors hover:bg-surface md:text-xs"
            >
              <Globe className="size-3.5" /> Visiter
            </a>
          )}
          <button
            type="button"
            onClick={() => toast.info(`Analyse IA de ${company.name} en cours…`)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[10px] transition-colors hover:bg-surface md:text-xs"
          >
            <Sparkles className="size-3.5" /> Enrichir
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-medium md:text-sm">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Explorateur                                                               */
/* -------------------------------------------------------------------------- */

export function KnownCompaniesExplorer() {
  const { addCompany, addActivity } = useAppStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /* --- Recherche avec debounce --- */
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setErrored(false);
      return;
    }
    setLoading(true);
    setErrored(false);
    const timer = setTimeout(async () => {
      const data = await searchCompanies(q, 20);
      setResults(data);
      setLoading(false);
      if (data.length === 0) setErrored(true);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  /* --- Auto-sélection de la 1ʳᵉ ligne à l'arrivée des résultats --- */
  useEffect(() => {
    if (results.length > 0 && !results.some((r) => r.id === selectedId)) {
      setSelectedId(results[0].id);
    }
  }, [results, selectedId]);

  /* ------------------------------------------------------------------ */
  /*  Position du dropdown                                              */
  /*  Priorité : SOUS le champ → CÔTÉ DROIT → CÔTÉ GAUCHE               */
  /*  (jamais au-dessus, pour éviter qu'il parte trop haut)             */
  /* ------------------------------------------------------------------ */
  const computeDropdownStyle = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const GAP = 6;
    const SIDE_WIDTH = 360; // largeur quand la fenêtre passe sur le côté
    const MAX_HEIGHT = 340;

    const spaceBelow = vh - r.bottom - GAP - 8;
    const spaceRight = vw - r.right - GAP - 8;
    const spaceLeft = r.left - GAP - 8;

    // 1) Priorité : SOUS le champ
    if (spaceBelow >= 180) {
      setDropdownStyle({
        position: "fixed",
        top: r.bottom + GAP,
        left: r.left,
        width: r.width,
        maxHeight: Math.min(MAX_HEIGHT, spaceBelow),
        zIndex: 9999,
      });
      return;
    }

    // 2) Sinon : sur le CÔTÉ DROIT
    if (spaceRight >= SIDE_WIDTH) {
      setDropdownStyle({
        position: "fixed",
        top: Math.max(8, Math.min(r.top, vh - MAX_HEIGHT - 8)),
        left: r.right + GAP,
        width: SIDE_WIDTH,
        maxHeight: Math.min(MAX_HEIGHT, vh - 16),
        zIndex: 9999,
      });
      return;
    }

    // 3) Sinon : sur le CÔTÉ GAUCHE
    if (spaceLeft >= SIDE_WIDTH) {
      setDropdownStyle({
        position: "fixed",
        top: Math.max(8, Math.min(r.top, vh - MAX_HEIGHT - 8)),
        left: r.left - SIDE_WIDTH - GAP,
        width: SIDE_WIDTH,
        maxHeight: Math.min(MAX_HEIGHT, vh - 16),
        zIndex: 9999,
      });
      return;
    }

    // 4) Repli : sous le champ avec l'espace restant
    setDropdownStyle({
      position: "fixed",
      top: r.bottom + GAP,
      left: Math.max(8, Math.min(r.left, vw - r.width - 8)),
      width: r.width,
      maxHeight: Math.max(120, spaceBelow),
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    computeDropdownStyle();
    const h = () => computeDropdownStyle();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.removeEventListener("resize", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [dropdownOpen, computeDropdownStyle]);

  /* --- Fermeture au clic extérieur / Escape --- */
  useEffect(() => {
    if (!dropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (inputRef.current?.contains(target)) return;
      if (target.closest?.("[data-known-companies-dropdown]")) return;
      setDropdownOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  const visible = showAll ? results : results.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, results.length - INITIAL_VISIBLE);
  const selected = results.find((r) => r.id === selectedId) ?? null;

  const handleAdd = (c: CompanyResult) => {
    const domain =
      c.domain || guessDomainFromName(c.name) || c.name.toLowerCase().replace(/\s+/g, "") + ".fr";
    const created = addCompany({
      name: c.name,
      domain,
      industry: c.industry === "—" ? "Autre" : c.industry,
      location: c.location,
      employees: c.employees,
      revenue: "—",
      size: c.size,
      intent: "warm",
      saved: true,
    });
    const newId =
      created && typeof created === "object" && "id" in created
        ? String((created as { id?: unknown }).id ?? "")
        : "";
    addActivity?.("Entreprise importée", `${c.name} (SIREN ${c.id})`);
    toast.success(newId ? `${c.name} ajoutée à votre base` : `${c.name} ajoutée`);
  };

  const leftPane = (
    <>
      <div className="shrink-0 border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAll(false);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            placeholder="Rechercher une entreprise (nom, SIREN, ville)…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h3 className="truncate font-display text-sm italic">
          {query.trim() ? "Résultats" : "Suggestions"}
        </h3>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {query.trim()
            ? `${results.length} résultat${results.length > 1 ? "s" : ""}`
            : "Commencez à taper"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!query.trim() ? (
          <div className="p-4 text-center text-[11px] text-muted-foreground">
            Tapez un nom d'entreprise pour lancer la recherche.
          </div>
        ) : loading ? (
          <div className="p-6 text-center">
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
            <p className="mt-2 text-[11px] text-muted-foreground">Recherche en cours…</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {errored
              ? "Aucune entreprise trouvée. Essayez un autre nom ou un SIREN."
              : "Aucun résultat pour le moment."}
          </div>
        ) : (
          <>
            {visible.map((c) => (
              <CompanyRow
                key={c.id}
                company={c}
                active={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))}

            {!showAll && hiddenCount > 0 && (
              <div className="border-t border-border/60 p-2">
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  <ArrowRight className="size-3.5" />
                  Voir les {hiddenCount} autres
                </button>
              </div>
            )}

            {showAll && results.length > INITIAL_VISIBLE && (
              <div className="border-t border-border/60 p-2">
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                >
                  Réduire
                </button>
              </div>
            )}

            <div className="border-t border-border/60 px-3 py-2 text-center text-[10px] text-muted-foreground/70">
              Source : API Recherche d'Entreprises (gouvernement français)
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <ResizableSplit
        left={leftPane}
        right={<CompanyPreview company={selected} onAdd={handleAdd} />}
        defaultLeftWidth={340}
        minLeftWidth={220}
        maxLeftWidth={520}
        minRightWidth={260}
        desktopHeight={560}
        mobileLeftHeight={420}
        mobileRightHeight={460}
        resizerLabel="Redimensionner la liste des entreprises"
      />

      {dropdownOpen &&
        dropdownStyle &&
        createPortal(
          <div
            data-known-companies-dropdown
            style={dropdownStyle}
            className="overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover shadow-2xl animate-in fade-in-0 zoom-in-95"
          >
            {!query.trim() ? (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Recherches suggérées
                </p>
                {SUGGESTED_QUERIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(s);
                      inputRef.current?.focus();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-surface"
                  >
                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{s}</span>
                    <ArrowRight className="ml-auto size-3 shrink-0 text-muted-foreground/60" />
                  </button>
                ))}
              </>
            ) : loading ? (
              <div className="p-4 text-center">
                <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                <p className="mt-2 text-[10px] text-muted-foreground">Recherche…</p>
              </div>
            ) : results.length === 0 ? (
              <p className="px-3 py-5 text-center text-[11px] text-muted-foreground">
                Aucune entreprise trouvée
              </p>
            ) : (
              results.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSelectedId(c.id);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    selectedId === c.id ? "bg-primary/10" : "hover:bg-surface",
                  )}
                >
                  <CompanyAvatar name={c.name} domain={c.domain} size={24} shape="rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{c.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {c.industry} · {c.location}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{c.category}</span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
