// academy/src/lib/curriculum-types.ts

export type CurriculumSnapshotDTO = {
  programs: ProgramSnapshotDTO[];
  total: number;
};

export type ProgramSnapshotDTO = {
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
  modules: ModuleSnapshotDTO[];
};

export type ModuleSnapshotDTO = {
  id: string;
  program_id: string;
  order: number;
  chapter: number;
  title: string;
  description: string;
  estimated_minutes: number;
  total_lessons: number;
  lessons: LessonDetailDTO[];
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

export type BlockDTO = {
  index: number;
  type: "cover" | "theory" | "practice" | "mission" | "debrief" | "unknown";
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

export type CalloutDTO = { tone: string; title?: string; text: string };
export type QuoteDTO = { text: string; author?: string };
export type VisualDTO = {
  kind: string;
  asset?: string;
  alt?: string;
  caption?: string;
  payload?: Record<string, unknown>;
};
export type InlineQuizDTO = { question: string; options: string[]; answer: number };

export type PracticeBlockDTO = { exercises: ExerciseDTO[] };

export type ExerciseDTO = {
  id: string;
  kind:
    | "mcq"
    | "multi_select"
    | "fill_blank"
    | "order_steps"
    | "match_pairs"
    | "free_text"
    | "scenario"
    | "in_app_mission";
  prompt: string;
  xp: number;
  difficulty: number;
  concepts?: string[];
  payload: unknown;
};

export type MissionBlockDTO = { mission: MissionDTO };

export type MissionDTO = {
  id: string;
  lesson_id: string;
  title: string;
  brief_md: string;
  target: { route: string; cta: string };
  trigger?: string;
  hint_after_minutes?: number;
  retry_allowed: boolean;
  on_success: { xp: number; mascot_line?: string };
  on_failure: { feedback_md: string; hint_md?: string };
};

export type DebriefBlockDTO = {
  sections: string[];
  custom_mascot_line?: string;
};

export type QuestStatusForLearnerDTO = {
  date: string;
  quests: QuestDTO[];
  completed: number;
  total: number;
  reward_due: number;
};

export type QuestDTO = {
  id: string;
  date: string;
  kind: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  status: "active" | "complete" | "claimed";
};

export type StreakStatusDTO = {
  current_days: number;
  best_days: number;
  freezes_available: number;
  is_active_today: boolean;
  days_until_next_milestone?: number;
  next_milestone_day?: number;
  next_milestone_xp?: number;
};
