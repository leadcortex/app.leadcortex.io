// frontend/components/companies/companies-search-dropdown.tsx

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Bookmark, Search } from "@/components/icons";
import { CompanyAvatar } from "@/components/company-logo";
import { cleanQuery, fuzzyMatch, highlightRanges } from "@/lib/core/fuzzy-search";
import { cn } from "@/lib/core/utils";

export type CompanySearchHit = {
  company: any;
  score: number;
  indices: number[];
};

export type CompaniesSearchDropdownProps = {
  open: boolean;
  query: string;
  inputElRef: React.RefObject<HTMLInputElement | null>;
  companies: any[];
  results: CompanySearchHit[];
  activeIndex: number;
  onActiveChange: (i: number) => void;
  onSelect: (company: any) => void;
  onClose: () => void;
};

export function useFuzzyCompanySearch(
  query: string,
  companies: any[],
  limit = 8,
): CompanySearchHit[] {
  return useMemo(() => {
    const q = cleanQuery(query);
    if (!q) return [];
    const hits: CompanySearchHit[] = [];
    for (const company of companies) {
      const nameMatch = fuzzyMatch(q, company.name ?? "");
      if (nameMatch) {
        hits.push({
          company,
          score: nameMatch.score + 100,
          indices: nameMatch.indices,
        });
        continue;
      }
      const metaMatch = fuzzyMatch(
        q,
        `${company.domain ?? ""} ${company.industry ?? ""} ${company.location ?? ""}`,
      );
      if (metaMatch) {
        hits.push({ company, score: metaMatch.score, indices: [] });
      }
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }, [query, companies, limit]);
}

export function CompaniesSearchDropdown({
  open,
  query,
  inputElRef,
  results,
  activeIndex,
  onActiveChange,
  onSelect,
  onClose,
}: CompaniesSearchDropdownProps) {
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
        "shadow-float",
        "animate-in fade-in-0 zoom-in-95 duration-100",
      )}
    >
      {results.length === 0 ? (
        <div className="px-3 py-6 text-center">
          <Search className="mx-auto mb-2 size-5 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            Aucune entreprise pour{" "}
            <span className="font-medium text-foreground">« {query.trim()} »</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Essayez « acme », « saas », « paris »…
          </p>
        </div>
      ) : (
        <>
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {results.length} résultat{results.length > 1 ? "s" : ""}
          </p>
          {results.map((hit, i) => {
            const active = i === activeIndex;
            const parts = highlightRanges(hit.company.name ?? "", hit.indices);
            return (
              <button
                key={hit.company.id}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(hit.company)}
                onMouseEnter={() => onActiveChange(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                  active ? "bg-primary/[0.08]" : "hover:bg-surface/60",
                )}
              >
                <CompanyAvatar
                  name={hit.company.name}
                  domain={hit.company.domain}
                  logoUrl={hit.company.companyLogoUrl}
                  size={32}
                  shape="rounded"
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
                    {hit.company.saved && (
                      <Bookmark className="size-2.5 shrink-0 fill-primary text-primary" />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[hit.company.domain, hit.company.industry].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {active && (
                  <ArrowRight className="size-3 shrink-0 text-muted-foreground/60" />
                )}
              </button>
            );
          })}
        </>
      )}
    </div>,
    document.body,
  );
}
