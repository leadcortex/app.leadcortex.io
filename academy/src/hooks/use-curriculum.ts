// academy/src/hooks/use-curriculum.ts

import { useMemo } from "react";

import {
  adaptCurriculum,
  type AdaptedProgram,
} from "../lib/curriculum-adapter";
import { programs as localPrograms } from "../data/curriculum";

export type UseCurriculumResult = {
  programs: AdaptedProgram[];
  isLoading: boolean;
  isFallback: boolean;
  error: Error | null;
};

export function useCurriculum(_learnerId?: string): UseCurriculumResult {
  const programs = useMemo(
    () => (localPrograms as unknown[]) as AdaptedProgram[],
    [],
  );

  return {
    programs,
    isLoading: false,
    isFallback: true,
    error: null,
  };
}
