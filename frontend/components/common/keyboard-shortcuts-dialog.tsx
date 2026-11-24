// frontend/components/common/keyboard-shortcuts-dialog.tsx

import { useMemo } from "react";
import { Keyboard, Command } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import {
  PEOPLE_SHORTCUTS,
  SHORTCUT_GROUP_ORDER,
  type ShortcutDef,
  type ShortcutGroup,
} from "@/lib/people/shortcuts";
import { cn } from "@/lib/core/utils";

export type KeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function ShortcutRow({ s }: { s: ShortcutDef }) {
  return (
    <li className="flex items-start justify-between gap-4 px-3 py-2 border-b border-border/40 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground leading-tight">{s.label}</p>
        {s.description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{s.description}</p>
        )}
      </div>
      <kbd
        className={cn(
          "shrink-0 inline-flex items-center rounded-md border border-border bg-surface/60",
          "px-2 py-1 font-mono text-[10.5px] font-semibold text-foreground",
          "shadow-[0_1px_0_var(--border)]",
        )}
      >
        {s.keys}
      </kbd>
    </li>
  );
}

function ShortcutsBody() {
  const grouped = useMemo(() => {
    const map = new Map<ShortcutGroup, ShortcutDef[]>();
    for (const s of PEOPLE_SHORTCUTS) {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    }
    return SHORTCUT_GROUP_ORDER.map((g) => ({ group: g, items: map.get(g) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, []);

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-3">
        <p className="text-[11px] text-primary inline-flex items-center gap-1.5">
          <Command className="size-3.5" />
          Astuce : {isMac ? "⌘" : "Ctrl"} remplace {isMac ? "Ctrl" : "⌘"} sur cet appareil.
        </p>
      </div>

      {grouped.map(({ group, items }) => (
        <section key={group}>
          <h3 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {group}
          </h3>
          <ul className="overflow-hidden rounded-xl border border-border bg-background">
            {items.map((s) => (
              <ShortcutRow key={s.id} s={s} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileSheet open={open} onOpenChange={onOpenChange} title="Raccourcis clavier">
        <div className="px-2 py-2">
          <ShortcutsBody />
        </div>
      </MobileSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 font-display text-xl italic">
            <Keyboard className="size-4 text-primary" />
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Appuyez sur <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">?</kbd>{" "}
            à tout moment pour rouvrir cette aide.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-3 pb-4">
          <ShortcutsBody />
        </div>
      </DialogContent>
    </Dialog>
  );
}
