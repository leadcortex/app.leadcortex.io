//frontend\components\workflow\WorkflowEditor.tsx
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Workflow,
  PanelLeftClose,
  PanelRightClose,
  ArrowLeft,
  Redo2,
  Undo2,
  Search,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { WorkflowProvider, useWorkflow } from "@/lib/workflow/store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import { Canvas, type CanvasMode } from "./Canvas";
import { LeftPanel } from "./LeftPanel";
import { WorkflowRightDock } from "./WorkflowRightDock";
import { Minimap } from "./Minimap";
import { BottomToolbar } from "./BottomToolbar";
import { BlockPalette } from "./BlockPalette";
import { MobileTopBar, MOBILE_TOP_BAR_HEIGHT } from "./MobileTopBar";
import { MobileWorkflowDrawer } from "./MobileWorkflowDrawer";
import { MobileChatDock } from "./MobileChatDock";
import { Terminal, TERMINAL_COLLAPSED_HEIGHT } from "./Terminal";
import { totalBlocksCount } from "@/data/workflow-blocks-catalog";
import { cn } from "@/lib/utils";
import { WorkflowMenus, type WorkflowDialog } from "./WorkflowMenus";
import { Button } from "@/components/ui/button";
import { WorkflowEditorSkeleton } from "@/components/skeletons";

/**
 * Empêche la PAGE (html/body) de défiler ou de "rebondir" (élastique) tant
 * que l'éditeur de workflow est monté — voir la règle `.workflow-scroll-lock`
 * dans `styles.css` pour le détail du problème que ceci résout (la console
 * `Terminal` et le dock `MobileChatDock`, tous deux en `position: fixed`, se
 * désynchronisaient de leur emplacement pendant un rebond de scroll rapide
 * sur iOS/Android).
 *
 * Le verrou est posé/retiré sur `<html>` ET `<body>` (les deux doivent être
 * verrouillés pour bloquer le rebond sur tous les moteurs), et retiré au
 * démontage pour ne jamais impacter le reste du site (pages marketing,
 * documentation, etc., qui doivent rester défilables normalement).
 */
function useLockBodyScroll() {
  useEffect(() => {
    const { documentElement, body } = document;
    documentElement.classList.add("workflow-scroll-lock");
    body.classList.add("workflow-scroll-lock");
    return () => {
      documentElement.classList.remove("workflow-scroll-lock");
      body.classList.remove("workflow-scroll-lock");
    };
  }, []);
}

