// academy/src/hooks/use-srs.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../lib/api-client";

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

const QUEUE_STALE_MS = 30 * 1000;

export type UseSrsQueueResult = {
  cards: SrsCardDTO[];
  count: number;
  isLoading: boolean;
  isFallback: boolean;
  refetch: () => void;
};

export function useSrsQueue(learnerId?: string, max = 20): UseSrsQueueResult {
  const query = useQuery<SrsQueueResponse, Error>({
    queryKey: ["academy", "srs-queue", max],
    queryFn: () =>
      apiFetch<SrsQueueResponse>(`/srs/queue?max=${max}`, { learnerId }),
    staleTime: QUEUE_STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    cards: query.data?.cards ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isFallback: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}

export type ReviewMutationVariables = {
  cardId: string;
  button: SrsReviewButton;
};

export function useSrsReview(learnerId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, button }: ReviewMutationVariables) =>
      apiFetch<{ card: SrsCardDTO }>(`/srs/cards/${cardId}/review`, {
        method: "POST",
        body: { button },
        learnerId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy", "srs-queue"] });
      qc.invalidateQueries({ queryKey: ["academy", "srs-stats"] });
    },
  });
}

export type SrsStatsDTO = {
  stats: {
    total_cards: number;
    due_count: number;
    mature_count: number;
    young_count: number;
    new_count: number;
    avg_ease: number;
    avg_interval_days: number;
    total_lapses: number;
    retention_rate: number;
  };
  queue: {
    total_due: number;
    total_cards: number;
    due_now: number;
    due_today: number;
    due_this_week: number;
    next_due_at?: string;
  };
};

export function useSrsStats(learnerId?: string) {
  const query = useQuery<SrsStatsDTO, Error>({
    queryKey: ["academy", "srs-stats"],
    queryFn: () => apiFetch<SrsStatsDTO>("/srs/stats", { learnerId }),
    staleTime: QUEUE_STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    stats: query.data?.stats,
    queue: query.data?.queue,
    isLoading: query.isLoading,
    isFallback: query.isError,
  };
}
