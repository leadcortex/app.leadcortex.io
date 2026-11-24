// frontend/lib/security/client-api.ts

import type { FormGuardPayload } from "./client-guard";

export type VerifyResponse =
  { ok: true } | { ok: false; reason: string; message: string; retryAfterMs?: number };

export async function verifyWithServer(
  route: "login" | "signup",
  payload: FormGuardPayload,
  email?: string,
): Promise<VerifyResponse> {
  try {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ route, payload, email }),
    });

    const data = (await res.json()) as VerifyResponse;
    return data;
  } catch {
    return { ok: true };
  }
}
