// frontend/hooks/use-current-user.ts

import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/state/store";

export type CurrentUser = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  plan: string;
  role: string;
  organization: string;
  isAuthenticated: boolean;
};

type ApiUser = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
};

const CURRENT_USER_QUERY_KEY = ["current-user"] as const;
const FALLBACK_NAME = "Utilisateur";

function titleCase(input: string): string {
  return input
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function computeInitials(source: string, email: string): string {
  const base = (source || email.split("@")[0] || "").trim();
  if (!base) return "U";
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0] ?? "";
  return `${first}${last}`.toUpperCase() || "U";
}

async function fetchCurrentUser(): Promise<ApiUser | null> {
  const response = await fetch("/api/me", { headers: { accept: "application/json" } });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Impossible de charger le profil (${response.status}).`);
  }

  const payload = (await response.json()) as { user?: ApiUser | null };
  if (!payload.user) return null;
  return payload.user;
}

export function useCurrentUser(): CurrentUser {
  const { user, setUser, clearUser } = useAppStore();
  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setUser({
        name: query.data.name,
        email: query.data.email,
        avatarUrl: query.data.avatarUrl,
        plan: query.data.plan,
      });
    } else if (query.data === null) {
      clearUser();
    }
  }, [query.data, setUser, clearUser]);

  return useMemo(() => {
    const apiUser = query.data;
    const rawName = apiUser?.name ?? user.name ?? "";
    const rawEmail = apiUser?.email ?? user.email ?? "";
    const parts = rawName.trim().split(/\s+/).filter(Boolean);
    const firstName = apiUser?.firstName || parts[0] || titleCase(rawEmail.split("@")[0] ?? "");
    const lastName = apiUser?.lastName || parts.slice(1).join(" ");
    const fullName = rawName || firstName || FALLBACK_NAME;

    return {
      id: apiUser?.id ?? "",
      fullName,
      firstName: firstName || FALLBACK_NAME,
      lastName,
      email: rawEmail,
      initials: computeInitials(fullName, rawEmail),
      avatarUrl: apiUser?.avatarUrl ?? user.avatarUrl,
      plan: apiUser?.plan ?? user.plan ?? "Free",
      role: "Founder",
      organization: "—",
      isAuthenticated: Boolean(apiUser?.id),
    };
  }, [query.data, user.name, user.email, user.avatarUrl, user.plan]);
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useCallback(
    async (patch: Partial<Pick<CurrentUser, "firstName" | "lastName">>): Promise<void> => {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        throw new Error(`Impossible d'enregistrer le profil (${response.status}).`);
      }

      const payload = (await response.json()) as { user: ApiUser };
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, payload.user);
    },
    [queryClient],
  );
}
