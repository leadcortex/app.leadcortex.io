// frontend/components/layout/header-search.tsx

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Command as CommandPrimitive } from "cmdk";
import { ArrowRight, CornerDownLeft, History, Search, Star, X } from "@/components/icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  SEARCH_CATEGORY_ICONS,
  SEARCH_CATEGORY_LABELS,
  SEARCH_CATEGORY_ORDER,
  matchSearchText,
  useGlobalSearchResults,
} from "@/hooks/use-global-search";
import {
  LANDING_BOUNCE_MS,
  flightPosition,
  flightProgress,
  fusionPath,
  landingBounce,
  makeVariation,
  type Point,
} from "@/lib/ui/search-flight";
import { cn } from "@/lib/core/utils";

export type SearchPage = {
  id?: string;
  label: string;
  to: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  keywords?: string;
  onSelect?: () => void;
};

type Phase = "closed" | "flying" | "revealing" | "open" | "closing";

const FILLET = 18;
const RADIUS = 22;
const ICON_PX = 20;
const MAX_WIDTH = 580;
const RECENT_KEY = "lc:recent-searches";
const RECENT_MAX = 5;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function readRecents(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string").slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

function writeRecents(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
  }
}

function center(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function HighlightedText({ text, indices = [] }: { text: string; indices?: number[] }) {
  const highlighted = new Set(indices);
  const parts: { text: string; highlighted: boolean }[] = [];

  Array.from(text).forEach((character, index) => {
    const isHighlighted = highlighted.has(index);
    const previous = parts[parts.length - 1];
    if (previous?.highlighted === isHighlighted) previous.text += character;
    else parts.push({ text: character, highlighted: isHighlighted });
  });

  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          className={
            part.highlighted ? "rounded-sm bg-primary/20 font-semibold text-primary" : undefined
          }
        >
          {part.text}
        </span>
      ))}
    </>
  );
}

type Splash = {
  key: number;
  x: number;
  y: number;
  drops: { dx: number; dy: number; size: number; delay: number }[];
};

