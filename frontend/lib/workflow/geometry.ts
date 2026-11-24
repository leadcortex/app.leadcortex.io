// frontend/lib/workflow/geometry.ts

import {
  BLOCKS,
  CATEGORIES,
  type BlockDef,
  type CategoryDef,
  type CategoryKey,
} from "@/data/workflow-blocks-catalog";
import type { WComment, WDoc, WEdge, WNode } from "./types";

export const NODE_W = 268;

export const NODE_MIN_W = 220;
export const NODE_MAX_W = 760;
export const HEADER_H = 42;
export const SUB_H = 24;
export const FIELD_H = 30;
export const FIELDS_PAD = 8;
export const PORTS_PAD = 10;
export const PORT_GAP = 26;
export const BOTTOM_PAD = 12;
export const MAX_INLINE_FIELDS = 3;

export const BLOCK_DRAG_MIME = "application/x-leadcortex-block-id";

export const blockMap: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
export const categoryMap: Record<CategoryKey, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryDef>;

let idSeq = 0;

export const uid = (p = "n") => `${p}_${++idSeq}`;

export const NOTE_MIN_H = 56;
export const NOTE_MAX_H = 420;
export const NOTE_PAD = 10;
export const NOTE_TOP_GAP = 14;
export const NOTE_TOP_GAP_CODE = 0;

export function noteField(n: WNode) {
  if (n.collapsed) return null;
  const block = blockMap[n.blockId];
  if (!block) return null;
  const key =
    block.noteField ??
    block.configFields.find((f) => f.type === "textarea" || f.type === "code")?.key;
  if (!key) return null;
  return block.configFields.find((f) => f.key === key) ?? null;
}

export function codeField(n: WNode) {
  const block = blockMap[n.blockId];
  return block?.configFields.find((f) => f.type === "code") ?? null;
}

export const isCodeNode = (n: WNode) => Boolean(codeField(n));

export const nodeWidth = (n: WNode) =>
  Math.round(Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, n.w ?? NODE_W)));

export function fieldsAreaHeight(n: WNode) {
  const f = inlineFields(n).length;
  if (!f) return 0;
  return n.fieldsH ?? FIELDS_PAD + f * FIELD_H;
}

export function noteAreaHeight(n: WNode) {
  const note = noteField(n);
  if (!note) return 0;
  const h = typeof n.noteH === "number" ? n.noteH : NOTE_MIN_H + 24;
  return Math.min(NOTE_MAX_H, Math.max(NOTE_MIN_H, h)) + NOTE_PAD;
}

export function inlineFields(n: WNode) {
  if (n.collapsed) return [];
  const block = blockMap[n.blockId];
  const note = noteField(n);
  return (block?.configFields ?? [])
    .filter((f) => !note || f.key !== note.key)
    .slice(0, block?.inlineLimit ?? MAX_INLINE_FIELDS);
}

export function nextDynamicInputLabel(existingLabels: string[]): string {
  const last = existingLabels[existingLabels.length - 1] ?? "";
  const numMatch = last.match(/^(.*?)(\d+)$/);
  if (numMatch) {
    const [, prefix, numStr] = numMatch;
    return `${prefix}${parseInt(numStr, 10) + 1}`;
  }
  const letterMatch = last.match(/^(.*\s)([A-Za-z])$/);
  if (letterMatch) {
    const [, prefix, letter] = letterMatch;
    const isUpper = letter === letter.toUpperCase();
    const nextCode = letter.toUpperCase().charCodeAt(0) + 1;
    if (nextCode <= 90) {
      const nextLetter = String.fromCharCode(nextCode);
      return `${prefix}${isUpper ? nextLetter : nextLetter.toLowerCase()}`;
    }
  }
  return `Entrée ${existingLabels.length + 1}`;
}

export const portRows = (n: WNode) => {
  const extra = !n.collapsed && blockMap[n.blockId]?.dynamicInputs ? 1 : 0;
  return Math.max(n.inputs.length + extra, n.outputs.length, 1);
};

export function bodyHeight(n: WNode) {
  const hasNote = Boolean(noteField(n));
  const topGap = isCodeNode(n) ? NOTE_TOP_GAP_CODE : NOTE_TOP_GAP;
  return (
    HEADER_H +
    (n.collapsed ? 0 : SUB_H) +
    fieldsAreaHeight(n) +
    (hasNote ? topGap : 0) +
    noteAreaHeight(n)
  );
}

export const portsTop = (n: WNode) => bodyHeight(n) + PORTS_PAD;

export const nodeHeight = (n: WNode) =>
  n.collapsed ? HEADER_H + 8 : portsTop(n) + portRows(n) * PORT_GAP + BOTTOM_PAD;

