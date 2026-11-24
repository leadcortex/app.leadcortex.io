// frontend/components/common/data-table.tsx

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X, Check, GripVertical, LucideIcon } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import {
  createEdgeScroller,
  installDragEdgeAutoScroll,
  type EdgeScroller,
} from "@/lib/ui/edge-auto-scroll";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  icon?: LucideIcon;
  accessor?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  cellClassName?: string;
  width?: string | number;
  hideOnMobile?: boolean;
  compactHide?: boolean;
  sticky?: boolean;
};

export type DragContext = {
  draggingId: string | null;
  dragOverId: string | null;
  setDragging: (id: string | null) => void;
  setDragOver: (id: string | null) => void;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  onRowContextMenu?: (e: React.MouseEvent, rowId: string) => void;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectRange?: (updates: { id: string; selected: boolean }[]) => void;
  onRangeAction?: (action: string, id: string, active: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  pageSize?: number;
  showPagination?: boolean;
  forceVisibleScrollbar?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  loadingRows?: number;
  stickyHeader?: boolean;
  maxBodyHeight?: string;
  fixedHeight?: string;
  reorderable?: boolean;
  onReorder?: (fromId: string, toId: string) => void;
  dragContext?: DragContext;
  comfortable?: boolean;
  compact?: boolean;
  bare?: boolean;
  disableHorizontalScroll?: boolean;
  onHeaderContextMenu?: (e: React.MouseEvent) => void;
  extraHeader?: ReactNode;
  onColumnsChange?: (newColumns: Column<T>[]) => void;
};

const NARROW_ENTER_PX = 480;
const NARROW_EXIT_PX = 510;

function DataTable<T extends object>({
  data,
  columns: initialColumns,
  keyExtractor,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  selectedIds,
  onSelectRow,
  onSelectRange,
  onRangeAction,
  onSelectAll,
  pageSize = 10,
  showPagination = true,
  forceVisibleScrollbar = false,
  showSearch = true,
  searchPlaceholder = "Rechercher...",
  searchFields,
  emptyMessage = "Aucune donnée à afficher.",
  className,
  isLoading = false,
  loadingRows = 5,
  stickyHeader = true,
  maxBodyHeight,
  fixedHeight,
  reorderable = false,
  onReorder,
  dragContext,
  comfortable = false,
  compact = false,
  bare = false,
  disableHorizontalScroll = true,
  onHeaderContextMenu,
  extraHeader,
  onColumnsChange,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [columns, setColumns] = useState<Column<T>[]>(initialColumns);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const rangeDragRef = useRef<{
    pointerId: number;
    kind: "selection" | "action";
    action?: string;
    startIndex: number;
    lastIndex: number;
    desired: boolean;
    original: Map<number, boolean>;
    startX: number;
    startY: number;
    x: number;
    y: number;
    moved: boolean;
    applied: boolean;
  } | null>(null);
  const rangeScrollerRef = useRef<EdgeScroller | null>(null);
  const suppressRangeClickRef = useRef(false);
  const originalUserSelectRef = useRef<string | null>(null);

  const resizingCol = useRef<string | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const resizeScrollerRef = useRef<EdgeScroller | null>(null);

  const [draggedColKey, setDraggedColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const [containerWidth, setContainerWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let frameId: number;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          const target = entry.target as HTMLElement;
          setContainerWidth(Math.round(target.offsetWidth));
        });
      }
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  const [internalDraggingId, setInternalDraggingId] = useState<string | null>(null);
  const [internalDragOverId, setInternalDragOverId] = useState<string | null>(null);

  const draggingId = dragContext ? dragContext.draggingId : internalDraggingId;
  const dragOverId = dragContext ? dragContext.dragOverId : internalDragOverId;
  const setDragging = dragContext ? dragContext.setDragging : setInternalDraggingId;
  const setDragOver = dragContext ? dragContext.setDragOver : setInternalDragOverId;

  useEffect(() => installDragEdgeAutoScroll(), []);
  useEffect(() => {
    return () => {
      rangeScrollerRef.current?.stop();
      resizeScrollerRef.current?.stop();
    };
  }, []);

  const resetDragStateRef = useRef(() => {});
  resetDragStateRef.current = () => {
    setDragging(null);
    setDragOver(null);
    setDraggedColKey(null);
    setDragOverColKey(null);
    setDropSide(null);
  };
  const dragActive = draggingId !== null || draggedColKey !== null;
  useEffect(() => {
    if (!dragActive) return;
    let armed = false;
    const timer = window.setTimeout(() => {
      armed = true;
    }, 150);
    const reset = () => resetDragStateRef.current();
    const onPointerMove = () => {
      if (armed) reset();
    };
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("pointermove", onPointerMove);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("dragend", reset);
      window.removeEventListener("drop", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [dragActive]);

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

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const rangeRowsRef = useRef(paginatedData);
  const rangeSelectedIdsRef = useRef(selectedIds);
  const rangeSelectRowRef = useRef(onSelectRow);
  const rangeSelectRowsRef = useRef(onSelectRange);
  const rangeActionRef = useRef(onRangeAction);
  rangeRowsRef.current = paginatedData;
  rangeSelectedIdsRef.current = selectedIds;
  rangeSelectRowRef.current = onSelectRow;
  rangeSelectRowsRef.current = onSelectRange;
  rangeActionRef.current = onRangeAction;

  const findRangeRowIndexRef = useRef<(y: number) => number | null>(() => null);
  findRangeRowIndexRef.current = (y) => {
    const container = scrollContainerRef.current;
    if (!container) return null;
    const rows = container.querySelectorAll<HTMLTableRowElement>("tr[data-row-index]");
    if (rows.length === 0) return null;
    const headBottom = container.querySelector("thead")?.getBoundingClientRect().bottom ?? 0;
    let previous: number | null = null;
    for (const row of Array.from(rows)) {
      const rect = row.getBoundingClientRect();
      if (rect.bottom <= headBottom) continue;
      const index = Number(row.dataset.rowIndex);
      if (!Number.isInteger(index) || index < 0 || index >= rangeRowsRef.current.length) continue;
      if (y < rect.top) return previous ?? index;
      if (y < rect.bottom) return index;
      previous = index;
    }
    return previous;
  };

  const applyRangeAtRef = useRef<(index: number) => void>(() => {});
  applyRangeAtRef.current = (index) => {
    const drag = rangeDragRef.current;
    if (!drag || index === drag.lastIndex) return;

    const first = Math.min(drag.startIndex, index);
    const last = Math.max(drag.startIndex, index);
    const previousFirst = Math.min(drag.startIndex, drag.lastIndex);
    const previousLast = Math.max(drag.startIndex, drag.lastIndex);
    const updates: { id: string; active: boolean }[] = [];

    for (
      let rowIndex = Math.min(first, previousFirst);
      rowIndex <= Math.max(last, previousLast);
      rowIndex++
    ) {
      const id = keyExtractor(rangeRowsRef.current[rowIndex]);
      const inRange = rowIndex >= first && rowIndex <= last;
      const active = inRange ? drag.desired : drag.original.get(rowIndex);
      const previouslyInRange =
        drag.applied && rowIndex >= previousFirst && rowIndex <= previousLast;
      const previousActive = previouslyInRange ? drag.desired : drag.original.get(rowIndex);
      if (active !== undefined && active !== previousActive) updates.push({ id, active });
    }

    if (drag.kind === "selection") {
      const selectionUpdates = updates.map(({ id, active }) => ({ id, selected: active }));
      if (rangeSelectRowsRef.current) {
        rangeSelectRowsRef.current(selectionUpdates);
      } else {
        selectionUpdates.forEach(({ id, selected }) => rangeSelectRowRef.current?.(id, selected));
      }
    } else {
      updates.forEach(({ id, active }) => rangeActionRef.current?.(drag.action!, id, active));
    }

    drag.lastIndex = index;
    drag.moved = true;
    drag.applied = true;
  };

  if (!rangeScrollerRef.current) {
    rangeScrollerRef.current = createEdgeScroller({
      axes: "y",
      onScroll: () => {
        const drag = rangeDragRef.current;
        if (!drag?.moved) return;
        const index = findRangeRowIndexRef.current(drag.y);
        if (index !== null) applyRangeAtRef.current(index);
      },
    });
  }

  const handleRangePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType !== "mouse") return;
    const target = event.target as HTMLElement;
    const control = target.closest<HTMLElement>("[data-range-select], [data-range-action]");
    const row = control?.closest<HTMLTableRowElement>("tr[data-row-index]");
    if (!control || !row) return;

    const index = Number(row.dataset.rowIndex);
    if (!Number.isInteger(index) || index < 0 || index >= paginatedData.length) return;

    const action = control.dataset.rangeAction;
    const kind = action ? "action" : "selection";
    if ((kind === "selection" && !selectable) || (kind === "action" && !onRangeAction)) return;

    const original = new Map<number, boolean>();
    scrollContainerRef.current
      ?.querySelectorAll<HTMLTableRowElement>("tr[data-row-index]")
      .forEach((visibleRow) => {
        const rowIndex = Number(visibleRow.dataset.rowIndex);
        const id = keyExtractor(rangeRowsRef.current[rowIndex]);
        if (kind === "selection") {
          original.set(rowIndex, rangeSelectedIdsRef.current?.has(id) ?? false);
        } else {
          const actionControl = Array.from(
            visibleRow.querySelectorAll<HTMLElement>("[data-range-action]"),
          ).find((element) => element.dataset.rangeAction === action);
          original.set(rowIndex, actionControl?.dataset.rangeActive === "true");
        }
      });

    const active =
      kind === "selection"
        ? (rangeSelectedIdsRef.current?.has(keyExtractor(rangeRowsRef.current[index])) ?? false)
        : control.dataset.rangeActive === "true";
    rangeDragRef.current = {
      pointerId: event.pointerId,
      kind,
      action,
      startIndex: index,
      lastIndex: index,
      desired: !active,
      original,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      applied: false,
    };
  };

  useEffect(() => {
    const restoreUserSelect = () => {
      if (originalUserSelectRef.current !== null) {
        document.body.style.userSelect = originalUserSelectRef.current;
        originalUserSelectRef.current = null;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = rangeDragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      drag.x = event.clientX;
      drag.y = event.clientY;
      if (!drag.moved && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 4) return;
      if (!drag.moved) originalUserSelectRef.current = document.body.style.userSelect;
      drag.moved = true;
      document.body.style.userSelect = "none";
      event.preventDefault();

      const index = findRangeRowIndexRef.current(drag.y);
      if (index !== null) applyRangeAtRef.current(index);

      const container = scrollContainerRef.current;
      if (container) rangeScrollerRef.current?.update(drag.x, drag.y, container);
    };

    const finishRangeDrag = (pointerId: number, suppressClick: boolean) => {
      const drag = rangeDragRef.current;
      if (!drag || pointerId !== drag.pointerId) return;
      rangeDragRef.current = null;
      rangeScrollerRef.current?.stop();
      restoreUserSelect();
      suppressRangeClickRef.current = suppressClick && drag.applied;
      if (suppressRangeClickRef.current) {
        window.setTimeout(() => {
          suppressRangeClickRef.current = false;
        }, 0);
      }
    };

    const onPointerUp = (event: PointerEvent) => finishRangeDrag(event.pointerId, true);
    const onPointerCancel = (event: PointerEvent) => finishRangeDrag(event.pointerId, true);
    const onWindowBlur = () => {
      const drag = rangeDragRef.current;
      if (drag) finishRangeDrag(drag.pointerId, false);
    };

    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerCancel, true);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerCancel, true);
      window.removeEventListener("blur", onWindowBlur);
      rangeScrollerRef.current?.stop();
      restoreUserSelect();
    };
  }, []);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const narrowRef = useRef(false);
  if (containerWidth > 0) {
    if (containerWidth < NARROW_ENTER_PX) narrowRef.current = true;
    else if (containerWidth >= NARROW_EXIT_PX) narrowRef.current = false;
  }
  const isNarrow = narrowRef.current;
  const effectiveCompact = compact || isNarrow;

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
    return columns.filter((col) => {
      if (effectiveCompact && col.compactHide) return false;
      return !col.hideOnMobile;
    });
  }, [columns, effectiveCompact]);

  const totalCols = visibleColumns.length + (selectable ? 1 : 0) + (extraHeader ? 1 : 0);

  const headPad = effectiveCompact ? "px-2 py-1.5" : comfortable ? "px-5 py-3.5" : "px-4 py-3";
  const cellPad = effectiveCompact ? "px-2 py-1.5" : comfortable ? "px-5 py-4" : "px-4 py-3.5";

  const estimatedHeaderPx = effectiveCompact ? 34 : comfortable ? 48 : 44;
  const estimatedRowPx = effectiveCompact ? 46 : comfortable ? 70 : 58;
  const effectiveMaxHeight = fixedHeight ? undefined : maxBodyHeight;

  const handleResizeStart = (e: React.MouseEvent, key: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = key;
    startX.current = e.clientX;
    startWidth.current = currentWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startScroll = scrollContainerRef.current?.scrollLeft ?? 0;
    let lastX = e.clientX;
    const applyWidth = () => {
      if (!resizingCol.current) return;
      const scrolled = (scrollContainerRef.current?.scrollLeft ?? 0) - startScroll;
      const newWidth = Math.max(100, startWidth.current + (lastX - startX.current) + scrolled);
      setColWidths((prev) => ({ ...prev, [resizingCol.current!]: newWidth }));
    };

    const scroller = createEdgeScroller({ axes: "x", onScroll: applyWidth });
    resizeScrollerRef.current = scroller;

    const handleMouseMove = (ev: MouseEvent) => {
      lastX = ev.clientX;
      applyWidth();
      const container = scrollContainerRef.current;
      if (container) scroller.update(ev.clientX, ev.clientY, container);
    };

    const handleMouseUp = () => {
      resizingCol.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      scroller.stop();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleColDragStart = (e: React.DragEvent, key: string) => {
    const col = columns.find((c) => c.key === key);
    if (col?.sticky) return;

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/col-key", key);
    setDraggedColKey(key);
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleColDragOver = (e: React.DragEvent<HTMLElement>, col: Column<T>) => {
    if (!draggedColKey) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    let side: "left" | "right" = e.clientX - rect.left < rect.width / 2 ? "left" : "right";
    if (col.sticky && side === "left") side = "right";
    setDragOverColKey(String(col.key));
    setDropSide(side);
  };

  const handleColDrop = (e: React.DragEvent, targetKey: string) => {
    if (!draggedColKey) return;
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData("text/col-key");
    if (!sourceKey || sourceKey === targetKey) {
      setDragOverColKey(null);
      setDropSide(null);
      setDraggedColKey(null);
      return;
    }

    const sourceIdx = columns.findIndex((c) => c.key === sourceKey);
    let targetIdx = columns.findIndex((c) => c.key === targetKey);

    const sourceCol = columns[sourceIdx];
    const targetCol = columns[targetIdx];

    if (sourceCol?.sticky) return;
    if (sourceIdx === -1 || targetIdx === -1) return;

    let effectiveDropSide = dropSide;
    if (targetCol?.sticky && effectiveDropSide === "left") {
      effectiveDropSide = "right";
    }

    const newCols = [...columns];
    const [moved] = newCols.splice(sourceIdx, 1);

    if (effectiveDropSide === "right") {
      targetIdx += 1;
    }
    newCols.splice(targetIdx, 0, moved);

    setColumns(newCols);
    if (onColumnsChange) onColumnsChange(newCols);
    setDraggedColKey(null);
    setDragOverColKey(null);
    setDropSide(null);
  };

  const handleRowDragStart = (e: React.DragEvent<HTMLElement>, id: string) => {
    e.stopPropagation();
    const tr = e.currentTarget.closest("tr");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    if (tr) e.dataTransfer.setDragImage(tr, 24, Math.round(tr.getBoundingClientRect().height / 2));
    setDragging(id);
  };

  const endRowDrag = () => {
    setDragging(null);
    setDragOver(null);
  };

  const rowHandle = (id: string, isDragging: boolean) => {
    if (!reorderable) return null;
    return (
      <span
        role="button"
        aria-label="Déplacer la ligne"
        title="Glisser pour réorganiser"
        data-row-handle
        draggable
        onDragStart={(e) => handleRowDragStart(e, id)}
        onDragEnd={endRowDrag}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute inset-y-0 left-0 z-10 flex cursor-grab items-center justify-center select-none",
          "text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground active:cursor-grabbing",
          "group-hover:opacity-100",
          effectiveCompact ? "w-2.5" : "w-3.5",
          isDragging && "opacity-100",
        )}
      >
        <GripVertical className="size-3.5" />
      </span>
    );
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "isolate rounded-xl border border-border overflow-hidden bg-background shadow-sm flex flex-col h-full",
          className,
        )}
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted-foreground text-[10px] uppercase tracking-[0.12em] sticky top-0 z-50">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 border-b border-border w-8 sticky left-0 bg-background z-50 shadow-[1px_0_0_var(--border)]" />
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "px-4 py-3 border-b border-border font-semibold bg-background shadow-[1px_0_0_var(--border)]",
                      col.className,
                    )}
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
                {extraHeader && (
                  <th className="px-4 py-3 border-b border-border w-12 min-w-[3rem] bg-background shadow-[1px_0_0_var(--border)]" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3.5 sticky left-0 bg-background z-30 shadow-[1px_0_0_var(--border)]">
                      <div className="size-4 rounded bg-secondary" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="px-4 py-3.5 shadow-[1px_0_0_var(--border)]"
                    >
                      <div className="h-4 rounded bg-secondary w-3/4" />
                    </td>
                  ))}
                  {extraHeader && <td className="px-4 py-3.5 shadow-[1px_0_0_var(--border)]" />}
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
          "rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground bg-surface/20 flex items-center justify-center h-full",
          className,
        )}
        style={fixedHeight ? { height: fixedHeight } : undefined}
      >
        {emptyMessage}
      </div>
    );
  }

  const tableInner = (
    <div
      ref={scrollContainerRef}
      onPointerDown={handleRangePointerDown}
      onDragStartCapture={(event) => {
        if (rangeDragRef.current) event.preventDefault();
      }}
      onClickCapture={(event) => {
        if (!suppressRangeClickRef.current) return;
        suppressRangeClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
      className={cn(
        "native-scrollbar relative min-h-0 flex-1 overflow-y-auto",
        forceVisibleScrollbar && "force-visible-scrollbar",
      )}
      style={{
        ...(fixedHeight ? { height: fixedHeight } : {}),
        ...(effectiveMaxHeight ? { maxHeight: effectiveMaxHeight } : {}),
        overflowX: disableHorizontalScroll ? "hidden" : "auto",
        overscrollBehaviorY: "auto",
        overscrollBehaviorX: "contain",
      }}
      data-edge-scroll="table"
    >
      <table
        className={cn(
          "w-full text-left border-separate border-spacing-0",
          effectiveCompact ? "text-xs" : "text-sm",
        )}
        style={{ tableLayout: "fixed", minWidth: "100%", width: "max-content" }}
      >
        <thead
          className={cn("z-[150] bg-background", stickyHeader && "sticky top-0")}
          onContextMenu={onHeaderContextMenu}
          onDragLeave={() => {
            setDragOverColKey(null);
            setDropSide(null);
          }}
        >
          <tr>
            {selectable && (
              <th
                className={cn(
                  headPad,
                  "border-b border-border w-12 bg-background sticky left-0 z-[160] shadow-[1px_0_0_var(--border),2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                )}
              >
                <label
                  className={cn(
                    "relative ml-1 flex size-5 cursor-pointer items-center justify-center rounded-md transition-all",
                    "border border-border active:translate-y-[1px] active:shadow-none",
                    allSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_60%,black)]"
                      : "bg-surface text-muted-foreground shadow-[0_2px_0_var(--border)] hover:bg-surface/80",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="sr-only"
                  />
                  {allSelected && <Check className="size-3.5" strokeWidth={3} />}
                </label>
              </th>
            )}
            {visibleColumns.map((col, idx) => {
              const width = colWidths[String(col.key)] || col.width || 200;
              const Icon = col.icon;
              const isDraggingThis = draggedColKey === col.key;
              const isDraggedOver = dragOverColKey === col.key && !isDraggingThis;

              const showDropLeft = isDraggedOver && dropSide === "left" && !col.sticky;
              const showDropRight = isDraggedOver && dropSide === "right";

              const stickyLeftStyle = selectable ? { left: 48 } : { left: 0 };
              const isLastDataCol = idx === visibleColumns.length - 1 && !extraHeader;

              return (
                <th
                  key={String(col.key)}
                  className={cn(
                    headPad,
                    "group/header relative border-b border-border font-semibold whitespace-nowrap bg-background transition-colors",
                    effectiveCompact && "text-[10px] uppercase tracking-wider",
                    !isLastDataCol && "shadow-[1px_0_0_var(--border)]",
                    col.sticky &&
                      "sticky z-[155] shadow-[1px_0_0_var(--border),2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                    col.className,
                    isDraggingThis && "opacity-40 grayscale",
                  )}
                  style={{ width, ...(col.sticky ? stickyLeftStyle : {}) }}
                  draggable={!col.sticky}
                  onDragStart={(e) => handleColDragStart(e, String(col.key))}
                  onDragEnd={() => {
                    setDraggedColKey(null);
                    setDragOverColKey(null);
                    setDropSide(null);
                  }}
                  onDragOver={(e) => handleColDragOver(e, col)}
                  onDrop={(e) => handleColDrop(e, String(col.key))}
                >
                  {draggedColKey && draggedColKey !== col.key && (
                    <div className="absolute inset-0 z-10" />
                  )}

                  {showDropLeft && (
                    <div className="absolute inset-y-0 -left-[1.5px] w-[3px] bg-primary shadow-[0_0_15px_2px_var(--primary)] z-50" />
                  )}
                  {showDropRight && (
                    <div className="absolute inset-y-0 -right-[1.5px] w-[3px] bg-primary shadow-[0_0_15px_2px_var(--primary)] z-50" />
                  )}

                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {!col.sticky && (
                      <div className="opacity-0 group-hover/header:opacity-100 cursor-grab active:cursor-grabbing transition-opacity absolute left-1 z-20">
                        <GripVertical className="size-3.5 text-muted-foreground/50" />
                      </div>
                    )}

                    <span
                      className={cn("flex items-center gap-1.5 truncate", !col.sticky && "pl-4")}
                    >
                      {Icon && <Icon className="size-3.5 text-muted-foreground shrink-0" />}
                      <span className="truncate">{col.header}</span>
                    </span>
                  </div>

                  <div
                    className="absolute right-0 top-0 bottom-0 w-4 translate-x-1/2 cursor-col-resize z-40 group/resizer"
                    onMouseDown={(e) =>
                      handleResizeStart(e, String(col.key), typeof width === "number" ? width : 200)
                    }
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-border group-hover/resizer:bg-primary group-hover/resizer:shadow-[0_0_8px_var(--primary)] transition-all" />
                  </div>
                </th>
              );
            })}
            {extraHeader && (
              <th
                className={cn(
                  headPad,
                  "border-b border-border bg-background w-12 min-w-[3rem] shadow-[1px_0_0_var(--border)]",
                )}
              >
                <div className="flex items-center justify-center">{extraHeader}</div>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="px-3 py-8 text-center text-muted-foreground text-xs"
              >
                Aucun résultat.
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => {
              const id = keyExtractor(row);
              const isSelected = selectable && selectedIds.has(id);
              const isDragging = draggingId === id;
              const isDragOverRow = dragOverId === id && reorderable && !isDragging;

              return (
                <tr
                  key={id}
                  data-row-index={rowIndex}
                  data-dragging={isDragging ? "true" : undefined}
                  data-drag-over={isDragOverRow ? "true" : undefined}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors duration-200 group relative",
                    rowIndex % 2 === 1 && !isSelected && "bg-surface/25",
                    onRowClick && "cursor-pointer hover:bg-primary/[0.05]",
                    isSelected && "bg-primary/[0.07]",
                    isDragOverRow &&
                      "bg-primary/[0.04] [&>td]:bg-[linear-gradient(var(--primary),var(--primary))] [&>td]:bg-[length:100%_2px] [&>td]:bg-top [&>td]:bg-no-repeat",
                  )}
                  style={{
                    boxShadow: isSelected ? "inset 2px 0 0 0 var(--primary)" : undefined,
                    opacity: isDragging ? 0.4 : undefined,
                  }}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                  onContextMenu={(e) => onRowContextMenu?.(e, id)}
                  onDragOver={(e) => {
                    if (!reorderable || !draggingId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDragEnter={() => {
                    if (!reorderable || !draggingId) return;
                    if (dragOverId !== id) setDragOver(id);
                  }}
                  onDragLeave={(e) => {
                    if (!isDragOverRow) return;
                    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                    setDragOver(null);
                  }}
                  onDrop={(e) => {
                    if (!reorderable || !draggingId) return;
                    e.preventDefault();
                    const fromId = draggingId || e.dataTransfer.getData("text/plain");
                    if (fromId && fromId !== id && onReorder) onReorder(fromId, id);
                    endRowDrag();
                  }}
                >
                  {selectable && (
                    <td
                      data-selection-index={rowIndex}
                      className={cn(
                        cellPad,
                        "sticky left-0 z-20 bg-background shadow-[1px_0_0_var(--border),2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                        isSelected &&
                          "bg-[color-mix(in_oklab,var(--primary)_7%,var(--background))]",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rowHandle(id, isDragging)}
                      <label
                        data-range-select
                        className={cn(
                          "relative ml-1 flex size-5 cursor-pointer items-center justify-center transition-all select-none",
                          "border border-border active:translate-y-[1px] active:shadow-none",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_60%,black)]"
                            : "bg-surface text-muted-foreground shadow-[0_2px_0_var(--border)] hover:bg-surface/80",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(id, !isSelected)}
                          className="sr-only"
                          draggable={false}
                        />
                        {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                      </label>
                    </td>
                  )}
                  {visibleColumns.map((col, idx) => {
                    const width = colWidths[String(col.key)] || col.width || 200;
                    const isDraggingThis = draggedColKey === col.key;
                    const isDraggedOver = dragOverColKey === col.key && !isDraggingThis;

                    const showDropLeft = isDraggedOver && dropSide === "left" && !col.sticky;
                    const showDropRight = isDraggedOver && dropSide === "right";

                    const stickyLeftStyle = selectable ? { left: 48 } : { left: 0 };
                    const isLastDataCol = idx === visibleColumns.length - 1 && !extraHeader;

                    return (
                      <td
                        key={String(col.key)}
                        className={cn(
                          cellPad,
                          "align-middle truncate transition-colors relative",
                          effectiveCompact && "max-w-0",
                          !isLastDataCol && "shadow-[1px_0_0_var(--border)]",
                          col.sticky &&
                            "sticky z-20 bg-background shadow-[1px_0_0_var(--border),2px_0_4px_-2px_rgba(0,0,0,0.1)]",
                          isSelected &&
                            col.sticky &&
                            "bg-[color-mix(in_oklab,var(--primary)_7%,var(--background))]",
                          col.cellClassName,
                          isDraggingThis && "opacity-40 grayscale",
                        )}
                        style={{
                          width,
                          minWidth: width,
                          maxWidth: width,
                          ...(col.sticky ? stickyLeftStyle : {}),
                        }}
                        onDragOver={(e) => handleColDragOver(e, col)}
                        onDrop={(e) => handleColDrop(e, String(col.key))}
                      >
                        {draggedColKey && draggedColKey !== col.key && (
                          <div className="absolute inset-0 z-10" />
                        )}

                        {showDropLeft && (
                          <div className="absolute inset-y-0 -left-[1.5px] w-[3px] bg-primary shadow-[0_0_15px_2px_var(--primary)] z-50" />
                        )}
                        {showDropRight && (
                          <div className="absolute inset-y-0 -right-[1.5px] w-[3px] bg-primary shadow-[0_0_15px_2px_var(--primary)] z-50" />
                        )}

                        {!selectable && idx === 0 && rowHandle(id, isDragging)}
                        {col.accessor ? col.accessor(row) : (row[col.key as keyof T] as ReactNode)}
                      </td>
                    );
                  })}
                  {extraHeader && <td className={cn(cellPad, "shadow-[1px_0_0_var(--border)]")} />}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const tableWrapper = bare ? (
    tableInner
  ) : (
    <div
      className={cn(
        "table-tactile flex min-h-0 flex-1 flex-col overflow-hidden",
        comfortable && !compact && "shadow-md",
      )}
    >
      {tableInner}
    </div>
  );

  return (
    <div
      data-edge-scroll-drag=""
      data-edge-scroll-managed=""
      className={cn("isolate space-y-3 flex min-h-0 flex-col h-full", className)}
    >
      {showSearch && searchFields && (
        <div className="relative max-w-sm shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-3 pr-8 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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

      {tableWrapper}

      {showPagination && filteredData.length > pageSize && (
        <div className="flex shrink-0 items-center justify-between text-xs text-muted-foreground px-2 py-1">
          <span>
            <span className="font-medium text-foreground">
              {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{" "}
            sur {filteredData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="grid size-7 place-items-center rounded-md hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 7) {
                if (p !== 1 && p !== totalPages && Math.abs(currentPage - p) > 1) {
                  if (p === 2 || p === totalPages - 1)
                    return (
                      <span key={p} className="px-1 text-muted-foreground/50">
                        ...
                      </span>
                    );
                  return null;
                }
              }
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={cn(
                    "grid size-7 place-items-center rounded-md text-[11px] font-medium transition-colors",
                    currentPage === p
                      ? "bg-primary text-primary-foreground shadow-[0_1px_0_color-mix(in_oklab,var(--primary)_60%,black)]"
                      : "hover:bg-surface text-muted-foreground",
                  )}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="grid size-7 place-items-center rounded-md hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
