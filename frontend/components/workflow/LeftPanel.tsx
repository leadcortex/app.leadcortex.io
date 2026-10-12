//frontend\components\workflow\LeftPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Frame,
  Grid3x3,
  Layers,
  Magnet,
  Maximize,
  Search,
  StickyNote,
  Cable,
  Focus,
  Blocks,
  GripVertical,
  Plus,
} from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import { categoryMap, BLOCK_DRAG_MIME } from "@/lib/workflow/geometry";
import {
  BLOCK_TOUCH_DRAG_END,
  BLOCK_TOUCH_DRAG_MOVE,
  emitBlockTouchDrag,
} from "@/lib/workflow/block-touch-drag";
import {
  BLOCKS,
  CATEGORIES,
  totalBlocksCount,
  type BlockDef,
} from "@/data/workflow-blocks-catalog";
import { cn } from "@/lib/utils";

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Layers;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        <Icon className="h-3.5 w-3.5" />
        <span className="flex-1 truncate text-left">{title}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 text-[11.5px]">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    className={cn(
      "h-4 w-8 shrink-0 rounded-full transition-colors",
      on ? "bg-primary" : "bg-muted",
    )}
  >
    <span
      className={cn(
        "block h-3 w-3 rounded-full bg-background transition-transform",
        on ? "translate-x-4.5 ml-0.5" : "ml-0.5",
      )}
      style={{ transform: on ? "translateX(16px)" : undefined }}
    />
  </button>
);

const numInput =
  "h-6 w-16 shrink-0 rounded border border-input bg-input-bg px-1.5 text-right text-[11px] outline-none focus:border-ring";

export function CanvasSettingsFields() {
  const { settings, setSettings } = useWorkflow();
  return (
    <>
      <Row label="Canevas borné">
        <Toggle
          on={settings.bounded}
          onClick={() => setSettings((s) => ({ ...s, bounded: !s.bounded }))}
        />
      </Row>
      <Row label="Largeur">
        <input
          type="number"
          className={numInput}
          value={settings.width}
          disabled={!settings.bounded}
          onChange={(e) => setSettings((s) => ({ ...s, width: Number(e.target.value) || 0 }))}
        />
      </Row>
      <Row label="Hauteur">
        <input
          type="number"
          className={numInput}
          value={settings.height}
          disabled={!settings.bounded}
          onChange={(e) => setSettings((s) => ({ ...s, height: Number(e.target.value) || 0 }))}
        />
      </Row>
    </>
  );
}

export function DisplayFields() {
  const { settings, setSettings, viewport, setViewport, fitView } = useWorkflow();
  return (
    <>
      <Row label="Grille visible">
        <Toggle
          on={settings.showGrid}
          onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
        />
      </Row>
      <Row label="Aimant (snap)">
        <Toggle on={settings.snap} onClick={() => setSettings((s) => ({ ...s, snap: !s.snap }))} />
      </Row>
      <Row label="Pas de grille">
        <input
          type="number"
          className={numInput}
          value={settings.gridSize}
          min={5}
          onChange={(e) =>
            setSettings((s) => ({ ...s, gridSize: Math.max(5, Number(e.target.value) || 50) }))
          }
        />
      </Row>
      <Row label="Mini-carte">
        <Toggle
          on={settings.showMinimap}
          onClick={() => setSettings((s) => ({ ...s, showMinimap: !s.showMinimap }))}
        />
      </Row>
      <div className="mt-2 flex items-center gap-2">
        <Magnet className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="range"
          min={15}
          max={250}
          value={Math.round(viewport.zoom * 100)}
          onChange={(e) => setViewport((v) => ({ ...v, zoom: Number(e.target.value) / 100 }))}
          className="h-1 flex-1 accent-primary"
        />
        <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">
          {Math.round(viewport.zoom * 100)}%
        </span>
      </div>
      <button
        type="button"
        onClick={fitView}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-border py-1 text-[11px] hover:bg-accent"
      >
        <Maximize className="h-3.5 w-3.5" /> Ajuster à la vue
      </button>
    </>
  );
}

