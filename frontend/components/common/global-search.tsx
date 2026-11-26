// frontend/components/common/global-search.tsx

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Users,
  Building2,
  Send,
  Target,
  Search,
  Sparkles,
  Star,
  ArrowRight,
} from "@/components/icons";
import {
  SEARCH_CATEGORY_ICONS as CATEGORY_ICONS,
  SEARCH_CATEGORY_LABELS as CATEGORY_LABELS,
  SEARCH_CATEGORY_ORDER as CATEGORY_ORDER,
  useGlobalSearchResults,
  type SearchResult,
} from "@/hooks/use-global-search";

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  hideTrigger?: boolean;
}

export function GlobalSearch({ open, onOpenChange, hideTrigger = false }: GlobalSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean" && typeof onOpenChange === "function";
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { debouncedQuery, results, groupedResults, quickActions } = useGlobalSearchResults(query);

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      router.history.push(result.url);
    },
    [router, setOpen],
  );

  const hasResults = results.length > 0 || quickActions.length > 0;

  return (
    <>
      {!hideTrigger && (
        <div className="flex items-center">
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir la recherche globale"
            title="Recherche globale (⌘K)"
            className="group flex h-9 items-center gap-2 rounded-lg px-3 transition-colors duration-150 hover:bg-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search
              className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
              strokeWidth={1.8}
            />
            <span className="hidden text-sm text-muted-foreground transition-colors group-hover:text-foreground sm:inline">
              Rechercher
            </span>
            <kbd className="ml-1 hidden h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground lg:inline-flex">
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
                        router.history.push(action.url);
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
                              <span className="text-[11px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
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
