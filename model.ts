import curriculum from './academy/src/data/curriculum';

export type Exercise = {
  id: string;
  kind: string;
  prompt: string;
  explanation_md: string;
  xp: number;
  payload: {
    options?: string[];
    correct?: number | number[];
    blanks?: { correct: string[] }[];
    steps?: string[];
    pairs?: { left: string; right: string }[];
    min_words?: number;
    max_words?: number;
    rubric_md?: string;
  };
};
export type Slide = {
  title: string;
  body_md: string;
  callout?: { title?: string; text: string };
  quote?: { text: string; author: string };
};
export type Block = {
  type: string;
  mascot_line?: string;
  objectives?: string[];
  slides?: Slide[];
  exercises?: Exercise[];
  mission?: { title: string; brief_md: string };
};
export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  duration_min: number;
  xp_total: number;
  blocks: Block[];
};
export type Module = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};
export type Program = {
  id: string;
  title: string;
  subtitle: string;
  modules: Module[];
};

export const programs = curriculum as unknown as Program[];
export type Answer = number[] | string[];

export function checkAnswer(exercise: Exercise, answer: Answer): boolean | null {
  const p = exercise.payload;
  if (exercise.kind === 'free_text') return null;
  if (exercise.kind === 'mcq') return answer[0] === p.correct;
  if (exercise.kind === 'multi_select' && Array.isArray(p.correct))
    return answer.length === p.correct.length && p.correct.every(i => answer.includes(i as never));
  if (exercise.kind === 'fill_blank')
    return (p.blanks ?? []).every((b, i) =>
      b.correct.some(
        s => s.toLocaleLowerCase().trim() === String(answer[i] ?? '').toLocaleLowerCase().trim()
      )
    );
  if (exercise.kind === 'order_steps') return (p.steps ?? []).every((_, i) => answer[i] === i);
  if (exercise.kind === 'match_pairs') return (p.pairs ?? []).every((_, i) => answer[i] === String(i));
  return false;
}