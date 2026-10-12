/**
 * Types TypeScript — miroir exact des DTO exposés par l'API Go
 * (voir backend/academy/internal/api/dto.go et handlers_*.go).
 *
 * Toute évolution côté Go doit être répercutée ici. Les noms de champs
 * suivent ceux du JSON (snake_case).
 */

/* ─── Learner ─────────────────────────────────────────────────────────── */

export type LearnerStatus = "active" | "inactive";

export type LearnerDTO = {
  id: string;
  display_name: string;
  email?: string;
  tenant_id?: string;
  xp: number;
  level: number;
  xp_for_next_level: number;
  level_progress: number;
  streak_days: number;
  best_streak_days: number;
  hearts: number;
  max_hearts: number;
  unlocked_avatar_ids: string[];
  equipped_avatar_id?: string;
  earned_badge_ids: string[];
};

/* ─── Curriculum ─────────────────────────────────────────────────────── */

export type ProgramDTO = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  difficulty: number;
  estimated_minutes: number;
  total_lessons: number;
  modules?: ModuleDTO[];
};

export type ModuleDTO = {
  id: string;
  program_id: string;
  order: number;
  title: string;
  description: string;
  estimated_minutes: number;
  total_lessons: number;
  lessons?: LessonDTO[];
};

export type LessonDTO = {
  id: string;
  module_id: string;
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  duration_min: number;
  difficulty: number;
  xp_total: number;
  concepts?: string[];
  skills?: string[];
  block_count: number;
};

export type LessonDetailDTO = LessonDTO & {
  blocks: BlockDTO[];
};

/* ─── Blocs ──────────────────────────────────────────────────────────── */

export type BlockType = "cover" | "theory" | "practice" | "mission" | "debrief" | "unknown";

export type BlockDTO = {
  index: number;
  type: BlockType;
  cover?: CoverBlockDTO;
  theory?: TheoryBlockDTO;
  practice?: PracticeBlockDTO;
  mission?: MissionBlockDTO;
  debrief?: DebriefBlockDTO;
};

export type CoverBlockDTO = {
  title: string;
  subtitle?: string;
  mascot_pose?: string;
  mascot_line?: string;
  objectives: string[];
};

export type TheoryBlockDTO = {
  slides: TheorySlideDTO[];
};

export type TheorySlideDTO = {
  id: string;
  title: string;
  body_md?: string;
  callout?: CalloutDTO;
  quote?: QuoteDTO;
  visual?: VisualDTO;
  quiz_inline?: InlineQuizDTO;
};

export type CalloutDTO = {
  tone: "info" | "warning" | "success" | "danger";
  title?: string;
  text: string;
};

export type QuoteDTO = { text: string; author?: string };

export type VisualDTO = {
  kind: string;
  asset?: string;
  alt?: string;
  caption?: string;
  payload?: Record<string, unknown>;
};

export type InlineQuizDTO = {
  question: string;
  options: string[];
  answer: number;
};

export type PracticeBlockDTO = { exercises: ExerciseDTO[] };

export type MissionBlockDTO = { mission: MissionDTO };

export type DebriefBlockDTO = {
  sections: string[];
  custom_mascot_line?: string;
};

/* ─── Exercices ──────────────────────────────────────────────────────── */

export type ExerciseKind =
  | "mcq"
  | "multi_select"
  | "fill_blank"
  | "order_steps"
  | "match_pairs"
  | "free_text"
  | "scenario"
  | "in_app_mission";

export type ExerciseDTO = {
  id: string;
  kind: ExerciseKind;
  prompt: string;
  xp: number;
  difficulty: number;
  concepts?: string[];
  payload: ExercisePayload;
};

export type ExercisePayload =
  | MCqPayloadDTO
  | MultiSelectPayloadDTO
  | FillBlankPayloadDTO
  | OrderStepsPayloadDTO
  | MatchPairsPayloadDTO
  | FreeTextPayloadDTO
  | ScenarioPayloadDTO
  | InAppMissionPayloadDTO;

