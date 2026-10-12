"use client";

/**
 * Bloc mission — action in-app à réaliser dans LeadCortex.
 *
 * Version Bloc 4 :
 *   - Affiche le brief et le CTA vers la route cible (nouvelle fenêtre).
 *   - Un bouton "Vérifier" appelle `POST /missions/{id}/attempt` avec un
 *     payload vide. Le backend valide l'événement synthétique.
 *   - En cas de succès : CTA → Continuer / Terminer.
 *
 * La validation en temps réel (via SSE / POST /events) viendra plus tard.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAttemptMission } from "@/lib/academy/hooks";
import type { BlockDTO, MissionAttemptResponse } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

import { useLessonPlayer, type LessonCTASpec } from "../lesson-context";

export function MissionBlock({ block }: { block: BlockDTO }) {
  const { isLastBlock, setCTA, advanceBlock, addSessionXP } = useLessonPlayer();
  const mission = block.mission?.mission;
  const [result, setResult] = useState<MissionAttemptResponse | null>(null);

  const attemptMutation = useAttemptMission();

  const submit = useCallback(async () => {
    if (!mission) return;
    try {
      const res = await attemptMutation.mutateAsync({
        missionId: mission.id,
        payload: {},
      });
      setResult(res);
      if (res.validated && res.xp_awarded > 0) {
        addSessionXP(res.xp_awarded);
      } else if (!res.validated) {
        toast.info("Mission non validée", {
          description: res.feedback_md ?? "Réalisez l'action puis réessayez.",
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de valider la mission.",
      );
    }
  }, [mission, attemptMutation, addSessionXP]);

  /* ─── CTA ────────────────────────────────────────────────────────── */
  const cta = useMemo<LessonCTASpec>(() => {
    if (result?.validated) {
      return {
        label: isLastBlock ? "Terminer" : "Continuer",
        kind: isLastBlock ? "finish" : "continue",
        disabled: false,
        onAction: advanceBlock,
      };
    }
    return {
      label: attemptMutation.isPending ? "Vérification…" : "Vérifier",
      kind: "verify",
      disabled: attemptMutation.isPending,
      onAction: submit,
    };
  }, [result, isLastBlock, advanceBlock, submit, attemptMutation.isPending]);

  useEffect(() => {
    setCTA(cta);
  }, [cta, setCTA]);

  if (!mission) return null;

  return (
    <article className="space-y-6 animate-fade-in-up">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Mission in-app
      </p>

      <div className="rounded-2xl border border-primary/25 bg-primary/[0.03] p-6 md:p-8">
        <h2 className="font-display text-2xl italic leading-tight md:text-3xl">
          {mission.title}
        </h2>

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {mission.brief_md}
        </p>

        <a
          href={mission.target.route}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-xs font-semibold text-background transition-opacity hover:opacity-90",
          )}
        >
          {mission.target.cta}
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      {attemptMutation.isPending ? (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Vérification…
        </div>
      ) : null}

      {result && !result.validated ? (
        <div className="rounded-xl border border-warning/40 bg-warning/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning">
            Mission non validée
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            {result.feedback_md ?? "Réalisez l'action puis réessayez."}
          </p>
          {result.hint_md ? (
            <p className="mt-2 text-[11px] text-muted-foreground">{result.hint_md}</p>
          ) : null}
        </div>
      ) : null}

      {result?.validated ? (
        <div className="rounded-xl border border-success/40 bg-success/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-success">
            Mission réussie
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            +{result.xp_awarded} XP crédités.
          </p>
        </div>
      ) : null}
    </article>
  );
}