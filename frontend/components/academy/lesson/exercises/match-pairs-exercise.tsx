"use client";

/**
 * MatchPairs — associer des éléments de deux colonnes.
 *
 * UX : clic-gauche puis clic-droite crée une paire. Clic sur un élément
 * déjà associé le libère. Pas de drag & drop (mobile-friendly).
 *
 * Contrat : answer = { kind: "match_pairs", pairs: MatchPairDTO[] }.
 * Une paire = { left: string, right: string }.
 */
import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import type {
  AnswerExerciseRequest,
  ExerciseDTO,
  MatchPairsPayloadDTO,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

function shuffleOnce<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function MatchPairsExercise({
  exercise,
  answer,
  onChange,
  disabled,
}: {
  exercise: ExerciseDTO;
  answer: AnswerExerciseRequest | null;
  onChange: (a: AnswerExerciseRequest) => void;
  disabled?: boolean;
}) {
  const payload = exercise.payload as MatchPairsPayloadDTO;

  const lefts = useMemo(() => payload.pairs.map((p) => p.left), [payload.pairs]);
  const rights = useMemo(
    () => shuffleOnce(payload.pairs.map((p) => p.right), 29),
    [payload.pairs],
  );

  const pairs = answer?.pairs ?? [];
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const rightToLeft = new Map<string, string>();
  for (const p of pairs) rightToLeft.set(p.right, p.left);
  const leftToRight = new Map<string, string>();
  for (const p of pairs) leftToRight.set(p.left, p.right);

  const commit = (nextPairs: { left: string; right: string }[]) => {
    onChange({ kind: "match_pairs", pairs: nextPairs });
  };

  const handleLeftClick = (left: string) => {
    if (disabled) return;
    // Si déjà associé, on libère.
    if (leftToRight.has(left)) {
      const next = pairs.filter((p) => p.left !== left);
      commit(next);
      setActiveLeft(null);
      return;
    }
    setActiveLeft((cur) => (cur === left ? null : left));
  };

  const handleRightClick = (right: string) => {
    if (disabled) return;
    // Si déjà associé, on libère.
    if (rightToLeft.has(right)) {
      const next = pairs.filter((p) => p.right !== right);
      commit(next);
      setActiveLeft(null);
      return;
    }
    if (!activeLeft) return;
    // On retire une éventuelle ancienne association pour la même gauche.
    const next = pairs.filter((p) => p.left !== activeLeft);
    next.push({ left: activeLeft, right });
    commit(next);
    setActiveLeft(null);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-medium leading-relaxed md:text-lg">
        {exercise.prompt}
      </h2>
      <p className="text-[11px] text-muted-foreground">
        Cliquez sur un élément à gauche, puis sur son correspondant à droite.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Colonne gauche */}
        <ul className="space-y-2">
          <li className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Élément
          </li>
          {lefts.map((left) => {
            const paired = leftToRight.has(left);
            const active = activeLeft === left;
            return (
              <li key={left}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleLeftClick(left)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/[0.06] font-medium shadow-sm"
                      : paired
                        ? "border-success/40 bg-success/[0.05]"
                        : "border-border hover:border-primary/40 hover:bg-surface/50",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  {paired ? (
                    <Check className="size-3.5 shrink-0 text-success" strokeWidth={2.6} />
                  ) : null}
                  <span className="min-w-0 flex-1">{left}</span>
                  {paired ? (
                    <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-mono text-success">
                      {leftToRight.get(left)}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Colonne droite */}
        <ul className="space-y-2">
          <li className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Correspondant
          </li>
          {rights.map((right) => {
            const pairedWith = rightToLeft.get(right);
            const paired = !!pairedWith;
            return (
              <li key={right}>
                <button
                  type="button"
                  disabled={disabled || !activeLeft}
                  onClick={() => handleRightClick(right)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    paired
                      ? "border-success/40 bg-success/[0.05]"
                      : activeLeft
                        ? "border-border hover:border-primary/40 hover:bg-surface/50"
                        : "border-border opacity-60",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {paired ? (
                    <X className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.2} />
                  ) : null}
                  <span className="min-w-0 flex-1">{right}</span>
                  {paired ? (
                    <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-mono text-success">
                      {pairedWith}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}