function Resizer({
  onDrag,
  side,
  crossBottom,
  onCrossDrag,
}: {
  onDrag: (dx: number) => void;
  side: "left" | "right";
  crossBottom?: number;
  onCrossDrag?: (dx: number, dy: number) => void;
}) {
  const last = useRef({ x: 0, y: 0 });

  const startDrag = (e: React.PointerEvent, cross: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    last.current = { x: e.clientX, y: e.clientY };
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - last.current.x;
      const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      if (cross) onCrossDrag?.(dx, dy);
      else onDrag(dx);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Redimensionner le panneau ${side === "left" ? "gauche" : "droit"}`}
      className="group relative z-30 w-2 shrink-0 cursor-ew-resize"
      onPointerDown={(e) => startDrag(e, false)}
    >
      <span className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-border/70 transition-colors group-hover:bg-primary" />
      {onCrossDrag && (
        <div
          role="separator"
          aria-label="Redimensionner le panneau et la console"
          onPointerDown={(e) => startDrag(e, true)}
          className="absolute left-1/2 h-5 w-5 -translate-x-1/2 translate-y-1/2 cursor-all-scroll rounded-full"
          style={{ bottom: crossBottom ?? 0 }}
        >
          <span className="pointer-events-none absolute inset-1 rounded-full bg-border/70 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" />
        </div>
      )}
    </div>
  );
}

function Shell({ returnTo }: { returnTo?: string }) {
  const {
    doc,
    addBlock,
    deleteSelected,
    duplicateSelected,
    copySelection,
    paste,
    undo,
    redo,
    fitView,
    setSelection,
  } = useWorkflow();
  const isMobile = useIsMobile();
  useLockBodyScroll();
  const [leftW, setLeftW] = useState(272);
  const [rightW, setRightW] = useState(330);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [mode, setMode] = useState<CanvasMode>("smart");
  const [terminalH, setTerminalH] = useState(TERMINAL_COLLAPSED_HEIGHT);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { inset: keyboardInset, viewportHeight } = useVirtualKeyboard();
  const shellRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const terminalResize = useRef<((dy: number) => void) | null>(null);

  const [palette, setPalette] = useState<{
    open: boolean;
    world: { x: number; y: number } | null;
  }>({
    open: false,
    world: null,
  });

  const openPalette = useCallback((world?: { x: number; y: number }) => {
    setPalette({ open: true, world: world ?? null });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "c") return copySelection();
      if (meta && e.key.toLowerCase() === "v") return paste();
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        return duplicateSelected();
      }
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        return e.shiftKey ? redo() : undo();
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        return redo();
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return window.dispatchEvent(
          new CustomEvent<WorkflowDialog>("workflow:open-dialog", { detail: "export" }),
        );
      }
      if (meta && e.key.toLowerCase() === "f") {
        e.preventDefault();
        return window.dispatchEvent(
          new CustomEvent<WorkflowDialog>("workflow:open-dialog", { detail: "search" }),
        );
      }
      if (meta && e.key === "/") {
        e.preventDefault();
        return window.dispatchEvent(
          new CustomEvent<WorkflowDialog>("workflow:open-dialog", { detail: "shortcuts" }),
        );
      }
      if (meta && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        return window.dispatchEvent(new CustomEvent("workflow:zoom", { detail: 0.1 }));
      }
      if (meta && e.key === "-") {
        e.preventDefault();
        return window.dispatchEvent(new CustomEvent("workflow:zoom", { detail: -0.1 }));
      }
      if (meta && e.key.toLowerCase() === "a") {
        e.preventDefault();
        return setSelection([...doc.nodes.map((n) => n.id), ...doc.comments.map((c) => c.id)]);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        return deleteSelected();
      }
      if (e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        return openPalette();
      }
      if (e.key.toLowerCase() === "f") return fitView();
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        return window.dispatchEvent(new CustomEvent("workflow:toggle-minimap"));
      }
      if (e.key.toLowerCase() === "v") return setMode("select");
      if (e.key.toLowerCase() === "h") return setMode("pan");
      if (e.key.toLowerCase() === "s") return setMode("smart");
      if (e.key === "Escape") return setSelection([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    copySelection,
    paste,
    duplicateSelected,
    undo,
    redo,
    deleteSelected,
    fitView,
    openPalette,
    setSelection,
    doc,
  ]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const stack = stackRef.current;
    if (!isMobile || !shell || !stack) return;
    const publish = () => shell.style.setProperty("--wf-stack-h", `${stack.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(stack);
    return () => observer.disconnect();
  }, [isMobile]);

  if (isMobile) {
    return (
      <div
        ref={shellRef}
        className="workflow-shell flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground"
      >
        <MobileTopBar
          returnTo={returnTo}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
          onOpenPalette={() => openPalette()}
        />

        <main className="relative min-h-0 flex-1">
          <Canvas mode={mode} onOpenPalette={(w) => openPalette(w)} />
          <Minimap />
          <MobileWorkflowDrawer
            open={mobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
            bottomInset={`calc(var(--wf-stack-h, 0px) + ${keyboardInset}px)`}
          />
        </main>

        <div
          ref={stackRef}
          className="mobile-dock-shield fixed inset-x-0 z-40 flex flex-col"
          style={{
            bottom: keyboardInset,
            maxHeight: Math.max(0, viewportHeight - MOBILE_TOP_BAR_HEIGHT),
            transition: "bottom 120ms ease-out",
          }}
        >
          <BottomToolbar mode={mode} setMode={setMode} onAddBlock={() => openPalette()} docked />
          <Terminal docked />
          <MobileChatDock />
        </div>

        <BlockPalette
          open={palette.open}
          onClose={() => setPalette({ open: false, world: null })}
          onPick={(blockId) => addBlock(blockId, palette.world?.x, palette.world?.y)}
        />
      </div>
    );
  }

  return (
    <div className="workflow-shell flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-2 border-b border-border bg-panel px-3 py-1.5">
        <Link
          to={returnTo ?? "/app"}
          aria-label="Retour"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Workflow className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Rechercher"
            title="Rechercher (Ctrl+F)"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent<WorkflowDialog>("workflow:open-dialog", { detail: "search" }),
              )
            }
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Basculer le panneau gauche"
            onClick={() => setShowLeft((v) => !v)}
            className={cn("h-7 w-7", !showLeft && "text-muted-foreground")}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Basculer le panneau droit"
            onClick={() => setShowRight((v) => !v)}
            className={cn("h-7 w-7", !showRight && "text-muted-foreground")}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex h-8 shrink-0 items-center gap-3 border-b border-border bg-panel px-3">
        <WorkflowMenus
          showLeft={showLeft}
          showRight={showRight}
          onToggleLeft={() => setShowLeft((value) => !value)}
          onToggleRight={() => setShowRight((value) => !value)}
          onOpenPalette={() => openPalette()}
        />

        <span className="hidden min-w-0 flex-1 truncate text-right text-[10px] text-muted-foreground md:block">
          {doc.nodes.length} blocs · {doc.edges.length} connexions · {doc.comments.length} notes ·{" "}
          {totalBlocksCount} blocs disponibles
        </span>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={undo}
            aria-label="Annuler"
            title="Annuler (Ctrl+Z)"
            className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            aria-label="Rétablir"
            title="Rétablir (Ctrl+Y)"
            className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-0 bg-muted/40 p-2">
        {showLeft && (
          <>
            <aside
              className="min-w-0 shrink-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm"
              style={{ width: leftW }}
            >
              <LeftPanel />
            </aside>
            <Resizer
              side="left"
              onDrag={(dx) => setLeftW((w) => Math.min(460, Math.max(200, w + dx)))}
              crossBottom={terminalH}
              onCrossDrag={(dx, dy) => {
                setLeftW((w) => Math.min(460, Math.max(200, w + dx)));
                terminalResize.current?.(-dy);
              }}
            />
          </>
        )}

        <main className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <Canvas mode={mode} onOpenPalette={(w) => openPalette(w)} />
          <Minimap />
          <BottomToolbar
            mode={mode}
            setMode={setMode}
            onAddBlock={() => openPalette()}
            bottomOffset={terminalH + 12}
          />
          <Terminal
            onHeightChange={setTerminalH}
            onRegisterResize={(fn) => {
              terminalResize.current = fn;
            }}
          />
        </main>

        {showRight && (
          <>
            <Resizer
              side="right"
              onDrag={(dx) => setRightW((w) => Math.min(520, Math.max(240, w - dx)))}
              crossBottom={terminalH}
              onCrossDrag={(dx, dy) => {
                setRightW((w) => Math.min(520, Math.max(240, w - dx)));
                terminalResize.current?.(-dy);
              }}
            />
            <aside
              className="min-w-0 shrink-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm"
              style={{ width: rightW }}
            >
              <WorkflowRightDock />
            </aside>
          </>
        )}
      </div>

      <BlockPalette
        open={palette.open}
        onClose={() => setPalette({ open: false, world: null })}
        onPick={(blockId) => addBlock(blockId, palette.world?.x, palette.world?.y)}
      />
    </div>
  );
}

export function WorkflowEditor({ returnTo }: { returnTo?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <WorkflowEditorSkeleton />;
  }

  return (
    <WorkflowProvider>
      <Shell returnTo={returnTo} />
    </WorkflowProvider>
  );
}