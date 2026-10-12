"use client";

/**
 * Feuille d'édition d'un prompt utilisateur.
 *
 *  - Desktop : `<Dialog>` classique (Radix) via `DialogContent`.
 *  - Mobile  : `MobileSheet` (tire depuis le bas, suit le clavier virtuel).
 *
 * À la validation, on renvoie le nouveau texte au parent, qui se charge de
 * remplacer la bulle d'origine (badge « modifié ») et de relancer.
 */
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function EditPromptSheet({
  open,
  initialText,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initialText: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newText: string) => void;
}) {
  const isMobile = useIsMobile();
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const body = (
    <div className="flex min-h-0 flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus={!isMobile}
        rows={6}
        className={cn(
          "w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-[16px] leading-relaxed outline-none transition-colors focus:border-primary/60 sm:text-[13px]",
        )}
        placeholder="Modifiez votre prompt…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-lg border border-border px-3 py-2 text-[12.5px] text-foreground transition-colors hover:bg-secondary/60"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" strokeWidth={2} />
          Relancer
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet open={open} onOpenChange={onOpenChange} title="Modifier le prompt" compact>
        <div className="px-5 pb-4 pt-3">{body}</div>
      </MobileSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-[15px]">Modifier le prompt</DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}