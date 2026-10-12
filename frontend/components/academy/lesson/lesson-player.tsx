//frontend\components\academy\lesson\lesson-player.tsx
"use client";

/**
 * Lesson Player — orchestrateur plein écran d'une leçon.
 *
 * Responsabilités :
 *   1. Charger la leçon (registry) et le Learner courant.
 *   2. Démarrer la leçon (idempotent côté API).
 *   3. Rendre le bloc courant via un dispatcher.
 *   4. Avancer entre blocs — utilisable par les blocs via `advanceBlock`.
 *   5. Afficher un écran de fin (`EndOfLesson`) quand le dernier bloc
 *      est franchi, ou un dialogue "plus de vies" si les cœurs sont à 0.
 *
 * Le player est destiné à être rendu HORS de l'AppShell (fullscreen).
 * Voir le patch `app-shell.tsx` (isAcademyLesson).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useAcademyMe,
  useLesson,
  useStartLesson,
  useViewBlock,
} from "@/lib/academy/hooks";
import type { BlockDTO } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

import {
  LessonPlayerContext,
  type LessonCTASpec,
  type LessonPlayerContextValue,
} from "./lesson-context";
import { LessonTopBar } from "./lesson-top-bar";
import { LessonBottomBar } from "./lesson-bottom-bar";
import { CoverBlock } from "./blocks/cover-block";
import { TheoryBlock } from "./blocks/theory-block";
import { PracticeBlock } from "./blocks/practice-block";
import { MissionBlock } from "./blocks/mission-block";
import { DebriefBlock } from "./blocks/debrief-block";
import { EndOfLesson } from "./end-of-lesson";
import { HeartsDialog } from "./hearts-dialog";

/* ═══════════════════════════════════════════════════════════════════════
   PROPS / TYPES
   ═══════════════════════════════════════════════════════════════════════ */

export type LessonSummary = {
  lessonId: string;
  lessonTitle: string;
  sessionXP: number;
  blocksCompleted: number;
  totalBlocks: number;
};

export type LessonPlayerProps = {
  lessonId: string;
  onExit?: () => void;
  onFinish?: (summary: LessonSummary) => void;
};

/* ═══════════════════════════════════════════════════════════════════════
   COMPOSANT
   ═══════════════════════════════════════════════════════════════════════ */