export function portRowY(n: WNode, i: number) {
  if (n.collapsed) return HEADER_H / 2 + 4;
  return portsTop(n) + i * PORT_GAP + PORT_GAP / 2;
}

export const inputPos = (n: WNode, i: number) => ({ x: n.x, y: n.y + portRowY(n, i) });
export const outputPos = (n: WNode, i: number) => ({
  x: n.x + nodeWidth(n),
  y: n.y + portRowY(n, i),
});

export const portAnchor = (n: WNode, portId: string, side: "in" | "out") => {
  const list = side === "in" ? n.inputs : n.outputs;
  const idx = Math.max(
    0,
    list.findIndex((p) => p.id === portId),
  );
  return side === "in" ? inputPos(n, idx) : outputPos(n, idx);
};

export function bezier(a: { x: number; y: number }, b: { x: number; y: number }) {
  const d = Math.min(200, Math.max(56, Math.abs(b.x - a.x) * 0.55));
  return `M ${a.x} ${a.y} C ${a.x + d} ${a.y}, ${b.x - d} ${b.y}, ${b.x} ${b.y}`;
}

export type Rect = { id: string; x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

const CABLE_CLEARANCE = 20;
const CABLE_FAN_SPREAD = 13;

function cubicPoint(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

function requiredBulge(a: Pt, c1: Pt, c2: Pt, b: Pt, obstacles: Rect[]): number {
  if (!obstacles.length) return 0;
  let push = 0;
  const samples = 14;
  for (let i = 1; i < samples; i++) {
    const p = cubicPoint(a, c1, c2, b, i / samples);
    for (const r of obstacles) {
      const left = r.x - CABLE_CLEARANCE;
      const right = r.x + r.w + CABLE_CLEARANCE;
      const top = r.y - CABLE_CLEARANCE;
      const bottom = r.y + r.h + CABLE_CLEARANCE;
      if (p.x <= left || p.x >= right || p.y <= top || p.y >= bottom) continue;
      const pushUp = top - p.y;
      const pushDown = bottom - p.y;
      const candidate = Math.abs(pushUp) < Math.abs(pushDown) ? pushUp : pushDown;
      if (Math.abs(candidate) > Math.abs(push)) push = candidate;
    }
  }
  return push;
}

function pickLoopSide(a: Pt, b: Pt, obstacles: Rect[]): 1 | -1 {
  const midY = (a.y + b.y) / 2;
  let above = 0;
  let below = 0;
  for (const r of obstacles) {
    const cy = r.y + r.h / 2;
    if (cy < midY) above++;
    else below++;
  }
  return below <= above ? 1 : -1;
}

export type Cubic = { a: Pt; c1: Pt; c2: Pt; b: Pt };

export type EdgePathOpts = {
  obstacles?: Rect[];
  fanIndex?: number;
  fanCount?: number;
  ignoreObstacles?: boolean;
};

export function edgeSegments(a: Pt, b: Pt, opts: EdgePathOpts = {}): Cubic[] {
  const { fanIndex = 0, fanCount = 1, ignoreObstacles = false } = opts;
  const obstacles = ignoreObstacles ? [] : (opts.obstacles ?? []);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;

  const fanOffset = fanCount > 1 ? (fanIndex - (fanCount - 1) / 2) * CABLE_FAN_SPREAD : 0;
  const start = { x: a.x, y: a.y + fanOffset * 0.4 };

  const horizWeight = Math.min(1, Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) + 1) + 0.3);
  const tension = Math.min(220, Math.max(48, dist * 0.42 * horizWeight));

  const isBackward = dx < NODE_W * 0.35;

  if (!isBackward) {
    let c1 = { x: start.x + tension, y: start.y };
    let c2 = { x: b.x - tension, y: b.y };
    const relevant = obstacles.filter(
      (r) => r.x + r.w >= Math.min(start.x, b.x) - 4 && r.x <= Math.max(start.x, b.x) + 4,
    );
    const bulge = requiredBulge(start, c1, c2, b, relevant);
    if (bulge) {
      c1 = { x: c1.x, y: c1.y + bulge };
      c2 = { x: c2.x, y: c2.y + bulge };
    }
    return [{ a: start, c1, c2, b }];
  }

  const side = pickLoopSide(start, b, obstacles);
  const reach = Math.max(64, tension * 0.75);
  const spread = 44 + Math.abs(fanOffset);
  const loopY = side === 1 ? Math.max(start.y, b.y) + spread : Math.min(start.y, b.y) - spread;

  const p1 = { x: start.x + reach, y: start.y };
  const p2 = { x: start.x + reach, y: loopY };
  const mid = { x: (start.x + b.x) / 2, y: loopY };
  const p3 = { x: b.x - reach, y: loopY };
  const p4 = { x: b.x - reach, y: b.y };

  return [
    { a: start, c1: p1, c2: p2, b: mid },
    { a: mid, c1: p3, c2: p4, b },
  ];
}

