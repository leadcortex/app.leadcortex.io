//frontend\components\data-table.tsx
import { useState, useMemo, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  cellClassName?: string;
  width?: string | number;
  hideOnMobile?: boolean;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  loadingRows?: number;
  scrollable?: boolean;

  comfortable?: boolean;
};

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  onRowDoubleClick,
  selectedIds,
  onSelectRow,
  onSelectAll,
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  searchPlaceholder = "Rechercher...",
  searchFields,
  emptyMessage = "Aucune donnée à afficher.",
  className,
  isLoading = false,
  loadingRows = 5,
  scrollable = true,
  comfortable = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const selectable = !!selectedIds && !!onSelectRow;

  const filteredData = useMemo(() => {
    if (!search.trim() || !searchFields) return data;
    const q = search.toLowerCase().trim();
    return data.filter((row) => {
      return searchFields.some((field) => {
        const value = row[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      });
    });
  }, [data, search, searchFields]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const key = sortKey as string;
    return [...filteredData].sort((a, b) => {
      const col = columns.find((c) => c.key === key);
      const valA = col?.accessor ? col.accessor(a) : a[key];
      const valB = col?.accessor ? col.accessor(b) : b[key];
      const strA = valA != null ? String(valA) : "";
      const strB = valB != null ? String(valB) : "";
      const result = strA.localeCompare(strB);
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const allSelected =
    selectable &&
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(keyExtractor(row)));

  const toggleAll = () => {
    if (onSelectAll) {
      onSelectAll(!allSelected);
    } else if (onSelectRow) {
      paginatedData.forEach((row) => {
        const id = keyExtractor(row);
        onSelectRow(id, !allSelected);
      });
    }
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !col.hideOnMobile);
  }, [columns]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border overflow-hidden bg-background shadow-sm",
          className,
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/60 text-muted-foreground text-[10px] uppercase tracking-[0.12em]">
              <tr>
                {selectable && <th className="px-4 py-3 border-b border-border w-8" />}
                {visibleColumns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn("px-4 py-3 border-b border-border font-semibold", col.className)}
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5">
                      <div className="size-4 rounded bg-secondary" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-3.5">
                      <div className="h-4 rounded bg-secondary w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground bg-surface/20",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  const headPad = comfortable ? "px-5 py-3.5" : "px-4 py-3";
  const cellPad = comfortable ? "px-5 py-4" : "px-4 py-3.5";

  const tableWrapper = (
    <div
      className={cn(
        "rounded-xl border border-border bg-background shadow-sm overflow-hidden",
        comfortable && "shadow-md",
      )}
    >
      <div className={cn("overflow-x-auto scrollbar-hide", scrollable && "table-scroll")}>
        <table className="w-full text-left text-sm min-w-[640px] border-separate border-spacing-0">
          <thead
            className={cn(
              "sticky top-0 z-10 text-muted-foreground text-[10px] uppercase tracking-[0.12em]",
              comfortable
                ? "bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85"
                : "bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70",
            )}
          >
            <tr>
              {selectable && (
                <th className={cn(headPad, "border-b border-border w-8")}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border cursor-pointer accent-primary"
                  />
                </th>
              )}
              {visibleColumns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={String(col.key)}
                    className={cn(
                      headPad,
                      "border-b border-border font-semibold whitespace-nowrap",
                      col.sortable && "cursor-pointer hover:text-foreground select-none",
                      col.className,
                    )}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        <span
                          className={cn(
                            "transition-colors",
                            isSorted ? "text-primary" : "text-muted-foreground/50",
                          )}
                        >
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="px-4 py-10 text-center text-muted-foreground text-sm"
                >
                  Aucun résultat pour cette recherche.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const id = keyExtractor(row);
                const isSelected = selectable && selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-border last:border-0 transition-all group",
                      rowIndex % 2 === 1 && !isSelected && "bg-surface/25",
                      onRowClick && "cursor-pointer hover:bg-primary/[0.04]",
                      comfortable &&
                        onRowClick &&
                        "hover:shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.015)]",
                      isSelected && "bg-primary/[0.06]",
                    )}
                    style={{
                      boxShadow: isSelected ? "inset 2px 0 0 0 var(--primary)" : undefined,
                    }}
                    onClick={() => onRowClick?.(row)}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                  >
                    {selectable && (
                      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(id, !isSelected)}
                          className="rounded border-border cursor-pointer accent-primary"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn(cellPad, "align-middle", col.cellClassName)}
                      >
                        {col.accessor ? col.accessor(row) : row[col.key as keyof T]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {}
      {showSearch && searchFields && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {}
      {tableWrapper}

      {}
      {showPagination && sortedData.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
          <span>
            <span className="font-medium text-foreground">
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{" "}
            sur {sortedData.length}
          </span>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface/40 p-0.5">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2.5 py-1 min-w-[52px] text-center font-mono text-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-background hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
