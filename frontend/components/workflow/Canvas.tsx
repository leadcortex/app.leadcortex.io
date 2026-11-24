// frontend/components/workflow/Canvas.tsx

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWorkflow } from "@/lib/workflow/store";
import {
  bezier,
  canInsertOnEdge,
  categoryMap,
  edgeHitTest,
  edgePath,
  edgeSegments,
  nodeHeight,
  nodeWidth,
  portAnchor,
  BLOCK_DRAG_MIME,
  NODE_W,
} from "@/lib/workflow/geometry";
import type { WNode } from "@/lib/workflow/types";
import { NodeCard } from "./NodeCard";
import { CommentCard } from "./CommentCard";
import { CanvasContextMenu, type MenuState, type MenuTarget } from "./CanvasContextMenu";
import { CodeEditorModal, type CodeEditorTarget } from "./CodeEditorModal";
import { blockMap, codeField, isCodeNode } from "@/lib/workflow/geometry";
import { resolveLanguage } from "@/lib/workflow/code-languages";
import { useAutoPan, type AutoPanPointer } from "@/lib/workflow/use-auto-pan";
import {
  BLOCK_TOUCH_DRAG_END,
  BLOCK_TOUCH_DRAG_MOVE,
  type BlockTouchDragDetail,
} from "@/lib/workflow/block-touch-drag";
import { cn } from "@/lib/core/utils";

type Drag =
  | { kind: "pan"; startX: number; startY: number; vx: number; vy: number }
  | {
      kind: "move";
      startWorld: { x: number; y: number };
      origins: Record<string, { x: number; y: number }>;
    }
  | { kind: "marquee"; startX: number; startY: number; x: number; y: number }
  | null;

type Link = { node: string; port: string; side: "in" | "out"; cx: number; cy: number } | null;

type InsertHover = { edgeId: string; nodeId: string; point: { x: number; y: number } } | null;

const INSERT_TOLERANCE = 14;

const LONG_PRESS_MS = 450;
const LONG_PRESS_SLOP = 10;

const isFormTarget = (e: React.PointerEvent) =>
  Boolean(
    (e.target as HTMLElement | null)?.closest(
      "input, textarea, select, button, [contenteditable='true']",
    ),
  );

export type CanvasMode = "smart" | "select" | "pan";