export function edgePath(a: Pt, b: Pt, opts: EdgePathOpts = {}): string {
  const segs = edgeSegments(a, b, opts);
  const first = segs[0]!;
  return [
    `M ${first.a.x} ${first.a.y}`,
    ...segs.map((s) => `C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.b.x} ${s.b.y}`),
  ].join(" ");
}

export function samplePath(segs: Cubic[], perSegment = 22): Pt[] {
  const pts: Pt[] = [];
  for (const s of segs)
    for (let i = 0; i <= perSegment; i++)
      pts.push(cubicPoint(s.a, s.c1, s.c2, s.b, i / perSegment));
  return pts;
}

export function edgeHitTest(
  segs: Cubic[],
  rect: { x: number; y: number; w: number; h: number },
  tolerance = 0,
): { point: Pt; distance: number } | null {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  let best: { point: Pt; distance: number } | null = null;
  for (const p of samplePath(segs)) {
    const inside =
      p.x >= rect.x - tolerance &&
      p.x <= rect.x + rect.w + tolerance &&
      p.y >= rect.y - tolerance &&
      p.y <= rect.y + rect.h + tolerance;
    if (!inside) continue;
    const distance = Math.hypot(p.x - cx, p.y - cy);
    if (!best || distance < best.distance) best = { point: p, distance };
  }
  return best;
}

export function makeNode(blockId: string, x: number, y: number): WNode {
  const block = blockMap[blockId] ?? BLOCKS[0]!;
  const config: Record<string, string | number | boolean> = {};
  for (const f of block.configFields)
    if (f.defaultValue !== undefined) config[f.key] = f.defaultValue;
  const outputs =
    block.branches && block.branches.length
      ? block.branches.map((b) => ({ id: b.id, label: b.label }))
      : [{ id: "out", label: "Sortie" }];
  return {
    id: uid("node"),
    blockId: block.id,
    category: block.category,
    title: block.title,
    subtitle: block.subtitle,
    x: Math.round(x),
    y: Math.round(y),
    inputs:
      block.category === "trigger" || block.category === "organisation"
        ? []
        : block.inputs && block.inputs.length
          ? block.inputs.map((p) => ({ id: p.id, label: p.label }))
          : [{ id: "in", label: "Entrée" }],

    outputs: block.category === "organisation" || block.terminal ? [] : outputs,
    config,
  };
}

export function makeComment(x: number, y: number, targetId: string | null = null): WComment {
  return {
    id: uid("cmt"),
    x: Math.round(x),
    y: Math.round(y),
    w: 260,
    h: 150,
    text: "## Note\nDécris ici **l'intention** de cette branche.\n\n- point clé\n- `variable`",
    targetId,
    pointer: true,
  };
}

export function connect(doc: WDoc, e: Omit<WEdge, "id">): WDoc {
  if (e.source === e.target) return doc;
  const exists = doc.edges.some(
    (x) =>
      x.source === e.source &&
      x.sourcePort === e.sourcePort &&
      x.target === e.target &&
      x.targetPort === e.targetPort,
  );
  if (exists) return doc;
  const edges = doc.edges.filter((x) => !(x.target === e.target && x.targetPort === e.targetPort));
  return { ...doc, edges: [...edges, { ...e, id: uid("edge") }] };
}

export function canInsertOnEdge(doc: WDoc, edge: WEdge, nodeId: string): boolean {
  if (edge.source === nodeId || edge.target === nodeId) return false;
  const n = doc.nodes.find((x) => x.id === nodeId);
  if (!n || !n.inputs.length || !n.outputs.length) return false;
  const already = doc.edges.some(
    (e) =>
      (e.source === edge.source && e.target === nodeId) ||
      (e.source === nodeId && e.target === edge.target),
  );
  return !already;
}

export function insertNodeOnEdge(doc: WDoc, edgeId: string, nodeId: string): WDoc {
  const edge = doc.edges.find((e) => e.id === edgeId);
  if (!edge || !canInsertOnEdge(doc, edge, nodeId)) return doc;
  const node = doc.nodes.find((n) => n.id === nodeId)!;
  const inPort = node.inputs[0]!.id;
  const outPort = node.outputs[0]!.id;

  const kept = doc.edges.filter(
    (e) =>
      e.id !== edgeId &&
      !(e.target === nodeId && e.targetPort === inPort) &&
      !(e.target === edge.target && e.targetPort === edge.targetPort),
  );

  return {
    ...doc,
    edges: [
      ...kept,
      {
        id: uid("edge"),
        source: edge.source,
        sourcePort: edge.sourcePort,
        target: nodeId,
        targetPort: inPort,
      },
      {
        id: uid("edge"),
        source: nodeId,
        sourcePort: outPort,
        target: edge.target,
        targetPort: edge.targetPort,
      },
    ],
  };
}

