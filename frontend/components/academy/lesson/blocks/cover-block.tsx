"use client";

/**
 * Bloc cover — écran d'entrée d'une leçon.
 *
 * Affiche titre / objectifs / phrase de la mascotte. Le CTA par défaut
 * (« Continuer ») est suffisant — pas de surcharge nécessaire.
 */
import { useAcademyMe } from "@/lib/academy/hooks";
import type { BlockDTO } from "@/lib/academy/types";

import { useLessonPlayer } from "../lesson-context";
import { MascotBubble } from "../mascot-bubble";

export function CoverBlock({ block }: { block: BlockDTO }) {
  const { lesson } = useLessonPlayer();
  const me = useAcademyMe();
  const cover = block.cover;
  const avatarId = me.data?.equipped_avatar_id ?? "eagle";

  if (!cover) return null;

  return (
    <article className="space-y-8 animate-fade-in-up">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {lesson.title}
        </p>
        <h1 className="mt-2 font-display text-3xl italic leading-tight md:text-5xl">
          {cover.title}
        </h1>
        {cover.subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{cover.subtitle}</p>
        ) : null}
      </div>

      <MascotBubble
        avatarId={avatarId}
        message={cover.mascot_line ?? "Prêt pour cette leçon ?"}
        tone="neutral"
      />

      {cover.objectives.length > 0 ? (
        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Objectifs
          </h2>
          <ul className="mt-3 space-y-2">
            {cover.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/15">
                  <span className="size-1.5 rounded-full bg-primary" />
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}