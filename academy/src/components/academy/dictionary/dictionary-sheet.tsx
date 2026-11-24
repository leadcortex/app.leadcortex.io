// academy/src/components/academy/dictionary/dictionary-sheet.tsx

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "../../../../../frontend/components/icons";

import type { GlossaryEntry } from "../../../lib/model";
import { useDictionary } from "../../../lib/dictionary-store";
import { DictionaryTermCard } from "./dictionary-term-card";

export function DictionarySheet({
  open,
  onOpenChange,
  glossary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  glossary: GlossaryEntry[];
}) {
  const { unlockedIds } = useDictionary();

  const unlockedCount = glossary.filter((g) =>
    unlockedIds.includes(g.term.trim().toLowerCase()),
  ).length;
  const total = glossary.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="academy-scope dict-sheet-root"
      role="dialog"
      aria-modal="true"
      aria-label="Dictionnaire"
    >
      <div
        className="dict-sheet-backdrop"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <section className="dict-sheet-panel">
        <header className="dict-sheet-head">
          <div>
            <h2>Dictionnaire</h2>
            <p className="dict-sheet-sub">
              {unlockedCount} sur {total} terme{total > 1 ? "s" : ""} débloqué
              {unlockedCount > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            className="dict-sheet-close"
            aria-label="Fermer le dictionnaire"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="dict-sheet-body">
          {glossary.length === 0 ? (
            <p className="dict-sheet-empty">
              Aucun terme pour cette leçon. Continue à explorer.
            </p>
          ) : (
            <ul className="dict-sheet-list">
              {glossary.map((entry) => (
                <li key={entry.term}>
                  <DictionaryTermCard entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
