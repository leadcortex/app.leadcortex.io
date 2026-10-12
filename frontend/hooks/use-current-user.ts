//frontend\hooks\use-current-user.ts
import { useCallback, useMemo } from "react";
import { useAppStore } from "@/lib/store";

export type CurrentUser = {
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

const FALLBACK_NAME = "Utilisateur";

function titleCase(input: string): string {
  return input
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function computeFirstName(fullName: string, email: string): string {
  const trimmed = fullName.trim();
  if (trimmed && trimmed !== FALLBACK_NAME) {
    const first = trimmed.split(/\s+/)[0];
    if (first) return first;
  }
  const local = email.split("@")[0];
  if (local) return titleCase(local);
  return FALLBACK_NAME;
}

function computeLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(1).join(" ");
}

function computeInitials(source: string, email: string): string {
  const base = (source || email.split("@")[0] || "").trim();
  if (!base) return "U";
  const parts = base.split(/[\s._\-]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]![0] ?? "";
  const last = parts[parts.length - 1]![0] ?? "";
  return `${first}${last}`.toUpperCase() || "U";
}

/* -------------------------------------------------------------------------- */
/*  Hook principal                                                            */
/* -------------------------------------------------------------------------- */

export function useCurrentUser(): CurrentUser {
  const { user } = useAppStore();

  return useMemo<CurrentUser>(() => {
    const rawName = user.name ?? "";
    const rawEmail = user.email ?? "";

    const firstName = computeFirstName(rawName, rawEmail);
    const lastName = computeLastName(rawName);
    const fullName = rawName || firstName;
    const initials = computeInitials(rawName || firstName, rawEmail);

    return {
      fullName,
      firstName,
      lastName,
      email: rawEmail,
      initials,
      // TODO [AUTH] : remplacer par `user.avatarUrl` quand GET /api/me sera branché.
      avatarUrl: null,
      // TODO [AUTH] : remplacer par `user.plan` (renvoyé par /api/me).
      plan: "Free",
      // TODO [AUTH] : remplacer par `user.role`.
      role: "Founder",
      // TODO [AUTH] : remplacer par `user.organization`.
      organization: "—",
      isAuthenticated: Boolean(rawEmail),
    };
  }, [user.name, user.email]);
}

/* -------------------------------------------------------------------------- */
/*  Action de mise à jour (stub — sera branchée sur PATCH /api/me)            */
/* -------------------------------------------------------------------------- */

export function useUpdateCurrentUser() {
  return useCallback(async (_patch: Partial<CurrentUser>): Promise<void> => {
    // TODO [AUTH] : PATCH /api/me puis invalider la query TanStack.
    // En attendant, on ne fait rien — le store reste la source de vérité.
  }, []);
}
