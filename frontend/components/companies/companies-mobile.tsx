// frontend/components/companies/companies-mobile.tsx

import { useEffect, useRef } from "react";
import { Bookmark, Building2, Check, MapPin, Users } from "@/components/icons";
import { CompanyAvatar } from "@/components/company-logo";
import { cn } from "@/lib/core/utils";
import { intentLabels } from "@/lib/companies/preferences";
import type { CardContextBind } from "@/components/companies/companies-cards";
import { useDragRangeSelection } from "@/hooks/use-drag-range-selection";

export type MobileCompanyStackProps = {
  companies: any[];
  selectedIds: Set<string>;
  onSelectRow: (id: string, selected: boolean) => void;
  onOpen: (company: any) => void;
  bindContext: CardContextBind;
  tablesInOwnContainer: boolean;
};

export function MobileCompanyStack({
  companies,
  selectedIds,
  onSelectRow,
  onOpen,
  bindContext,
  tablesInOwnContainer,
}: MobileCompanyStackProps) {
  const rangeRootRef = useRef<HTMLDivElement>(null);
  const rangeHandlers = useDragRangeSelection({
    rootRef: rangeRootRef,
    items: companies,
    selectedIds,
    onSelectRow,
  });

  return (
    <div className="pb-2 pt-3">
      <div
        ref={rangeRootRef}
        {...rangeHandlers}
        className="mobile-stack-scroll relative max-h-[55vh] min-h-[400px] overflow-y-auto rounded-xl border border-border bg-surface/30 p-2 overscroll-y-auto scrollbar-hide"
      >
        <div className="space-y-2">
          {companies.map((company, index) => (
            <div
              key={company.id}
              data-range-index={index}
              className={cn(
                tablesInOwnContainer &&
                  "rounded-xl border border-border bg-surface/40 p-1",
              )}
            >
              <MobileCompanyCard
                company={company}
                selected={selectedIds.has(company.id)}
                onSelect={(sel) => onSelectRow(company.id, sel)}
                onOpen={() => onOpen(company)}
                bindContext={bindContext}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileCompanyCard({
  company,
  selected,
  onSelect,
  onOpen,
  bindContext,
}: {
  company: any;
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

  const ctxBind = bindContext({ id: company.id });
  const intent = intentLabels[company.intent] ?? company.intent ?? "";
  const meta = [company.domain, company.industry].filter(Boolean).join(" · ");

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
        "relative flex items-center gap-3 rounded-xl border bg-background p-3 active:bg-surface",
        selected ? "border-primary bg-primary/[0.03]" : "border-border",
      )}
    >
      <button
        data-range-select
        type="button"
        aria-label={`${selected ? "Désélectionner" : "Sélectionner"} ${company.name}`}
        aria-pressed={selected}
        className={cn(
          "absolute top-1/2 right-2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg transition-colors",
          selected ? "text-primary" : "text-muted-foreground",
        )}
        onClick={() => onSelect(!selected)}
      >
        <span
          className={cn(
            "grid size-5 place-items-center rounded-md border-2",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40",
          )}
        >
          {selected && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 pr-12 text-left"
        aria-label={`Ouvrir la fiche de ${company.name}`}
      >
        <CompanyAvatar
          name={company.name}
          domain={company.domain}
          logoUrl={company.companyLogoUrl}
          size={48}
          shape="rounded"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{company.name}</span>
            {intent && (
            <span
              className={cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                company.intent === "hot"
                  ? "bg-primary/15 text-primary"
                  : company.intent === "warm"
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {intent}
            </span>
            )}
          </div>
          {meta && <div className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</div>}
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
        </div>

        {company.saved && <Bookmark className="size-4 shrink-0 fill-primary text-primary" />}
      </button>
    </article>
  );
}

export { Building2 };
