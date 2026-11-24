// frontend/components/people/note-quick-dialog.tsx

import { useState } from "react";
import { FileText } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type NoteQuickDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onSaved: (text: string) => void;
};

export function NoteQuickDialog({ open, onOpenChange, lead, onSaved }: NoteQuickDialogProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSaved(text.trim());
    toast.success("Note ajoutée");
    setText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl italic">Ajouter une note</DialogTitle>
          <DialogDescription>
            Pour {lead.name} — {lead.company}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contexte, prochaine étape, points d'attention..."
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-[0_2px_0_var(--border)] focus:shadow-none focus:translate-y-[2px]"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-background hover:bg-surface shadow-[0_1px_0_var(--border)] active:translate-y-[1px] active:shadow-none transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <FileText className="size-3.5" /> Enregistrer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
