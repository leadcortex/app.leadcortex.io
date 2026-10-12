//frontend\components\workflow\BottomToolbar.tsx
import {
  MousePointer2,
  Hand,
  Plus,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  Magnet,
  Network,
  Wand2,
} from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import type { CanvasMode } from "./Canvas";
import { cn } from "@/lib/utils";

export const MOBILE_TOOLBAR_HEIGHT = 44;

type Props = {
  mode: CanvasMode;
  setMode: (m: CanvasMode) => void;
  onAddBlock: () => void;
  bottomOffset?: number;
  docked?: boolean;
};

export function BottomToolbar({ mode, setMode, onAddBlock, bottomOffset, docked = false }: Props) {
  const {
    setViewport,
    fitView,
    autoLayout,
    arranging,
    doc,
    undo,
    redo,
    addComment,
    duplicateSelected,
    deleteSelected,
    settings,
    setSettings,
    selection,
    viewport,
  } = useWorkflow();

  const Btn = ({
    icon: Icon,
    label,
    active,
    disabled,
    onClick,
  }: {
    icon: typeof Plus;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30",
        docked ? "h-9 w-9" : "h-8 w-8",
        active &&
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-border" />;

  const controls = (
    <>
      <Btn
        icon={Wand2}
        label="Curseur intelligent (S) — fond : main, bloc : déplacement, port : lien"
        active={mode === "smart"}
        onClick={() => setMode("smart")}
      />
      <Btn
        icon={MousePointer2}
        label="Sélection rectangulaire (V)"
        active={mode === "select"}
        onClick={() => setMode("select")}
      />
      <Btn
        icon={Hand}
        label="Main / Navigation (H, Espace)"
        active={mode === "pan"}
        onClick={() => setMode("pan")}
      />
      <Sep />
      <Btn icon={Plus} label="Ajouter un bloc (Shift+A)" onClick={onAddBlock} />
      <Btn icon={StickyNote} label="Ajouter une note" onClick={() => addComment()} />
      <Btn
        icon={Copy}
        label="Dupliquer (Ctrl+D)"
        disabled={!selection.length}
        onClick={duplicateSelected}
      />
      <Btn
        icon={Trash2}
        label="Supprimer (Suppr)"
        disabled={!selection.length}
        onClick={deleteSelected}
      />
      <Sep />
      <Btn icon={Undo2} label="Annuler (Ctrl+Z)" onClick={undo} />
      <Btn icon={Redo2} label="Rétablir (Ctrl+Y)" onClick={redo} />
      <Sep />
      <Btn
        icon={Network}
        label="Réorganiser (Auto-Layout)"
        active={arranging}
        disabled={doc.nodes.length < 2 || arranging}
        onClick={autoLayout}
      />
      <Sep />
      <Btn
        icon={Magnet}
        label="Aimant"
        active={settings.snap}
        onClick={() => setSettings((s) => ({ ...s, snap: !s.snap }))}
      />
      <Btn
        icon={ZoomOut}
        label="Dézoomer"
        onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(0.15, v.zoom / 1.2) }))}
      />
      <span className="w-11 shrink-0 text-center text-[11px] tabular-nums text-muted-foreground">
        {Math.round(viewport.zoom * 100)}%
      </span>
      <Btn
        icon={ZoomIn}
        label="Zoomer"
        onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(2.5, v.zoom * 1.2) }))}
      />
      <Btn icon={Maximize} label="Ajuster (F)" onClick={fitView} />
    </>
  );

  if (docked) {
    return (
      <div
        role="toolbar"
        aria-label="Outils du canevas"
        className="shrink-0 overflow-x-auto border-t border-border bg-panel [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: MOBILE_TOOLBAR_HEIGHT }}
      >
        <div className="flex h-full w-max min-w-full items-center justify-center gap-0.5 px-2">
          {controls}
        </div>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-2 transition-[bottom] duration-200"
      style={{ bottom: bottomOffset ?? 16 }}
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-panel/95 px-1.5 py-1 shadow-node backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {controls}
      </div>
    </div>
  );
}