export type MCqPayloadDTO = { options: string[] };
export type MultiSelectPayloadDTO = { options: string[] };
export type FillBlankPayloadDTO = { blank_count: number };
export type OrderStepsPayloadDTO = { steps: string[] };
export type MatchPairsPayloadDTO = { pairs: MatchPairDTO[] };
export type MatchPairDTO = { left: string; right: string };
export type FreeTextPayloadDTO = { min_words: number; max_words?: number };
export type ScenarioPayloadDTO = { steps: ScenarioStepDTO[] };
export type ScenarioStepDTO = {
  id: string;
  situation: string;
  question: string;
  choices: string[];
};
export type InAppMissionPayloadDTO = { mission_id: string };

/* ─── Missions ───────────────────────────────────────────────────────── */

export type MissionDTO = {
  id: string;
  lesson_id: string;
  title: string;
  brief_md: string;
  target: MissionTargetDTO;
  trigger?: string;
  hint_after_minutes?: number;
  retry_allowed: boolean;
  on_success: MissionOnSuccessDTO;
  on_failure: MissionOnFailureDTO;
};

export type MissionTargetDTO = { route: string; cta: string };
export type MissionOnSuccessDTO = { xp: number; mascot_line?: string };
export type MissionOnFailureDTO = { feedback_md: string; hint_md?: string };

export type MissionWithStatusDTO = MissionDTO & {
  status: "locked" | "available" | "in_progress" | "completed" | "failed" | "skipped";
  attempts: number;
};

export type MissionListResponse = {
  missions: MissionWithStatusDTO[];
  total: number;
  pending: number;
  completed: number;
};

export type MissionAttemptResponse = {
  mission_id: string;
  validated: boolean;
  status: string;
  xp_awarded: number;
  feedback_md?: string;
  hint_md?: string;
  reason?: string;
};

/* ─── Évaluation ─────────────────────────────────────────────────────── */

export type EvaluationResponse = {
  score: number;
  correct: boolean;
  feedback_md: string;
  concepts_touched?: string[];
  details?: ResultDetailsDTO;
  xp_awarded: number;
  lesson_status?: string;
};

export type ResultDetailsDTO = {
  blank_results?: SubResultDTO[];
  pair_results?: SubResultDTO[];
  step_results?: SubResultDTO[];
  scenario_results?: SubResultDTO[];
  matched_keywords?: string[];
  missing_keywords?: string[];
  word_count?: number;
};

export type SubResultDTO = {
  index: number;
  expected?: string;
  got?: string;
  correct: boolean;
};

export type AnswerExerciseRequest = {
  kind: ExerciseKind;
  selected?: number;
  selected_multiple?: number[];
  blanks?: string[];
  steps?: string[];
  pairs?: MatchPairDTO[];
  text?: string;
  choices?: number[];
};

/* ─── Leçon — actions ────────────────────────────────────────────────── */

export type LessonActionResponse = {
  lesson_id: string;
  status: string;
  transitioned: boolean;
};

export type ViewBlockRequest = { slides_consumed?: number };

/* ─── SRS ────────────────────────────────────────────────────────────── */

export type SrsCardDTO = {
  id: string;
  concept_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at?: string;
  is_due: boolean;
};

export type SrsQueueResponse = {
  cards: SrsCardDTO[];
  count: number;
  generated_at: string;
};

export type SrsReviewButton = "again" | "hard" | "good" | "easy";
export type ReviewCardRequest = { button: SrsReviewButton };

export type SrsReviewResponse = { card: SrsCardDTO };

export type SrsStatsResponse = {
  stats: {
    total_cards: number;
    due_count: number;
    new_count: number;
    learning_count?: number;
    review_count?: number;
  };
  queue: { total_cards: number; total_due: number };
};

export type SrsForecastDay = {
  date: string;
  day_offset: number;
  due_count: number;
};

export type SrsForecastResponse = {
  days: number;
  forecast: SrsForecastDay[];
};

/* ─── Recommandation & plan ──────────────────────────────────────────── */

