// frontend/components/companies/companies-cards.tsx

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
} from "@/components/icons";
import { Badge } from "@/components/common/ui-primitives";
import { CompanyAvatar } from "@/components/company-logo";
import { intentLabels } from "@/lib/companies/preferences";
import { cn } from "@/lib/core/utils";
import { useDragRangeSelection } from "@/hooks/use-drag-range-selection";

export const CARDS_PER_ROW = 10;
export const CARDS_PER_ROW_MOBILE = 5;

export type CardContextBind = (payload: { id: string }) => React.HTMLAttributes<HTMLElement>;

export type CardsViewProps = {
  companies: any[];
  selectedIds: Set<string>;
  onSelectRow: (id: string, selected: boolean) => void;
  bindContext: CardContextBind;
  onReorder: (fromId: string, toId: string) => void;
  cardsPerRow?: number;
};

export function CardsView({
  companies,
  selectedIds,
  onSelectRow,
  bindContext,
  onReorder,
  cardsPerRow = CARDS_PER_ROW,
}: CardsViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const rangeRootRef = useRef<HTMLDivElement>(null);
  const rangeHandlers = useDragRangeSelection({
    rootRef: rangeRootRef,
    items: companies,
    selectedIds,
    onSelectRow,
  });

  const rows: any[][] = [];
  for (let i = 0; i < companies.length; i += cardsPerRow) {
    rows.push(companies.slice(i, i + cardsPerRow));
  }

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }
    onReorder(draggingId, targetId);
    setDraggingId(null);
  };

  return (
    <div ref={rangeRootRef} {...rangeHandlers} className="space-y-4">
      {rows.map((row, idx) => (
        <CardRow
          key={idx}
          row={row}
          indexOffset={idx * cardsPerRow}
          selectedIds={selectedIds}
          onSelectRow={onSelectRow}
          bindContext={bindContext}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}

function CardRow({
  row,
  indexOffset,
  selectedIds,
  onSelectRow,
  bindContext,
  draggingId,
  setDraggingId,
  onDrop,
}: {
  row: any[];
  indexOffset: number;
  selectedIds: Set<string>;
  onSelectRow: (id: string, selected: boolean) => void;
  bindContext: CardContextBind;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  onDrop: (targetId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((child) => {
      if (child instanceof Element) ro.observe(child);
    });
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [row.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative group/row">
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent z-10" />
      )}

      <button
        type="button"
        onClick={() => scrollBy(-1)}
        disabled={!canScrollLeft}
        aria-label="Précédent"
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full",
          "bg-background border border-border shadow-float grid place-items-center transition-colors",
          canScrollLeft ? "opacity-100 hover:bg-surface" : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="size-4" strokeWidth={2.2} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 pt-1 pb-3 overflow-x-auto overflow-y-hidden overscroll-x-contain snap-x snap-proximity scrollbar-hide"
      >
        {row.map((company, rowIndex) => {
          const isSelected = selectedIds.has(company.id);
          const isDragging = draggingId === company.id;
          const ctxBind = bindContext({ id: company.id });
          return (
            <Link
              key={company.id}
              data-range-index={indexOffset + rowIndex}
              to={`/app/companies/$id`}
              params={{ id: company.id }}
              draggable
              onDragStart={(e) => {
                if ((e.target as HTMLElement).closest("[data-range-select]")) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", company.id);
                setDraggingId(company.id);
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(company.id);
              }}
              {...ctxBind}
              className={cn(
                "relative snap-start shrink-0 w-[calc(48%-0.5rem)] sm:w-[220px] md:w-[240px] lg:w-[260px] rounded-xl border bg-background p-4",
                "hover:bg-surface/40 transition-colors flex flex-col",
                isSelected ? "border-primary bg-primary/[0.03]" : "border-border",
                isDragging && "opacity-40 cursor-grabbing",
              )}
            >
              <label
                data-range-select
                className={cn(
                  "absolute top-3 right-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-lg",
                )}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectRow(company.id, e.target.checked);
                  }}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-md border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-background",
                  )}
                >
                  {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </label>

              <div className="flex items-start gap-3 pr-10">
                <CompanyAvatar
                  name={company.name}
                  domain={company.domain}
                  logoUrl={company.companyLogoUrl}
                  size={40}
                  shape="rounded"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{company.name}</div>
                  {company.domain && (
                    <div className="text-xs text-muted-foreground truncate">{company.domain}</div>
                  )}
                </div>
              </div>

              {company.industry && (
                <div className="mt-3 truncate text-[13px]">{company.industry}</div>
              )}

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {company.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {company.location}
                  </span>
                )}
                {company.employees > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" />
                    <span className="tabular-nums">{company.employees.toLocaleString("fr-FR")}</span>
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2 pt-4">
                <Badge
                  tone={
                    company.intent === "hot"
                      ? "primary"
                      : company.intent === "warm"
                        ? "warning"
                        : "muted"
                  }
                >
                  {intentLabels[company.intent] ?? company.intent}
                </Badge>
                {company.saved && (
                  <Bookmark className="size-3.5 fill-primary text-primary ml-auto" />
                )}

              </div>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        disabled={!canScrollRight}
        aria-label="Suivant"
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 z-20 size-9 rounded-full",
          "bg-background border border-border shadow-float grid place-items-center transition-colors",
          canScrollRight ? "opacity-100 hover:bg-surface" : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="size-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

export { Building2 };