export function TreeFields({
  onNavigate,
  touch = false,
}: {
  onNavigate?: () => void;
  touch?: boolean;
} = {}) {
  const { doc, selection, focusOn } = useWorkflow();
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const list = [
      ...doc.nodes.map((n) => ({
        id: n.id,
        kind: "Bloc" as const,
        label: n.title,
        color: categoryMap[n.category].color,
        icon: Layers,
      })),
      ...doc.comments.map((c) => ({
        id: c.id,
        kind: "Note" as const,
        label: c.text.replace(/[#*`]/g, "").split("\n").find(Boolean)?.slice(0, 34) ?? "Note",
        color: "var(--annotation)",
        icon: StickyNote,
      })),
      ...doc.edges.map((e) => {
        const s = doc.nodes.find((n) => n.id === e.source);
        const t = doc.nodes.find((n) => n.id === e.target);
        return {
          id: e.id,
          kind: "Câble" as const,
          label: `${s?.title ?? "?"} → ${t?.title ?? "?"}`,
          color: "var(--muted-foreground)",
          icon: Cable,
        };
      }),
    ];
    return q ? list.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())) : list;
  }, [doc, q]);

  return (
    <>
      <div className="relative mb-2">
        <Search
          className={cn(
            "absolute text-muted-foreground",
            touch ? "left-3 top-3 h-4 w-4" : "left-2 top-1.5 h-3.5 w-3.5",
          )}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrer les éléments…"
          className={cn(
            "w-full rounded border border-input bg-input-bg outline-none focus:border-ring",
            touch ? "h-10 pl-9 pr-3 text-[16px]" : "h-7 pl-7 pr-2 text-[11.5px]",
          )}
        />
      </div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => {
                focusOn(it.id);
                onNavigate?.();
              }}
              className={cn(
                "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded px-1.5 text-left",
                touch ? "min-h-10 py-1.5 text-[13px]" : "py-1 text-[11.5px]",
                selection.includes(it.id) ? "bg-accent text-foreground" : "hover:bg-accent/60",
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: it.color }} />
              <span className="min-w-0 truncate">{it.label}</span>
              <Focus
                className={cn(
                  "h-3 w-3 shrink-0 text-muted-foreground",
                  touch ? "opacity-60" : "opacity-0 group-hover:opacity-100",
                )}
              />
            </button>
          </li>
        ))}
        {!items.length && (
          <li className="py-2 text-[11px] text-muted-foreground">Aucun élément.</li>
        )}
      </ul>
    </>
  );
}

/**
 * Sous-accordéon (imbriqué dans une catégorie) — même logique que `Section`
 * mais plus compact, pour empiler les catégories de blocs sans encombrer.
 */
function SubSection({
  title,
  color,
  count,
  open,
  onToggle,
  touch = false,
  children,
}: {
  title: string;
  color: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  touch?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-1.5 text-left hover:text-foreground",
          touch ? "min-h-10 py-2 text-[13px]" : "py-1.5 text-[11.5px]",
        )}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{count}</span>
      </button>
      {open && <div className="space-y-0.5 pb-1.5 pl-4">{children}</div>}
    </div>
  );
}

/** Distance (px) à parcourir avant qu'un appui sur la poignée devienne un glisser. */
const TOUCH_DRAG_ACTIVATION = 6;

/**
 * Une ligne de bloc dans la bibliothèque : cliquable (ajout instantané au
 * centre de la vue) et glissable vers le canevas.
 *  - desktop : drag-and-drop natif HTML5 sur toute la ligne ;
 *  - mode `touch` (tiroir mobile) : glisser depuis la poignée à droite, piloté
 *    par Pointer Events (voir `block-touch-drag.ts`) — fiable au doigt, et sans
 *    conflit avec le défilement vertical de la liste.
 */
