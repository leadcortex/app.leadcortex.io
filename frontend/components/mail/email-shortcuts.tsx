// frontend/components/mail/email-shortcuts.tsx

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/core/utils";

export type EmailShortcuts = {
  onCompose?: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
  onToggleRead?: () => void;
  onMarkUnread?: () => void;
  onSnooze?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onOpen?: () => void;
  onEscape?: () => void;
  onSelectAll?: () => void;
  onUndo?: () => void;
  onSearch?: () => void;
  onHelp?: () => void;
  disabled?: boolean;
};

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

function isEditable(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  return el.matches(EDITABLE_SELECTOR);
}

function isAnyDialogOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}

export function useEmailShortcuts(s: EmailShortcuts) {
  useEffect(() => {
    if (s.disabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;
      if (isAnyDialogOpen()) return;

      const k = e.key;

      switch (k) {
        case "c":
          if (s.onCompose) {
            e.preventDefault();
            s.onCompose();
          }
          return;
        case "r":
          if (s.onReply) {
            e.preventDefault();
            s.onReply();
          }
          return;
        case "a":
          if (s.onReplyAll) {
            e.preventDefault();
            s.onReplyAll();
          }
          return;
        case "f":
          if (s.onForward) {
            e.preventDefault();
            s.onForward();
          }
          return;
        case "e":
          if (s.onArchive) {
            e.preventDefault();
            s.onArchive();
          }
          return;
        case "#":
          if (s.onDelete) {
            e.preventDefault();
            s.onDelete();
          }
          return;
        case "s":
          if (s.onToggleStar) {
            e.preventDefault();
            s.onToggleStar();
          }
          return;
        case "u":
          if (e.shiftKey && s.onMarkUnread) {
            e.preventDefault();
            s.onMarkUnread();
          } else if (s.onToggleRead) {
            e.preventDefault();
            s.onToggleRead();
          }
          return;
        case "b":
          if (s.onSnooze) {
            e.preventDefault();
            s.onSnooze();
          }
          return;
        case "j":
        case "ArrowDown":
          if (s.onNext) {
            e.preventDefault();
            s.onNext();
          }
          return;
        case "k":
        case "ArrowUp":
          if (s.onPrev) {
            e.preventDefault();
            s.onPrev();
          }
          return;
        case "Enter":
        case "o":
          if (s.onOpen) {
            e.preventDefault();
            s.onOpen();
          }
          return;
        case "Escape":
          if (s.onEscape) {
            e.preventDefault();
            s.onEscape();
          }
          return;
        case "*":
          if (s.onSelectAll) {
            e.preventDefault();
            s.onSelectAll();
          }
          return;
        case "z":
          if (s.onUndo) {
            e.preventDefault();
            s.onUndo();
          }
          return;
        case "/":
          if (s.onSearch) {
            e.preventDefault();
            s.onSearch();
          }
          return;
        case "?":
          if (s.onHelp) {
            e.preventDefault();
            s.onHelp();
          }
          return;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [s]);
}

const SHORTCUTS: { group: string; items: [string, string][] }[] = [
  {
    group: "Composer",
    items: [
      ["c", "Nouveau message"],
      ["r", "Répondre"],
      ["a", "Répondre à tous"],
      ["f", "Transférer"],
    ],
  },
  {
    group: "Actions",
    items: [
      ["e", "Archiver"],
      ["#", "Supprimer"],
      ["s", "Favori"],
      ["u", "Lu / Non lu"],
      ["⇧ u", "Marquer comme non lu"],
      ["b", "Reporter (snooze)"],
      ["z", "Annuler la dernière action"],
    ],
  },
  {
    group: "Navigation",
    items: [
      ["j / ↓", "Message suivant"],
      ["k / ↑", "Message précédent"],
      ["Entrée / o", "Ouvrir"],
      ["Échap", "Fermer / Retour"],
      ["/", "Rechercher"],
      ["*", "Tout sélectionner"],
      ["?", "Afficher cette aide"],
    ],
  },
];

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg dialog-content">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Raccourcis clavier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {SHORTCUTS.map((sec) => (
            <section key={sec.group}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{sec.group}</p>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {sec.items.map(([key, label]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                  >
                    <span className="text-foreground">{label}</span>
                    <kbd
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1.5",
                        "font-mono text-[11px] text-muted-foreground",
                      )}
                    >
                      {key}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