const LAYOUT_COL_GAP = 120;
const LAYOUT_ROW_GAP = 56;
const LAYOUT_MARGIN = 80;
const LAYOUT_BRANCH_GAP = 34;
const LAYOUT_Y_JITTER = 16;
const LAYOUT_X_JITTER = 12;
const LAYOUT_GAP_JITTER = 18;

function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return ((h >>> 0) % 10000) / 10000;
}
const seededSigned = (seed: string) => seededRandom(seed) * 2 - 1;

export function computeTreeLayout(doc: WDoc): Map<string, { x: number; y: number }> | null {
  const { nodes, edges } = doc;
  if (nodes.length < 2) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const n of nodes) {
    outgoing.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of edges) {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target) || e.source === e.target) continue;
    outgoing.get(e.source)!.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const depth = new Map<string, number>();
  const remaining = new Map(inDegree);
  const queue: string[] = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  for (const id of queue) depth.set(id, 0);
  let cursor = 0;
  while (cursor < queue.length) {
    const id = queue[cursor++]!;
    for (const t of outgoing.get(id) ?? []) {
      depth.set(t, Math.max(depth.get(t) ?? 0, (depth.get(id) ?? 0) + 1));
      const left = (remaining.get(t) ?? 0) - 1;
      remaining.set(t, left);
      if (left === 0) queue.push(t);
    }
  }
  for (const n of nodes) if (!depth.has(n.id)) depth.set(n.id, 0);

  const columns = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(n.id);
  }
  const maxDepth = Math.max(...columns.keys());

  const primaryParent = new Map<string, string | undefined>();
  for (const n of nodes) {
    const parents = edges.filter((e) => e.target === n.id).map((e) => e.source);
    primaryParent.set(n.id, parents[0]);
  }

  const yCenter = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();
  const xOf = (d: number) => d * (NODE_W + LAYOUT_COL_GAP);

  const placeColumn = (ids: string[], d: number) => {
    let cursorY = 0;
    let prevParent: string | undefined | null = null;
    for (const id of ids) {
      const n = nodeMap.get(id)!;
      const h = nodeHeight(n);
      const parent = primaryParent.get(id);

      if (prevParent !== null && parent !== prevParent) {
        cursorY += LAYOUT_BRANCH_GAP + seededRandom(`${id}:branch`) * (LAYOUT_BRANCH_GAP / 2);
      }

      const yJitter = seededSigned(`${id}:y`) * LAYOUT_Y_JITTER;
      const xJitter = seededSigned(`${id}:x`) * LAYOUT_X_JITTER;
      const y = cursorY + yJitter;

      positions.set(id, { x: xOf(d) + xJitter, y });
      yCenter.set(id, y + h / 2);

      const gapJitter = seededRandom(`${id}:gap`) * LAYOUT_GAP_JITTER;
      cursorY += h + LAYOUT_ROW_GAP + gapJitter;
      prevParent = parent ?? undefined;
    }
  };

  const col0 = nodes.filter((n) => depth.get(n.id) === 0).map((n) => n.id);
  placeColumn(col0, 0);

  for (let d = 1; d <= maxDepth; d++) {
    const ids = columns.get(d) ?? [];
    const parentY = new Map<string, number>();
    for (const id of ids) {
      const parents = edges.filter((e) => e.target === id).map((e) => e.source);
      const ys = parents.map((p) => yCenter.get(p)).filter((v): v is number => v !== undefined);
      parentY.set(
        id,
        ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Number.MAX_SAFE_INTEGER,
      );
    }
    const sorted = [...ids].sort((a, b) => {
      const dy = (parentY.get(a) ?? 0) - (parentY.get(b) ?? 0);
      if (Math.abs(dy) > 0.5) return dy;
      return (primaryParent.get(a) ?? "").localeCompare(primaryParent.get(b) ?? "");
    });
    placeColumn(sorted, d);
  }

  const all = [...positions.values()];
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const offsetX = LAYOUT_MARGIN - minX;
  const offsetY = LAYOUT_MARGIN - minY;
  for (const [id, p] of positions)
    positions.set(id, { x: Math.round(p.x + offsetX), y: Math.round(p.y + offsetY) });

  return positions;
}

export function docBounds(doc: WDoc) {
  const pts: { x: number; y: number; w: number; h: number }[] = [
    ...doc.nodes.map((n) => ({ x: n.x, y: n.y, w: nodeWidth(n), h: nodeHeight(n) })),
    ...doc.comments.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
  ];
  if (!pts.length) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 };
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x + p.w)),
    maxY: Math.max(...pts.map((p) => p.y + p.h)),
  };
}
