// frontend/hooks/use-gmail-emails.ts

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmailRecord } from "@shared/types/email-types";
import {
  customLabelsFromLabelIds,
  flagsFromLabelIds,
  folderFromLabelIds,
  gmailQueryForFolder,
  type GmailFolderQuery,
} from "@/lib/mail/gmail-label-mapping";

type Payload = {
  account: { id: string; address: string };
  messages: EmailRecord[];
  resultSizeEstimate: number;
};

type State = {
  emails: EmailRecord[];
  loading: boolean;
  error: string | null;
  resultSizeEstimate: number;
};

async function parseError(response: Response, fallback: string): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return new Error(typeof payload?.error === "string" ? payload.error : fallback);
}

function normalizeMessage(raw: EmailRecord): EmailRecord {
  const labelIds = raw.labels ?? [];
  const folder = folderFromLabelIds(labelIds);
  const flags = flagsFromLabelIds(labelIds);
  const customLabels = customLabelsFromLabelIds(labelIds);

  return {
    ...raw,
    folder,
    unread: flags.unread,
    starred: flags.starred,
    labels: customLabels,
  };
}

export function useGmailEmails({
  accountId,
  folder,
  enabled = true,
  maxResults = 25,
}: {
  accountId: string | null | undefined;
  folder: GmailFolderQuery;
  enabled?: boolean;
  maxResults?: number;
}) {
  const [state, setState] = useState<State>({
    emails: [],
    loading: Boolean(enabled && accountId),
    error: null,
    resultSizeEstimate: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!accountId) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({
        ...s,
        loading: mode === "initial" ? true : s.loading,
        error: null,
      }));

      const q = gmailQueryForFolder(folder);
      const url =
        `/api/mail/messages?accountId=${encodeURIComponent(accountId)}` +
        `&q=${encodeURIComponent(q)}` +
        `&maxResults=${maxResults}`;

      try {
        const response = await fetch(url, {
          headers: { accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw await parseError(response, "Impossible de charger Gmail.");
        }
        const payload = (await response.json()) as Payload;
        const messages = payload.messages.map(normalizeMessage);
        setState({
          emails: messages,
          loading: false,
          error: null,
          resultSizeEstimate: payload.resultSizeEstimate ?? messages.length,
        });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setState({
          emails: [],
          loading: false,
          error: cause instanceof Error ? cause.message : "Impossible de charger Gmail.",
          resultSizeEstimate: 0,
        });
      }
    },
    [accountId, folder, maxResults],
  );

  useEffect(() => {
    if (!enabled || !accountId) {
      setState({ emails: [], loading: false, error: null, resultSizeEstimate: 0 });
      return;
    }
    void load("initial");
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, accountId, folder, load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return {
    ...state,
    refresh,
  };
}
