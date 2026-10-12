//frontend\components\workflow\CommentCard.tsx
import { useState } from "react";
import { CornerDownRight, Pencil, Check, X } from "lucide-react";
import type { WComment, WNode } from "@/lib/workflow/types";
import { NODE_W, nodeHeight } from "@/lib/workflow/geometry";
import { Markdown } from "./Markdown";
import { cn } from "@/lib/utils";

type Props = {
  comment: WComment;
  target?: WNode | undefined;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onChange: (patch: Partial<WComment>) => void;
};

export function CommentCard({
  comment,
  target,
  selected,
  onPointerDown,
  onContextMenu,
  onChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);

  const arrow = (() => {
    if (!target || !comment.pointer) return null;
    const from = { x: comment.x + comment.w / 2, y: comment.y };
    const to = { x: target.x + NODE_W / 2, y: target.y + nodeHeight(target) };
    const minX = Math.min(from.x, to.x) - 30;
    const minY = Math.min(from.y, to.y) - 30;
    const w = Math.abs(from.x - to.x) + 60;
    const h = Math.abs(from.y - to.y) + 60;
    const d = `M ${from.x - minX} ${from.y - minY} C ${from.x - minX} ${from.y - minY - 60}, ${to.x - minX} ${to.y - minY + 60}, ${to.x - minX} ${to.y - minY}`;
    return (
      <svg
        className="pointer-events-none absolute"
        style={{ left: minX, top: minY, width: w, height: h }}
      >
        <path
          d={d}
          className="stroke-annotation"
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <circle cx={to.x - minX} cy={to.y - minY} r={3.5} className="fill-annotation" />
      </svg>
    );
  })();

  return (
    <>
      {arrow}
      <div
        data-comment-id={comment.id}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        className={cn(
          "absolute flex cursor-move flex-col rounded-lg border border-dashed bg-annotation-bg backdrop-blur-sm",
          selected ? "border-ring" : "border-annotation",
        )}
        style={{ left: comment.x, top: comment.y, width: comment.w, height: comment.h }}
      >
        <div className="flex items-center gap-1.5 border-b border-annotation/40 px-2 py-1 text-[10px] uppercase tracking-wider text-annotation">
          <CornerDownRight className="h-3 w-3" />
          <span className="flex-1 truncate">Note{target ? ` → ${target.title}` : ""}</span>
          <button
            type="button"
            className="rounded p-0.5 hover:bg-muted"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (editing) onChange({ text: draft });
              setEditing((v) => !v);
            }}
            aria-label={editing ? "Enregistrer la note" : "Éditer la note"}
          >
            {editing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
          </button>
          {editing && (
            <button
              type="button"
              className="rounded p-0.5 hover:bg-muted"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setDraft(comment.text);
                setEditing(false);
              }}
              aria-label="Annuler"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 resize-none bg-transparent p-2 font-mono text-[11px] outline-none"
          />
        ) : (
          <Markdown
            text={comment.text}
            className="flex-1 space-y-1 overflow-auto p-2 text-[11px] leading-snug text-foreground/85"
          />
        )}

        <div
          className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-annotation bg-background"
          onPointerDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const w0 = comment.w;
            const h0 = comment.h;
            const el = e.currentTarget;
            el.setPointerCapture(e.pointerId);
            const move = (ev: PointerEvent) => {
              onChange({
                w: Math.max(160, w0 + (ev.clientX - startX)),
                h: Math.max(90, h0 + (ev.clientY - startY)),
              });
            };
            const up = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        />
      </div>
    </>
  );
}
