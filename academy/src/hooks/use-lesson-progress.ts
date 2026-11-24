// academy/src/hooks/use-lesson-progress.ts

import { useCallback, useMemo } from "react";

import { sendOrQueue } from "../lib/offline-queue";

export type AnswerPayload = {
  kind: string;
  selected?: number;
  selected_multiple?: number[];
  blanks?: string[];
  steps?: string[];
  pairs?: Array<{ left: string; right: string }>;
  text?: string;
  choices?: number[];
};

export type UseLessonProgressResult = {
  startLesson: (lessonId: string) => void;
  viewBlock: (lessonId: string, blockIndex: number, slidesConsumed?: number) => void;
  answerExercise: (
    lessonId: string,
    exerciseId: string,
    payload: AnswerPayload,
  ) => void;
};

export function useLessonProgress(learnerId?: string): UseLessonProgressResult {
  const startLesson = useCallback(
    (lessonId: string) => {
      void sendOrQueue(
        `/lessons/${encodeURIComponent(lessonId)}/start`,
        "POST",
        {},
        learnerId,
      );
    },
    [learnerId],
  );

  const viewBlock = useCallback(
    (lessonId: string, blockIndex: number, slidesConsumed = 1) => {
      void sendOrQueue(
        `/lessons/${encodeURIComponent(lessonId)}/blocks/${blockIndex}/view`,
        "POST",
        { slides_consumed: slidesConsumed },
        learnerId,
      );
    },
    [learnerId],
  );

  const answerExercise = useCallback(
    (lessonId: string, exerciseId: string, payload: AnswerPayload) => {
      void sendOrQueue(
        `/lessons/${encodeURIComponent(lessonId)}/exercises/${encodeURIComponent(
          exerciseId,
        )}/answer`,
        "POST",
        payload,
        learnerId,
      );
    },
    [learnerId],
  );

  return useMemo(
    () => ({ startLesson, viewBlock, answerExercise }),
    [startLesson, viewBlock, answerExercise],
  );
}
