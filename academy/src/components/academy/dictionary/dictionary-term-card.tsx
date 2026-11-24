// academy/src/components/academy/dictionary/dictionary-term-card.tsx

import { useState } from "react";
import { Lock, Sparkles, Check, AlertCircle } from "../../../../../frontend/components/icons";

import type { GlossaryEntry } from "../../../lib/model";
import { useDictionary } from "../../../lib/dictionary-store";
import { useGems } from "../../../lib/gems-store";

export function DictionaryTermCard({ entry }: { entry: GlossaryEntry }) {
  const dict = useDictionary();
  const gems = useGems();
  const [error, setError] = useState<string | null>(null);

  const unlocked = dict.isUnlocked(entry.term);
  const cost = dict.cost;
  const canAfford = gems.balance >= cost;

  const handleUnlock = () => {
    setError(null);
    if (!canAfford) {
      setError(`Il te manque ${cost - gems.balance} gemme${cost - gems.balance > 1 ? "s" : ""}.`);
      return;
    }
    const ok = dict.unlock(entry.term);
    if (!ok) setError("Le déblocage a échoué. Réessaie.");
  };

  return (
    <article
      className={`dict-card ${unlocked ? "is-unlocked" : "is-locked"}`}
      aria-label={`Terme ${entry.term}`}
    >
      <header className="dict-card__head">
        <h4 className="dict-card__term">{entry.term}</h4>
        {unlocked ? (
          <span className="dict-card__status dict-card__status--unlocked">
            <Check className="w-3 h-3" strokeWidth={3} /> Débloqué
          </span>
        ) : (
          <span className="dict-card__status dict-card__status--locked">
            <Lock className="w-3 h-3" strokeWidth={2.5} /> Verrouillé
          </span>
        )}
      </header>

      <div className={`dict-card__body ${unlocked ? "" : "is-blurred"}`}>
        <p className="dict-card__definition">{entry.definition_md}</p>
        {entry.example_md && (
          <p className="dict-card__example">
            <span className="dict-card__example-label">Exemple</span>
            {entry.example_md}
          </p>
        )}
      </div>

      {!unlocked && (
        <footer className="dict-card__foot">
          <button
            type="button"
            className="dict-card__reveal"
            onClick={handleUnlock}
            disabled={!canAfford}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Révéler — {cost} gemmes
          </button>
          {error && (
            <p className="dict-card__error" role="alert">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
