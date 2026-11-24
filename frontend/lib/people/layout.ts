// frontend/lib/people/layout.ts

export type LayoutSlot = {
  tableIndex: number | null;
  ratio?: number;
};

export type LayoutLine = {
  id: string;
  size: "large" | "small";
  align: "left" | "right";
  slots: LayoutSlot[];
};

export type Layout = LayoutLine[];

export const TABLE_LAYOUT_STORAGE_KEY = "leadcortex-people-table-layout-v1";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newLine(tableIndex: number | null): LayoutLine {
  return {
    id: `line-${uid()}`,
    size: "small",
    align: "left",
    slots: [{ tableIndex }],
  };
}

export function layoutFromCount(count: number): Layout {
  return Array.from({ length: count }, (_, i) => newLine(i));
}

export function findTablePosition(
  layout: Layout,
  tableIndex: number,
): { lineIdx: number; slotIdx: number } | null {
  for (let li = 0; li < layout.length; li++) {
    for (let si = 0; si < layout[li].slots.length; si++) {
      if (layout[li].slots[si].tableIndex === tableIndex) {
        return { lineIdx: li, slotIdx: si };
      }
    }
  }
  return null;
}

export function extractTable(layout: Layout, tableIndex: number): Layout {
  const next = layout.map((line) => ({
    ...line,
    slots: line.slots.map((s) =>
      s.tableIndex === tableIndex ? { ...s, tableIndex: null } : s,
    ),
  }));
  return next.filter((line) => line.slots.some((s) => s.tableIndex !== null));
}

export function normalizeLayout(layout: Layout, count: number): Layout {
  const seen = new Set<number>();
  const result: Layout = [];
  for (const line of layout) {
    if (!line.slots.length) continue;
    const size: "large" | "small" = line.size === "large" ? "large" : "small";
    const align: "left" | "right" = line.align === "right" ? "right" : "left";
    const maxSlots = size === "large" ? 1 : 2;
    const slots = line.slots.slice(0, maxSlots).map((s) => {
      if (s.tableIndex === null) return { ...s };
      if (s.tableIndex < 0 || s.tableIndex >= count || seen.has(s.tableIndex)) {
        return { tableIndex: null };
      }
      seen.add(s.tableIndex);
      return { ...s };
    });
    if (slots.some((s) => s.tableIndex !== null)) {
      result.push({ ...line, size, align, slots });
    }
  }
  for (let i = 0; i < count; i++) {
    if (!seen.has(i)) result.push(newLine(i));
  }
  return result;
}

function migrateLegacy(stored: unknown): Layout {
  const s = stored as { tableOrder?: number[]; tableStates?: Array<Record<string, unknown>> };
  const order = Array.isArray(s?.tableOrder) ? s.tableOrder : [];
  const states = Array.isArray(s?.tableStates) ? s.tableStates : [];
  if (!order.length) return [];
  const layout: Layout = [];
  let pending: LayoutLine | null = null;
  for (const idx of order) {
    const st = states[idx] ?? { size: "large", align: "left" };
    const isLarge = st.size === "large";
    const forceBreak = st.forceBreak === true;
    const align: "left" | "right" = st.align === "right" ? "right" : "left";

    if (isLarge) {
      if (pending) {
        layout.push(pending);
        pending = null;
      }
      layout.push({
        id: `line-${uid()}`,
        size: "large",
        align: "left",
        slots: [{ tableIndex: idx }],
      });
    } else if (forceBreak) {
      if (pending) {
        layout.push(pending);
        pending = null;
      }
      layout.push({
        id: `line-${uid()}`,
        size: "small",
        align,
        slots: [{ tableIndex: idx, ratio: st.ratio as number | undefined }],
      });
    } else if (!pending) {
      pending = {
        id: `line-${uid()}`,
        size: "small",
        align: "left",
        slots: [{ tableIndex: idx, ratio: st.ratio as number | undefined }],
      };
    } else {
      pending.slots.push({ tableIndex: idx, ratio: st.ratio as number | undefined });
      layout.push(pending);
      pending = null;
    }
  }
  if (pending) layout.push(pending);
  return layout;
}

export function readLayout(): Layout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TABLE_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Record<string, unknown> | null;
    if (!stored || typeof stored !== "object") return null;
    if (Array.isArray(stored.layout)) return stored.layout as Layout;
    if (Array.isArray(stored.tableOrder)) return migrateLegacy(stored);
    return null;
  } catch {
    return null;
  }
}

export function writeLayout(layout: Layout): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TABLE_LAYOUT_STORAGE_KEY, JSON.stringify({ layout }));
  } catch {
  }
}
