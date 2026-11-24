// academy/src/lib/adaptive.ts

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "academy:lesson-performance:v1";
const EVENT_KEY = "academy:lesson-performance-changed";

export const EXPERT_THRESHOLD = 3;
export const REMEDIATION_THRESHOLD = 3;

export type ConceptAttempts = {
  correct: number;
  wrong: number;
};

export type LessonPerformance = {
  lessonId: string;
  perfectStreak: number;
  failStreak: number;
  unlockedExpertMode: boolean;
  attemptsByConcept: Record<string, ConceptAttempts>;
  lastUpdatedAt: string;
};

type StoreShape = Record<string, LessonPerformance>;

function emptyPerformance(lessonId: string): LessonPerformance {
  return {
    lessonId,
    perfectStreak: 0,
    failStreak: 0,
    unlockedExpertMode: false,
    attemptsByConcept: {},
    lastUpdatedAt: new Date().toISOString(),
  };
}

function readStore(): StoreShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as StoreShape;
  } catch {
    return {};
  }
}

function writeStore(store: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: store }));
  } catch {
  }
}

function readOne(lessonId: string): LessonPerformance {
  const store = readStore();
  return store[lessonId] ?? emptyPerformance(lessonId);
}

function writeOne(perf: LessonPerformance): void {
  const store = readStore();
  store[perf.lessonId] = { ...perf, lastUpdatedAt: new Date().toISOString() };
  writeStore(store);
}

export const adaptiveApi = {
  get(lessonId: string): LessonPerformance {
    return readOne(lessonId);
  },

  recordSuccess(lessonId: string, conceptIds: string[]): LessonPerformance {
    const perf = readOne(lessonId);
    const next: LessonPerformance = {
      ...perf,
      perfectStreak: perf.perfectStreak + 1,
      failStreak: 0,
      attemptsByConcept: { ...perf.attemptsByConcept },
    };
    for (const cid of conceptIds) {
      const prev = next.attemptsByConcept[cid] ?? { correct: 0, wrong: 0 };
      next.attemptsByConcept[cid] = { correct: prev.correct + 1, wrong: prev.wrong };
    }
    if (next.perfectStreak >= EXPERT_THRESHOLD) next.unlockedExpertMode = true;
    writeOne(next);
    return next;
  },

  recordFailure(lessonId: string, conceptIds: string[]): LessonPerformance {
    const perf = readOne(lessonId);
    const next: LessonPerformance = {
      ...perf,
      perfectStreak: 0,
      failStreak: perf.failStreak + 1,
      attemptsByConcept: { ...perf.attemptsByConcept },
    };
    for (const cid of conceptIds) {
      const prev = next.attemptsByConcept[cid] ?? { correct: 0, wrong: 0 };
      next.attemptsByConcept[cid] = { correct: prev.correct, wrong: prev.wrong + 1 };
    }
    writeOne(next);
    return next;
  },

  reset(lessonId: string): void {
    const store = readStore();
    delete store[lessonId];
    writeStore(store);
  },
};

export type UseLessonPerformanceResult = LessonPerformance & {
  recordSuccess: (conceptIds: string[]) => void;
  recordFailure: (conceptIds: string[]) => void;
  reset: () => void;
};

export function useLessonPerformance(lessonId: string): UseLessonPerformanceResult {
  const [perf, setPerf] = useState<LessonPerformance>(() => readOne(lessonId));

  useEffect(() => {
    setPerf(readOne(lessonId));

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as StoreShape;
      if (detail && detail[lessonId]) setPerf(detail[lessonId]);
      else setPerf(readOne(lessonId));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPerf(readOne(lessonId));
    };
    window.addEventListener(EVENT_KEY, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_KEY, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [lessonId]);

  const recordSuccess = useCallback(
    (conceptIds: string[]) => {
      const next = adaptiveApi.recordSuccess(lessonId, conceptIds);
      setPerf(next);
    },
    [lessonId],
  );

  const recordFailure = useCallback(
    (conceptIds: string[]) => {
      const next = adaptiveApi.recordFailure(lessonId, conceptIds);
      setPerf(next);
    },
    [lessonId],
  );

  const reset = useCallback(() => {
    adaptiveApi.reset(lessonId);
    setPerf(emptyPerformance(lessonId));
  }, [lessonId]);

  return { ...perf, recordSuccess, recordFailure, reset };
}
