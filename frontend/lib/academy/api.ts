/**
 * Fonctions typées de l'API Academy. Une fonction = un endpoint.
 * Aucun state ici — les hooks (hooks.ts) s'occupent du cache et des
 * mutations côté React Query.
 */
import { request } from "./api-client";
import type {
  AnswerExerciseRequest,
  AvatarSnapshot,
  EquipAvatarRequest,
  EvaluationResponse,
  HealthResponse,
  LearnerDTO,
  LessonActionResponse,
  LessonDetailDTO,
  MissionAttemptResponse,
  MissionListResponse,
  PlanMode,
  ProgramDTO,
  PublishEventRequest,
  PublishEventResponse,
  QuestClaimResponse,
  QuestSummary,
  ReadyResponse,
  Recommendation,
  ReviewCardRequest,
  SessionPlan,
  Snapshot,
  SrsForecastResponse,
  SrsQueueResponse,
  SrsReviewResponse,
  SrsStatsResponse,
  VersionResponse,
} from "./types";

/* ─── Santé ──────────────────────────────────────────────────────────── */

export const getHealthz = () =>
  request<HealthResponse>("/healthz", { publicRoute: true });

export const getReadyz = () =>
  request<ReadyResponse>("/readyz", { publicRoute: true });

export const getVersion = () =>
  request<VersionResponse>("/version", { publicRoute: true });

/* ─── Profil ─────────────────────────────────────────────────────────── */

export const getMe = () => request<LearnerDTO>("/me");

export const getSnapshot = () => request<Snapshot>("/me/snapshot");

export const equipAvatar = (payload: EquipAvatarRequest) =>
  request<LearnerDTO>("/me/equip-avatar", {
    method: "PATCH",
    body: payload,
  });

export const getRecommendation = () =>
  request<Recommendation>("/me/recommendation");

export const planSession = (mode: PlanMode) =>
  request<SessionPlan>("/me/plan", {
    method: "POST",
    body: { mode },
  });

/* ─── Curriculum ─────────────────────────────────────────────────────── */

export const listPrograms = () =>
  request<{ programs: ProgramDTO[]; total: number }>("/programs");

export const getProgram = (programId: string) =>
  request<ProgramDTO>(`/programs/${encodeURIComponent(programId)}`);

export const getLesson = (lessonId: string) =>
  request<LessonDetailDTO>(`/lessons/${encodeURIComponent(lessonId)}`);

export const startLesson = (lessonId: string) =>
  request<LessonActionResponse>(
    `/lessons/${encodeURIComponent(lessonId)}/start`,
    { method: "POST" },
  );

export const viewBlock = (
  lessonId: string,
  blockIndex: number,
  slidesConsumed = 1,
) =>
  request<LessonActionResponse>(
    `/lessons/${encodeURIComponent(lessonId)}/blocks/${blockIndex}/view`,
    {
      method: "POST",
      body: { slides_consumed: slidesConsumed },
    },
  );

export const answerExercise = (
  lessonId: string,
  exerciseId: string,
  payload: AnswerExerciseRequest,
) =>
  request<EvaluationResponse>(
    `/lessons/${encodeURIComponent(lessonId)}/exercises/${encodeURIComponent(exerciseId)}/answer`,
    { method: "POST", body: payload },
  );

/* ─── Missions ───────────────────────────────────────────────────────── */

export const listMissions = () => request<MissionListResponse>("/missions");

export const attemptMission = (
  missionId: string,
  payload: Record<string, unknown> = {},
) =>
  request<MissionAttemptResponse>(
    `/missions/${encodeURIComponent(missionId)}/attempt`,
    { method: "POST", body: { payload } },
  );

/* ─── Événements ─────────────────────────────────────────────────────── */

export const publishEvent = (payload: PublishEventRequest) =>
  request<PublishEventResponse>("/events", {
    method: "POST",
    body: payload,
  });

/* ─── SRS ────────────────────────────────────────────────────────────── */

export type SrsQueueParams = {
  max?: number;
  order?: "due" | "lapses" | "ease";
  concept?: string;
};

export const getSrsQueue = (params: SrsQueueParams = {}) =>
  request<SrsQueueResponse>("/srs/queue", {
    query: {
      max: params.max,
      order: params.order,
      concept: params.concept,
    },
  });

export const reviewSrsCard = (cardId: string, payload: ReviewCardRequest) =>
  request<SrsReviewResponse>(
    `/srs/cards/${encodeURIComponent(cardId)}/review`,
    { method: "POST", body: payload },
  );

export const getSrsStats = () => request<SrsStatsResponse>("/srs/stats");

export const getSrsForecast = (days?: number) =>
  request<SrsForecastResponse>("/srs/forecast", { query: { days } });

/* ─── Avatars ────────────────────────────────────────────────────────── */

export const listAvatars = () => request<AvatarSnapshot>("/avatars");

export const equipAvatarByPath = (payload: EquipAvatarRequest) =>
  request<LearnerDTO>("/avatars/equip", {
    method: "POST",
    body: payload,
  });

/* ─── Quêtes ─────────────────────────────────────────────────────────── */

export const getQuests = () => request<QuestSummary>("/quests");

export const claimQuest = (questId: string) =>
  request<QuestClaimResponse>(
    `/quests/${encodeURIComponent(questId)}/claim`,
    { method: "POST", body: {} },
  );