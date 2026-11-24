// frontend/components/people/people-table-layout.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  RotateCcw,
  Settings2,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignRight,
  GripVertical,
  Check,
  MoreHorizontal,
} from "@/components/icons";
import DataTable, { type Column } from "@/components/common/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/core/utils";
import {
  extractTable,
  findTablePosition,
  layoutFromCount,
  newLine,
  normalizeLayout,
  uid,
  type Layout,
  type LayoutSlot,
} from "@/lib/people/layout";

import Eagle from "@academy/assets/classic/Eagle.svg";
import Fox from "@academy/assets/classic/Fox.svg";
import Panda from "@academy/assets/classic/panda.svg";
import RedPanda from "@academy/assets/classic/Red-panda.svg";
import Tiger from "@academy/assets/classic/tiger.svg";
import Wolf from "@academy/assets/classic/Wolf.svg";
import AstralOwl from "@academy/assets/collector/Astral-owl.svg";
import FoundingDolphin from "@academy/assets/collector/Founding-dolphin.svg";
import GoldenDolphin from "@academy/assets/collector/Golden-dolphin.svg";
import LunarCat from "@academy/assets/collector/Lunar-cat.svg";
import MosaicTurtle from "@academy/assets/collector/Mosaic-turtle.svg";
import SolarLion from "@academy/assets/collector/Solar-lion.svg";

const FILLER_SVGS = [
  Eagle,
  Fox,
  Panda,
  RedPanda,
  Tiger,
  Wolf,
  AstralOwl,
  FoundingDolphin,
  GoldenDolphin,
  LunarCat,
  MosaicTurtle,
  SolarLion,
];

export function ScrollbarStyles() {
  return (
    <style>{`
      .force-visible-scrollbar::-webkit-scrollbar,
      .force-visible-scrollbar *::-webkit-scrollbar {
        display: block !important;
        width: 12px !important;
        height: 12px !important;
      }
      .force-visible-scrollbar::-webkit-scrollbar-track,
      .force-visible-scrollbar *::-webkit-scrollbar-track {
        background: transparent !important;
      }
      .force-visible-scrollbar::-webkit-scrollbar-thumb,
      .force-visible-scrollbar *::-webkit-scrollbar-thumb {
        display: block !important;
        background-color: color-mix(in oklab, var(--foreground) 45%, transparent) !important;
        border-radius: 9999px !important;
        border: 2px solid transparent !important;
        background-clip: content-box !important;
        min-height: 28px !important;
        min-width: 28px !important;
      }
      .force-visible-scrollbar::-webkit-scrollbar-thumb:hover,
      .force-visible-scrollbar *::-webkit-scrollbar-thumb:hover {
        background-color: color-mix(in oklab, var(--foreground) 65%, transparent) !important;
        background-clip: content-box !important;
      }
      .force-visible-scrollbar::-webkit-scrollbar-corner,
      .force-visible-scrollbar *::-webkit-scrollbar-corner {
        background: transparent;
      }
      .force-visible-scrollbar,
      .force-visible-scrollbar * {
        scrollbar-width: auto !important;
        scrollbar-color: auto !important;
      }
    `}</style>
  );
}

const AUTO_SCROLL_MAX_SPEED = 36;
const AUTO_SCROLL_MIN_SPEED = 2;
const AUTO_SCROLL_EASING_POWER = 2;
const AUTO_SCROLL_MAX_THRESHOLD = 250;
const AUTO_SCROLL_MIN_THRESHOLD = 60;
const AUTO_SCROLL_THRESHOLD_RATIO = 0.35;

function computeThreshold(dimension: number): number {
  return Math.max(
    AUTO_SCROLL_MIN_THRESHOLD,
    Math.min(AUTO_SCROLL_MAX_THRESHOLD, dimension * AUTO_SCROLL_THRESHOLD_RATIO),
  );
}

