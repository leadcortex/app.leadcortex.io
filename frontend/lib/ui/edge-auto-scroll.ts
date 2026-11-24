// frontend/lib/ui/edge-auto-scroll.ts

export type EdgeScrollAxes = "x" | "y" | "both";

export type EdgeScrollerOptions = {
  axes?: EdgeScrollAxes;
  onScroll?: () => void;
  staleMs?: number;
};

export type EdgeScroller = {
  update: (x: number, y: number, origin: Element | null) => void;
  stop: () => void;
};

type Rect = { top: number; bottom: number; left: number; right: number };
type Inset = { top: number; left: number };

const MIN_ZONE = 36;
const MAX_ZONE = 96;
const MIN_SPEED = 3;
const MAX_SPEED = 26;
const FRAME_MS = 16.67;

function viewportRect(): Rect {
  const de = document.documentElement;
  return { top: 0, left: 0, right: de.clientWidth, bottom: window.innerHeight };
}

function intersect(a: Rect, b: Rect): Rect {
  return {
    top: Math.max(a.top, b.top),
    bottom: Math.min(a.bottom, b.bottom),
    left: Math.max(a.left, b.left),
    right: Math.min(a.right, b.right),
  };
}

function toRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
}

function buildChain(origin: Element | null): HTMLElement[] {
  const chain: HTMLElement[] = [];
  const root = (document.scrollingElement ?? document.documentElement) as HTMLElement;
  for (let node = origin as HTMLElement | null; node && node !== root; node = node.parentElement) {
    if (node === document.body) continue;
    const style = getComputedStyle(node);
    const scrollY = /(auto|scroll|overlay)/.test(style.overflowY);
    const scrollX = /(auto|scroll|overlay)/.test(style.overflowX);
    if (scrollY || scrollX) chain.push(node);
  }
  chain.push(root);
  return chain;
}

function canScroll(el: HTMLElement, axis: "x" | "y", dir: number): boolean {
  if (axis === "y") {
    if (dir < 0) return el.scrollTop > 0;
    return el.scrollTop < el.scrollHeight - el.clientHeight - 1;
  }
  if (dir < 0) return el.scrollLeft > 0;
  return el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
}

function tableInsets(el: HTMLElement): Inset {
  const inset: Inset = { top: 0, left: 0 };
  const head = el.querySelector("thead");
  if (!head) return inset;
  const box = el.getBoundingClientRect();
  if (getComputedStyle(head).position === "sticky") inset.top = head.getBoundingClientRect().height;
  head.querySelectorAll<HTMLElement>("th").forEach((th) => {
    if (getComputedStyle(th).position !== "sticky") return;
    inset.left = Math.max(inset.left, th.getBoundingClientRect().right - box.left);
  });
  return inset;
}

function edgeVelocity(pos: number, start: number, end: number): number {
  const size = end - start;
  if (size <= 0) return 0;
  const zone = Math.min(size / 2, Math.min(MAX_ZONE, Math.max(MIN_ZONE, size * 0.2)));
  const speed = (t: number) => MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.min(1, t) ** 2;
  if (pos < start + zone) return -speed((start + zone - pos) / zone);
  if (pos > end - zone) return speed((pos - (end - zone)) / zone);
  return 0;
}

export function createEdgeScroller(options: EdgeScrollerOptions = {}): EdgeScroller {
  const axes = options.axes ?? "both";
  let x = 0;
  let y = 0;
  let origin: Element | null = null;
  let chain: HTMLElement[] = [];
  let raf = 0;
  let last = 0;
  let lastEvent = 0;

  const step = (axis: "x" | "y", now: number): boolean => {
    const root = chain[chain.length - 1];
    const clips = new Map<HTMLElement, Rect>();
    let clip = viewportRect();
    for (let i = chain.length - 1; i >= 0; i--) {
      const el = chain[i];
      if (el !== root) clip = intersect(clip, toRect(el));
      clips.set(el, clip);
    }

    for (const el of chain) {
      const area = clips.get(el)!;
      const inset = el.dataset.edgeScroll === "table" ? tableInsets(el) : { top: 0, left: 0 };
      const v =
        axis === "y"
          ? edgeVelocity(y, area.top + inset.top, area.bottom)
          : edgeVelocity(x, area.left + inset.left, area.right);
      if (v === 0 || !canScroll(el, axis, v)) continue;

      const delta = v * Math.min(3, (now - last) / FRAME_MS);
      if (axis === "y") el.scrollTop += delta;
      else el.scrollLeft += delta;
      return true;
    }
    return false;
  };

  const tick = (now: number) => {
    raf = 0;
    if (options.staleMs && now - lastEvent > options.staleMs) return;
    if (last === 0) last = now - FRAME_MS;

    let moved = false;
    if (axes !== "x" && step("y", now)) moved = true;
    if (axes !== "y" && step("x", now)) moved = true;
    last = now;

    if (!moved) return;
    options.onScroll?.();
    raf = requestAnimationFrame(tick);
  };

  return {
    update(px, py, el) {
      x = px;
      y = py;
      lastEvent = performance.now();
      if (el !== origin) {
        origin = el;
        chain = buildChain(el);
      }
      if (raf === 0) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    },
    stop() {
      if (raf !== 0) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      origin = null;
      chain = [];
    },
  };
}

let installCount = 0;
let uninstall: (() => void) | null = null;

export function installDragEdgeAutoScroll(): () => void {
  installCount += 1;

  if (installCount === 1 && typeof document !== "undefined") {
    const scroller = createEdgeScroller({ axes: "both", staleMs: 900 });
    let active = false;

    const onDragStart = (e: DragEvent) => {
      const target = e.target as Element | null;
      active = !!target?.closest?.("[data-edge-scroll-drag]");
    };
    const onDragOver = (e: DragEvent) => {
      if (!active) return;
      scroller.update(e.clientX, e.clientY, e.target as Element | null);
    };
    const onEnd = () => {
      active = false;
      scroller.stop();
    };

    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("dragover", onDragOver, true);
    document.addEventListener("dragend", onEnd, true);
    document.addEventListener("drop", onEnd, true);
    window.addEventListener("blur", onEnd);

    uninstall = () => {
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("dragover", onDragOver, true);
      document.removeEventListener("dragend", onEnd, true);
      document.removeEventListener("drop", onEnd, true);
      window.removeEventListener("blur", onEnd);
      scroller.stop();
    };
  }

  return () => {
    installCount = Math.max(0, installCount - 1);
    if (installCount === 0) {
      uninstall?.();
      uninstall = null;
    }
  };
}
