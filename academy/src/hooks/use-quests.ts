// academy/src/hooks/use-quests.ts

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../lib/api-client";
import type { QuestDTO, QuestStatusForLearnerDTO } from "../lib/curriculum-types";

const STALE_TIME_MS = 2 * 60 * 1000;

const FALLBACK_QUESTS: QuestDTO[] = [
  {
    id: "fallback-xp",
    date: "",
    kind: "xp",
    title: "Gagner 50 XP",
    description: "Accumule de l'XP en complétant du contenu.",
    target: 50,
    progress: 0,
    reward: 15,
    status: "active",
  },
  {
    id: "fallback-lessons",
    date: "",
    kind: "lessons",
    title: "Terminer 2 entraînements",
    description: "Complète deux leçons pour avancer.",
    target: 2,
    progress: 0,
    reward: 20,
    status: "active",
  },
  {
    id: "fallback-missions",
    date: "",
    kind: "missions",
    title: "Faire le premier pas",
    description: "Réussis une mission in-app.",
    target: 1,
    progress: 0,
    reward: 25,
    status: "active",
  },
];

export type UseQuestsResult = {
  quests: QuestDTO[];
  completed: number;
  total: number;
  rewardDue: number;
  isLoading: boolean;
  isFallback: boolean;
};

export function useQuests(learnerId?: string): UseQuestsResult {
  const query = useQuery<QuestStatusForLearnerDTO, Error>({
    queryKey: ["academy", "quests"],
    queryFn: () => apiFetch<QuestStatusForLearnerDTO>("/quests", { learnerId }),
    staleTime: STALE_TIME_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (!query.data) {
    return {
      quests: FALLBACK_QUESTS,
      completed: 0,
      total: FALLBACK_QUESTS.length,
      rewardDue: 0,
      isLoading: query.isLoading,
      isFallback: query.isError || !query.isLoading,
    };
  }

  return {
    quests: query.data.quests ?? [],
    completed: query.data.completed ?? 0,
    total: query.data.total ?? 0,
    rewardDue: query.data.reward_due ?? 0,
    isLoading: false,
    isFallback: false,
  };
}
