//frontend\lib\security\client-api.ts
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
    // Fail-open sur erreur réseau : on ne bloque pas un user légitime
    // dont le réseau est instable. À ajuster selon votre tolérance au risque.
    return { ok: true };
  }
}
