//frontend\components\workflow\MobileWorkflowDrawer.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Blocks, ChevronLeft, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflow } from "@/lib/workflow/store";
import { cn } from "@/lib/utils";
import { BlockLibraryFields, TreeFields } from "./LeftPanel";

type DrawerTab = "tree" | "library";

const TAB_STORAGE_KEY = "workflow:mobile-drawer-tab-y";
const TAB_MIN_RATIO = 0.1;
const TAB_MAX_RATIO = 0.9;

const EDGE_ZONE_WIDTH = 16;

const GESTURE_THRESHOLD = 6;

const COMMIT_RATIO = 0.3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function readTabRatio() {
  try {
    const raw = window.localStorage.getItem(TAB_STORAGE_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? clamp(value, TAB_MIN_RATIO, TAB_MAX_RATIO) : 0.5;
  } catch {
    return 0.5;
  }
}

function useDrawerWidth() {
  const [width, setWidth] = useState(() => Math.min(Math.round(window.innerWidth * 0.82), 340));
  useEffect(() => {
    const onResize = () => setWidth(Math.min(Math.round(window.innerWidth * 0.82), 340));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  axis: "x" | "y" | null;
};

/**
 * Tiroir mobile « Arborescence + Bibliothèque de blocs ».
 *
 * Même principe que l'assistant IA (`assistant-sidebar`) : un panneau qui
 * glisse DEPUIS LE BORD DROIT, ouvert par un glissement de la droite vers la
 * gauche (depuis le bord de l'écran ou depuis la languette) ou par un appui
 * sur la languette. Il occupe un espace défini — sous l'en-tête, au-dessus de
 * la pile du bas (barre d'outils / console / chatbot) — et ne recouvre donc
 * jamais ces commandes.
 *
 * Contrairement à l'assistant, AUCUN voile ne flou ni ne bloque le canevas :
 * il reste entièrement utilisable autour du tiroir, car on doit pouvoir y
 * déposer des blocs pendant que le tiroir est ouvert. Pendant le glissement
 * d'un bloc, le tiroir s'efface même complètement, pour que tout le canevas
 * soit une cible de dépôt (il réapparaît au relâchement).
 *
 * Fermeture : bouton ✕, glissement vers la droite depuis l'en-tête ou le bord
 * gauche du tiroir, touche Échap, ou automatiquement après un saut vers un
 * élément de l'arborescence.
 */
export function MobileWorkflowDrawer({
  open,
  onOpenChange,
  bottomInset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  bottomInset: number | string;
}) {
  const { draggingBlockId } = useWorkflow();
  const blockDragging = draggingBlockId !== null;

  const [tab, setTab] = useState<DrawerTab>("tree");
  const width = useDrawerWidth();
  const regionRef = useRef<HTMLDivElement>(null);

  const [swipe, setSwipe] = useState<number | null>(null);
  const swipeRef = useRef(0);
  const gesture = useRef<Gesture | null>(null);

  const [tabRatio, setTabRatio] = useState(readTabRatio);
  const tabRatioRef = useRef(tabRatio);
  tabRatioRef.current = tabRatio;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const setProgress = useCallback((value: number | null) => {
    swipeRef.current = value ?? 0;
    setSwipe(value);
  }, []);

  const openGesture = (allowVertical: boolean) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      gesture.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        axis: null,
      };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== e.pointerId) return;
      const dx = g.startX - e.clientX;
      const dy = e.clientY - g.startY;
      if (!g.axis) {
        if (Math.hypot(dx, dy) < GESTURE_THRESHOLD) return;
        g.axis = allowVertical && Math.abs(dy) > Math.abs(dx) ? "y" : "x";
      }
      if (g.axis === "x") {
        setProgress(clamp(dx, 0, width));
      } else {
        const rect = regionRef.current?.getBoundingClientRect();
        if (rect && rect.height > 0) {
          setTabRatio(clamp((e.clientY - rect.top) / rect.height, TAB_MIN_RATIO, TAB_MAX_RATIO));
        }
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== e.pointerId) return;
      gesture.current = null;
      if (g.axis === "y") {
        try {
          window.localStorage.setItem(TAB_STORAGE_KEY, String(tabRatioRef.current));
        } catch {
          /* Intentionally ignored. */
        }
        return;
      }

      const committed = g.axis === null || swipeRef.current > width * COMMIT_RATIO;
      setProgress(null);
      if (committed) onOpenChange(true);
    },
    onPointerCancel: () => {
      gesture.current = null;
      setProgress(null);
    },
  });

  const closeGesture = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      gesture.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        axis: null,
      };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== e.pointerId) return;
      const dx = e.clientX - g.startX;
      const dy = Math.abs(e.clientY - g.startY);
      if (!g.axis) {
        if (Math.hypot(dx, dy) < GESTURE_THRESHOLD) return;
        if (dy > Math.abs(dx)) {
          gesture.current = null;
          return;
        }
        g.axis = "x";

        e.currentTarget.setPointerCapture(e.pointerId);
      }
      setProgress(clamp(dx, 0, width));
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== e.pointerId) return;
      gesture.current = null;
      const committed = g.axis === "x" && swipeRef.current > width * COMMIT_RATIO;
      setProgress(null);
      if (committed) onOpenChange(false);
    },
    onPointerCancel: () => {
      gesture.current = null;
      setProgress(null);
    },
  };

  // (marge en plus pour ne pas laisser dépasser l'ombre).
  const hidden = width + 24;
  const offset = open ? (swipe ?? 0) : hidden - (swipe ?? 0) * (hidden / width);
  const swiping = swipe !== null;

  const openHandlers = openGesture(false);
  const tabHandlers = openGesture(true);

  return (
    <div
      ref={regionRef}
      className="pointer-events-none absolute inset-x-0 top-0 z-20"
      style={{ bottom: bottomInset }}
    >
      {}
      {!open && (
        <div
          aria-hidden
          className="pointer-events-auto absolute inset-y-0 right-0 touch-none"
          style={{ width: EDGE_ZONE_WIDTH }}
          {...openHandlers}
        />
      )}

      {}
      {!open && (
        <button
          type="button"
          aria-label="Ouvrir l'arborescence et la bibliothèque de blocs"
          className="pointer-events-auto absolute right-0 flex w-7 -translate-y-1/2 touch-none select-none flex-col items-center gap-1.5 rounded-l-xl border border-r-0 border-border bg-panel/90 py-2.5 text-muted-foreground shadow-lg backdrop-blur"
          style={{ top: `${tabRatio * 100}%` }}
          {...tabHandlers}
        >
          <Blocks className="h-4 w-4" />
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}

      <aside
        aria-label="Arborescence et bibliothèque de blocs"
        // `inert` : rangé, le tiroir ne doit ni recevoir le focus ni être lu.
        inert={!open}
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col overflow-hidden rounded-l-2xl border-y border-l border-border bg-panel shadow-2xl",
          // Pendant le glissement d'un bloc : effacé ET transparent aux gestes,
          // pour que tout le canevas puisse recevoir le dépôt.
          blockDragging ? "pointer-events-none opacity-0" : open && "pointer-events-auto",
        )}
        style={{
          width,
          transform: `translateX(${offset}px)`,
          transition: swiping
            ? "opacity 120ms ease-out"
            : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease-out",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 z-10 w-3.5 touch-none"
          {...closeGesture}
        >
          <span className="absolute left-1 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-border" />
        </div>

        <header
          className="grid h-11 shrink-0 touch-none grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-0 pl-4 pr-2"
          {...closeGesture}
        >
          <div className="flex min-w-0 rounded-md bg-muted p-0.5">
            <Button
              type="button"
              variant={tab === "tree" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab("tree")}
              className="min-w-0 flex-1 px-2"
            >
              <Layers />
              <span className="truncate">Arborescence</span>
            </Button>
            <Button
              type="button"
              variant={tab === "library" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab("library")}
              className="min-w-0 flex-1 px-2"
            >
              <Blocks />
              <span className="truncate">Bibliothèque</span>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer le panneau"
          >
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pl-4">
          {tab === "tree" ? (
            <TreeFields touch onNavigate={() => onOpenChange(false)} />
          ) : (
            <BlockLibraryFields touch />
          )}
        </div>
      </aside>
    </div>
  );
}
