"use client";

/**
 * Aide « Raccourcis clavier » + hook global associé.
 *
 * Le composant `ShortcutsHelp` est une modale passive : Dialog desktop,
 * MobileSheet mobile, exactement comme les autres panneaux de l'assistant.
 *
 * Le hook `useAssistantShortcuts` se charge des raccourcis globaux qui ne
 * peuvent pas vivre dans les composants enfants :
 *   - Ctrl/⌘ + Shift + F  → bascule le mode focus
 *   - Ctrl/⌘ + /          → ouvre cette aide
 *   - Ctrl/⌘ + Shift + O  → démarre une nouvelle conversation
 *
 * Tous les handlers vérifient qu'aucun champ de saisie n'est focalisé avant
 * d'agir, pour ne jamais voler une frappe légitime.
 */
import { useCallback, useEffect } from "react";
import { Check, Command, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { canUseNativeNotifications, ensureNotificationPermission } from "@/lib/assistant-notifications";
import { toast } from "sonner";
import { useState } from "react";

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? "⌘" : "Ctrl";

type Row = { keys: string; label: string };
type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: "Envoyer",
    rows: [
      { keys: "Entrée", label: "Envoyer le message" },
      { keys: "Maj + Entrée", label: "Nouvelle ligne dans le champ" },
    ],
  },
  {
    title: "Navigation",
    rows: [
      { keys: `${MOD} + F`, label: "Rechercher dans la conversation" },
      { keys: "Entrée (recherche)", label: "Résultat suivant" },
      { keys: "Maj + Entrée (recherche)", label: "Résultat précédent" },
      { keys: "Échap", label: "Fermer la recherche ou une modale" },
    ],
  },
  {
    title: "Conversation",
    rows: [
      { keys: `${MOD} + Shift + O`, label: "Nouvelle conversation" },
      { keys: `${MOD} + Shift + F`, label: "Basculer le mode focus" },
      { keys: `${MOD} + /`, label: "Ouvrir cette aide" },
    ],
  },
];

export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return canUseNativeNotifications() && Notification.permission === "granted";
  });

  const requestNotifications = useCallback(async () => {
    const result = await ensureNotificationPermission();
    if (result === "granted") {
      setNotifyEnabled(true);
      toast.success("Notifications activées");
    } else if (result === "denied") {
      setNotifyEnabled(false);
      toast.info("Notifications refusées par le navigateur");
    }
  }, []);

  const body = (
    <div className="flex flex-col gap-4">
      {SECTIONS.map((section) => (
        <section key={section.title}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {section.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/40"
              >
                <span className="text-[12px] text-foreground/90">{r.label}</span>
                <kbd className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                  {r.keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-border bg-secondary/20 p-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Command className="size-3.5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium">Notifications de fin de réponse</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Recevez une alerte du navigateur quand la réponse est prête, si
              l'onglet est en arrière-plan.
            </p>
          </div>
          <button
            type="button"
            onClick={notifyEnabled ? undefined : requestNotifications}
            disabled={notifyEnabled}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
              notifyEnabled
                ? "border border-success/40 bg-success/10 text-success"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            {notifyEnabled ? (
              <>
                <Check className="size-3" strokeWidth={2.4} />
                Activées
              </>
            ) : (
              "Activer"
            )}
          </button>
        </div>
      </section>
    </div>
  );

  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        onOpenChange={onOpenChange}
        title="Raccourcis clavier"
        compact
      >
        <div className="px-4 pb-4 pt-2">{body}</div>
      </MobileSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Keyboard className="size-4" strokeWidth={1.8} />
          </span>
          <DialogTitle className="text-[15px]">Raccourcis clavier</DialogTitle>
        </div>
        <div className="max-h-[62vh] overflow-y-auto overscroll-contain pr-1">{body}</div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Raccourcis globaux ──────────────────────────────────────────────── */

/** Vrai si le focus est dans un champ texte — pour ne pas détourner les touches. */
function isTypingTarget(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useAssistantShortcuts({
  onToggleFocus,
  onOpenHelp,
  onNewConversation,
  enabled = true,
}: {
  onToggleFocus: () => void;
  onOpenHelp: () => void;
  onNewConversation: () => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;

      // Ctrl/⌘ + Shift + F → focus (peut s'appliquer même en saisie)
      if (e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        onToggleFocus();
        return;
      }

      // Ctrl/⌘ + / → aide (peut s'appliquer même en saisie)
      if (e.key === "/" || e.key === ":") {
        e.preventDefault();
        onOpenHelp();
        return;
      }

      // Ctrl/⌘ + Shift + O → nouvelle conversation (hors champ de saisie)
      if (e.shiftKey && e.key.toLowerCase() === "o") {
        if (isTypingTarget()) return;
        e.preventDefault();
        onNewConversation();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onToggleFocus, onOpenHelp, onNewConversation]);
}