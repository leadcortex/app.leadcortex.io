"use client";

/**
 * Sélection de texte → citation dans le prochain prompt.
 *
 * Deux exports :
 *  - `useTextSelection()` : hook qui observe `document.selectionchange`
 *    et renvoie la sélection **si elle est dans un élément portant
 *    `data-message-id`** (c.-à-d. une bulle de message), avec sa position
 *    écran pour placer un bouton flottant.
 *  - `SelectionQuoteButton` : bouton flottant « Citer » ancré au-dessus de
 *    la sélection. Clic = le texte entre guillemets Markdown (`> …`) est
 *    injecté dans le champ de saisie du parent.
 *
 * Aucun listener `mousedown` sur le bouton lui-même (`preventDefault`) pour
 * que la sélection ne soit pas perdue avant le clic.
 */
import { useCallback, useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectionInfo = {
  text: string;
  messageId: string;
  /** Coordonnées viewport (px) pour ancrer le bouton flottant. */
  x: number;
  y: number;
} | null;

export function useTextSelection(): {
  selection: SelectionInfo;
  clearSelection: () => void;
} {
  const [selection, setSelection] = useState<SelectionInfo>(null);

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text || text.length < 2) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const container =
        range.commonAncestorContainer.nodeType === 1
          ? (range.commonAncestorContainer as HTMLElement)
          : range.commonAncestorContainer.parentElement;
      const messageEl = container?.closest<HTMLElement>("[data-message-id]");
      if (!messageEl?.dataset.messageId) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setSelection(null);
        return;
      }
      setSelection({
        text,
        messageId: messageEl.dataset.messageId,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  return { selection, clearSelection };
}

export function SelectionQuoteButton({
  selection,
  onQuote,
  className,
}: {
  selection: SelectionInfo;
  onQuote: (text: string) => void;
  className?: string;
}) {
  if (!selection) return null;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onQuote(selection.text)}
      className={cn(
        "fixed z-50 inline-flex items-center gap-1.5 rounded-full border border-border bg-popover px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-xl transition-transform hover:scale-105",
        className,
      )}
      style={{
        left: selection.x,
        top: selection.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Quote className="size-3" strokeWidth={1.8} />
      Citer
    </button>
  );
}