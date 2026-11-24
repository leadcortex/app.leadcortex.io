// frontend/hooks/use-gmail-message.ts

import { useEffect, useState } from "react";
import type { EmailRecord } from "@shared/types/email-types";

async function parseError(response: Response, fallback: string): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return new Error(typeof payload?.error === "string" ? payload.error : fallback);
}

export function useGmailMessage({
  accountId,
  messageId,
  enabled = true,
}: {
  accountId: string;
  messageId: string | null;
  enabled?: boolean;
}) {
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !messageId) return;

    let active = true;
    const controller = new AbortController();
    setBody(null);
    setLoading(true);
    setError(null);

    const url =
      `/api/mail/messages?accountId=${encodeURIComponent(accountId)}` +
      `&messageId=${encodeURIComponent(messageId)}`;

    void fetch(url, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw await parseError(response, "Impossible d’ouvrir ce message.");
        return (await response.json()) as { message: EmailRecord };
      })
      .then((payload) => {
        if (active) setBody(payload.message.body);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Impossible d’ouvrir ce message.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [accountId, messageId, enabled]);

  return { body, loading, error };
}
