// academy/src/hooks/use-avatars.ts

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../lib/api-client";
import { AVATARS } from "../components/academy/illustrations";

const STALE_TIME_MS = 5 * 60 * 1000;

type AvatarRenderDTO = {
  avatar_id: string;
  name: string;
  tier: string;
  description: string;
  pose_key: string;
  pose_label: string;
  asset_url: string;
  accent_color: string;
  gradient: string;
  has_glow: boolean;
  has_star: boolean;
  unlocked: boolean;
  equipped: boolean;
};

type AvatarSnapshotDTO = {
  unlocked_ids?: string[];
  equipped_id?: string;
  avatars: AvatarRenderDTO[];
  total: number;
  unlocked_count: number;
};

export type UseAvatarsResult = {
  unlockedIds: string[];
  equippedId: string;
  isFallback: boolean;
  isLoading: boolean;
};

export function useAvatars(learnerId?: string): UseAvatarsResult {
  const query = useQuery<AvatarSnapshotDTO, Error>({
    queryKey: ["academy", "avatars"],
    queryFn: () => apiFetch<AvatarSnapshotDTO>("/avatars", { learnerId }),
    staleTime: STALE_TIME_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (!query.data) {
    return {
      unlockedIds: [],
      equippedId: "",
      isFallback: query.isError || !query.isLoading,
      isLoading: query.isLoading,
    };
  }

  const localIds = new Set(AVATARS.map((a) => a.id));
  const unlockedIds = (query.data.unlocked_ids ?? []).filter((id) =>
    localIds.has(id),
  );

  return {
    unlockedIds,
    equippedId: query.data.equipped_id ?? "",
    isFallback: false,
    isLoading: false,
  };
}