function DraggableBlockRow({ block, touch = false }: { block: BlockDef; touch?: boolean }) {
  const { addBlock, setDraggingBlockId } = useWorkflow();
  const c = categoryMap[block.category];
  const Icon = block.icon;

  // Nettoyage si la ligne disparaît en plein geste (filtre modifié, démontage).
  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanupRef.current?.(), []);

  const startTouchDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const { pointerId, clientX: startX, clientY: startY } = e;
    let active = false;

    const send = (
      type: typeof BLOCK_TOUCH_DRAG_MOVE | typeof BLOCK_TOUCH_DRAG_END,
      ev: PointerEvent,
      cancelled = false,
    ) =>
      emitBlockTouchDrag(type, {
        blockId: block.id,
        clientX: ev.clientX,
        clientY: ev.clientY,
        cancelled,
      });

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < TOUCH_DRAG_ACTIVATION) return;
        active = true;
        setDraggingBlockId(block.id);
      }
      send(BLOCK_TOUCH_DRAG_MOVE, ev);
    };
    const finish = (ev: PointerEvent, cancelled: boolean) => {
      if (ev.pointerId !== pointerId) return;
      cleanup();
      if (active) {
        setDraggingBlockId(null);
        send(BLOCK_TOUCH_DRAG_END, ev, cancelled);
      }
    };
    const up = (ev: PointerEvent) => finish(ev, false);
    const cancel = (ev: PointerEvent) => finish(ev, true);
    const cleanup = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      cleanupRef.current = null;
    };

    cleanupRef.current = () => {
      cleanup();
      if (active) {
        setDraggingBlockId(null);
        emitBlockTouchDrag(BLOCK_TOUCH_DRAG_END, {
          blockId: block.id,
          clientX: 0,
          clientY: 0,
          cancelled: true,
        });
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={!touch}
      onDragStart={(e) => {
        e.dataTransfer.setData(BLOCK_DRAG_MIME, block.id);
        e.dataTransfer.effectAllowed = "copy";
        setDraggingBlockId(block.id);
      }}
      onDragEnd={() => setDraggingBlockId(null)}
      onClick={() => addBlock(block.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          addBlock(block.id);
        }
      }}
      title={
        touch
          ? "Toucher pour ajouter au centre, ou glisser la poignée vers le canevas"
          : "Glisser sur le canevas, ou cliquer pour ajouter au centre"
      }
      className={cn(
        "group grid items-center gap-1.5 rounded px-1.5 text-left outline-none hover:bg-accent focus-visible:bg-accent",
        touch
          ? "min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] py-0.5"
          : "cursor-grab grid-cols-[auto_minmax(0,1fr)_auto] py-1 active:cursor-grabbing",
      )}
    >
      <span
        className={cn("grid shrink-0 place-items-center rounded", touch ? "h-7 w-7" : "h-5 w-5")}
        style={{ background: `${c.color}25`, color: c.color }}
      >
        <Icon className={touch ? "h-4 w-4" : "h-3 w-3"} />
      </span>
      <span className={cn("min-w-0 truncate", touch ? "text-[13px]" : "text-[11.5px]")}>
        {block.title}
      </span>
      {touch ? (
        <span
          role="presentation"
          onPointerDown={startTouchDrag}
          onClick={(e) => e.stopPropagation()}
          className="grid h-10 w-10 shrink-0 touch-none select-none place-items-center rounded text-muted-foreground active:bg-accent"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      ) : (
        <Plus className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
      )}
    </div>
  );
}

/**
 * Contenu "Bibliothèque de blocs" — tous les blocs du catalogue, organisés
 * par catégorie repliable, glissables (drag-and-drop) directement sur le
 * canevas. Vient en complément de la modale d'ajout (Shift+A / double-clic)
 * pour enchaîner rapidement les ajouts sans ouvrir de fenêtre.
 */