export function HeaderSearch({ pages }: { pages: SearchPage[] }) {
  const navigate = useNavigate();

  const [phase, setPhaseState] = useState<Phase>("closed");
  const phaseRef = useRef<Phase>("closed");
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  const [host, setHost] = useState<HTMLElement | null>(null);
  const [geom, setGeom] = useState<{ left: number; width: number } | null>(null);
  const [docked, setDocked] = useState(false);
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [splash, setSplash] = useState<Splash | null>(null);
  const [popKey, setPopKey] = useState(0);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const triggerIconRef = useRef<HTMLSpanElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const flyRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pathFillRef = useRef<SVGPathElement | null>(null);
  const pathLineRef = useRef<SVGPathElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const animsRef = useRef<Animation[]>([]);

  const { debouncedQuery, results, groupedResults, quickActions } = useGlobalSearchResults(query);

  useEffect(() => {
    setHost((triggerRef.current?.closest("header") as HTMLElement | null) ?? null);
  }, []);

  const stopAnimations = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    animsRef.current.forEach((a) => a.cancel());
    animsRef.current = [];
  }, []);
  useEffect(() => stopAnimations, [stopAnimations]);

  const computeGeom = useCallback(() => {
    const btn = triggerRef.current;
    if (!host || !btn) return null;
    const hr = host.getBoundingClientRect();
    const width = Math.min(MAX_WIDTH, Math.max(0, hr.width - 24));
    const left = (hr.width - width) / 2 - host.clientLeft;
    return { left, width };
  }, [host]);

  const redrawShape = useCallback((w: number, h: number) => {
    const { outline, fill } = fusionPath(w, h, FILLET, RADIUS);
    pathFillRef.current?.setAttribute("d", fill);
    pathLineRef.current?.setAttribute("d", outline);
    const svg = svgRef.current;
    if (svg) {
      svg.setAttribute("width", String(w));
      svg.setAttribute("height", String(h));
    }
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || phase === "closed") return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const w = box?.inlineSize ?? panel.offsetWidth;
      const h = box?.blockSize ?? panel.offsetHeight;
      redrawShape(w, h);
    });
    redrawShape(panel.offsetWidth, panel.offsetHeight);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [phase, redrawShape, geom]);

  const listInnerRef = useRef<HTMLDivElement | null>(null);
  const [listHeight, setListHeight] = useState(0);
  useLayoutEffect(() => {
    const el = listInnerRef.current;
    if (!el || phase === "closed") return;
    const ro = new ResizeObserver(() => setListHeight(el.offsetHeight));
    setListHeight(el.offsetHeight);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  const finishClose = useCallback(() => {
    stopAnimations();
    if (flyRef.current) flyRef.current.style.visibility = "hidden";
    setDocked(false);
    setSplash(null);
    setPhase("closed");
    setPopKey((k) => k + 1);
    triggerRef.current?.focus({ preventScroll: true });
  }, [stopAnimations]);

  const close = useCallback(() => {
    if (phaseRef.current !== "open" && phaseRef.current !== "revealing") return;
    stopAnimations();
    const panel = panelRef.current;
    const slot = slotRef.current;
    const trigger = triggerIconRef.current;
    const fly = flyRef.current;
    if (prefersReducedMotion() || !panel || !slot || !trigger || !fly) {
      finishClose();
      return;
    }
    setPhase("closing");
    const from = center(slot);
    const to = center(trigger);
    const rect = panel.getBoundingClientRect();
    const cx = from.x - rect.left;
    const cy = from.y - rect.top;
    const maxR = Math.hypot(Math.max(cx, rect.width - cx), Math.max(cy, rect.height - cy)) + 10;

    setDocked(false);
    fly.style.visibility = "visible";
    place(fly, from, 1, 1, 1);
    const clip = panel.animate(
      [
        { clipPath: `circle(${maxR}px at ${cx}px ${cy}px)` },
        { clipPath: `circle(0px at ${cx}px ${cy}px)` },
      ],
      { duration: 360, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" },
    );
    animsRef.current = [clip];

    const v = makeVariation();
    const dur = v.duration * 0.72;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const u = flightProgress(t, { ...v, ease: (x) => x * x * (3 - 2 * x) });
      const p = flightPosition(u, from, to, v);
      place(fly, p, 1 + 0.15 * Math.sin(Math.PI * u), 1, 1);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else finishClose();
    };
    rafRef.current = requestAnimationFrame(step);
  }, [finishClose, stopAnimations]);

  const open = useCallback(() => {
    if (phaseRef.current !== "closed") return;
    const g = computeGeom();
    if (!g) return;
    setGeom(g);
    setQuery("");
    setRecents(readRecents());
    setSplash(null);
    setPhase("flying");
  }, [computeGeom]);

  const toggle = useCallback(() => {
    if (phaseRef.current === "closed") open();
    else close();
  }, [open, close]);

  useLayoutEffect(() => {
    if (phase !== "flying") return;
    const fly = flyRef.current;
    const slot = slotRef.current;
    const trigger = triggerIconRef.current;
    const panel = panelRef.current;
    if (!fly || !slot || !trigger || !panel) return;

    const focusField = () => inputRef.current?.focus({ preventScroll: true });

    if (prefersReducedMotion()) {
      setDocked(true);
      setPhase("open");
      requestAnimationFrame(focusField);
      return;
    }

    const s = center(trigger);
    const e = center(slot);
    const v = makeVariation();
    fly.style.visibility = "visible";
    place(fly, s, 1, 1, 1);
    const t0 = performance.now();
    let landedAt: number | null = null;

    const land = () => {
      const rect = panel.getBoundingClientRect();
      const cx = e.x - rect.left;
      const cy = e.y - rect.top;
      const maxR = Math.hypot(Math.max(cx, rect.width - cx), Math.max(cy, rect.height - cy)) + 12;
      const reveal = panel.animate(
        [
          { clipPath: `circle(0px at ${cx}px ${cy}px)` },
          { clipPath: `circle(${maxR}px at ${cx}px ${cy}px)` },
        ],
        { duration: 640, easing: "cubic-bezier(.18,.8,.22,1)", fill: "forwards" },
      );
      const settle = panel.animate(
        [
          { transform: "scaleY(.86)" },
          { transform: "scaleY(1.035)", offset: 0.55 },
          { transform: "scaleY(.992)", offset: 0.8 },
          { transform: "scaleY(1)" },
        ],
        { duration: 760, easing: "ease-out" },
      );
      animsRef.current = [reveal, settle];
      reveal.finished
        .then(() => {
          if (phaseRef.current !== "revealing" && phaseRef.current !== "open") return;
          reveal.cancel();
          setPhase("open");
        })
        .catch(() => {});
      const drops = Array.from({ length: 7 }, (_, i) => {
        const angle = (-160 + (140 / 6) * i + (Math.random() * 16 - 8)) * (Math.PI / 180);
        const dist = 20 + Math.random() * 26;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 3 + Math.random() * 2.5,
          delay: Math.random() * 40,
        };
      });
      setSplash({ key: Date.now(), x: e.x, y: e.y, drops });
      setPhase("revealing");
      focusField();
    };

    const step = (now: number) => {
      if (landedAt === null) {
        const t = Math.min(1, (now - t0) / v.duration);
        const u = flightProgress(t, v);
        const p = flightPosition(u, s, e, v);
        place(fly, p, 1 + 0.18 * Math.sin(Math.PI * u), 1, 1);
        if (t >= 1) {
          landedAt = now;
          land();
        }
      }
      if (landedAt !== null) {
        const ms = now - landedAt;
        const b = landingBounce(ms);
        place(fly, { x: e.x, y: e.y + b.dy }, 1, b.scaleX, b.scaleY);
        if (ms >= LANDING_BOUNCE_MS) {
          place(fly, e, 1, 1, 1);
          fly.style.visibility = "hidden";
          setDocked(true);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase === "flying"]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && ["k", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        toggle();
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        open();
        return;
      }
      if (e.key === "Escape" && (phaseRef.current === "open" || phaseRef.current === "revealing")) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, open, close]);

  useEffect(() => {
    if (phase !== "open" && phase !== "revealing") return;
    const onDown = (e: PointerEvent) => {
      const n = e.target as Node;
      if (panelRef.current?.contains(n) || triggerRef.current?.contains(n)) return;
      close();
    };
    const onResize = () => {
      const g = computeGeom();
      if (g) setGeom(g);
    };
    const observer = new ResizeObserver(onResize);
    if (host) observer.observe(host);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
    };
  }, [phase, close, computeGeom, host]);

  const remember = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const next = [q, ...readRecents().filter((r) => r.toLowerCase() !== q.toLowerCase())];
    writeRecents(next);
  }, [query]);

  const go = useCallback(
    (to: string, onSelect?: () => void) => {
      remember();
      close();
      if (onSelect) onSelect();
      else navigate({ to: to as never });
    },
    [remember, close, navigate],
  );

  const q = query.trim().toLowerCase();
  const matchingPages = useMemo(() => {
    if (!q) return pages.slice(0, 6).map((page) => ({ page, rank: 0 }));
    return pages
      .flatMap((page) => {
        const match = [page.label, page.group, page.to, page.description ?? "", page.keywords ?? ""]
          .map((value) => matchSearchText(q, value))
          .reduce(
            (best, candidate) =>
              candidate && (!best || candidate.score > best.score) ? candidate : best,
            null,
          );
        return match ? [{ page, rank: match.score }] : [];
      })
      .sort((a, b) => b.rank - a.rank);
  }, [pages, q]);

  const hasEntityResults = results.length > 0 || quickActions.length > 0;
  const nothing =
    q.length > 0 &&
    debouncedQuery.trim() === query.trim() &&
    !hasEntityResults &&
    matchingPages.length === 0;

  const visible = phase !== "closed";
  const hideSlotIcon = !docked;

  const panelStyle: CSSProperties = {
    left: geom?.left ?? 0,
    width: geom?.width ?? MAX_WIDTH,
    top: "calc(100% + 0.5px)",
    ...(phase === "flying" ? { clipPath: "circle(0px at 100% 0)" } : null),
  };

  const portal =
    host && visible
      ? createPortal(
          <>
            <div
              ref={panelRef}
              role="search"
              aria-label="Recherche globale"
              style={panelStyle}
              className="absolute z-10 origin-top drop-shadow-[0_14px_22px_rgb(0_0_0/0.07)]"
            >
              <svg
                ref={svgRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 overflow-visible"
              >
                <path ref={pathFillRef} style={{ fill: "var(--background)" }} />
                <path
                  ref={pathLineRef}
                  fill="none"
                  strokeWidth={1}
                  style={{ stroke: "color-mix(in oklab, var(--border) 70%, transparent)" }}
                />
              </svg>

              <Command
                shouldFilter={false}
                loop
                label="Recherche globale"
                className="relative h-auto overflow-visible bg-transparent px-[18px]"
              >
                <div className="flex h-[58px] items-center px-2">
                  <div className="flex h-10 w-full items-center gap-2 rounded-full border border-border/80 bg-background px-3 shadow-sm transition-colors focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/15">
                    <span
                      ref={slotRef}
                      className="relative grid size-7 shrink-0 place-items-center rounded-full"
                    >
                      <Search
                        className={cn(
                          "size-5 text-foreground transition-none",
                          hideSlotIcon ? "opacity-0" : "opacity-100",
                        )}
                        strokeWidth={1.5}
                      />
                    </span>
                    <CommandPrimitive.Input
                      ref={inputRef}
                      value={query}
                      onValueChange={setQuery}
                      placeholder="Recherche…"
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                      aria-label="Rechercher"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {query && (
                      <button
                        type="button"
                        aria-label="Effacer la recherche"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{ height: listHeight }}
                  className="overflow-hidden transition-[height] duration-200 ease-out"
                >
                  <div ref={listInnerRef}>
                    <div className="mx-3 border-t border-border/60" />
                    <CommandList className="max-h-[min(52vh,340px)] px-0 pb-2 pt-1">
                      {nothing && (
                        <CommandEmpty className="py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            Aucun résultat pour «&nbsp;
                            <span className="font-medium text-foreground">{query.trim()}</span>
                            &nbsp;»
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            Essayez d'autres termes.
                          </p>
                        </CommandEmpty>
                      )}

                      {!q && recents.length > 0 && (
                        <CommandGroup heading="Récents">
                          {recents.map((r) => (
                            <CommandItem
                              key={r}
                              value={`recent-${r}`}
                              onSelect={() => setQuery(r)}
                              className="data-[selected=true]:bg-surface"
                            >
                              <History className="mr-2 size-4 text-muted-foreground" />
                              <span className="truncate">{r}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {matchingPages.length > 0 && (
                        <CommandGroup heading={q ? "Pages" : "Accès rapide"}>
                          {matchingPages.map(({ page: p }) => {
                            const Icon = p.icon;
                            return (
                              <CommandItem
                                key={p.id ?? p.to}
                                value={`page-${p.id ?? p.to}`}
                                onSelect={() => go(p.to, p.onSelect)}
                                className="data-[selected=true]:bg-surface"
                              >
                                <Icon className="mr-2 size-4 text-muted-foreground" />
                                <span className="min-w-0 flex-1 truncate">
                                  <HighlightedText
                                    text={p.label}
                                    indices={matchSearchText(q, p.label)?.indices}
                                  />
                                  {p.description && (
                                    <span className="block truncate text-[11px] text-muted-foreground">
                                      <HighlightedText
                                        text={p.description}
                                        indices={matchSearchText(q, p.description)?.indices}
                                      />
                                    </span>
                                  )}
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  <HighlightedText
                                    text={p.group}
                                    indices={matchSearchText(q, p.group)?.indices}
                                  />
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}

                      {q && quickActions.length > 0 && (
                        <CommandGroup heading="Actions rapides">
                          {quickActions.map((a) => (
                            <CommandItem
                              key={a.id}
                              value={`action-${a.id}`}
                              onSelect={() => go(a.url)}
                              className="data-[selected=true]:bg-surface"
                            >
                              <a.icon className="mr-2 size-4" />
                              {a.label}
                              <ArrowRight className="ml-auto size-3 text-muted-foreground" />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}

                      {q &&
                        SEARCH_CATEGORY_ORDER.map((category) => {
                          const items = groupedResults[category];
                          if (items.length === 0) return null;
                          const Icon = SEARCH_CATEGORY_ICONS[category];
                          return (
                            <CommandGroup key={category} heading={SEARCH_CATEGORY_LABELS[category]}>
                              {items.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={`${category}-${item.id}`}
                                  onSelect={() => go(item.url)}
                                  className="flex items-start gap-3 py-2 data-[selected=true]:bg-surface"
                                >
                                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate font-medium">
                                        <HighlightedText
                                          text={item.label}
                                          indices={item.labelMatches}
                                        />
                                      </span>
                                      {item.saved && (
                                        <Star className="size-3 shrink-0 fill-primary text-primary" />
                                      )}
                                      {item.score !== undefined && item.score > 0 && (
                                        <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                                          {item.score.toFixed(1)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                      <HighlightedText
                                        text={item.subtitle}
                                        indices={item.subtitleMatches}
                                      />
                                    </p>
                                  </div>
                                  <ArrowRight className="size-3 shrink-0 text-muted-foreground/50" />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          );
                        })}
                    </CommandList>
                  </div>
                </div>
              </Command>
            </div>

            <div className="pointer-events-none fixed left-0 top-0 z-[100]">
              <div
                ref={flyRef}
                style={{ width: ICON_PX, height: ICON_PX, visibility: "hidden" }}
                className="absolute left-0 top-0 will-change-transform"
              >
                <Search className="size-5 text-foreground" strokeWidth={1.5} />
              </div>
              {splash && (
                <div key={splash.key} className="absolute left-0 top-0" aria-hidden="true">
                  {[0, 110, 230].map((delay) => (
                    <span
                      key={delay}
                      className="hs-ripple absolute rounded-full border border-primary/45"
                      style={{
                        left: splash.x,
                        top: splash.y,
                        width: 26,
                        height: 26,
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                  {splash.drops.map((d, i) => (
                    <span
                      key={i}
                      className="hs-drop absolute rounded-full bg-primary/55"
                      style={
                        {
                          left: splash.x,
                          top: splash.y,
                          width: d.size,
                          height: d.size,
                          animationDelay: `${d.delay}ms`,
                          "--dx": `${d.dx}px`,
                          "--dy": `${d.dy}px`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </>,
          host,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Ouvrir la recherche globale"
        aria-expanded={visible}
        title="Recherche globale (⌘K / Ctrl+P)"
        onClick={toggle}
        className={cn(
          "relative rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2",
          visible && "bg-surface/70",
        )}
      >
        <span
          ref={triggerIconRef}
          key={popKey}
          className={cn("block", popKey > 0 && !visible && "hs-pop")}
          style={{ opacity: visible ? 0 : 1 }}
        >
          <Search className="size-4 md:size-5" strokeWidth={1.5} />
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-2 rounded-full border border-dashed border-foreground/25 transition-all duration-300",
            visible ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        />
      </button>
      {portal}
    </>
  );
}

function place(el: HTMLElement, p: Point, scale: number, sx: number, sy: number) {
  el.style.transform = `translate3d(${p.x - ICON_PX / 2}px, ${p.y - ICON_PX / 2}px, 0) scale(${scale * sx}, ${scale * sy})`;
}
