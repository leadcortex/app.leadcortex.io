//frontend\components\workflow\NodeCard.tsx
import { memo, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  EyeOff,
  GripVertical,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import {
  bodyHeight,
  blockMap,
  categoryMap,
  codeField as codeFieldOf,
  FIELD_H,
  FIELDS_PAD,
  fieldsAreaHeight,
  HEADER_H,
  inlineFields,
  NODE_MAX_W,
  NODE_MIN_W,
  nodeWidth,
  nodeHeight,
  noteAreaHeight,
  nextDynamicInputLabel,
  noteField as noteFieldOf,
  NOTE_MAX_H,
  NOTE_MIN_H,
  NOTE_PAD,
  PORT_GAP,
  portRowY,
  SUB_H,
} from "@/lib/workflow/geometry";
import { resolveLanguage } from "@/lib/workflow/code-languages";
import type { WNode } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";
import { NodeSelect } from "./NodeSelect";
import { CodePreview } from "./CodePreview";

type Props = {
  node: WNode;
  selected: boolean;
  dimmed?: boolean;
  linking?: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onPortDown: (portId: string, side: "in" | "out", e: React.PointerEvent) => void;
  onPatch: (patch: Partial<WNode>) => void;
  onConfig: (key: string, value: string | number | boolean) => void;
  onOpenCodeEditor?: () => void;
};

const stop = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

const PORT_HIT =
  "after:absolute after:-inset-3 after:rounded-full after:content-[''] touch-none cursor-crosshair";

function NodeCardBase({
  node,
  selected,
  dimmed,
  linking,
  onPointerDown,
  onContextMenu,
  onPortDown,
  onPatch,
  onConfig,
  onOpenCodeEditor,
}: Props) {
  /**
   * Sur mobile/tactile, le navigateur applique une « capture implicite » du
   * pointeur sur l'élément où le doigt s'est posé : tous les événements
   * suivants (y compris `pointerup`) sont alors renvoyés à ce même élément,
   * jamais au port survolé. On relâche donc la capture immédiatement pour que
   * le câble puisse s'accrocher au port cible comme sur desktop.
   */
  const portDown = (portId: string, side: "in" | "out", e: React.PointerEvent) => {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    onPortDown(portId, side, e);
  };

  const cat = categoryMap[node.category];
  const block = blockMap[node.blockId];
  const Icon = block?.icon ?? cat.icon;

  const w = nodeWidth(node);
  const h = nodeHeight(node);
  const fields = inlineFields(node);
  const accent = cat.color;

  const note = noteFieldOf(node);
  const noteH = noteAreaHeight(node) - NOTE_PAD;
  const noteTop = bodyHeight(node) - noteAreaHeight(node) + 2;
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const fieldsRef = useRef<HTMLDivElement | null>(null);
  const currentFieldsH = fieldsAreaHeight(node);

  const code = codeFieldOf(node);
  const isCode = Boolean(code && note && code.key === note.key);
  const language = resolveLanguage(node.config["language"]);

  useEffect(() => {
    const el = taRef.current;
    if (!el || !note || isCode) return;
    const ro = new ResizeObserver(() => {
      const next = Math.round(Math.min(NOTE_MAX_H, Math.max(NOTE_MIN_H, el.offsetHeight)));
      if (next !== Math.round(noteH)) onPatch({ noteH: next });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [note, noteH, onPatch, isCode]);

  useEffect(() => {
    const el = fieldsRef.current;
    if (!el || fields.length === 0) return;
    const ro = new ResizeObserver(() => {
      const next = Math.round(el.offsetHeight);
      if (next !== Math.round(currentFieldsH)) onPatch({ fieldsH: next });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fields.length, currentFieldsH, onPatch]);

  /**
   * Redimensionnement manuel du bloc (largeur, et hauteur quand le bloc
   * possède une zone de texte/code). Le geste est capturé sur la poignée du
   * coin bas-droit et n'entre jamais en conflit avec le déplacement du bloc.
   */
  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture?.(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = w;
    const startH = noteH;
    const canResizeH = Boolean(note);

    const move = (ev: PointerEvent) => {
      const patch: Partial<WNode> = {
        w: Math.round(Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, startW + (ev.clientX - startX)))),
      };
      if (canResizeH) {
        patch.noteH = Math.round(
          Math.min(NOTE_MAX_H, Math.max(NOTE_MIN_H, startH + (ev.clientY - startY))),
        );
      }
      onPatch(patch);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const canAddInput = Boolean(block?.dynamicInputs) && !node.collapsed;
  const addInput = () => {
    const n = node.inputs.length + 1;
    const label = nextDynamicInputLabel(node.inputs.map((p) => p.label));
    onPatch({
      inputs: [...node.inputs, { id: `in${n}_${Date.now().toString(36)}`, label }],
    });
  };
  const removeInput = (portId: string) => {
    if (node.inputs.length <= 1) return;
    onPatch({ inputs: node.inputs.filter((p) => p.id !== portId) });
  };

  return (
    <div
      data-node-id={node.id}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      className={cn(
        "group absolute cursor-move select-none rounded-2xl border bg-node text-node-foreground shadow-node transition-[box-shadow,transform,opacity] duration-150",
        selected ? "border-transparent shadow-glow" : "border-node-border hover:shadow-node-hover",
        node.muted && "opacity-55 saturate-50",
        dimmed && "opacity-35",
      )}
      style={{ left: node.x, top: node.y, width: w, height: h }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-1 top-2.5 bottom-2.5 w-[5px] rounded-full"
        style={{ background: accent }}
      />

      <div
        className="flex items-center gap-2 rounded-t-2xl pl-4 pr-2"
        style={{
          height: HEADER_H,
          background: `color-mix(in oklab, ${accent} 14%, transparent)`,
        }}
      >
        <span
          className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
          style={{ background: accent, color: "oklch(0.16 0.02 70)" }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold leading-tight tracking-tight">
            {node.title}
          </p>
        </div>
        {node.status === "running" && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
        )}
        {node.status === "success" && <span className="h-2 w-2 shrink-0 rounded-full bg-success" />}
        {node.status === "error" && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
        )}
        {node.muted && <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        {isCode && onOpenCodeEditor && (
          <button
            type="button"
            aria-label="Ouvrir l'éditeur de code"
            title="Ouvrir l'éditeur de code"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation();
              onOpenCodeEditor();
            }}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          aria-label={node.collapsed ? "Déplier le bloc" : "Replier le bloc"}
          onPointerDown={stop}
          onClick={(e) => {
            e.stopPropagation();
            onPatch({ collapsed: !node.collapsed });
          }}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          {node.collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {!node.collapsed && (
        <>
          <div
            className="flex items-center truncate px-4 text-[10.5px] leading-tight text-muted-foreground"
            style={{ height: SUB_H }}
          >
            <span className="truncate">{node.subtitle}</span>
          </div>

          {fields.length > 0 && (
            <div
              ref={fieldsRef}
              className="space-y-1 px-4"
              style={{ paddingTop: FIELDS_PAD - 4, paddingBottom: FIELDS_PAD }}
            >
              {fields.map((f) => {
                const v = node.config[f.key];
                return (
                  <div
                    key={f.key}
                    className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2"
                    style={{ minHeight: FIELD_H - 4 }}
                  >
                    <span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </span>
                    {f.type === "toggle" ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(v)}
                        aria-label={f.label}
                        onPointerDown={stop}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfig(f.key, !v);
                        }}
                        className={cn(
                          "h-4 w-8 rounded-full transition-colors",
                          v ? "bg-primary" : "bg-muted",
                        )}
                      >
                        <span
                          className="block h-3 w-3 rounded-full bg-background transition-transform"
                          style={{ transform: v ? "translateX(17px)" : "translateX(2px)" }}
                        />
                      </button>
                    ) : f.type === "select" ? (
                      <NodeSelect
                        value={String(v ?? "")}
                        onChange={(val) => onConfig(f.key, val)}
                        options={f.options ?? []}
                        ariaLabel={f.label}
                        size="compact"
                        autoGrow
                        onPointerDownCapture={stop}
                      />
                    ) : (
                      <input
                        type={f.type === "number" ? "number" : "text"}
                        value={String(v ?? "")}
                        placeholder={f.placeholder ?? "—"}
                        aria-label={f.label}
                        onPointerDown={stop}
                        onClick={stop}
                        onChange={(e) =>
                          onConfig(
                            f.key,
                            f.type === "number" ? Number(e.target.value) : e.target.value,
                          )
                        }
                        className="wf-node-field h-6 w-full min-w-0 rounded-md border border-input bg-input-bg px-1.5 text-[11px] outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {note && isCode && (
            <div className="absolute inset-x-3" style={{ top: noteTop }}>
              <CodePreview
                code={String(node.config[note.key] ?? "")}
                language={language.id}
                height={noteH}
                placeholder={note.placeholder ?? "Aucun code — ouvre l'éditeur."}
                headerLabel={`${note.label} · ${language.label}`}
                onEdit={onOpenCodeEditor}
              />
            </div>
          )}

          {note && !isCode && (
            <div className="absolute inset-x-3" style={{ top: noteTop }}>
              <textarea
                ref={taRef}
                value={String(node.config[note.key] ?? "")}
                placeholder={note.placeholder ?? "Écris ici…"}
                aria-label={note.label}
                onPointerDown={stop}
                onClick={stop}
                onWheel={(e) => e.stopPropagation()}
                onChange={(e) => onConfig(note.key, e.target.value)}
                style={{ height: noteH, maxHeight: NOTE_MAX_H, minHeight: NOTE_MIN_H }}
                className="wf-node-field w-full resize-y overflow-auto rounded-md border border-input bg-input-bg px-2 py-1.5 text-[11px] leading-snug outline-none"
              />
              <span className="pointer-events-none absolute -top-3 left-0.5 text-[9px] uppercase tracking-wide text-muted-foreground/70">
                {note.label}
              </span>
            </div>
          )}

          <div
            role="separator"
            aria-label="Redimensionner le bloc"
            title="Redimensionner le bloc"
            onPointerDown={startResize}
            onClick={stop}
            className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-nwse-resize touch-none opacity-0 transition-opacity group-hover:opacity-100"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-1 right-1 h-2 w-2 rounded-[2px] border-b-2 border-r-2 border-muted-foreground/70"
            />
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 h-px bg-border"
            style={{ top: bodyHeight(node) + 4 }}
          />

          {canAddInput && (
            <button
              type="button"
              aria-label="Ajouter une entrée"
              title="Ajouter une entrée"
              onPointerDown={stop}
              onClick={(e) => {
                e.stopPropagation();
                addInput();
              }}
              className="absolute -left-[26px] grid h-5 w-5 -translate-y-1/2 place-items-center rounded-md border border-dashed border-border bg-node text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              style={{ top: portRowY(node, node.inputs.length) }}
            >
              <Plus className="h-3 w-3" />
            </button>
          )}

          {(node.inputs ?? []).map((p, i) => (
            <div
              key={p.id}
              className="absolute left-3 flex items-center text-[10.5px] text-muted-foreground"
              style={{ top: portRowY(node, i) - PORT_GAP / 2, height: PORT_GAP }}
            >
              <span className="max-w-[104px] truncate">{p.label}</span>
              {canAddInput && i > 0 && (
                <button
                  type="button"
                  aria-label={`Supprimer l'entrée ${p.label}`}
                  title="Supprimer cette entrée"
                  onPointerDown={stop}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeInput(p.id);
                  }}
                  className="ml-1 grid h-4 w-4 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                aria-label={`Entrée ${p.label}`}
                data-port-id={p.id}
                data-port-side="in"
                data-port-node={node.id}
                onPointerDown={(e) => portDown(p.id, "in", e)}
                style={{ touchAction: "none" }}
                className={cn(
                  PORT_HIT,
                  "absolute -left-[18px] top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full border-2 border-node bg-port transition-transform hover:scale-125",
                  linking && "scale-125 ring-2 ring-primary/50",
                )}
              />
            </div>
          ))}
          {(node.outputs ?? []).map((p, i) => (
            <div
              key={p.id}
              className="absolute right-3 flex items-center justify-end text-[10.5px] text-muted-foreground"
              style={{ top: portRowY(node, i) - PORT_GAP / 2, height: PORT_GAP }}
            >
              <span className="max-w-[132px] truncate text-right">{p.label}</span>
              <button
                type="button"
                aria-label={`Sortie ${p.label}`}
                data-port-id={p.id}
                data-port-side="out"
                data-port-node={node.id}
                onPointerDown={(e) => portDown(p.id, "out", e)}
                className={cn(
                  PORT_HIT,
                  "absolute -right-[18px] top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full border-2 border-node transition-transform hover:scale-125",
                )}
                style={{ background: accent, touchAction: "none" }}
              />
            </div>
          ))}
        </>
      )}

      {node.collapsed && (
        <>
          {(node.inputs ?? [])[0] && (
            <button
              type="button"
              aria-label="Entrée"
              data-port-id={node.inputs[0]!.id}
              data-port-side="in"
              data-port-node={node.id}
              onPointerDown={(e) => portDown(node.inputs[0]!.id, "in", e)}
              className={cn(
                PORT_HIT,
                "absolute -left-[18px] h-4 w-4 -translate-y-1/2 rounded-full border-2 border-node bg-port",
              )}
              style={{ top: portRowY(node, 0), touchAction: "none" }}
            />
          )}
          {(node.outputs ?? [])[0] && (
            <button
              type="button"
              aria-label="Sortie"
              data-port-id={node.outputs[0]!.id}
              data-port-side="out"
              data-port-node={node.id}
              onPointerDown={(e) => portDown(node.outputs[0]!.id, "out", e)}
              className={cn(
                PORT_HIT,
                "absolute -right-[18px] h-4 w-4 -translate-y-1/2 rounded-full border-2 border-node",
              )}
              style={{ top: portRowY(node, 0), background: accent, touchAction: "none" }}
            />
          )}
        </>
      )}
    </div>
  );
}

export const NodeCard = memo(NodeCardBase);
