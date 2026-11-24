// academy/src/hooks/use-streak.ts

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../lib/api-client";

const STALE_TIME_MS = 60 * 1000;

type LearnerDTO = {
  id: string;
  display_name: string;
  email?: string;
  xp: number;
  level: number;
  xp_for_next_level?: number;
  level_progress?: number;
  streak_days: number;
  best_streak_days: number;
  hearts: number;
  max_hearts: number;
  unlocked_avatar_ids: string[];
  equipped_avatar_id?: string;
  earned_badge_ids: string[];
};

export type UseStreakResult = {
  currentDays: number;
  bestDays: number;
  hearts: number;
  maxHearts: number;
  xp: number;
  level: number;
  activeToday: boolean;
  isLoading: boolean;
  isFallback: boolean;
};

export function useStreak(learnerId?: string): UseStreakResult {
  const query = useQuery<LearnerDTO, Error>({
    queryKey: ["academy", "me"],
    queryFn: () => apiFetch<LearnerDTO>("/me", { learnerId }),
    staleTime: STALE_TIME_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (!query.data) {
    return {
      currentDays: 0,
      bestDays: 0,
      hearts: 5,
      maxHearts: 5,
      xp: 0,
      level: 1,
      activeToday: false,
      isLoading: query.isLoading,
      isFallback: query.isError || !query.isLoading,
    };
  }

  const d = query.data;
  return {
    currentDays: d.streak_days ?? 0,
    bestDays: d.best_streak_days ?? 0,
    hearts: d.hearts ?? 5,
    maxHearts: d.max_hearts ?? 5,
    xp: d.xp ?? 0,
    level: d.level ?? 1,
    activeToday: (d.streak_days ?? 0) > 0,
    isLoading: false,
    isFallback: false,
  };
}