export function Canvas({
  onOpenPalette,
  mode = "smart",
}: {
  onOpenPalette: (world: { x: number; y: number }) => void;
  mode?: CanvasMode;
}) {
  const {
    doc,
    setDoc,
    selection,
    setSelection,
    toggleSelect,
    viewport,
    setViewport,
    size,
    setSize,
    settings,
    connect,
    addComment,
    attachNode,
    duplicateSelected,
    deleteSelected,
    disconnectNode,
    updateNode,
    copySelection,
    paste,
    groupSelected,
    fitView,
    insertNodeOnEdge,
    codeEditorNodeId,
    openCodeEditor,
    closeCodeEditor,
    addBlock,
    draggingBlockId,
    setDraggingBlockId,
  } = useWorkflow();

  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [link, setLink] = useState<Link>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [spaceKey, setSpaceKey] = useState(false);
  const [insertHover, setInsertHover] = useState<InsertHover>(null);
  const [dropGhost, setDropGhost] = useState<{
    clientX: number;
    clientY: number;
    touch?: boolean;
  } | null>(null);
  const dragCounter = useRef(0);
  const space = spaceKey || mode === "pan";
  const backgroundPans = mode !== "select";
  const vpRef = useRef(viewport);
  vpRef.current = viewport;
  const pointerRef = useRef<AutoPanPointer>(null);
  const applyDragRef = useRef<(clientX: number, clientY: number) => void>(() => {});
  const longPress = useRef<{ timer: number; x: number; y: number } | null>(null);
  const cancelLongPress = useCallback(() => {
    if (longPress.current) {
      window.clearTimeout(longPress.current.timer);
      longPress.current = null;
    }
  }, []);
  const touchCountRef = useRef(0);
  const boundsRef = useRef({ size, settings });
  boundsRef.current = { size, settings };
  const isMultiTouch = (e: React.PointerEvent) =>
    e.pointerType === "touch" && touchCountRef.current > 1;

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const r = ref.current?.getBoundingClientRect();
    const v = vpRef.current;
    const px = clientX - (r?.left ?? 0);
    const py = clientY - (r?.top ?? 0);
    return { x: (px - v.x) / v.zoom, y: (py - v.y) / v.zoom, px, py };
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [setSize]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement | null)?.closest('[role="dialog"]')) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
      if (!e.ctrlKey && (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey)) {
        setViewport((v) => ({ ...v, x: v.x - e.deltaX * scale, y: v.y - e.deltaY * scale }));
        return;
      }
      const dy = e.deltaY * scale;
      setViewport((v) => {
        const next = Math.min(2.5, Math.max(0.15, v.zoom * Math.exp(-dy * 0.0015)));
        const k = next / v.zoom;
        return { zoom: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setViewport]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    type Pt = { x: number; y: number };
    type Gesture = {
      ids: [number, number];
      dist0: number;
      zoom0: number;
      anchor: Pt;
    };

    const ZOOM_MIN = 0.15;
    const ZOOM_MAX = 2.5;
    const MIN_PINCH_DIST = 30;

    const active = new Map<number, Pt>();
    let gesture: Gesture | null = null;
    let tap: { startTime: number; points: [Pt, Pt] } | null = null;
    let raf = 0;

    const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
    const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const minZoom = () => {
      const { size: s, settings: st } = boundsRef.current;
      if (!st.bounded || s.w <= 0 || s.h <= 0) return ZOOM_MIN;
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s.w / st.width, s.h / st.height));
    };

    const begin = () => {
      if (active.size !== 2) {
        gesture = null;
        return;
      }
      const ids = Array.from(active.keys()) as [number, number];
      const a = active.get(ids[0])!;
      const b = active.get(ids[1])!;
      const r = el.getBoundingClientRect();
      const c = mid(a, b);
      const v = vpRef.current;
      gesture = {
        ids,
        dist0: Math.max(dist(a, b), MIN_PINCH_DIST),
        zoom0: v.zoom,
        anchor: { x: (c.x - r.left - v.x) / v.zoom, y: (c.y - r.top - v.y) / v.zoom },
      };
    };

    const apply = () => {
      const g = gesture;
      if (!g) return;
      const a = active.get(g.ids[0]);
      const b = active.get(g.ids[1]);
      if (!a || !b) return;
      const r = el.getBoundingClientRect();
      const c = mid(a, b);
      const d = dist(a, b);
      const raw = g.zoom0 * (d / g.dist0);
      const zoom = Math.min(ZOOM_MAX, Math.max(minZoom(), raw));
      if (zoom !== raw) {
        g.zoom0 = zoom;
        g.dist0 = Math.max(d, MIN_PINCH_DIST);
      }
      setViewport({
        zoom,
        x: c.x - r.left - g.anchor.x * zoom,
        y: c.y - r.top - g.anchor.y * zoom,
      });
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        apply();
      });
    };
    const flush = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
      apply();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (e.isPrimary) {
        active.clear();
        gesture = null;
        tap = null;
      }
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      touchCountRef.current = active.size;

      if (active.size === 2) {
        cancelLongPress();
        setDrag(null);
        setLink(null);
        setInsertHover(null);
        begin();
        const pts = Array.from(active.values());
        tap = { startTime: Date.now(), points: [{ ...pts[0]! }, { ...pts[1]! }] };
      } else if (active.size > 2) {
        gesture = null;
        tap = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !active.has(e.pointerId)) return;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture;
      if (!g || active.size !== 2) return;

      if (tap) {
        const a = active.get(g.ids[0]);
        const b = active.get(g.ids[1]);
        if (a && b) {
          const moved = dist(a, tap.points[0]) > 10 || dist(b, tap.points[1]) > 10;
          if (moved) tap = null;
        }
      }
      schedule();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !active.has(e.pointerId)) return;
      flush();
      const wasTwo = active.size === 2;
      active.delete(e.pointerId);
      touchCountRef.current = active.size;

      if (wasTwo && tap && e.type === "pointerup") {
        const elapsed = Date.now() - tap.startTime;
        if (elapsed < 350) {
          const c = mid(tap.points[0], tap.points[1]);
          const r = el.getBoundingClientRect();
          const hitEls = document.elementsFromPoint(c.x, c.y) as HTMLElement[];
          const nodeEl = hitEls.map((n) => n.closest?.("[data-node-id]")).find(Boolean) as
            HTMLElement | undefined;
          const commentEl = hitEls.map((n) => n.closest?.("[data-comment-id]")).find(Boolean) as
            HTMLElement | undefined;
          const edgeEl = hitEls.map((n) => n.closest?.("[data-edge-id]")).find(Boolean) as
            HTMLElement | undefined;
          let target: MenuTarget = null;
          if (nodeEl?.dataset.nodeId) target = { type: "node", id: nodeEl.dataset.nodeId };
          else if (commentEl?.dataset.commentId)
            target = { type: "comment", id: commentEl.dataset.commentId };
          else if (edgeEl?.dataset.edgeId) target = { type: "edge", id: edgeEl.dataset.edgeId };
          const w = toWorld(c.x, c.y);
          setMenu({ x: c.x - r.left, y: c.y - r.top, world: { x: w.x, y: w.y }, target });
        }
        tap = null;
      }

      if (active.size === 2) begin();
      else gesture = null;
      if (active.size === 0) tap = null;
    };

    const reset = () => {
      active.clear();
      gesture = null;
      tap = null;
      touchCountRef.current = 0;
    };

    el.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    el.addEventListener("pointermove", onMove, { capture: true, passive: true });
    el.addEventListener("pointerup", onUp, { capture: true, passive: true });
    el.addEventListener("pointercancel", onUp, { capture: true, passive: true });
    window.addEventListener("blur", reset);
    return () => {
      el.removeEventListener("pointerdown", onDown, true);
      el.removeEventListener("pointermove", onMove, true);
      el.removeEventListener("pointerup", onUp, true);
      el.removeEventListener("pointercancel", onUp, true);
      window.removeEventListener("blur", reset);
      if (raf) cancelAnimationFrame(raf);
      touchCountRef.current = 0;
    };
  }, [setViewport, toWorld, cancelLongPress]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => e.preventDefault();
    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd < 300) e.preventDefault();
      lastTouchEnd = now;
    };
    el.addEventListener("gesturestart", stop as EventListener, { passive: false });
    el.addEventListener("gesturechange", stop as EventListener, { passive: false });
    el.addEventListener("gestureend", stop as EventListener, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("gesturestart", stop as EventListener);
      el.removeEventListener("gesturechange", stop as EventListener);
      el.removeEventListener("gestureend", stop as EventListener);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(e.target as HTMLElement)?.closest("input,textarea,select,[contenteditable='true']")
      ) {
        e.preventDefault();
        setSpaceKey(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpaceKey(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const snap = (v: number) =>
    settings.snap ? Math.round(v / settings.gridSize) * settings.gridSize : Math.round(v);

  const clampX = (x: number, w: number) =>
    settings.bounded ? Math.min(Math.max(0, x), Math.max(0, settings.width - w)) : x;
  const clampY = (y: number, h: number) =>
    settings.bounded ? Math.min(Math.max(0, y), Math.max(0, settings.height - h)) : y;

  const nodeById = useMemo(
    () => Object.fromEntries(doc.nodes.map((n) => [n.id, n])) as Record<string, WNode>,
    [doc.nodes],
  );

  const codeEditorTarget = useMemo<CodeEditorTarget | null>(() => {
    if (!codeEditorNodeId) return null;
    const n = nodeById[codeEditorNodeId];
    if (!n) return null;
    const field = codeField(n);
    if (!field) return null;
    const block = blockMap[n.blockId];
    const languageKey = block?.configFields.find((f) => f.key === "language")?.key;
    return {
      nodeId: n.id,
      title: n.title,
      fieldKey: field.key,
      fieldLabel: field.label,
      languageKey,
      language: resolveLanguage(n.config["language"]).id,
      value: String(n.config[field.key] ?? ""),
    };
  }, [codeEditorNodeId, nodeById]);

  const nodeRects = useMemo(
    () => doc.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, w: nodeWidth(n), h: nodeHeight(n) })),
    [doc.nodes],
  );

  const edgeFan = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const e of doc.edges) {
      const key = `${e.source}:${e.sourcePort}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e.id);
    }
    const fan = new Map<string, { index: number; count: number }>();
    for (const ids of groups.values()) {
      ids.forEach((id, index) => fan.set(id, { index, count: ids.length }));
    }
    return fan;
  }, [doc.edges]);

  const movingNodeId = useMemo(() => {
    if (drag?.kind !== "move") return null;
    const ids = Object.keys(drag.origins);
    if (ids.length !== 1) return null;
    const id = ids[0]!;
    return doc.nodes.some((n) => n.id === id) ? id : null;
  }, [drag, doc.nodes]);

  useEffect(() => {
    if (!drag && !link) return;

    const moveTo = (clientX: number, clientY: number) => {
      if (link) {
        const w = toWorld(clientX, clientY);
        setLink((l) => (l ? { ...l, cx: w.x, cy: w.y } : l));
        return;
      }
      if (!drag) return;
      if (drag.kind === "pan") {
        setViewport((v) => ({
          ...v,
          x: drag.vx + (clientX - drag.startX),
          y: drag.vy + (clientY - drag.startY),
        }));
      } else if (drag.kind === "move") {
        const w = toWorld(clientX, clientY);
        const dx = w.x - drag.startWorld.x;
        const dy = w.y - drag.startWorld.y;
        setDoc(
          (d) => ({
            ...d,
            nodes: d.nodes.map((n) => {
              const o = drag.origins[n.id];
              return o
                ? {
                    ...n,
                    x: clampX(snap(o.x + dx), nodeWidth(n)),
                    y: clampY(snap(o.y + dy), nodeHeight(n)),
                  }
                : n;
            }),
            comments: d.comments.map((c) => {
              const o = drag.origins[c.id];
              return o
                ? { ...c, x: clampX(snap(o.x + dx), c.w), y: clampY(snap(o.y + dy), c.h) }
                : c;
            }),
          }),
          false,
        );
        if (movingNodeId) {
          const origin = drag.origins[movingNodeId]!;
          const node = doc.nodes.find((n) => n.id === movingNodeId)!;
          const rect = {
            x: snap(origin.x + dx),
            y: snap(origin.y + dy),
            w: nodeWidth(node),
            h: nodeHeight(node),
          };
          let best: InsertHover = null;
          let bestDist = Infinity;
          for (const edge of doc.edges) {
            if (!canInsertOnEdge(doc, edge, movingNodeId)) continue;
            const s = nodeById[edge.source];
            const t = nodeById[edge.target];
            if (!s || !t) continue;
            const fan = edgeFan.get(edge.id);
            const segs = edgeSegments(
              portAnchor(s, edge.sourcePort, "out"),
              portAnchor(t, edge.targetPort, "in"),
              {
                obstacles: nodeRects.filter(
                  (r) => r.id !== edge.source && r.id !== edge.target && r.id !== movingNodeId,
                ),
                fanIndex: fan?.index ?? 0,
                fanCount: fan?.count ?? 1,
              },
            );
            const hit = edgeHitTest(segs, rect, INSERT_TOLERANCE);
            if (hit && hit.distance < bestDist) {
              bestDist = hit.distance;
              best = { edgeId: edge.id, nodeId: movingNodeId, point: hit.point };
            }
          }
          setInsertHover((prev) => {
            if (!best) return prev ? null : prev;
            if (
              prev &&
              prev.edgeId === best.edgeId &&
              Math.abs(prev.point.x - best.point.x) < 1 &&
              Math.abs(prev.point.y - best.point.y) < 1
            )
              return prev;
            return best;
          });
        }
      } else if (drag.kind === "marquee") {
        const r = ref.current!.getBoundingClientRect();
        setDrag({ ...drag, x: clientX - r.left, y: clientY - r.top });
      }
    };

    applyDragRef.current = moveTo;

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" && touchCountRef.current > 1) return;
      pointerRef.current = { x: e.clientX, y: e.clientY, type: e.pointerType };
      if (longPress.current) {
        const moved =
          Math.abs(e.clientX - longPress.current.x) > LONG_PRESS_SLOP ||
          Math.abs(e.clientY - longPress.current.y) > LONG_PRESS_SLOP;
        if (moved) cancelLongPress();
      }
      moveTo(e.clientX, e.clientY);
    };

    const up = (e: PointerEvent) => {
      if (link) {
        const target = document
          .elementsFromPoint(e.clientX, e.clientY)
          .map((el) => (el as HTMLElement).closest?.("[data-port-id]") as HTMLElement | null)
          .find(Boolean);
        const nodeId = target?.dataset.portNode;
        const port = target?.dataset.portId;
        const side = target?.dataset.portSide as "in" | "out" | undefined;
        if (nodeId && port && side && nodeId !== link.node && side !== link.side) {
          if (link.side === "out")
            connect({ source: link.node, sourcePort: link.port, target: nodeId, targetPort: port });
          else
            connect({ source: nodeId, sourcePort: port, target: link.node, targetPort: link.port });
        }
      }
      if (drag?.kind === "move") {
        if (insertHover && movingNodeId && insertHover.nodeId === movingNodeId) {
          insertNodeOnEdge(insertHover.edgeId, movingNodeId);
        }
        const overChat = (
          document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
        )?.closest("[data-ai-drop]");
        if (overChat) {
          const ids = Object.keys(drag.origins);
          setDoc(
            (d) => ({
              ...d,
              nodes: d.nodes.map((n) =>
                drag.origins[n.id] ? { ...n, ...drag.origins[n.id]! } : n,
              ),
              comments: d.comments.map((c) =>
                drag.origins[c.id] ? { ...c, ...drag.origins[c.id]! } : c,
              ),
            }),
            false,
          );
          ids.forEach((id) => attachNode(id));
        }
      }
      if (drag?.kind === "marquee") {
        const v = vpRef.current;
        const x1 = Math.min(drag.startX, drag.x);
        const x2 = Math.max(drag.startX, drag.x);
        const y1 = Math.min(drag.startY, drag.y);
        const y2 = Math.max(drag.startY, drag.y);
        const hit = (bx: number, by: number, bw: number, bh: number) => {
          const sx = bx * v.zoom + v.x;
          const sy = by * v.zoom + v.y;
          return sx < x2 && sx + bw * v.zoom > x1 && sy < y2 && sy + bh * v.zoom > y1;
        };
        const ids = [
          ...doc.nodes.filter((n) => hit(n.x, n.y, nodeWidth(n), nodeHeight(n))).map((n) => n.id),
          ...doc.comments.filter((c) => hit(c.x, c.y, c.w, c.h)).map((c) => c.id),
        ];
        if (Math.abs(x2 - x1) > 4 || Math.abs(y2 - y1) > 4) setSelection(ids);
      }
      cancelLongPress();
      pointerRef.current = null;
      setDrag(null);
      setLink(null);
      setInsertHover(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [
    drag,
    link,
    doc,
    setDoc,
    setSelection,
    setViewport,
    toWorld,
    attachNode,
    movingNodeId,
    insertHover,
    insertNodeOnEdge,
    nodeById,
    nodeRects,
    edgeFan,
    cancelLongPress,
  ]);

  useAutoPan({
    active: drag?.kind === "move" || Boolean(link),
    containerRef: ref,
    pointerRef,
    setViewport,
    onPan: () => {
      const p = pointerRef.current;
      if (p) applyDragRef.current(p.x, p.y);
    },
  });

  const startPan = (e: React.PointerEvent) => {
    setDrag({
      kind: "pan",
      startX: e.clientX,
      startY: e.clientY,
      vx: viewport.x,
      vy: viewport.y,
    });
  };

  const startMarquee = (clientX: number, clientY: number, additive: boolean) => {
    const r = ref.current!.getBoundingClientRect();
    if (!additive) setSelection([]);
    setDrag({
      kind: "marquee",
      startX: clientX - r.left,
      startY: clientY - r.top,
      x: clientX - r.left,
      y: clientY - r.top,
    });
  };

  const onBackgroundDown = (e: React.PointerEvent) => {
    if (e.button === 2) return;
    if (isMultiTouch(e)) return;
    setMenu(null);
    cancelLongPress();
    pointerRef.current = { x: e.clientX, y: e.clientY, type: e.pointerType };

    if (!space && !backgroundPans && e.button !== 1) {
      startMarquee(e.clientX, e.clientY, e.shiftKey);
      return;
    }

    startPan(e);

    if (e.pointerType === "touch" && backgroundPans && !space) {
      const { clientX, clientY } = e;
      longPress.current = {
        x: clientX,
        y: clientY,
        timer: window.setTimeout(() => {
          longPress.current = null;
          startMarquee(clientX, clientY, false);
        }, LONG_PRESS_MS),
      };
    }
  };

  const startMove = (id: string) => (e: React.PointerEvent) => {
    if (e.button === 2) return;
    if (isMultiTouch(e)) {
      e.stopPropagation();
      return;
    }
    if (isFormTarget(e)) {
      e.stopPropagation();
      if (!selection.includes(id)) setSelection([id]);
      return;
    }
    e.stopPropagation();
    setMenu(null);
    pointerRef.current = { x: e.clientX, y: e.clientY, type: e.pointerType };
    if (space) {
      startPan(e);
      return;
    }
    const sel =
      selection.includes(id) && !e.shiftKey ? selection : e.shiftKey ? [...selection, id] : [id];
    if (!selection.includes(id) || e.shiftKey) toggleSelect(id, e.shiftKey);
    const origins: Record<string, { x: number; y: number }> = {};
    for (const n of doc.nodes) if (sel.includes(n.id)) origins[n.id] = { x: n.x, y: n.y };
    for (const c of doc.comments) if (sel.includes(c.id)) origins[c.id] = { x: c.x, y: c.y };
    const w = toWorld(e.clientX, e.clientY);
    setDrag({ kind: "move", startWorld: { x: w.x, y: w.y }, origins });
  };

  const onPortDown =
    (nodeId: string) => (port: string, side: "in" | "out", e: React.PointerEvent) => {
      e.stopPropagation();
      if (isMultiTouch(e)) return;
      pointerRef.current = { x: e.clientX, y: e.clientY, type: e.pointerType };
      const w = toWorld(e.clientX, e.clientY);
      setLink({ node: nodeId, port, side, cx: w.x, cy: w.y });
    };

  const openMenu = (e: React.MouseEvent, target: MenuTarget) => {
    e.preventDefault();
    e.stopPropagation();
    const r = ref.current!.getBoundingClientRect();
    const w = toWorld(e.clientX, e.clientY);
    setMenu({ x: e.clientX - r.left, y: e.clientY - r.top, world: { x: w.x, y: w.y }, target });
  };

  const onCanvasDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BLOCK_DRAG_MIME)) return;
    e.preventDefault();
    dragCounter.current += 1;
    setDropGhost({ clientX: e.clientX, clientY: e.clientY });
  };

  const onCanvasDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BLOCK_DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropGhost({ clientX: e.clientX, clientY: e.clientY });
  };

  const onCanvasDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(BLOCK_DRAG_MIME)) return;
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDropGhost(null);
  };

  const dropBlockAt = (blockId: string, clientX: number, clientY: number) => {
    const w = toWorld(clientX, clientY);
    addBlock(blockId, clampX(w.x - NODE_W / 2, NODE_W), clampY(w.y - 24, 96));
  };

  const onCanvasDrop = (e: React.DragEvent) => {
    const blockId = e.dataTransfer.getData(BLOCK_DRAG_MIME);
    if (!blockId) return;
    e.preventDefault();
    dragCounter.current = 0;
    setDropGhost(null);
    setDraggingBlockId(null);
    dropBlockAt(blockId, e.clientX, e.clientY);
  };

  const dropBlockAtRef = useRef(dropBlockAt);
  dropBlockAtRef.current = dropBlockAt;
  useEffect(() => {
    const overCanvas = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      return !!el && !!ref.current?.contains(el);
    };
    const onMove = (e: Event) => {
      const d = (e as CustomEvent<BlockTouchDragDetail>).detail;
      setDropGhost(
        overCanvas(d.clientX, d.clientY)
          ? { clientX: d.clientX, clientY: d.clientY, touch: true }
          : null,
      );
    };
    const onEnd = (e: Event) => {
      const d = (e as CustomEvent<BlockTouchDragDetail>).detail;
      setDropGhost(null);
      if (d.cancelled) return;
      if (overCanvas(d.clientX, d.clientY)) dropBlockAtRef.current(d.blockId, d.clientX, d.clientY);
    };
    window.addEventListener(BLOCK_TOUCH_DRAG_MOVE, onMove);
    window.addEventListener(BLOCK_TOUCH_DRAG_END, onEnd);
    return () => {
      window.removeEventListener(BLOCK_TOUCH_DRAG_MOVE, onMove);
      window.removeEventListener(BLOCK_TOUCH_DRAG_END, onEnd);
    };
  }, []);

  const ghostBlock = draggingBlockId ? blockMap[draggingBlockId] : null;
  const ghostCategory = ghostBlock ? categoryMap[ghostBlock.category] : null;

  const z = viewport.zoom;
  const step = settings.gridSize * z;
  const major = step * 5;
  const dotR = Math.max(0.8, Math.min(1.6, 1.1 * z));

  return (
    <div
      ref={ref}
      className={cn(
        "wf-canvas relative h-full w-full overflow-hidden bg-canvas transition-shadow",
        drag?.kind === "pan"
          ? "cursor-grabbing"
          : drag?.kind === "marquee" || link
            ? "cursor-crosshair"
            : space || backgroundPans
              ? "cursor-grab"
              : "cursor-default",
        dropGhost && "shadow-[inset_0_0_0_2px_var(--primary)]",
      )}
      onPointerDown={onBackgroundDown}
      onContextMenu={(e) => openMenu(e, null)}
      onDragEnter={onCanvasDragEnter}
      onDragOver={onCanvasDragOver}
      onDragLeave={onCanvasDragLeave}
      onDrop={onCanvasDrop}
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(
            '[data-node-id], [data-comment-id], input, textarea, select, button, [role="button"]',
          )
        ) {
          return;
        }
        const w = toWorld(e.clientX, e.clientY);
        onOpenPalette({ x: w.x, y: w.y });
      }}
    >
      {settings.showGrid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(var(--grid-dot-strong) ${dotR + 0.4}px, transparent ${dotR + 0.4}px), radial-gradient(var(--grid-dot) ${dotR}px, transparent ${dotR}px)`,
            backgroundSize: `${major}px ${major}px, ${step}px ${step}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px, ${viewport.x}px ${viewport.y}px`,
            opacity: z < 0.35 ? 0.4 : 1,
            transition: "opacity 150ms linear",
          }}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, transparent 55%, color-mix(in oklab, var(--foreground) 5%, transparent) 100%)",
        }}
      />

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
      >
        {settings.bounded && (
          <div
            className="wf-canvas-wall pointer-events-none absolute rounded-2xl"
            style={{ left: 0, top: 0, width: settings.width, height: settings.height }}
          />
        )}

        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={1}
          height={1}
        >
          {doc.edges.map((e) => {
            const s = nodeById[e.source];
            const t = nodeById[e.target];
            if (!s || !t) return null;
            const a = portAnchor(s, e.sourcePort, "out");
            const b = portAnchor(t, e.targetPort, "in");
            const color = categoryMap[s.category].color;
            const active =
              selection.includes(e.id) || selection.includes(s.id) || selection.includes(t.id);
            const fan = edgeFan.get(e.id);
            const obstacles = nodeRects.filter(
              (r) => r.id !== e.source && r.id !== e.target && r.id !== movingNodeId,
            );
            const hoveredForInsert = insertHover?.edgeId === e.id;
            const d = edgePath(a, b, {
              obstacles,
              fanIndex: fan?.index ?? 0,
              fanCount: fan?.count ?? 1,
              ignoreObstacles: hoveredForInsert,
            });
            return (
              <g key={e.id}>
                <path
                  d={d}
                  data-edge-id={e.id}
                  fill="none"
                  strokeWidth={16}
                  stroke="transparent"
                  className="pointer-events-auto cursor-pointer"
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    setSelection([e.id]);
                  }}
                  onContextMenu={(ev) => openMenu(ev, { type: "edge", id: e.id })}
                />
                <path
                  d={d}
                  fill="none"
                  strokeWidth={active ? 3 : 2}
                  stroke={active ? "color-mix(in oklab, var(--primary) 85%, white)" : color}
                  strokeLinecap="round"
                  opacity={active ? 1 : 0.75}
                />
                {active && (
                  <path
                    d={d}
                    fill="none"
                    strokeWidth={2}
                    stroke="var(--background)"
                    strokeLinecap="round"
                    className="wf-edge-flow"
                    opacity={0.9}
                  />
                )}
                {hoveredForInsert && (
                  <>
                    <path
                      d={d}
                      fill="none"
                      strokeWidth={7}
                      stroke="var(--primary)"
                      strokeLinecap="round"
                      opacity={0.22}
                    />
                    <path
                      d={d}
                      fill="none"
                      strokeWidth={2.6}
                      strokeDasharray="8 6"
                      stroke="var(--primary)"
                      strokeLinecap="round"
                      className="wf-edge-flow"
                    />
                    <circle cx={a.x} cy={a.y} r={5} fill="var(--primary)" opacity={0.9} />
                    <circle cx={b.x} cy={b.y} r={5} fill="var(--primary)" opacity={0.9} />
                    {insertHover && (
                      <g>
                        <circle
                          cx={insertHover.point.x}
                          cy={insertHover.point.y}
                          r={11}
                          fill="var(--primary)"
                          opacity={0.18}
                        />
                        <circle
                          cx={insertHover.point.x}
                          cy={insertHover.point.y}
                          r={6}
                          fill="var(--background)"
                          stroke="var(--primary)"
                          strokeWidth={2}
                        />
                        <path
                          d={`M ${insertHover.point.x - 3} ${insertHover.point.y} h 6 M ${insertHover.point.x} ${insertHover.point.y - 3} v 6`}
                          stroke="var(--primary)"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                        />
                      </g>
                    )}
                  </>
                )}
                <circle cx={a.x} cy={a.y} r={3} fill={color} />
                <circle cx={b.x} cy={b.y} r={3} fill={color} />
              </g>
            );
          })}
          {link &&
            (() => {
              const n = nodeById[link.node];
              if (!n) return null;
              const a = portAnchor(n, link.port, link.side);
              const from = link.side === "out" ? a : { x: link.cx, y: link.cy };
              const to = link.side === "out" ? { x: link.cx, y: link.cy } : a;
              return (
                <g>
                  <path
                    d={bezier(from, to)}
                    fill="none"
                    strokeWidth={2.4}
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                    stroke="color-mix(in oklab, var(--primary) 80%, white)"
                  />
                  <circle cx={link.cx} cy={link.cy} r={4} fill="var(--primary)" />
                </g>
              );
            })()}
        </svg>

        {doc.comments.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            target={c.targetId ? nodeById[c.targetId] : undefined}
            selected={selection.includes(c.id)}
            onPointerDown={startMove(c.id)}
            onContextMenu={(e) => openMenu(e, { type: "comment", id: c.id })}
            onChange={(patch) =>
              setDoc(
                (d) => ({
                  ...d,
                  comments: d.comments.map((x) => (x.id === c.id ? { ...x, ...patch } : x)),
                }),
                false,
              )
            }
          />
        ))}

        {doc.nodes.map((n) => (
          <NodeCard
            key={n.id}
            node={n}
            selected={selection.includes(n.id)}
            linking={Boolean(link) && link?.node !== n.id}
            onPointerDown={startMove(n.id)}
            onContextMenu={(e) => openMenu(e, { type: "node", id: n.id })}
            onPortDown={onPortDown(n.id)}
            onOpenCodeEditor={isCodeNode(n) ? () => openCodeEditor(n.id) : undefined}

            onPatch={(patch) => updateNode(n.id, patch)}
            onConfig={(key, value) =>
              setDoc((d) => ({
                ...d,
                nodes: d.nodes.map((x) =>
                  x.id === n.id ? { ...x, config: { ...x.config, [key]: value } } : x,
                ),
              }))
            }
          />
        ))}
      </div>

      {insertHover &&
        (() => {
          const edge = doc.edges.find((e) => e.id === insertHover.edgeId);
          const s = edge ? nodeById[edge.source] : undefined;
          const t = edge ? nodeById[edge.target] : undefined;
          if (!edge || !s || !t) return null;
          const a = portAnchor(s, edge.sourcePort, "out");
          const b = portAnchor(t, edge.targetPort, "in");
          const fan = edgeFan.get(edge.id);
          const d = edgePath(a, b, {
            fanIndex: fan?.index ?? 0,
            fanCount: fan?.count ?? 1,
            ignoreObstacles: true,
          });
          const v = viewport;
          const pt = {
            x: insertHover.point.x * v.zoom + v.x,
            y: insertHover.point.y * v.zoom + v.y,
          };
          return (
            <>
              <svg
                className="pointer-events-none absolute left-0 top-0 overflow-visible"
                width={1}
                height={1}
                style={{
                  transform: `translate(${v.x}px, ${v.y}px) scale(${v.zoom})`,
                  transformOrigin: "0 0",
                }}
              >
                <path
                  d={d}
                  fill="none"
                  strokeWidth={8}
                  stroke="var(--primary)"
                  strokeLinecap="round"
                  opacity={0.2}
                />
                <path
                  d={d}
                  fill="none"
                  strokeWidth={2.6}
                  strokeDasharray="8 6"
                  stroke="var(--primary)"
                  strokeLinecap="round"
                  className="wf-edge-flow"
                />
                <circle cx={a.x} cy={a.y} r={5} fill="var(--primary)" />
                <circle cx={b.x} cy={b.y} r={5} fill="var(--primary)" />
              </svg>
              <div
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-primary/60 bg-panel/95 px-2.5 py-1 text-[11px] font-medium text-primary shadow-node backdrop-blur"
                style={{ left: pt.x, top: pt.y }}
              >
                Insérer ici
              </div>
            </>
          );
        })()}

      {drag?.kind === "marquee" && (
        <div
          className="pointer-events-none absolute rounded-md border border-primary/70 bg-primary/10"
          style={{
            left: Math.min(drag.startX, drag.x),
            top: Math.min(drag.startY, drag.y),
            width: Math.abs(drag.x - drag.startX),
            height: Math.abs(drag.y - drag.startY),
          }}
        />
      )}

      {!doc.nodes.length && !doc.comments.length && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6">
          <div
            className="pointer-events-auto max-w-md rounded-2xl border border-border/80 bg-panel/90 p-6 text-center shadow-node backdrop-blur-sm"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-semibold tracking-tight">Canevas vierge</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Commencez par ajouter un bloc via le <strong>clic droit</strong>, un{" "}
              <strong>double-clic</strong> sur le canevas, ou en demandant directement à{" "}
              <strong>l'Agent IA</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                const c = {
                  x: (size.w / 2 - viewport.x) / viewport.zoom,
                  y: (size.h / 2 - viewport.y) / viewport.zoom,
                };
                onOpenPalette(c);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12px] font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Ajouter un bloc
            </button>
            <p className="mt-3 text-[10.5px] text-muted-foreground">
              Raccourci : Shift+A · Espace+Glisser pour naviguer
            </p>
          </div>
        </div>
      )}

      <CanvasContextMenu
        state={menu}
        hasSelection={selection.length > 0}
        onClose={() => setMenu(null)}
        actions={{
          addBlock: (world) => onOpenPalette(world),
          addNote: (world, target) => addComment(world.x, world.y, target),
          recenter: fitView,
          duplicate: duplicateSelected,
          remove: deleteSelected,
          disconnect: disconnectNode,
          toChat: attachNode,
          select: (id) => setSelection([id]),
          copy: copySelection,
          paste,
          group: groupSelected,
          selectAll: () =>
            setSelection([...doc.nodes.map((n) => n.id), ...doc.comments.map((c) => c.id)]),
          toggleMute: (id) => {
            const n = nodeById[id];
            if (n) updateNode(id, { muted: !n.muted });
          },
          deleteEdge: (id) =>
            setDoc((d) => ({ ...d, edges: d.edges.filter((edge) => edge.id !== id) })),
          openCodeEditor,
        }}
        isCodeNode={(id) => {
          const n = nodeById[id];
          return Boolean(n && isCodeNode(n));
        }}
      />

      <CodeEditorModal
        target={codeEditorTarget}
        onClose={closeCodeEditor}
        onSave={({ code, language }) => {
          if (!codeEditorTarget) return;
          const label = resolveLanguage(language).label;
          setDoc((d) => ({
            ...d,
            nodes: d.nodes.map((x) =>
              x.id === codeEditorTarget.nodeId
                ? {
                    ...x,
                    config: {
                      ...x.config,
                      [codeEditorTarget.fieldKey]: code,
                      ...(codeEditorTarget.languageKey
                        ? { [codeEditorTarget.languageKey]: label }
                        : {}),
                    },
                  }
                : x,
            ),
          }));
        }}
      />

      {dropGhost && ghostBlock && ghostCategory && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[80] flex items-center gap-2 rounded-md border border-border bg-popover px-2.5 py-1.5 shadow-node"
          style={{
            left: dropGhost.clientX + 14,
            top: dropGhost.clientY + (dropGhost.touch ? -56 : 14),
            opacity: 0.95,
          }}
        >
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded"
            style={{ background: `${ghostCategory.color}25`, color: ghostCategory.color }}
          >
            <ghostBlock.icon className="h-3.5 w-3.5" />
          </span>
          <span className="whitespace-nowrap text-[12px] font-medium">{ghostBlock.title}</span>
        </div>
      )}
    </div>
  );
}
