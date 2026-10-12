//frontend\components\global-search.tsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Users, Building2, Send, Target, Search, Sparkles, Star, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useDebounce } from "@/hooks/use-debounce";

type SearchResult = {
  id: string;
  label: string;
  subtitle: string;
  category: "prospects" | "companies" | "sequences" | "deals";
  icon: typeof Users;
  url: string;
  score?: number;
  saved?: boolean;
};

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  hideTrigger?: boolean;
}

const CATEGORY_LABELS: Record<SearchResult["category"], string> = {
  prospects: "Prospects",
  companies: "Entreprises",
  sequences: "Séquences",
  deals: "Opportunités",
};

const CATEGORY_ICONS: Record<SearchResult["category"], typeof Users> = {
  prospects: Users,
  companies: Building2,
  sequences: Send,
  deals: Target,
};

const CATEGORY_ORDER = ["prospects", "companies", "sequences", "deals"] as const;

export function GlobalSearch({ open, onOpenChange, hideTrigger = false }: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean" && typeof onOpenChange === "function";
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  const navigate = useNavigate();
  const store = useAppStore();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase().trim();

    const searchInLeads = (): SearchResult[] =>
      store.leads
        .filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.company.toLowerCase().includes(q) ||
            l.title.toLowerCase().includes(q) ||
            (l.email && l.email.toLowerCase().includes(q)),
        )
        .map((l) => ({
          id: l.id,
          label: l.name,
          subtitle: `${l.title} · ${l.company}`,
          category: "prospects" as const,
          icon: Users,
          url: `/app/people/${l.id}`,
          score: l.score ?? undefined,
          saved: l.saved,
        }));

    const searchInCompanies = (): SearchResult[] =>
      store.companies
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.domain.toLowerCase().includes(q) ||
            c.industry.toLowerCase().includes(q),
        )
        .map((c) => ({
          id: c.id,
          label: c.name,
          subtitle: `${c.industry} · ${c.location}`,
          category: "companies" as const,
          icon: Building2,
          url: `/app/companies/${c.id}`,
          saved: c.saved,
        }));

    const searchInSequences = (): SearchResult[] =>
      store.sequences
        .filter((s) => s.name.toLowerCase().includes(q))
        .map((s) => ({
          id: s.id,
          label: s.name,
          subtitle: `${s.leads} leads · ${s.opens} d'ouverture`,
          category: "sequences" as const,
          icon: Send,
          url: `/app/sequences/${s.id}`,
        }));

    const searchInDeals = (): SearchResult[] =>
      store.deals
        .filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.company.toLowerCase().includes(q) ||
            d.contact.toLowerCase().includes(q),
        )
        .map((d) => ({
          id: d.id,
          label: d.name,
          subtitle: `${d.company} · ${d.amount.toLocaleString("fr-FR")} €`,
          category: "deals" as const,
          icon: Target,
          url: `/app/deals/${d.id}`,
        }));

    const all = [
      ...searchInLeads(),
      ...searchInCompanies(),
      ...searchInSequences(),
      ...searchInDeals(),
    ];

    return all.sort((a, b) => {
      if (a.score && b.score) return b.score - a.score;
      if (a.score) return -1;
      if (b.score) return 1;
      return a.label.localeCompare(b.label);
    });
  }, [store, debouncedQuery]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResult["category"], SearchResult[]> = {
      prospects: [],
      companies: [],
      sequences: [],
      deals: [],
    };
    results.forEach((r) => groups[r.category].push(r));
    return groups;
  }, [results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      navigate({ to: result.url as any });
    },
    [navigate, setOpen],
  );

  const quickActions = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const actions = [];
    if (!results.some((r) => r.category === "prospects")) {
      actions.push({
        id: "create-lead",
        label: `Créer un prospect "${debouncedQuery}"`,
        icon: Users,
        url: "/app/people/new",
      });
    }
    if (!results.some((r) => r.category === "companies")) {
      actions.push({
        id: "create-company",
        label: `Créer une entreprise "${debouncedQuery}"`,
        icon: Building2,
        url: "/app/companies/new",
      });
    }
    return actions;
  }, [debouncedQuery, results]);

  const hasResults = results.length > 0 || quickActions.length > 0;

  return (
    <>
      {!hideTrigger && (
        <div className="flex items-center">
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir la recherche globale"
            title="Recherche globale (⌘K)"
            className="group flex items-center gap-2 rounded-xl border border-transparent bg-white/5 px-2.5 py-1.5 transition-all duration-200 hover:border-primary/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] active:scale-95"
          >
            <Search
              className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
              strokeWidth={1.8}
            />
            <span className="hidden text-sm text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
              Rechercher
            </span>
            <kbd className="ml-1 hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
      )}

      <CommandDialog open={isOpen} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Rechercher des prospects, entreprises, séquences..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[80vh] sm:max-h-[300px] pt-12 sm:pt-0 pb-4">
          {!hasResults && debouncedQuery.trim() && (
            <CommandEmpty className="py-12 text-center">
              <Search className="size-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun résultat pour "
                <span className="font-medium text-foreground">{debouncedQuery}</span>"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez de modifier vos termes de recherche.
              </p>
            </CommandEmpty>
          )}

          {!debouncedQuery.trim() && (
            <div className="p-6 text-center">
              <Sparkles className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium">Recherche globale</p>
              <p className="text-xs text-muted-foreground mt-1">
                Recherchez dans les prospects, entreprises, séquences et opportunités.
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3" /> Prospects
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="size-3" /> Entreprises
                </span>
                <span className="flex items-center gap-1">
                  <Send className="size-3" /> Séquences
                </span>
                <span className="flex items-center gap-1">
                  <Target className="size-3" /> Opportunités
                </span>
              </div>
            </div>
          )}

          {hasResults && debouncedQuery.trim() && (
            <>
              {quickActions.length > 0 && (
                <CommandGroup heading="Actions rapides">
                  {quickActions.map((action) => (
                    <CommandItem
                      key={action.id}
                      onSelect={() => {
                        setOpen(false);
                        navigate({ to: action.url as any });
                      }}
                    >
                      <action.icon className="size-4 mr-2" />
                      {action.label}
                      <ArrowRight className="size-3 ml-auto text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {quickActions.length > 0 && <CommandSeparator />}

              {CATEGORY_ORDER.map((category) => {
                const items = groupedResults[category];
                if (items.length === 0) return null;
                const Icon = CATEGORY_ICONS[category];
                const label = CATEGORY_LABELS[category];
                return (
                  <CommandGroup key={category} heading={label}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleSelect(item)}
                        className="flex items-start gap-3 py-2"
                      >
                        <div className="mt-0.5 shrink-0">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{item.label}</span>
                            {item.saved && (
                              <Star className="size-3 fill-primary text-primary shrink-0" />
                            )}
                            {item.score !== undefined && item.score > 0 && (
                              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                                {item.score.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                        <ArrowRight className="size-3 text-muted-foreground/50 shrink-0" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
