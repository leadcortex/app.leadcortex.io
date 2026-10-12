//frontend\components\workflow\CanvasContextMenu.tsx
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Plus,
  StickyNote,
  Crosshair,
  Copy,
  Unlink,
  MessageSquarePlus,
  Trash2,
  ClipboardPaste,
  Group,
  EyeOff,
  MousePointerSquareDashed,
  Code2,
} from "lucide-react";

export type MenuTarget = { type: "node" | "comment" | "edge"; id: string } | null;

export type MenuState = {
  x: number;
  y: number;
  world: { x: number; y: number };
  target: MenuTarget;
} | null;

type Actions = {
  addBlock: (world: { x: number; y: number }) => void;
  addNote: (world: { x: number; y: number }, target: string | null) => void;
  recenter: () => void;
  duplicate: () => void;
  remove: () => void;
  disconnect: (id: string) => void;
  toChat: (id: string) => void;
  select: (id: string) => void;
  copy: () => void;
  paste: () => void;
  group: () => void;
  selectAll: () => void;
  toggleMute: (id: string) => void;
  deleteEdge: (id: string) => void;
  openCodeEditor: (id: string) => void;
};

export function CanvasContextMenu({
  state,
  onClose,
  actions,
  hasSelection = false,
  isCodeNode,
}: {
  state: MenuState;
  onClose: () => void;
  actions: Actions;
  hasSelection?: boolean;
  isCodeNode?: (id: string) => boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const closeTouch = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("pointerdown", closeTouch);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("pointerdown", closeTouch);
      window.removeEventListener("keydown", esc);
    };
  }, [state, onClose]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !state) return;
    const margin = 8;
    const bounds = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect();
    if (!bounds) return;
    const rect = el.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (rect.right > bounds.right - margin) dx = bounds.right - margin - rect.right;
    if (rect.bottom > bounds.bottom - margin) dy = bounds.bottom - margin - rect.bottom;
    if (rect.left + dx < bounds.left + margin) dx = bounds.left + margin - rect.left;
    if (rect.top + dy < bounds.top + margin) dy = bounds.top + margin - rect.top;
    if (dx || dy) {
      el.style.left = `${state.x + dx}px`;
      el.style.top = `${state.y + dy}px`;
    }
  }, [state]);

  if (!state) return null;
  const t = state.target;

  const Item = ({
    icon: Icon,
    label,
    hint,
    danger,
    onClick,
  }: {
    icon: typeof Plus;
    label: string;
    hint?: string;
    danger?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-accent ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {hint && <kbd className="text-[10px] text-muted-foreground">{hint}</kbd>}
    </button>
  );

  return (
    <div
      ref={ref}
      className="absolute z-50 w-56 rounded-lg border border-border bg-popover p-1 shadow-node"
      style={{ left: state.x, top: state.y }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {t?.type === "edge" ? (
        <>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Connexion
          </div>
          <Item
            icon={Trash2}
            label="Supprimer la connexion"
            danger
            onClick={() => actions.deleteEdge(t.id)}
          />
        </>
      ) : t ? (
        <>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t.type === "node" ? "Bloc" : "Note"}
          </div>
          <Item
            icon={Copy}
            label="Dupliquer"
            hint="Ctrl+D"
            onClick={() => {
              actions.select(t.id);
              setTimeout(actions.duplicate, 0);
            }}
          />
          <Item icon={Copy} label="Copier" hint="Ctrl+C" onClick={actions.copy} />
          {t.type === "node" && isCodeNode?.(t.id) && (
            <Item
              icon={Code2}
              label="Ouvrir l'éditeur de code"
              onClick={() => actions.openCodeEditor(t.id)}
            />
          )}
          {t.type === "node" && (
            <>
              <Item
                icon={EyeOff}
                label="Activer / désactiver"
                onClick={() => actions.toggleMute(t.id)}
              />
              <Item icon={Unlink} label="Déconnecter" onClick={() => actions.disconnect(t.id)} />
              <Item
                icon={MessageSquarePlus}
                label="Envoyer au Chatbot IA"
                onClick={() => actions.toChat(t.id)}
              />
              <Item
                icon={StickyNote}
                label="Annoter ce bloc"
                onClick={() => actions.addNote({ x: state.world.x, y: state.world.y + 60 }, t.id)}
              />
            </>
          )}
          <div className="my-1 h-px bg-border" />
          <Item
            icon={Trash2}
            label="Supprimer"
            hint="Suppr"
            danger
            onClick={() => {
              actions.select(t.id);
              setTimeout(actions.remove, 0);
            }}
          />
        </>
      ) : (
        <>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Canevas
          </div>
          <Item
            icon={Plus}
            label="Ajouter un bloc"
            hint="Shift+A"
            onClick={() => actions.addBlock(state.world)}
          />
          <Item
            icon={StickyNote}
            label="Ajouter une note"
            onClick={() => actions.addNote(state.world, null)}
          />
          <Item icon={ClipboardPaste} label="Coller" hint="Ctrl+V" onClick={actions.paste} />
          {hasSelection && (
            <Item icon={Group} label="Grouper la sélection" hint="Ctrl+G" onClick={actions.group} />
          )}
          <Item
            icon={MousePointerSquareDashed}
            label="Tout sélectionner"
            hint="Ctrl+A"
            onClick={actions.selectAll}
          />
          <Item icon={Crosshair} label="Recentrer la vue" hint="F" onClick={actions.recenter} />
        </>
      )}
    </div>
  );
}
