// frontend/components/people/people-search-dropdown.tsx

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Search, Star } from "@/components/icons";
import { ProspectAvatarBadge } from "@/components/people/people-shared";
import { cleanQuery, fuzzyMatch, highlightRanges } from "@/lib/core/fuzzy-search";
import type { Lead } from "@/lib/data/mock-data";
import { cn } from "@/lib/core/utils";

export type SearchHit = {
  lead: Lead;
  score: number;
  indices: number[];
};

export type PeopleSearchDropdownProps = {
  open: boolean;
  query: string;
  inputElRef: React.RefObject<HTMLInputElement | null>;
  leads: Lead[];
  results: SearchHit[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onSelect: (lead: Lead) => void;
  onClose: () => void;
};

export function useFuzzyLeadSearch(query: string, leads: Lead[], limit = 8): SearchHit[] {
  return useMemo(() => {
    const q = cleanQuery(query);
    if (!q) return [];
    const hits: SearchHit[] = [];
    for (const lead of leads) {
      const nameMatch = fuzzyMatch(q, lead.name);
      if (nameMatch) {
        hits.push({ lead, score: nameMatch.score + 100, indices: nameMatch.indices });
        continue;
      }
      const metaMatch = fuzzyMatch(
        q,
        `${lead.company} ${lead.title} ${lead.email ?? ""} ${lead.industry ?? ""}`,
      );
      if (metaMatch) {
        hits.push({ lead, score: metaMatch.score, indices: [] });
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }, [query, leads, limit]);
}

export function PeopleSearchDropdown({
  open,
  query,
  inputElRef,
  results,
  activeIndex,
  onActiveChange,
  onSelect,
  onClose,
}: PeopleSearchDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const computeStyle = useCallback(() => {
    const el = inputElRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(420, openUp ? spaceAbove - 4 : spaceBelow - 4);

    setStyle({
      position: "fixed",
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? vh - r.top + 6 : undefined,
      left: r.left,
      width: r.width,
      maxHeight,
      zIndex: 9999,
    });
  }, [inputElRef]);

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
      const t = e.target as Node;
      if (inputElRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, inputElRef, onClose]);

  if (!open || !style) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="listbox"
      style={style}
      className={cn(
        "overflow-y-auto overscroll-contain",
        "rounded-xl border border-border bg-popover p-1.5",
        "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)]",
        "animate-in fade-in-0 zoom-in-95 duration-100",
      )}
    >
      {results.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <Search className="mx-auto mb-2 size-5 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            Aucun prospect pour{" "}
            <span className="font-medium text-foreground">« {query.trim()} »</span>
          </p>
          <p className="mt-1 text-[10.5px] text-muted-foreground/70">
            Essayez « dupont », « aero », « cto »…
          </p>
        </div>
      ) : (
        <>
          <p className="px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {results.length} résultat{results.length > 1 ? "s" : ""}
          </p>
          {results.map((hit, i) => {
            const active = i === activeIndex;
            const parts = highlightRanges(hit.lead.name, hit.indices);
            return (
              <button
                key={hit.lead.id}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(hit.lead)}
                onMouseEnter={() => onActiveChange(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                  active ? "bg-primary/[0.08]" : "hover:bg-surface/60",
                )}
              >
                <ProspectAvatarBadge
                  name={hit.lead.name}
                  avatarUrl={hit.lead.avatarUrl}
                  company={hit.lead.company}
                  companyLogoUrl={hit.lead.companyLogoUrl}
                  size={32}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-medium">
                      {parts.map((part, pi) =>
                        part.match ? (
                          <mark
                            key={pi}
                            className="rounded-[2px] bg-primary/15 px-0.5 font-semibold text-primary"
                          >
                            {part.text}
                          </mark>
                        ) : (
                          <span key={pi}>{part.text}</span>
                        ),
                      )}
                    </span>
                    {typeof hit.lead.score === "number" && (
                      <span
                        className={cn(
                          "shrink-0 rounded px-1 py-0.5 font-mono text-[9.5px] font-semibold tabular-nums",
                          hit.lead.score >= 9
                            ? "bg-primary/15 text-primary"
                            : hit.lead.score >= 8
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {hit.lead.score.toFixed(1)}
                      </span>
                    )}
                    {hit.lead.saved && (
                      <Star className="size-2.5 shrink-0 fill-primary text-primary" />
                    )}
                  </div>
                  <p className="truncate text-[10.5px] text-muted-foreground">
                    {hit.lead.title} · {hit.lead.company}
                  </p>
                </div>
                {active && <ArrowRight className="size-3 shrink-0 text-muted-foreground/60" />}
              </button>
            );
          })}
        </>
      )}
    </div>,
    document.body,
  );
}
