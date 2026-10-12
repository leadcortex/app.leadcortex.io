"use client";

/**
 * Contexte React du Lesson Player.
 *
 * Le player expose l'état courant (bloc affiché, progression, XP de session,
 * cœurs) et un objet `cta` que les blocs peuvent surcharger via `setCTA`.
 *
 * Le CTA est la source de vérité de la barre inférieure : les blocs qui ont
 * un flux propre (practice, mission) enregistrent un CTA spécifique ; les
 * autres (cover, theory, debrief) laissent le CTA par défaut (« Continuer »
 * ou « Terminer » sur le dernier bloc).
 */
import { createContext, useContext } from "react";

import type { BlockDTO, LessonDetailDTO } from "@/lib/academy/types";

export type LessonCTAKind = "verify" | "continue" | "finish";

export type LessonCTASpec = {
  label: string;
  kind: LessonCTAKind;
  disabled: boolean;
  onAction: () => Promise<void> | void;
};

export type LessonPlayerContextValue = {
  /* ─── Données ───────────────────────────────────────────────────── */
  lesson: LessonDetailDTO;
  currentBlock: BlockDTO;
  blockIndex: number;
  totalBlocks: number;
  isLastBlock: boolean;

  /* ─── Session ───────────────────────────────────────────────────── */
  sessionXP: number;
  hearts: number;
  maxHearts: number;

  /* ─── CTA ───────────────────────────────────────────────────────── */
  cta: LessonCTASpec;
  setCTA: (spec: LessonCTASpec) => void;

  /* ─── Actions ───────────────────────────────────────────────────── */
  addSessionXP: (amount: number) => void;
  /** Avance au bloc suivant (ou termine si dernier). Utilisable par les blocs. */
  advanceBlock: () => Promise<void>;
  /** Demande la sortie (confirm si non terminée). */
  requestExit: () => void;
};

export const LessonPlayerContext =
  createContext<LessonPlayerContextValue | null>(null);

export function useLessonPlayer(): LessonPlayerContextValue {
  const ctx = useContext(LessonPlayerContext);
  if (!ctx) {
    throw new Error("useLessonPlayer doit être utilisé dans <LessonPlayerProvider>.");
  }
  return ctx;
}