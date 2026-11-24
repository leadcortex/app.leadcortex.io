// academy/src/lib/curriculum-adapter.ts

import type {
  BlockDTO,
  CurriculumSnapshotDTO,
  LessonDetailDTO,
  ModuleSnapshotDTO,
  ProgramSnapshotDTO,
} from "./curriculum-types";

export type AdaptedBlock = {
  type: string;
  [key: string]: unknown;
};

export type AdaptedLesson = {
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
  blocks: AdaptedBlock[];
};

export type AdaptedModule = {
  id: string;
  program_id: string;
  order: number;
  chapter: number;
  title: string;
  description: string;
  estimated_minutes: number;
  lessons: AdaptedLesson[];
};

export type AdaptedProgram = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  difficulty: number;
  estimated_minutes: number;
  modules: AdaptedModule[];
};

export function adaptCurriculum(dto: CurriculumSnapshotDTO): AdaptedProgram[] {
  if (!dto || !Array.isArray(dto.programs)) return [];
  return dto.programs.map(adaptProgram);
}

function adaptProgram(p: ProgramSnapshotDTO): AdaptedProgram {
  return {
    id: p.id,
    order: p.order,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    icon: p.icon,
    color: p.color,
    difficulty: p.difficulty,
    estimated_minutes: p.estimated_minutes,
    modules: (p.modules ?? []).map(adaptModule),
  };
}

function adaptModule(m: ModuleSnapshotDTO): AdaptedModule {
  return {
    id: m.id,
    program_id: m.program_id,
    order: m.order,
    chapter: m.chapter,
    title: m.title,
    description: m.description,
    estimated_minutes: m.estimated_minutes,
    lessons: (m.lessons ?? []).map(adaptLesson),
  };
}

function adaptLesson(l: LessonDetailDTO): AdaptedLesson {
  return {
    id: l.id,
    module_id: l.module_id,
    order: l.order,
    slug: l.slug,
    title: l.title,
    subtitle: l.subtitle,
    duration_min: l.duration_min,
    difficulty: l.difficulty,
    xp_total: l.xp_total,
    concepts: l.concepts,
    skills: l.skills,
    blocks: (l.blocks ?? []).map(adaptBlock),
  };
}

function adaptBlock(b: BlockDTO): AdaptedBlock {
  switch (b.type) {
    case "cover":
      return {
        type: "cover",
        title: b.cover?.title ?? "",
        subtitle: b.cover?.subtitle,
        mascot_pose: b.cover?.mascot_pose,
        mascot_line: b.cover?.mascot_line,
        objectives: b.cover?.objectives ?? [],
      };
    case "theory":
      return { type: "theory", slides: b.theory?.slides ?? [] };
    case "practice":
      return { type: "practice", exercises: b.practice?.exercises ?? [] };
    case "mission":
      return { type: "mission", mission: b.mission?.mission };
    case "debrief":
      return {
        type: "debrief",
        sections: b.debrief?.sections ?? [],
        custom_mascot_line: b.debrief?.custom_mascot_line,
      };
    default:
      return { type: b.type };
  }
}