function speedFor(distance: number, threshold: number): number {
  if (threshold <= 0) return 0;
  const t = Math.min(1, Math.max(0, distance / threshold));
  return Math.max(
    AUTO_SCROLL_MIN_SPEED,
    Math.round(Math.pow(t, AUTO_SCROLL_EASING_POWER) * AUTO_SCROLL_MAX_SPEED),
  );
}

export function AutoScrollOnDrag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const stickyLeftRef = useRef(0);

  const velRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    velRef.current.x = 0;
    velRef.current.y = 0;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const el = scrollElRef.current;
    if (!el) {
      rafRef.current = null;
      return;
    }
    const { x: vx, y: vy } = velRef.current;
    if (vx === 0 && vy === 0) {
      rafRef.current = null;
      return;
    }
    el.scrollBy(vx, vy);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const ensureLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const detect = () => {
      scrollElRef.current = null;
      stickyLeftRef.current = 0;

      const all = wrapper.querySelectorAll<HTMLElement>("*");

      for (const el of all) {
        const s = window.getComputedStyle(el);
        if (s.overflowX === "auto" || s.overflowX === "scroll") {
          scrollElRef.current = el;
          break;
        }
      }

      const container = scrollElRef.current;
      if (!container) return;

      const cRect = container.getBoundingClientRect();
      const stickyByLeft = new Map<number, number>();

      for (const el of all) {
        const s = window.getComputedStyle(el);
        if (s.position !== "sticky") continue;

        const leftVal = parseFloat(s.left);
        if (Number.isNaN(leftVal)) continue;

        const r = el.getBoundingClientRect();

        if (r.bottom < cRect.top || r.top > cRect.bottom) continue;

        if (r.left > cRect.right) continue;

        const key = Math.round(r.left);
        const prevRight = stickyByLeft.get(key) ?? Number.NEGATIVE_INFINITY;
        if (r.right > prevRight) stickyByLeft.set(key, r.right);
      }

      let maxRight = cRect.left;
      for (const right of stickyByLeft.values()) {
        if (right > maxRight) maxRight = right;
      }
      stickyLeftRef.current = Math.max(0, maxRight - cRect.left);
    };

    const onDragStart = () => detect();
    const onDragEnd = () => stop();

    wrapper.addEventListener("dragstart", onDragStart, true);
    wrapper.addEventListener("dragend", onDragEnd, true);
    wrapper.addEventListener("drop", onDragEnd, true);

    return () => {
      wrapper.removeEventListener("dragstart", onDragStart, true);
      wrapper.removeEventListener("dragend", onDragEnd, true);
      wrapper.removeEventListener("drop", onDragEnd, true);
      stop();
    };
  }, [stop]);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const el = scrollElRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      const stickyLeft = stickyLeftRef.current;
      const visibleLeft = rect.left + stickyLeft;
      const visibleWidth = Math.max(0, rect.width - stickyLeft);
      const visibleHeight = rect.height;

      if (visibleWidth <= 0 || visibleHeight <= 0) {
        stop();
        return;
      }

      const thrX = computeThreshold(visibleWidth);
      const thrY = computeThreshold(visibleHeight);

      const x = e.clientX - visibleLeft;
      const y = e.clientY - rect.top;

      const canScrollX = el.scrollWidth > el.clientWidth + 2;
      let vx = 0;
      if (canScrollX) {
        if (x < thrX) {
          vx = -speedFor(thrX - x, thrX);
        } else if (x > visibleWidth - thrX) {
          vx = speedFor(x - (visibleWidth - thrX), thrX);
        }
      }

      let vy = 0;
      if (y < thrY) {
        vy = -speedFor(thrY - y, thrY);
      } else if (y > visibleHeight - thrY) {
        vy = speedFor(y - (visibleHeight - thrY), thrY);
      }

      if (vx === 0 && vy === 0) {
        stop();
      } else {
        velRef.current.x = vx;
        velRef.current.y = vy;
        ensureLoop();
      }
    },
    [ensureLoop, stop],
  );

  return (
    <div
      ref={wrapperRef}
      onDragOver={handleDragOver}
      onDragEnd={stop}
      onDrop={stop}
      className={className}
    >
      {children}
    </div>
  );
}