export function BlockLibraryFields({ touch = false }: { touch?: boolean } = {}) {
  const [q, setQ] = useState("");
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());
  const needle = q.trim().toLowerCase();

  const grouped = useMemo(() => {
    const byCat = new Map<string, BlockDef[]>();
    for (const b of BLOCKS) {
      if (
        needle &&
        !b.title.toLowerCase().includes(needle) &&
        !b.subtitle.toLowerCase().includes(needle) &&
        !(b.tags ?? []).some((t) => t.toLowerCase().includes(needle))
      ) {
        continue;
      }
      if (!byCat.has(b.category)) byCat.set(b.category, []);
      byCat.get(b.category)!.push(b);
    }
    return CATEGORIES.filter((c) => byCat.has(c.key)).map((c) => ({
      def: c,
      blocks: byCat.get(c.key)!,
    }));
  }, [needle]);

  const toggleCat = (key: string) =>
    setOpenCats((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      <div className="relative mb-2">
        <Search
          className={cn(
            "absolute text-muted-foreground",
            touch ? "left-3 top-3 h-4 w-4" : "left-2 top-1.5 h-3.5 w-3.5",
          )}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrer les blocs…"
          className={cn(
            "w-full rounded border border-input bg-input-bg outline-none focus:border-ring",
            touch ? "h-10 pl-9 pr-3 text-[16px]" : "h-7 pl-7 pr-2 text-[11.5px]",
          )}
        />
      </div>
      <div>
        {grouped.map(({ def, blocks }) => {
          // Avec un filtre actif, on déplie automatiquement les catégories
          // qui matchent pour éviter à l'utilisateur un clic superflu.
          const open = needle ? true : openCats.has(def.key);
          return (
            <SubSection
              key={def.key}
              title={def.label}
              color={def.color}
              count={blocks.length}
              open={open}
              onToggle={() => toggleCat(def.key)}
              touch={touch}
            >
              {blocks.map((b) => (
                <DraggableBlockRow key={b.id} block={b} touch={touch} />
              ))}
            </SubSection>
          );
        })}
        {!grouped.length && (
          <p className="py-2 text-[11px] text-muted-foreground">Aucun bloc trouvé.</p>
        )}
      </div>
    </>
  );
}

export { Section as LeftPanelSection };

/**
 * Panneau gauche desktop — deux sections **indépendantes** en hauteur et en
 * scroll :
 *
 *   ┌───────────────────────────────┐
 *   │ ARBORESCENCE      20 %        │ ← header fixe
 *   │ ┌───────────────────────────┐ │
 *   │ │ liste scrollable          │ │ ← scroll #1 (indépendant)
 *   │ └───────────────────────────┘ │
 *   ├───────────────────────────────┤
 *   │ BIBLIOTHÈQUE DE BLOCS  80 %   │ ← header fixe
 *   │ ┌───────────────────────────┐ │
 *   │ │ liste scrollable          │ │ ← scroll #2 (indépendant)
 *   │ └───────────────────────────┘ │
 *   └───────────────────────────────┘
 *
 * Chaque section a son propre `overflow-y-auto` + `overscroll-contain` : le
 * scroll de l'une ne déborde donc jamais sur l'autre (auparavant, tout était
 * dans un unique conteneur scrollable, si bien que faire défiler la
 * bibliothèque faisait disparaître l'arborescence hors de la vue).
 * La répartition 1 : 4 est assurée par `flex-[1_1_0%]` / `flex-[4_1_0%]`,
 * avec un plancher (`min-h-[80px]`) pour que l'arborescence ne disparaisse
 * jamais complètement quand la fenêtre est très courte.
 */
export function LeftPanel() {
  const { doc } = useWorkflow();
  const itemCount = doc.nodes.length + doc.comments.length + doc.edges.length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-panel">
      <section className="flex min-h-[80px] flex-[1_1_0%] flex-col border-b border-border">
        <header className="flex shrink-0 items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">Arborescence ({itemCount})</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-3">
          <TreeFields />
        </div>
      </section>

      <section className="flex min-h-0 flex-[4_1_0%] flex-col">
        <header className="flex shrink-0 items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Blocks className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">
            Bibliothèque de blocs ({totalBlocksCount})
          </span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-3">
          <BlockLibraryFields />
        </div>
      </section>
    </div>
  );
}
