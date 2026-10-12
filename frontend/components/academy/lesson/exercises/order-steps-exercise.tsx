"use client";

/**
 * OrderSteps — remettre des étapes dans le bon ordre.
 *
 * L'apprenant réordonne une liste. Deux mécanismes coexistent :
 *   - HTML5 drag & drop (desktop)
 *   - Boutons ▲ / ▼ (mobile + accessibilité clavier)
 *
 * Le payload fournit l'ordre canonique (backend). L'ordre initial envoyé
 * au client est mélangé pour éviter qu'il soit déjà correct.
 *
 * Contrat : answer = { kind: "order_steps", steps: string[] }.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

import type {
  AnswerExerciseRequest,
  ExerciseDTO,
  OrderStepsPayloadDTO,
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

export function OrderStepsExercise({
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
  const payload = exercise.payload as OrderStepsPayloadDTO;

  // Ordre initial = mélange déterministe de l'ordre canonique.
  const initial = useMemo(
    () => shuffleOnce(payload.steps, 17),
    [payload.steps],
  );

  const [items, setItems] = useState<string[]>(() => answer?.steps ?? initial);

  // Si l'answer change depuis l'extérieur (reset), on resync.
  useEffect(() => {
    if (answer?.steps && answer.steps.length === items.length) return;
    if (!answer?.steps) setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer?.steps]);

  const dragIndex = useRef<number | null>(null);

  const commit = (next: string[]) => {
    setItems(next);
    onChange({ kind: "order_steps", steps: next });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    commit(next);
  };

  const onDrop = (to: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === to) return;
    move(from, to);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-medium leading-relaxed md:text-lg">
        {exercise.prompt}
      </h2>
      <p className="text-[11px] text-muted-foreground">
        Glissez-déposez les étapes ou utilisez les flèches pour les réordonner.
      </p>

      <ol className="space-y-2">
        {items.map((step, i) => (
          <li
            key={`${step}-${i}`}
            draggable={!disabled}
            onDragStart={() => {
              dragIndex.current = i;
            }}
            onDragOver={(e) => {
              if (!disabled) e.preventDefault();
            }}
            onDrop={() => !disabled && onDrop(i)}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5",
              "transition-colors",
              !disabled && "hover:border-primary/30",
              disabled && "opacity-70",
            )}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-muted-foreground",
                !disabled && "cursor-grab active:cursor-grabbing",
              )}
            >
              <GripVertical className="size-3.5" />
            </span>

            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary">
              {i + 1}
            </span>

            <span className="min-w-0 flex-1 text-sm">{step}</span>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={disabled || i === 0}
                onClick={() => move(i, i - 1)}
                aria-label={`Monter l'étape ${i + 1}`}
                className={cn(
                  "grid size-7 place-items-center rounded-md border border-border transition-colors hover:bg-surface",
                  "disabled:cursor-not-allowed disabled:opacity-30",
                )}
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || i === items.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={`Descendre l'étape ${i + 1}`}
                className={cn(
                  "grid size-7 place-items-center rounded-md border border-border transition-colors hover:bg-surface",
                  "disabled:cursor-not-allowed disabled:opacity-30",
                )}
              >
                <ArrowDown className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}