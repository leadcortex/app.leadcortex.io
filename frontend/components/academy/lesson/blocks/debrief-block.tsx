"use client";

/**
 * Bloc debrief — fin de leçon, avec récap sections + mascotte + confetti.
 *
 * Le confetti n'est affiché que pour la fin du dernier bloc (déclenché
 * par le player via `LessonEndScreen` — Bloc 6). Ici, c'est un debrief
 * sobre : sections défilables.
 */
import { useAcademyMe } from "@/lib/academy/hooks";
import type { BlockDTO } from "@/lib/academy/types";

import { useLessonPlayer } from "../lesson-context";
import { MascotBubble } from "../mascot-bubble";

const SECTION_LABELS: Record<string, string> = {
  score_breakdown: "Récapitulatif des scores",
  concepts_mastered: "Concepts maîtrisés",
  concepts_to_review: "Concepts à revoir",
  next_recommendation: "Recommandation suivante",
};

export function DebriefBlock({ block }: { block: BlockDTO }) {
  const { sessionXP } = useLessonPlayer();
  const me = useAcademyMe();
  const avatarId = me.data?.equipped_avatar_id ?? "eagle";
  const sections = block.debrief?.sections ?? [];

  return (
    <article className="space-y-6 animate-fade-in-up">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Débrief
      </p>

      <MascotBubble
        avatarId={avatarId}
        message={
          block.debrief?.custom_mascot_line ??
          "Bravo, leçon terminée ! Prends un instant pour ancrer ce que tu viens d'apprendre."
        }
        tone="success"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-background p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            XP de session
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">{sessionXP}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Niveau
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums">{me.data?.level ?? 1}</p>
        </div>
      </div>

      {sections.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            À retenir
          </h3>
          <ul className="space-y-2">
            {sections.map((s) => (
              <li
                key={s}
                className="rounded-xl border border-border bg-surface/40 px-4 py-3 text-sm"
              >
                {SECTION_LABELS[s] ?? s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}