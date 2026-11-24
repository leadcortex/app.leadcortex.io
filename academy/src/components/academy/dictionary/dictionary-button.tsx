// academy/src/components/academy/dictionary/dictionary-button.tsx

import { useEffect, useState } from "react";

import { useDictionary } from "../../../lib/dictionary-store";
import type { GlossaryEntry } from "../../../lib/model";
import { DictionarySheet } from "./dictionary-sheet";

export function DictionaryButton({
  glossary,
}: {
  glossary: GlossaryEntry[];
}) {
  const { isUnlocked } = useDictionary();
  const [open, setOpen] = useState(false);

  const lockedCount = glossary.filter((g) => !isUnlocked(g.term)).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (glossary.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="dictionary-fab"
        aria-label={`Dictionnaire — ${lockedCount} terme${lockedCount > 1 ? "s" : ""} à découvrir`}
        title="Ouvrir le dictionnaire"
        onClick={() => setOpen(true)}
      >
        <DictionaryBookGlyph />
        {lockedCount > 0 && (
          <span className="dictionary-fab__badge" aria-hidden="true">
            {lockedCount}
          </span>
        )}
      </button>

      <DictionarySheet
        open={open}
        onOpenChange={setOpen}
        glossary={glossary}
      />
    </>
  );
}

function DictionaryBookGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="dictionary-fab__icon"
      aria-hidden="true"
    >
      <ellipse
        cx="24"
        cy="43.5"
        rx="16"
        ry="2.5"
        fill="rgba(0,0,0,0.18)"
      />

      <path
        d="M8 9 Q8 6 11 6 L35 6 Q40 6 40 11 L40 39 Q40 42 37 42 L11 42 Q8 42 8 39 Z"
        fill="#8F6B1F"
      />

      <rect
        x="12"
        y="10"
        width="26"
        height="30"
        rx="1.5"
        fill="#FBF1D6"
      />
      <line x1="13.5" y1="14" x2="36.5" y2="14" stroke="#E2D3A6" strokeWidth="0.7" />
      <line x1="13.5" y1="17.5" x2="36.5" y2="17.5" stroke="#E2D3A6" strokeWidth="0.7" />
      <line x1="13.5" y1="21" x2="36.5" y2="21" stroke="#E2D3A6" strokeWidth="0.7" />
      <line x1="13.5" y1="24.5" x2="36.5" y2="24.5" stroke="#E2D3A6" strokeWidth="0.7" />
      <line x1="13.5" y1="28" x2="36.5" y2="28" stroke="#E2D3A6" strokeWidth="0.7" />
      <line x1="13.5" y1="31.5" x2="36.5" y2="31.5" stroke="#E2D3A6" strokeWidth="0.7" />
      <line x1="13.5" y1="35" x2="30.5" y2="35" stroke="#E2D3A6" strokeWidth="0.7" />

      <path
        d="M6 8 Q6 4.5 10 4.5 L34 4.5 Q38 4.5 38 8.5 L38 38 Q38 41 34.5 41 L10 41 Q6 41 6 37.5 Z"
        fill="#C99A2E"
      />
      <path
        d="M8 8 Q8 6 11 6 L32 6 Q35 6 35 8 L35 9 Q35 7.5 32 7.5 L11 7.5 Q8.5 7.5 8.5 9 Z"
        fill="#E3B84D"
        opacity="0.85"
      />
      <rect x="6" y="21.5" width="32" height="2" rx="1" fill="#8F6B1F" />
      <circle cx="22" cy="22.5" r="3.2" fill="#FBF1D6" stroke="#8F6B1F" strokeWidth="0.9" />
      <path
        d="M22 20.4 L22.7 22 L24.4 22.2 L23.1 23.3 L23.5 25 L22 24.1 L20.5 25 L20.9 23.3 L19.6 22.2 L21.3 22 Z"
        fill="#C99A2E"
      />
    </svg>
  );
}
