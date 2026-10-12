//frontend\components\mobile\mobile-card-list.tsx
import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import DataTable, { type Column, type DataTableProps } from "@/components/data-table";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type MobileCardListProps<T> = DataTableProps<T> & {
  renderCard?: (row: T) => ReactNode;

  titleKey?: keyof T | string;

  subtitleKey?: keyof T | string;

  renderTrailing?: (row: T) => ReactNode;
};

export function MobileCardList<T extends Record<string, any>>(props: MobileCardListProps<T>) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    const { renderCard, titleKey, subtitleKey, renderTrailing, ...tableProps } = props;
    void renderCard;
    void titleKey;
    void subtitleKey;
    void renderTrailing;
    return <DataTable {...tableProps} />;
  }

  return <MobileCardListBody {...props} />;
}

function MobileCardListBody<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  onRowDoubleClick,
  selectedIds,
  onSelectRow,
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  searchPlaceholder = "Rechercher…",
  searchFields,
  emptyMessage = "Aucune donnée à afficher.",
  className,
  isLoading = false,
  loadingRows = 5,
  comfortable = false,
  renderCard,
  titleKey,
  subtitleKey,
  renderTrailing,
}: MobileCardListProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const selectable = !!selectedIds && !!onSelectRow;

  const filteredData = useMemo(() => {
    if (!search.trim() || !searchFields) return data;
    const q = search.toLowerCase().trim();
    return data.filter((row) =>
      searchFields.some((field) => {
        const value = row[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      }),
    );
  }, [data, search, searchFields]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  const visibleColumns = useMemo(() => columns.filter((c) => !c.hideOnMobile), [columns]);

  const resolvedTitleKey = titleKey ?? visibleColumns[0]?.key;
  const resolvedSubtitleKey = subtitleKey ?? visibleColumns[1]?.key;

  const renderRowContent = (row: T) => {
    if (renderCard) return renderCard(row);

    const title = resolvedTitleKey ? getCellValue(row, columns, resolvedTitleKey) : null;
    const subtitle = resolvedSubtitleKey ? getCellValue(row, columns, resolvedSubtitleKey) : null;

    const restCols = visibleColumns.filter(
      (c) => c.key !== resolvedTitleKey && c.key !== resolvedSubtitleKey,
    );

    return (
      <div className="min-w-0 flex-1 overflow-hidden">
        {title != null && (
          <div className="truncate text-[14px] font-medium text-foreground">{title}</div>
        )}
        {subtitle != null && (
          <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</div>
        )}

        {restCols.length > 0 && (
          <dl className="mt-2 space-y-1">
            {restCols.map((c) => {
              const value = getCellValue(row, columns, c.key);
              if (value == null || value === "") return null;
              return (
                <div key={String(c.key)} className="flex min-w-0 items-center gap-2 text-[11.5px]">
                  <dt className="shrink-0 text-muted-foreground">{c.header}</dt>
                  <dd className="ml-auto min-w-0 truncate text-right text-foreground">{value}</dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    );
  };

  return (
    <div className={cn("min-w-0 space-y-3 overflow-hidden", className)}>
      {}
      {showSearch && searchFields && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            inputMode="search"
            className={cn(
              "h-11 w-full rounded-xl border border-border bg-background pl-9 pr-9",
              "text-[16px] outline-none transition-colors focus:border-primary/50",
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              aria-label="Effacer la recherche"
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground active:bg-surface"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {}
      {isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <li
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-border bg-surface/50"
            />
          ))}
        </ul>
      ) : paginatedData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/20 p-8 text-center text-[13px] text-muted-foreground">
          {data.length === 0 ? emptyMessage : "Aucun résultat pour cette recherche."}
        </div>
      ) : (
        <ul className="space-y-2">
          {paginatedData.map((row) => {
            const id = keyExtractor(row);
            const isSelected = selectable && selectedIds!.has(id);

            return (
              <li key={id} className="min-w-0 overflow-hidden">
                <div
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
                  className={cn(
                    "flex min-h-[68px] items-start gap-3 overflow-hidden rounded-2xl border bg-background p-3 transition-colors",
                    comfortable && "p-4",
                    onRowClick && "cursor-pointer active:bg-surface/60",
                    isSelected ? "border-primary/40 bg-primary/[0.04]" : "border-border",
                  )}
                >
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectRow!(id, !isSelected);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Sélectionner"
                      className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-border accent-primary"
                    />
                  )}

                  {renderRowContent(row)}

                  {renderTrailing && (
                    <div className="ml-1 shrink-0 self-center">{renderTrailing(row)}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {}
      {showPagination && filteredData.length > pageSize && (
        <div className="flex items-center justify-between px-1 text-[12px] text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{" "}
            sur {filteredData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Page précédente"
              className="grid size-9 place-items-center rounded-lg border border-border bg-background active:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[52px] text-center font-mono text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
              className="grid size-9 place-items-center rounded-lg border border-border bg-background active:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getCellValue<T>(row: T, columns: Column<T>[], key: keyof T | string): ReactNode {
  const col = columns.find((c) => c.key === key);
  if (col?.accessor) return col.accessor(row);
  const v = (row as Record<string, unknown>)[key as string];
  if (v == null) return null;
  return v as ReactNode;
}