export function LessonPlayer({ lessonId, onExit, onFinish }: LessonPlayerProps) {
  const lessonQuery = useLesson(lessonId);
  const meQuery = useAcademyMe();
  const startMutation = useStartLesson();
  const viewBlockMutation = useViewBlock();

  const [blockIndex, setBlockIndex] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [finished, setFinished] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [ctaOverride, setCTAOverride] = useState<LessonCTASpec | null>(null);

  const startedRef = useRef(false);

  /* ─── Démarrage idempotent ───────────────────────────────────────── */
  useEffect(() => {
    if (!lessonQuery.data || startedRef.current) return;
    startedRef.current = true;
    startMutation.mutate(lessonId, {
      onError: (err) => console.warn("[lesson] startLesson failed:", err),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonQuery.data, lessonId]);

  /* ─── Helpers ────────────────────────────────────────────────────── */
  const addSessionXP = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setSessionXP((xp) => xp + Math.round(amount));
  }, []);

  const currentBlock: BlockDTO | undefined = useMemo(
    () => lessonQuery.data?.blocks[blockIndex],
    [lessonQuery.data, blockIndex],
  );

  const totalBlocks = lessonQuery.data?.blocks.length ?? 0;
  const isLastBlock = blockIndex >= totalBlocks - 1;

  const advanceBlock = useCallback(async () => {
    const lesson = lessonQuery.data;
    const block = lesson?.blocks[blockIndex];
    if (!lesson || !block) return;

    // Notifie le backend pour les blocs "vus". Practice et mission ont
    // leur propre logique (answerExercise / attemptMission).
    try {
      if (block.type === "cover" || block.type === "debrief") {
        await viewBlockMutation.mutateAsync({
          lessonId,
          blockIndex,
          slidesConsumed: 1,
        });
      } else if (block.type === "theory") {
        const slideCount = block.theory?.slides.length ?? 1;
        await viewBlockMutation.mutateAsync({
          lessonId,
          blockIndex,
          slidesConsumed: slideCount,
        });
      }
    } catch (err) {
      console.warn("[lesson] viewBlock failed:", err);
    }

    if (blockIndex >= totalBlocks - 1) {
      setFinished(true);
      onFinish?.({
        lessonId,
        lessonTitle: lesson.title,
        sessionXP,
        blocksCompleted: totalBlocks,
        totalBlocks,
      });
      return;
    }

    setCTAOverride(null);
    setBlockIndex((i) => i + 1);
  }, [
    blockIndex,
    lessonId,
    lessonQuery.data,
    onFinish,
    sessionXP,
    totalBlocks,
    viewBlockMutation,
  ]);

  const requestExit = useCallback(() => {
    if (finished) {
      onExit?.();
      return;
    }
    setExitConfirmOpen(true);
  }, [finished, onExit]);

  /* ─── CTA par défaut ─────────────────────────────────────────────── */
  const defaultCTA: LessonCTASpec = useMemo(
    () => ({
      label: isLastBlock ? "Terminer" : "Continuer",
      kind: isLastBlock ? "finish" : "continue",
      disabled: false,
      onAction: advanceBlock,
    }),
    [isLastBlock, advanceBlock],
  );

  const effectiveCTA = ctaOverride ?? defaultCTA;

  /* ─── Rendu : états ──────────────────────────────────────────────── */
  if (lessonQuery.isLoading) return <LessonSkeleton />;

  if (lessonQuery.isError || !lessonQuery.data) {
    return (
      <LessonError
        message={
          lessonQuery.error instanceof Error
            ? lessonQuery.error.message
            : "Impossible de charger la leçon."
        }
        onExit={onExit}
      />
    );
  }

  if (!currentBlock) {
    return <LessonError message="Cette leçon ne contient aucun bloc." onExit={onExit} />;
  }

  const hearts = meQuery.data?.hearts ?? 5;
  const maxHearts = meQuery.data?.max_hearts ?? 5;

  /* ─── Cœurs épuisés → blocage total ──────────────────────────────── */
  if (hearts <= 0 && !finished) {
    return (
      <HeartsDialog
        open
        hearts={hearts}
        maxHearts={maxHearts}
        onExit={() => onExit?.()}
      />
    );
  }

  /* ─── Écran de fin ───────────────────────────────────────────────── */
  if (finished) {
    const me = meQuery.data;
    return (
      <EndOfLesson
        lessonTitle={lessonQuery.data.title}
        sessionXP={sessionXP}
        streakDays={me?.streak_days ?? 0}
        level={me?.level ?? 1}
        onExit={onExit}
      />
    );
  }

  /* ─── Contexte ───────────────────────────────────────────────────── */
  const contextValue: LessonPlayerContextValue = {
    lesson: lessonQuery.data,
    currentBlock,
    blockIndex,
    totalBlocks,
    isLastBlock,
    sessionXP,
    hearts,
    maxHearts,
    cta: effectiveCTA,
    setCTA: setCTAOverride,
    addSessionXP,
    advanceBlock,
    requestExit,
  };

  return (
    <LessonPlayerContext.Provider value={contextValue}>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
        <LessonTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
            <LessonBlockRenderer block={currentBlock} />
          </div>
        </main>
        <LessonBottomBar />
      </div>

      <ConfirmDialog
        open={exitConfirmOpen}
        onOpenChange={setExitConfirmOpen}
        onConfirm={() => {
          setExitConfirmOpen(false);
          onExit?.();
        }}
        title="Quitter la leçon ?"
        description="Votre progression est sauvegardée. Vous pourrez reprendre où vous en étiez."
        confirmLabel="Quitter"
        cancelLabel="Continuer"
        variant="default"
      />
    </LessonPlayerContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DISPATCHER
   ═══════════════════════════════════════════════════════════════════════ */

function LessonBlockRenderer({ block }: { block: BlockDTO }) {
  switch (block.type) {
    case "cover":
      return <CoverBlock block={block} />;
    case "theory":
      return <TheoryBlock block={block} />;
    case "practice":
      return <PracticeBlock block={block} />;
    case "mission":
      return <MissionBlock block={block} />;
    case "debrief":
      return <DebriefBlock block={block} />;
    default:
      return (
        <div className="rounded-2xl border border-dashed border-border bg-surface/30 p-6 text-center text-sm text-muted-foreground">
          Type de bloc inconnu.
        </div>
      );
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   ÉTATS DE CHARGEMENT / ERREUR
   ═══════════════════════════════════════════════════════════════════════ */

function LessonSkeleton() {
  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/70 px-3 py-3 md:px-5 md:py-4">
        <div className="skeleton size-9 rounded-full" />
        <div className="skeleton h-2 flex-1 rounded-full" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </header>
      <main className="flex min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
      <footer className="shrink-0 border-t border-border/70 px-4 py-3 md:px-6 md:py-4">
        <div className="skeleton mx-auto h-11 w-full max-w-3xl rounded-xl" />
      </footer>
    </div>
  );
}

function LessonError({ message, onExit }: { message: string; onExit?: () => void }) {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="font-display text-xl italic md:text-2xl">Leçon indisponible</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onExit ? (
        <button
          type="button"
          onClick={onExit}
          className={cn(
            "mt-2 inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium",
            "transition-colors hover:bg-surface",
          )}
        >
          Retour à l'Academy
        </button>
      ) : null}
    </div>
  );
}