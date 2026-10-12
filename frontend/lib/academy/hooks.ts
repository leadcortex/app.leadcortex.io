/**
 * Hooks TanStack Query pour l'API Academy.
 *
 * Conventions :
 *  - Les queries utilisent une clé hiérarchique `["academy", ...]` pour
 *    permettre l'invalidation ciblée.
 *  - Les mutations invalident automatiquement les queries impactées.
 *  - Aucun side-effect hors React Query (pas de toast ici).
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import * as api from "./api";
import type {
  AnswerExerciseRequest,
  EquipAvatarRequest,
  PlanMode,
  PublishEventRequest,
  ReviewCardRequest,
} from "./types";

/* ─── Clés ───────────────────────────────────────────────────────────── */

export const academyKeys = {
  all: ["academy"] as const,
  me: () => [...academyKeys.all, "me"] as const,
  snapshot: () => [...academyKeys.all, "snapshot"] as const,
  recommendation: () => [...academyKeys.all, "recommendation"] as const,
  plan: (mode: PlanMode) => [...academyKeys.all, "plan", mode] as const,
  programs: () => [...academyKeys.all, "programs"] as const,
  program: (id: string) => [...academyKeys.all, "program", id] as const,
  lesson: (id: string) => [...academyKeys.all, "lesson", id] as const,
  missions: () => [...academyKeys.all, "missions"] as const,
  srsQueue: (params?: unknown) =>
    [...academyKeys.all, "srs", "queue", params ?? {}] as const,
  srsStats: () => [...academyKeys.all, "srs", "stats"] as const,
  srsForecast: (days: number) =>
    [...academyKeys.all, "srs", "forecast", days] as const,
  avatars: () => [...academyKeys.all, "avatars"] as const,
  quests: () => [...academyKeys.all, "quests"] as const,
};

/* ─── Queries ────────────────────────────────────────────────────────── */

export function useAcademyMe(
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.getMe>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: academyKeys.me(),
    queryFn: api.getMe,
    ...options,
  });
}

export function useAcademySnapshot(
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.getSnapshot>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: academyKeys.snapshot(),
    queryFn: api.getSnapshot,
    ...options,
  });
}

export function useRecommendation(
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.getRecommendation>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: academyKeys.recommendation(),
    queryFn: api.getRecommendation,
    ...options,
  });
}

export function useSessionPlan(
  mode: PlanMode,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof api.planSession>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: academyKeys.plan(mode),
    queryFn: () => api.planSession(mode),
    ...options,
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: academyKeys.programs(),
    queryFn: api.listPrograms,
  });
}

export function useProgram(programId: string, enabled = true) {
  return useQuery({
    queryKey: academyKeys.program(programId),
    queryFn: () => api.getProgram(programId),
    enabled: enabled && programId !== "",
  });
}

export function useLesson(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: academyKeys.lesson(lessonId),
    queryFn: () => api.getLesson(lessonId),
    enabled: enabled && lessonId !== "",
  });
}

export function useMissions() {
  return useQuery({
    queryKey: academyKeys.missions(),
    queryFn: api.listMissions,
  });
}

export function useSrsQueue(params: api.SrsQueueParams = {}) {
  return useQuery({
    queryKey: academyKeys.srsQueue(params),
    queryFn: () => api.getSrsQueue(params),
  });
}

export function useSrsStats() {
  return useQuery({
    queryKey: academyKeys.srsStats(),
    queryFn: api.getSrsStats,
  });
}

export function useSrsForecast(days = 30) {
  return useQuery({
    queryKey: academyKeys.srsForecast(days),
    queryFn: () => api.getSrsForecast(days),
  });
}

export function useAvatars() {
  return useQuery({
    queryKey: academyKeys.avatars(),
    queryFn: api.listAvatars,
  });
}

export function useQuests() {
  return useQuery({
    queryKey: academyKeys.quests(),
    queryFn: api.getQuests,
  });
}

/* ─── Mutations ──────────────────────────────────────────────────────── */

export function useStartLesson(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.startLesson>>,
    Error,
    string
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => api.startLesson(lessonId),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.lesson(vars) });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      qc.invalidateQueries({ queryKey: academyKeys.recommendation() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function useViewBlock(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.viewBlock>>,
    Error,
    { lessonId: string; blockIndex: number; slidesConsumed?: number }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      blockIndex,
      slidesConsumed,
    }: {
      lessonId: string;
      blockIndex: number;
      slidesConsumed?: number;
    }) => api.viewBlock(lessonId, blockIndex, slidesConsumed ?? 1),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.lesson(vars.lessonId) });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function useAnswerExercise(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.answerExercise>>,
    Error,
    {
      lessonId: string;
      exerciseId: string;
      payload: AnswerExerciseRequest;
    }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      exerciseId,
      payload,
    }: {
      lessonId: string;
      exerciseId: string;
      payload: AnswerExerciseRequest;
    }) => api.answerExercise(lessonId, exerciseId, payload),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.lesson(vars.lessonId) });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      qc.invalidateQueries({ queryKey: academyKeys.quests() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function useAttemptMission(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.attemptMission>>,
    Error,
    { missionId: string; payload?: Record<string, unknown> }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      missionId,
      payload,
    }: {
      missionId: string;
      payload?: Record<string, unknown>;
    }) => api.attemptMission(missionId, payload ?? {}),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.missions() });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      qc.invalidateQueries({ queryKey: academyKeys.quests() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function usePublishEvent(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.publishEvent>>,
    Error,
    PublishEventRequest
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PublishEventRequest) => api.publishEvent(payload),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.missions() });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      qc.invalidateQueries({ queryKey: academyKeys.quests() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function useReviewSrsCard(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.reviewSrsCard>>,
    Error,
    { cardId: string; payload: ReviewCardRequest }
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      payload,
    }: {
      cardId: string;
      payload: ReviewCardRequest;
    }) => api.reviewSrsCard(cardId, payload),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: [...academyKeys.all, "srs"] });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function useEquipAvatar(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.equipAvatar>>,
    Error,
    EquipAvatarRequest
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: EquipAvatarRequest) => api.equipAvatar(payload),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.me() });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      qc.invalidateQueries({ queryKey: academyKeys.avatars() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export function useClaimQuest(
  options?: UseMutationOptions<
    Awaited<ReturnType<typeof api.claimQuest>>,
    Error,
    string
  >,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => api.claimQuest(questId),
    ...options,
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: academyKeys.quests() });
      qc.invalidateQueries({ queryKey: academyKeys.snapshot() });
      options?.onSuccess?.(data, vars, ctx);
    },
  });
}