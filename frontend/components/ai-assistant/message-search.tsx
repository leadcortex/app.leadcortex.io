"use client";

/**
 * Barre de recherche dans la conversation.
 *
 *  - S'ouvre par Ctrl/⌘+F (géré par le parent), se ferme par Échap.
 *  - Navigation : Entrée = suivant, Maj+Entrée = précédent, ou les flèches.
 *  - Compteur « n / N » ; saisie vide → compteur masqué.
 *  - Au saut vers un message, un flash lumineux (Web Animations API) attire
 *    l'œil sans toucher au rendu du message lui-même : aucune classe CSS
 *    globale n'est requise, aucune modification de `MessageContent`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import type { AssistantMessage } from "./assistant-engine";

export function MessageSearch({
  open,
  messages,
  scrollRef,
  onClose,
}: {
  open: boolean;
  messages: AssistantMessage[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const needle = query.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(needle));
  }, [messages, query]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    } else {
      setQuery("");
      setActiveIdx(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  /** Saut vers un message + flash lumineux. */
  const jumpTo = useCallback(
    (id: string) => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        el.animate(
          [
            { boxShadow: "0 0 0 3px color-mix(in oklab, var(--primary) 50%, transparent)" },
            { boxShadow: "0 0 0 0 transparent" },
          ],
          { duration: 1100, easing: "ease-out" },
        );
      } catch {
        /* Web Animations API indisponible → silencieux */
      }
    },
    [scrollRef],
  );

  useEffect(() => {
    if (!matches.length) return;
    const target = matches[Math.min(activeIdx, matches.length - 1)];
    if (target) jumpTo(target.id);
  }, [activeIdx, matches, jumpTo]);

  const next = () => {
    if (!matches.length) return;
    setActiveIdx((i) => (i + 1) % matches.length);
  };
  const prev = () => {
    if (!matches.length) return;
    setActiveIdx((i) => (i - 1 + matches.length) % matches.length);
  };

  if (!open) return null;

  const counter = query ? (matches.length ? `${activeIdx + 1} / ${matches.length}` : "0 / 0") : "";

  return (
    <div
      role="search"
      className="absolute inset-x-2 top-2 z-20 flex items-center gap-1 rounded-xl border border-border bg-popover px-2 py-1.5 shadow-lg"
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (e.shiftKey) prev();
            else next();
          }
        }}
        placeholder="Rechercher dans la conversation…"
        className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
      />
      {counter && (
        <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
          {counter}
        </span>
      )}
      <button
        type="button"
        onClick={prev}
        disabled={!matches.length}
        aria-label="Résultat précédent"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"
      >
        <ChevronUp className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={next}
        disabled={!matches.length}
        aria-label="Résultat suivant"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-40"
      >
        <ChevronDown className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la recherche"
        className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}