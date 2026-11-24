// frontend/components/people/people-mobile.tsx

import { useEffect, useRef } from "react";
import { Bookmark, Check, Radio } from "@/components/icons";
import { ProspectAvatarBadge } from "@/components/people/people-shared";
import { cn } from "@/lib/core/utils";
import type { CardContextBind } from "@/components/people/people-cards";
import { useDragRangeSelection } from "@/hooks/use-drag-range-selection";

export type MobileNotificationStackProps = {
  leads: any[];
  selectedIds: Set<string>;
  onSelectRow: (id: string, selected: boolean) => void;
  onOpen: (lead: any) => void;
  bindContext: CardContextBind;
  tablesInOwnContainer: boolean;
};

export function MobileNotificationStack({
  leads,
  selectedIds,
  onSelectRow,
  onOpen,
  bindContext,
  tablesInOwnContainer,
}: MobileNotificationStackProps) {
  const rangeRootRef = useRef<HTMLDivElement>(null);
  const rangeHandlers = useDragRangeSelection({
    rootRef: rangeRootRef,
    items: leads,
    selectedIds,
    onSelectRow,
  });

  return (
    <div className="px-3 pb-2 pt-2">
      <div ref={rangeRootRef} {...rangeHandlers} className="mobile-stack-scroll relative max-h-[55vh] min-h-[400px] overflow-y-auto rounded-2xl border border-border/60 bg-surface/20 p-2 shadow-inner overscroll-y-auto scrollbar-hide">
        <div className="space-y-2">
          {leads.map((lead, index) => (
            <div
              key={lead.id}
              data-range-index={index}
              className={cn(
                tablesInOwnContainer &&
                  "rounded-2xl border border-border bg-surface/40 p-1.5 shadow-[0_2px_0_var(--border)]",
              )}
            >
              <MobileNotificationCard
                lead={lead}
                selected={selectedIds.has(lead.id)}
                onSelect={(sel) => onSelectRow(lead.id, sel)}
                onOpen={() => onOpen(lead)}
                bindContext={bindContext}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNotificationCard({
  lead,
  selected,
  onSelect,
  onOpen,
  bindContext,
}: {
  lead: any;
  selected: boolean;
  onSelect: (sel: boolean) => void;
  onOpen: () => void;
  bindContext: CardContextBind;
}) {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      const el = cardRef.current;
      if (!el) return;
      const scrollContainer = el.closest(".mobile-stack-scroll");
      if (!scrollContainer) return;

      const rect = el.getBoundingClientRect();
      const parentRect = scrollContainer.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const viewportCenter = parentRect.top + parentRect.height / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      const maxDistance = parentRect.height / 2;
      const t = Math.min(1, distance / maxDistance);
      const scale = 1 - t * 0.12;
      const opacity = 1 - t * 0.35;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = `${Math.max(0.5, opacity)}`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        update();
        raf = null;
      });
    };

    update();
    const parent = cardRef.current?.closest(".mobile-stack-scroll");
    if (parent) parent.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (parent) parent.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const ctxBind = bindContext({ id: lead.id });

  return (
    <article
      ref={cardRef as React.RefObject<HTMLElement>}
      {...ctxBind}
      style={{
        transition: "transform 120ms ease-out, opacity 120ms ease-out",
        transformOrigin: "center center",
        willChange: "transform, opacity",
      }}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-sm",
        "backdrop-blur-sm active:bg-surface",
        selected ? "border-primary ring-2 ring-primary/30 bg-primary/[0.03]" : "border-border",
      )}
    >
      <button
        data-range-select
        type="button"
        aria-label={`${selected ? "Désélectionner" : "Sélectionner"} ${lead.name}`}
        aria-pressed={selected}
        className={cn(
          "absolute top-2.5 right-2.5 z-10 flex size-10 cursor-pointer items-center justify-center rounded-xl transition-all",
          "border-2 active:translate-y-[2px] active:shadow-none",
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-[0_3px_0_color-mix(in_oklab,var(--primary)_60%,black)]"
            : "border-border bg-surface text-muted-foreground shadow-[0_3px_0_var(--border)]",
        )}
        onClick={() => onSelect(!selected)}
      >
        {selected ? (
          <Check className="size-5" strokeWidth={3} />
        ) : (
          <span className="size-4 rounded border-2 border-muted-foreground/30" />
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 pr-12 text-left"
        aria-label={`Ouvrir la fiche de ${lead.name}`}
      >
        <ProspectAvatarBadge
          name={lead.name}
          avatarUrl={lead.avatarUrl}
          company={lead.company}
          companyLogoUrl={lead.companyLogoUrl}
          size={48}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{lead.name}</span>
            {typeof lead.score === "number" && (
              <span
                className={cn(
                  "shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold",
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
          <div className="truncate text-[11px] text-muted-foreground">
            {lead.title} · {lead.company}
          </div>
          {lead.signal && (
            <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-primary/5 px-1.5 py-0.5">
              <Radio className="size-2.5 shrink-0 text-primary" />
              <span className="truncate text-[10px] text-primary">{lead.signal}</span>
            </div>
          )}
        </div>

        {lead.saved && <Bookmark className="size-4 shrink-0 fill-primary text-primary" />}
      </button>
    </article>
  );
}