export type MultiTableLayoutProps = {
  leads: any[];
  columns: Column<any>[];
  layout: Layout;
  setLayout: React.Dispatch<React.SetStateAction<Layout>>;
  onManage: () => void;
  tablesInOwnContainer: boolean;
  groupSize: number;
  tableProps: Omit<
    React.ComponentProps<typeof DataTable<any>>,
    "data" | "columns" | "showSearch"
  >;
};

export function MultiTableLayout({
  leads,
  columns,
  layout,
  setLayout,
  onManage,
  tablesInOwnContainer,
  groupSize,
  tableProps,
}: MultiTableLayoutProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const dragContext = useMemo(
    () => ({
      draggingId,
      dragOverId,
      setDragging: setDraggingId,
      setDragOver: setDragOverId,
    }),
    [draggingId, dragOverId],
  );

  const groups = useMemo(() => {
    if (leads.length === 0) return [];
    const result: any[][] = [];
    for (let i = 0; i < leads.length; i += groupSize) {
      result.push(leads.slice(i, i + groupSize));
    }
    return result;
  }, [leads, groupSize]);

  const updateRatio = (lineIdx: number, ratio: number) => {
    setLayout((prev) => {
      const next = prev.map((l) => ({
        ...l,
        slots: l.slots.map((s) => ({ ...s })),
      }));
      if (next[lineIdx]?.slots[0]) {
        next[lineIdx].slots[0] = { ...next[lineIdx].slots[0], ratio };
      }
      return next;
    });
  };

  const handleResize = (e: React.MouseEvent, lineIdx: number) => {
    e.preventDefault();
    const container = (e.target as HTMLElement).closest(".resizable-row");
    if (!container) return;
    const w = container.getBoundingClientRect().width;
    const startX = e.clientX;
    const line = layout[lineIdx];
    if (!line) return;
    const filledSlots = line.slots.filter((s) => s.tableIndex != null);
    const isSingle = filledSlots.length === 1;
    const startRatio = line.slots[0].ratio ?? (isSingle ? 65 : 50);
    const invert = isSingle && line.align === "right";

    const onMove = (ev: MouseEvent) => {
      const raw = ev.clientX - startX;
      const delta = ((invert ? -raw : raw) / w) * 100;
      updateRatio(lineIdx, Math.max(25, Math.min(75, startRatio + delta)));
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setLayout((prev) => {
        const currentLine = prev[lineIdx];
        if (!currentLine) return prev;
        const finalRatio = currentLine.slots[0]?.ratio ?? startRatio;

        if (finalRatio >= 75) {
          const first = currentLine.slots[0];
          if (first?.tableIndex == null) return prev;
          const next = prev.map((l, i) =>
            i === lineIdx
              ? { ...l, size: "large" as const, slots: [{ ...first }] }
              : l,
          );
          return normalizeLayout(next, groups.length);
        }

        if (!isSingle && finalRatio <= 25) {
          const second = currentLine.slots[1];
          if (second?.tableIndex == null) return prev;
          const next = prev.map((l, i) =>
            i === lineIdx
              ? { ...l, size: "large" as const, slots: [{ ...second }] }
              : l,
          );
          return normalizeLayout(next, groups.length);
        }

        return prev;
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const renderResizeHandle = (lineIdx: number) => (
    <div
      onMouseDown={(e) => handleResize(e, lineIdx)}
      className="cursor-ew-resize group relative z-10 flex h-full w-full items-center justify-center hover:bg-primary/10 select-none"
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-border dark:bg-muted-foreground/40 group-hover:bg-primary/60 transition-colors" />
      <div className="relative z-10 flex h-8 w-4 items-center justify-center rounded-md bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col gap-0.5">
          <div className="size-0.5 rounded-full bg-muted-foreground" />
          <div className="size-0.5 rounded-full bg-muted-foreground" />
          <div className="size-0.5 rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );

  if (groups.length === 0) return null;

  const renderTable = (tableIndex: number) => {
    if (tableIndex >= groups.length) return null;
    const content = (
      <>
        <DataTable
          data={groups[tableIndex]}
          columns={columns}
          showSearch={false}
          dragContext={dragContext}
          onHeaderContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onManage();
          }}
          {...tableProps}
        />
        <button
          type="button"
          onClick={onManage}
          className="absolute top-2 right-2 z-20 rounded-md p-1 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
          aria-label="Organiser"
          title="Organiser"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </>
    );
    if (tablesInOwnContainer) {
      return (
        <AutoScrollOnDrag
          key={tableIndex}
          className="relative rounded-xl border border-border bg-surface/30 p-2 shadow-[0_2px_0_var(--border)] overflow-hidden force-visible-scrollbar"
        >
          {content}
        </AutoScrollOnDrag>
      );
    }
    return (
      <AutoScrollOnDrag key={tableIndex} className="relative force-visible-scrollbar">
        {content}
      </AutoScrollOnDrag>
    );
  };

  const renderFiller = (tableIndex: number) => {
    const SvgIcon = FILLER_SVGS[tableIndex % FILLER_SVGS.length];
    return (
      <div
        className="hidden lg:flex relative h-full min-h-[200px] w-full items-center justify-center overflow-hidden rounded-xl"
        aria-hidden="true"
      >
        <img
          src={SvgIcon}
          alt=""
          className="absolute inset-0 h-full w-full object-contain scale-[1.15] opacity-100"
        />
      </div>
    );
  };

  if (groups.length === 1) {
    return (
      <AutoScrollOnDrag className="force-visible-scrollbar">
        <DataTable
          data={groups[0]}
          columns={columns}
          showSearch={false}
          dragContext={dragContext}
          {...tableProps}
        />
      </AutoScrollOnDrag>
    );
  }

  return (
    <div className="space-y-3">
      {layout.map((line, li) => {
        const filled = line.slots.filter(
          (s) => s.tableIndex !== null && s.tableIndex < groups.length,
        );
        if (filled.length === 0) return null;

        if (line.size === "large") {
          const idx = filled[0].tableIndex!;
          return (
            <div key={line.id} className="w-full">
              {renderTable(idx)}
            </div>
          );
        }

        if (filled.length === 1) {
          const idx = filled[0].tableIndex!;
          const isLeft = line.align === "left";
          const ratio = line.slots[0].ratio ?? 65;
          const cols = isLeft ? `${ratio}% 16px 1fr` : `1fr 16px ${ratio}%`;
          return (
            <div key={line.id} className="w-full">
              <div
                className="hidden lg:grid w-full items-stretch relative resizable-row"
                style={{ gridTemplateColumns: cols }}
              >
                {isLeft ? (
                  <>
                    <div className="min-w-0 pr-1.5">{renderTable(idx)}</div>
                    {renderResizeHandle(li)}
                    <div className="min-w-0 pl-1.5">{renderFiller(idx)}</div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 pr-1.5">{renderFiller(idx)}</div>
                    {renderResizeHandle(li)}
                    <div className="min-w-0 pl-1.5">{renderTable(idx)}</div>
                  </>
                )}
              </div>
              <div className="lg:hidden">{renderTable(idx)}</div>
            </div>
          );
        }

        const a = filled[0].tableIndex!;
        const b = filled[1].tableIndex!;
        const ratio = line.slots[0].ratio ?? 50;
        return (
          <div key={line.id} className="w-full">
            <div
              className="hidden lg:grid w-full items-stretch relative resizable-row"
              style={{ gridTemplateColumns: `${ratio}% 16px 1fr` }}
            >
              <div className="min-w-0 pr-1.5">{renderTable(a)}</div>
              {renderResizeHandle(li)}
              <div className="min-w-0 pl-1.5">{renderTable(b)}</div>
            </div>
            <div className="lg:hidden space-y-3">
              {renderTable(a)}
              {renderTable(b)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LayoutEditor({
  open,
  onOpenChange,
  groupsCount,
  layout,
  setLayout,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupsCount: number;
  layout: Layout;
  setLayout: React.Dispatch<React.SetStateAction<Layout>>;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<
    | { kind: "slot"; lineIdx: number; slotIdx: number }
    | {
        kind: "table";
        lineIdx: number;
        slotIdx: number;
        tableIndex: number;
        side: "left" | "right";
      }
    | { kind: "between"; lineIdx: number }
    | { kind: "end" }
    | null
  >(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollVel = useRef({ x: 0, y: 0 });
  const autoScrollRaf = useRef<number | null>(null);

  const stopAutoScroll = useCallback(() => {
    autoScrollVel.current.x = 0;
    autoScrollVel.current.y = 0;
    if (autoScrollRaf.current !== null) {
      cancelAnimationFrame(autoScrollRaf.current);
      autoScrollRaf.current = null;
    }
  }, []);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const startAutoScrollLoop = useCallback(() => {
    if (autoScrollRaf.current !== null) return;
    const tick = () => {
      const el = scrollRef.current;
      if (!el) {
        autoScrollRaf.current = null;
        return;
      }
      const { x: vx, y: vy } = autoScrollVel.current;
      if (vx === 0 && vy === 0) {
        autoScrollRaf.current = null;
        return;
      }
      el.scrollBy(vx, vy);
      autoScrollRaf.current = requestAnimationFrame(tick);
    };
    autoScrollRaf.current = requestAnimationFrame(tick);
  }, []);

  const handleAutoScroll = useCallback(
    (e: React.DragEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const visibleWidth = rect.width;
      const visibleHeight = rect.height;
      if (visibleWidth <= 0 || visibleHeight <= 0) return;

      const thrX = computeThreshold(visibleWidth);
      const thrY = computeThreshold(visibleHeight);

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const canScrollX = el.scrollWidth > el.clientWidth + 2;
      let vx = 0;
      if (canScrollX) {
        if (x < thrX) {
          vx = -speedFor(thrX - x, thrX);
        } else if (x > visibleWidth - thrX) {
          vx = speedFor(x - (visibleWidth - thrX), thrX);
        }
      }

      let vy = 0;
      if (y < thrY) {
        vy = -speedFor(thrY - y, thrY);
      } else if (y > visibleHeight - thrY) {
        vy = speedFor(y - (visibleHeight - thrY), thrY);
      }

      if (vx === 0 && vy === 0) {
        stopAutoScroll();
      } else {
        autoScrollVel.current.x = vx;
        autoScrollVel.current.y = vy;
        startAutoScrollLoop();
      }
    },
    [startAutoScrollLoop, stopAutoScroll],
  );

  const reset = () => setLayout(layoutFromCount(groupsCount));

  const setSize = (lineId: string, size: "large" | "small") => {
    setLayout((prev) => {
      const lineIdx = prev.findIndex((l) => l.id === lineId);
      if (lineIdx < 0) return prev;
      const line = prev[lineIdx];

      if (size === "small") {
        return normalizeLayout(
          prev.map((l) => (l.id === lineId ? { ...l, size: "small" as const } : l)),
          groupsCount,
        );
      }

      const filled = line.slots.filter((s) => s.tableIndex !== null);
      const first = filled[0] ?? { tableIndex: null };
      const rest = filled.slice(1);

      const next = prev.map((l) =>
        l.id === lineId ? { ...l, size: "large" as const, slots: [{ ...first }] } : l,
      );
      const newLines = rest.map((s) => newLine(s.tableIndex));

      return normalizeLayout([...next, ...newLines], groupsCount);
    });
  };

  const setAlign = (lineId: string, align: "left" | "right") => {
    setLayout((prev) =>
      normalizeLayout(
        prev.map((l) => (l.id === lineId ? { ...l, align } : l)),
        groupsCount,
      ),
    );
  };

  const performDrop = () => {
    stopAutoScroll();
    if (dragIdx === null || !dropTarget) {
      setDropTarget(null);
      setDragIdx(null);
      return;
    }
    const target = dropTarget;
    setDropTarget(null);
    setDragIdx(null);

    let next = layout.map((l) => ({
      ...l,
      slots: l.slots.map((s) => ({ ...s })),
    }));
    const from = findTablePosition(next, dragIdx);
    if (!from) return;

    if (target.kind === "slot") {
      next = extractTable(next, dragIdx);
      const lineIdx = Math.min(target.lineIdx, next.length - 1);
      if (lineIdx < 0 || !next[lineIdx]) {
        next.push({
          id: `line-${uid()}`,
          size: "small",
          align: "left",
          slots: [{ tableIndex: dragIdx }],
        });
      } else {
        const line = next[lineIdx];
        if (target.slotIdx < line.slots.length) {
          line.slots[target.slotIdx] = { ...line.slots[target.slotIdx], tableIndex: dragIdx };
        } else if (line.slots.length < 2) {
          line.slots.push({ tableIndex: dragIdx });
          line.size = "small";
        } else {
          next.splice(lineIdx + 1, 0, {
            id: `line-${uid()}`,
            size: "small",
            align: "left",
            slots: [{ tableIndex: dragIdx }],
          });
        }
      }
    } else if (target.kind === "table") {
      const to = findTablePosition(next, target.tableIndex);
      if (!to) return;
      if (to.lineIdx === from.lineIdx) {
        const tmp = next[to.lineIdx].slots[to.slotIdx];
        next[to.lineIdx].slots[to.slotIdx] = next[from.lineIdx].slots[from.slotIdx];
        next[from.lineIdx].slots[from.slotIdx] = tmp;
      } else {
        const targetLine = next[to.lineIdx];
        const fromLine = next[from.lineIdx];
        if (targetLine.size === "large" || targetLine.slots.length === 1) {
          const targetTableIdx = targetLine.slots[0].tableIndex;
          if (targetTableIdx === null) return;
          const bSlot: LayoutSlot = { tableIndex: targetTableIdx };
          const aSlot: LayoutSlot = { tableIndex: dragIdx };
          targetLine.slots = target.side === "left" ? [aSlot, bSlot] : [bSlot, aSlot];
          targetLine.size = "small";
          fromLine.slots[from.slotIdx] = {
            ...fromLine.slots[from.slotIdx],
            tableIndex: null,
          };
        } else {
          const tmp = targetLine.slots[to.slotIdx];
          targetLine.slots[to.slotIdx] = { ...fromLine.slots[from.slotIdx] };
          fromLine.slots[from.slotIdx] = tmp;
        }
      }
    } else if (target.kind === "between") {
      next = extractTable(next, dragIdx);
      const insertAt = Math.min(target.lineIdx, next.length);
      next.splice(insertAt, 0, {
        id: `line-${uid()}`,
        size: "small",
        align: "left",
        slots: [{ tableIndex: dragIdx }],
      });
    } else if (target.kind === "end") {
      next = extractTable(next, dragIdx);
      next.push({
        id: `line-${uid()}`,
        size: "small",
        align: "left",
        slots: [{ tableIndex: dragIdx }],
      });
    }

    setLayout(normalizeLayout(next, groupsCount));
  };

  const ejectTable = (tableIndex: number) => {
    const next = extractTable(layout, tableIndex);
    next.push({
      id: `line-${uid()}`,
      size: "small",
      align: "left",
      slots: [{ tableIndex }],
    });
    setLayout(normalizeLayout(next, groupsCount));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ScrollbarStyles />
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl border-2 border-border shadow-[0_4px_0_var(--border)]">
        <header className="flex shrink-0 flex-col gap-1 border-b border-border py-4 pl-5 pr-14 bg-surface/10">
          <DialogTitle className="font-display text-xl italic flex items-center gap-2">
            <Settings2 className="size-4 text-primary" />
            Organiser les tableaux
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choisissez Grand/Petit et Gauche/Droite par ligne. Glissez un tableau sur un autre
            pour les mettre côte à côte.
          </DialogDescription>
        </header>

        <div
          ref={scrollRef}
          onDragOver={(e) => {
            if (dragIdx !== null) {
              e.preventDefault();
              handleAutoScroll(e);
            }
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (!related || !e.currentTarget.contains(related)) {
              stopAutoScroll();
            }
          }}
          onDragEnd={stopAutoScroll}
          onDrop={stopAutoScroll}
          className="force-visible-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 bg-background"
        >
          {groupsCount <= 1 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ajoutez plus de lignes par page pour organiser plusieurs tableaux.
            </p>
          ) : (
            <div className="space-y-1.5">
              {layout.map((line, li) => {
                const isLarge = line.size === "large";
                const filledCount = line.slots.filter((s) => s.tableIndex !== null).length;
                const hasTwo = !isLarge && filledCount === 2;

                return (
                  <div key={line.id}>
                    <div
                      onDragOver={(e) => {
                        if (dragIdx !== null) {
                          e.preventDefault();
                          setDropTarget({ kind: "between", lineIdx: li });
                        }
                      }}
                      onDragLeave={() => {
                        if (dropTarget?.kind === "between" && dropTarget.lineIdx === li) {
                          setDropTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        performDrop();
                      }}
                      className={cn(
                        "h-1.5 rounded transition-all",
                        dropTarget?.kind === "between" &&
                          dropTarget.lineIdx === li &&
                          "h-4 bg-primary/40",
                      )}
                    />

                    <div
                      className={cn(
                        "rounded-xl border-2 p-2 transition-colors",
                        isLarge
                          ? "border-primary/40 bg-primary/[0.03]"
                          : hasTwo
                            ? "border-primary/30 bg-primary/[0.03]"
                            : "border-dashed border-border bg-surface/20",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 pb-1.5 border-b border-border/40">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Ligne {li + 1}
                        </span>
                        <span className="ml-auto flex items-center gap-1">
                          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                            <button
                              type="button"
                              onClick={() => setSize(line.id, "large")}
                              className={cn(
                                "px-1.5 py-0.5 text-[10px] rounded inline-flex items-center gap-1 transition-colors",
                                isLarge
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Maximize2 className="size-3" /> Grand
                            </button>
                            <button
                              type="button"
                              onClick={() => setSize(line.id, "small")}
                              className={cn(
                                "px-1.5 py-0.5 text-[10px] rounded inline-flex items-center gap-1 transition-colors",
                                !isLarge
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <Minimize2 className="size-3" /> Petit
                            </button>
                          </div>

                          {!isLarge && filledCount === 1 && (
                            <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                              <button
                                type="button"
                                onClick={() => setAlign(line.id, "left")}
                                className={cn(
                                  "px-1.5 py-0.5 text-[10px] rounded inline-flex items-center gap-1 transition-colors",
                                  line.align === "left"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <AlignLeft className="size-3" /> Gauche
                              </button>
                              <button
                                type="button"
                                onClick={() => setAlign(line.id, "right")}
                                className={cn(
                                  "px-1.5 py-0.5 text-[10px] rounded inline-flex items-center gap-1 transition-colors",
                                  line.align === "right"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <AlignRight className="size-3" /> Droite
                              </button>
                            </div>
                          )}
                        </span>
                      </div>

                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: hasTwo ? "1fr 1fr" : "1fr",
                        }}
                      >
                        {line.slots.map((slot, si) => {
                          if (isLarge && si > 0) return null;
                          if (slot.tableIndex === null) {
                            const isTarget =
                              dropTarget?.kind === "slot" &&
                              dropTarget.lineIdx === li &&
                              dropTarget.slotIdx === si;
                            return (
                              <div
                                key={`slot-${line.id}-${si}`}
                                onDragOver={(e) => {
                                  if (dragIdx !== null) {
                                    e.preventDefault();
                                    setDropTarget({ kind: "slot", lineIdx: li, slotIdx: si });
                                  }
                                }}
                                onDragLeave={() => {
                                  if (isTarget) setDropTarget(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  performDrop();
                                }}
                                className={cn(
                                  "h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-[10px] transition-colors",
                                  isTarget
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground/60",
                                )}
                              >
                                Glisser un tableau ici
                              </div>
                            );
                          }

                          const tIdx = slot.tableIndex;
                          const isDragging = dragIdx === tIdx;
                          const isTarget =
                            dropTarget?.kind === "table" && dropTarget.tableIndex === tIdx;

                          return (
                            <div
                              key={`slot-${line.id}-${si}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", String(tIdx));
                                setDragIdx(tIdx);
                              }}
                              onDragEnd={() => {
                                setDragIdx(null);
                                setDropTarget(null);
                                stopAutoScroll();
                              }}
                              onDragOver={(e) => {
                                if (dragIdx === null || dragIdx === tIdx) return;
                                e.preventDefault();
                                const rect = (
                                  e.currentTarget as HTMLElement
                                ).getBoundingClientRect();
                                const side: "left" | "right" =
                                  e.clientX < rect.left + rect.width / 2 ? "left" : "right";
                                setDropTarget({
                                  kind: "table",
                                  lineIdx: li,
                                  slotIdx: si,
                                  tableIndex: tIdx,
                                  side,
                                });
                              }}
                              onDragLeave={() => {
                                if (isTarget) setDropTarget(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                performDrop();
                              }}
                              className={cn(
                                "relative h-14 rounded-lg border-2 flex items-center justify-between px-3 gap-2 transition-all cursor-grab active:cursor-grabbing",
                                isDragging && "opacity-30",
                                isTarget &&
                                  "border-primary bg-primary/[0.08] shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_35%,transparent)]",
                                !isDragging &&
                                  !isTarget &&
                                  "border-primary/40 bg-primary/[0.04] hover:bg-primary/[0.08]",
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical className="size-3.5 text-muted-foreground/60 shrink-0" />
                                <span className="grid size-6 shrink-0 place-items-center rounded bg-primary/15 font-mono text-[10px] font-bold text-primary">
                                  {tIdx + 1}
                                </span>
                                <span className="text-xs font-medium truncate">
                                  Tableau {tIdx + 1}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  ejectTable(tIdx);
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-destructive transition-colors"
                                title="Retirer dans une ligne séparée"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                onDragOver={(e) => {
                  if (dragIdx !== null) {
                    e.preventDefault();
                    setDropTarget({ kind: "end" });
                  }
                }}
                onDragLeave={() => {
                  if (dropTarget?.kind === "end") setDropTarget(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  performDrop();
                }}
                className={cn(
                  "h-3 rounded transition-all mt-2",
                  dropTarget?.kind === "end" && "h-6 bg-primary/40",
                )}
              />
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-surface/10 px-5 py-3">
          <button
            type="button"
            onClick={reset}
            disabled={groupsCount <= 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-surface transition-colors shadow-[0_1px_0_var(--border)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="size-3.5" /> Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Check className="size-3.5" /> Terminé
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