export type RecommendationKind =
  | "review_concept"
  | "practice_concept"
  | "resume_lesson"
  | "start_lesson"
  | "rest_day"
  | "none";

export type Recommendation = {
  kind: RecommendationKind;
  lesson_id?: string;
  concept_id?: string;
  reason: string;
  priority: number;
  estimated_minutes: number;
};

export type PlanMode = "micro" | "standard" | "deep" | "review_only";

export type SessionPlan = {
  mode: PlanMode;
  total_minutes: number;
  steps: PlanStep[];
  reason: string;
};

export type PlanStep = {
  order: number;
  kind: RecommendationKind;
  lesson_id?: string;
  concept_id?: string;
  duration_minutes: number;
  description: string;
};

export type PlanSessionRequest = { mode: PlanMode };

/* ─── Quêtes ─────────────────────────────────────────────────────────── */

export type QuestKind = "xp" | "lessons" | "exercises" | "srs" | "missions" | "streak";
export type QuestStatus = "active" | "complete" | "claimed";

export type QuestDTO = {
  id: string;
  date: string;
  kind: QuestKind;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  status: QuestStatus;
};

export type QuestSummary = {
  date: string;
  quests: QuestDTO[];
  completed: number;
  total: number;
  reward_due: number;
};

export type QuestClaimResponse = {
  quest_id: string;
  xp_awarded: number;
  summary: QuestSummary;
};

/* ─── Avatars & badges ───────────────────────────────────────────────── */

export type AvatarPoseDTO = { key: string; label: string; is_default: boolean };

export type AvatarUnlockDTO = {
  kind: string;
  value: string;
  description: string;
};

export type AvatarCatalogEntry = {
  id: string;
  name: string;
  tier: string;
  description: string;
  svg_path: string;
  default_pose: string;
  poses: AvatarPoseDTO[];
  unlock: AvatarUnlockDTO;
  unlocked: boolean;
  equipped: boolean;
};

export type AvatarSnapshot = {
  avatars: AvatarCatalogEntry[];
  equipped_id: string;
  total: number;
  unlocked_ids: string[];
  unlocked_count: number;
};

export type EquipAvatarRequest = { avatar_id: string };

/* ─── Événements ─────────────────────────────────────────────────────── */

export type PublishEventRequest = {
  kind: string;
  at?: string;
  payload?: Record<string, unknown>;
};

export type PublishEventResponse = {
  event: string;
  at: string;
  validated_missions: string[];
  xp_awarded_total: number;
};

/* ─── Santé / version ────────────────────────────────────────────────── */

export type HealthResponse = { status: "ok" };
export type ReadyResponse = { status: "ready" };

export type VersionResponse = {
  version: string;
  commit: string;
  build_date: string;
  go_version: string;
};

/* ─── Snapshot (vue agrégée renvoyée par /me/snapshot) ──────────────── */
/**
 * Le snapshot est sérialisé par progress.BuildSnapshot côté Go. On expose
 * volontairement un type minimal côté front : les composants consomment
 * principalement `learner_id`, `xp`, `level`, `hearts`, `programs`,
 * `recommendation`. Le reste peut être étendu au besoin.
 */
export type Snapshot = {
  learner_id: string;
  display_name: string;
  xp: number;
  level: number;
  streak_days: number;
  best_streak_days: number;
  hearts: number;
  max_hearts: number;
  equipped_avatar_id?: string;
  unlocked_avatar_ids: string[];
  earned_badge_ids: string[];
  programs: ProgramProgressView[];
  recommendation?: Recommendation;
  [key: string]: unknown;
};

export type ProgramProgressView = {
  program_id: string;
  title: string;
  order: number;
  total_lessons: number;
  completed_lessons: number;
  modules?: ModuleProgressView[];
};

export type ModuleProgressView = {
  module_id: string;
  title: string;
  order: number;
  total_lessons: number;
  completed_lessons: number;
  lessons?: LessonProgressView[];
};

export type LessonProgressView = {
  lesson_id: string;
  title: string;
  order: number;
  status: string;
  progress_ratio?: number;
  duration_min?: number;
};