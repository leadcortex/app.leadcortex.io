"use client";

/**
 * Bandeau des messages épinglés, affiché en haut de la liste de la
 * conversation.
 *
 *  - Masqué tant qu'aucun message n'est épinglé.
 *  - Chaque épingle = puce horizontale scrollable : un clic saute au
 *    message, une petite croix la retire.
 *  - Un bouton « Tout désépingler » apparaît à droite, toujours visible.
 *  - Volontairement compact pour ne pas empiéter sur la conversation :
 *    hauteur d'une seule ligne, sans bordure épaisse.
 */
import { Pin, PinOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "./assistant-engine";

export function PinnedMessagesBar({
  messages,
  pinnedIds,
  onJump,
  onUnpin,
  onClearAll,
  className,
}: {
  messages: AssistantMessage[];
  pinnedIds: string[];
  onJump: (id: string) => void;
  onUnpin: (id: string) => void;
  onClearAll: () => void;
  className?: string;
}) {
  if (pinnedIds.length === 0) return null;

  const byId = new Map(messages.map((m) => [m.id, m] as const));
  const items = pinnedIds
    .map((id) => byId.get(id))
    .filter((m): m is AssistantMessage => Boolean(m));

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Messages épinglés"
      className={cn(
        "flex items-center gap-1 border-b border-border/60 bg-secondary/15 px-2 py-1.5",
        className,
      )}
    >
      <span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Pin className="size-3" strokeWidth={1.8} />
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {items.map((m) => {
          const preview = m.text.replace(/\s+/g, " ").trim().slice(0, 42);
          const role = m.role === "user" ? "Vous" : "Assistant";
          return (
            <div
              key={m.id}
              className="group flex shrink-0 items-center gap-1 rounded-full border border-border bg-background pl-2 pr-0.5 py-0.5 text-[10.5px] transition-colors hover:border-primary/40"
            >
              <button
                type="button"
                onClick={() => onJump(m.id)}
                className="flex min-w-0 items-center gap-1.5"
                title={`${role} · ${m.text.slice(0, 120)}`}
              >
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider",
                    m.role === "user"
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {role}
                </span>
                <span className="max-w-[160px] truncate text-foreground/85">
                  {preview || "(vide)"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onUnpin(m.id)}
                aria-label="Désépingler"
                className="grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-2.5" strokeWidth={2.2} />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClearAll}
        aria-label="Tout désépingler"
        title="Tout désépingler"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <PinOff className="size-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}