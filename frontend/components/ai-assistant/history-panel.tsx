"use client";

/**
 * Historique des conversations de l'assistant.
 *
 * Desktop → Dialog centré.
 * Mobile  → MobileSheet tiré du bas.
 *
 * Affiche la liste triée par date de modification, avec titre, extrait du
 * dernier message, date relative et bouton de suppression. Un clic sur une
 * entrée charge la conversation (le parent se charge de l'application).
 */
import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  deleteConversation,
  formatRelativeDate,
  loadConversations,
  type Conversation,
} from "./conversation-store";

export function HistoryPanel({
  open,
  onOpenChange,
  currentId,
  onSelect,
  onNew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId: string | null;
  onSelect: (conv: Conversation) => void;
  onNew: () => void;
}) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<Conversation[]>([]);

  useEffect(() => {
    if (open) setItems(loadConversations());
  }, [open]);

  const handleDelete = (id: string) => {
    deleteConversation(id);
    setItems(loadConversations());
  };

  const list = (
    <div className="flex min-h-0 flex-col gap-1">
      <button
        type="button"
        onClick={() => {
          onNew();
          onOpenChange(false);
        }}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary/40"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Plus className="size-3.5" strokeWidth={1.8} />
        </span>
        <span className="text-[12.5px] font-medium">Nouvelle conversation</span>
      </button>

      {items.length === 0 ? (
        <p className="px-2 py-6 text-center text-[11.5px] text-muted-foreground">
          Aucune conversation enregistrée pour le moment.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const excerpt = last?.text.replace(/\s+/g, " ").trim().slice(0, 90) ?? "";
            const active = c.id === currentId;
            return (
              <li key={c.id}>
                <div
                  className={cn(
                    "group flex items-start gap-2 rounded-xl px-2.5 py-2 transition-colors",
                    active ? "bg-primary/10" : "hover:bg-secondary/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      onOpenChange(false);
                    }}
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg",
                        active ? "bg-primary/20 text-primary" : "bg-secondary/60 text-muted-foreground",
                      )}
                    >
                      <MessageSquare className="size-3" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-[12px] font-medium",
                          active ? "text-primary" : "text-foreground",
                        )}
                      >
                        {c.title || "Sans titre"}
                      </span>
                      {excerpt && (
                        <span className="mt-0.5 block line-clamp-1 text-[10.5px] text-muted-foreground">
                          {excerpt}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[9.5px] uppercase tracking-wider text-muted-foreground/70">
                        {formatRelativeDate(c.updatedAt)} · {c.messages.length} msg
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    aria-label={`Supprimer « ${c.title} »`}
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" strokeWidth={1.8} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet open={open} onOpenChange={onOpenChange} title="Historique" compact>
        <div className="px-3 pb-4 pt-2">{list}</div>
      </MobileSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-[15px]">Historique des conversations</DialogTitle>
        <div className="mt-1 max-h-[60vh] overflow-y-auto overscroll-contain pr-1">{list}</div>
      </DialogContent>
    </Dialog>
  );
}