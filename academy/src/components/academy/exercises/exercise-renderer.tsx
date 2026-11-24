// academy/src/components/academy/exercises/exercise-renderer.tsx

import type { Answer, Exercise } from "../../../lib/model";
import { CategorizeExercise } from "./categorize";
import { TimelineExercise } from "./timeline";
import { ConnectSignalsExercise } from "./connect-signals";
import { SortPriorityExercise } from "./sort-priority";
import { RoleplayExercise } from "./roleplay";
import { FillEmailExercise } from "./fill-email";
import { HotColdClickExercise } from "./hot-cold-click";

export type ExerciseRendererProps = {
  exercise: Exercise;
  answer: Answer;
  disabled: boolean;
  onAnswer: (next: Answer) => void;
};

export function ExerciseRenderer(props: ExerciseRendererProps) {
  const { exercise } = props;

  switch (exercise.kind) {
    case "categorize":
      return <CategorizeExercise {...props} />;
    case "timeline":
      return <TimelineExercise {...props} />;
    case "connect_signals":
      return <ConnectSignalsExercise {...props} />;
    case "sort_priority":
      return <SortPriorityExercise {...props} />;
    case "roleplay":
      return <RoleplayExercise {...props} />;
    case "fill_email":
      return <FillEmailExercise {...props} />;
    case "hot_cold_click":
      return <HotColdClickExercise {...props} />;
    default:
      return null;
  }
}

export function isCustomExerciseKind(kind: string): boolean {
  switch (kind) {
    case "categorize":
    case "timeline":
    case "connect_signals":
    case "sort_priority":
    case "roleplay":
    case "fill_email":
    case "hot_cold_click":
      return true;
    default:
      return false;
  }
}
