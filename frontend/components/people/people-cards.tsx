// frontend/components/people/people-cards.tsx

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Radio,
} from "@/components/icons";
import { Badge } from "@/components/common/ui-primitives";
import { ProspectAvatarBadge } from "@/components/people/people-shared";
import { stageLabels } from "@/lib/people/preferences";
import { cn } from "@/lib/core/utils";
import { useDragRangeSelection } from "@/hooks/use-drag-range-selection";

export const CARDS_PER_ROW = 10;
export const CARDS_PER_ROW_MOBILE = 5;

export type CardContextBind = (payload: { id: string }) => React.HTMLAttributes<HTMLElement>;

export type CardsViewProps = {
  leads: any[];
  selectedIds: Set<string>;
  onSelectRow: (id: string, selected: boolean) => void;
  bindContext: CardContextBind;
  onReorder: (fromId: string, toId: string) => void;
  cardsPerRow?: number;
};

export function CardsView({
  leads,
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
    items: leads,
    selectedIds,
    onSelectRow,
  });

  const rows: any[][] = [];
  for (let i = 0; i < leads.length; i += cardsPerRow) {
    rows.push(leads.slice(i, i + cardsPerRow));
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
    <div ref={rangeRootRef} {...rangeHandlers} className="space-y-5">
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
          "bg-background/95 backdrop-blur-sm border border-border shadow-md grid place-items-center transition-all",
          canScrollLeft
            ? "opacity-100 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105"
            : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="size-4" strokeWidth={2.2} />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-3 pt-1 pb-3 overflow-x-auto overflow-y-hidden overscroll-x-contain snap-x snap-proximity scrollbar-hide"
      >
        {row.map((lead, rowIndex) => {
          const isSelected = selectedIds.has(lead.id);
          const isDragging = draggingId === lead.id;
          const ctxBind = bindContext({ id: lead.id });
          return (
            <Link
              key={lead.id}
              data-range-index={indexOffset + rowIndex}
              to={`/app/people/$id`}
              params={{ id: lead.id }}
              draggable
              onDragStart={(e) => {
                if ((e.target as HTMLElement).closest("[data-range-select]")) {
                  e.preventDefault();
                  return;
                }
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", lead.id);
                setDraggingId(lead.id);
              }}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(lead.id);
              }}
              {...ctxBind}
              className={cn(
                "relative group snap-start shrink-0 w-[calc(48%-0.5rem)] sm:w-[220px] md:w-[240px] lg:w-[260px] rounded-xl border bg-background p-3.5",
                "hover:shadow-md hover:border-primary/40 transition-all flex flex-col",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 bg-primary/[0.03]"
                  : "border-border",
                isDragging && "opacity-40 cursor-grabbing",
              )}
            >
              <label
                data-range-select
                className={cn(
                  "absolute top-2 right-2 z-10 flex size-8 cursor-pointer items-center justify-center rounded-lg transition-all",
                  "border-2 active:translate-y-[1px] active:shadow-none",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_60%,black)]"
                    : "border-border bg-surface text-muted-foreground shadow-[0_2px_0_var(--border)] hover:bg-surface/80",
                )}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectRow(lead.id, e.target.checked);
                  }}
                  className="sr-only"
                />
                {isSelected ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <span className="size-3 rounded border-2 border-muted-foreground/30" />
                )}
              </label>

              <div className="flex items-start gap-2.5 pr-10">
                <ProspectAvatarBadge
                  name={lead.name}
                  avatarUrl={lead.avatarUrl}
                  company={lead.company}
                  companyLogoUrl={lead.companyLogoUrl}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {lead.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{lead.title}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-medium truncate">{lead.company}</span>
                {typeof lead.score === "number" && (
                  <span
                    className={cn(
                      "ml-auto rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold shrink-0",
                      lead.score >= 9
                        ? "bg-primary/15 text-primary"
                        : lead.score >= 8
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {lead.score.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                <Badge tone="muted">{lead.industry}</Badge>
                <Badge tone="muted">
                  <MapPin className="size-2.5 mr-0.5" />
                  {lead.location}
                </Badge>
              </div>

              <div className="mt-3 min-h-[34px]">
                {lead.signal ? (
                  <div className="rounded-lg bg-primary/5 p-2 flex items-center gap-1.5">
                    <Radio className="size-3 text-primary shrink-0" />
                    <span className="text-[10px] text-primary truncate">{lead.signal}</span>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/40 p-2 text-center">
                    <span className="text-[10px] text-muted-foreground/60">Pas de signal</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <Badge
                  tone={
                    lead.stage === "won"
                      ? "success"
                      : lead.stage === "meeting"
                        ? "primary"
                        : "muted"
                  }
                >
                  {stageLabels[lead.stage ?? "new"] ?? "Nouveau"}
                </Badge>
                {lead.saved && <Bookmark className="size-3 fill-primary text-primary ml-auto" />}
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
          "bg-background/95 backdrop-blur-sm border border-border shadow-md grid place-items-center transition-all",
          canScrollRight
            ? "opacity-100 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105"
            : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="size-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}
