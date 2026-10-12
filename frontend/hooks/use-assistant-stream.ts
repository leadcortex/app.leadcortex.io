"use client";

/**
 * Hook qui pilote un transport `AssistantTransport` et expose un état
 * prêt à consommer par l'UI :
 *
 *  - `phase`     : "idle" | "thinking" | "streaming" | "done" | "error"
 *  - `text`      : texte cumulé reçu jusqu'ici
 *  - `usage`     : consommation (renseignée après un `done`)
 *  - `error`     : message d'erreur lisible
 *  - `start`     : lance un envoi (annule l'éventuel envoi en cours)
 *  - `abort`     : annule le flux en cours
 *  - `reset`     : remet à zéro
 *
 * Le hook est volontairement bas-niveau : la sidebar le branchera sur son
 * état de messages, mais il peut être utilisé isolément (ex. pour un test).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MockTransport,
  withRetry,
  type AssistantTransport,
  type SendRequest,
  type StreamChunk,
  type Usage,
} from "@/lib/assistant-transport";
import type { AssistantAttachment, AssistantMessage } from "@/components/ai-assistant/assistant-engine";

export type StreamPhase = "idle" | "thinking" | "streaming" | "done" | "error";

export type AssistantStreamState = {
  phase: StreamPhase;
  text: string;
  usage: Usage | null;
  error: string | null;
};

export type StartOptions = {
  prompt: string;
  context: string;
  attachments?: AssistantAttachment[];
  history?: AssistantMessage[];
  onDone?: (fullText: string, usage: Usage | null) => void;
  onError?: (message: string) => void;
};

const initialState: AssistantStreamState = {
  phase: "idle",
  text: "",
  usage: null,
  error: null,
};

/** Transport par défaut : mock. À remplacer côté appelant si un vrai endpoint existe. */
const defaultTransport: AssistantTransport = new MockTransport();

export function useAssistantStream(transport: AssistantTransport = defaultTransport) {
  const [state, setState] = useState<AssistantStreamState>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>("");

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    bufferRef.current = "";
    setState(initialState);
  }, [abort]);

  useEffect(() => () => abort(), [abort]);

  const start = useCallback(
    async (options: StartOptions) => {
      abort();
      const controller = new AbortController();
      abortRef.current = controller;
      bufferRef.current = "";
      setState({ phase: "thinking", text: "", usage: null, error: null });

      const request: SendRequest = {
        prompt: options.prompt,
        context: options.context,
        attachments: options.attachments ?? [],
        history: options.history ?? [],
        signal: controller.signal,
      };

      const runOnce = async (): Promise<boolean> => {
        try {
          let sawDelta = false;
          for await (const chunk of transport.send(request)) {
            if (controller.signal.aborted) return false;
            handleChunk(chunk, sawDelta);
            if (chunk.type === "text-delta") sawDelta = true;
            if (chunk.type === "done") return true;
            if (chunk.type === "error") {
              if (!chunk.retryable) {
                finish("error", chunk.message);
                return true; // pas de retry, mais on sort proprement
              }
              return false;
            }
          }
          return true;
        } catch (err) {
          if ((err as Error).name === "AbortError") return true;
          return false;
        }
      };

      const handleChunk = (chunk: StreamChunk, alreadyStreaming: boolean) => {
        if (chunk.type === "text-delta") {
          bufferRef.current += chunk.delta;
          setState((s) => ({
            phase: alreadyStreaming ? "streaming" : "streaming",
            text: bufferRef.current,
            usage: s.usage,
            error: null,
          }));
        } else if (chunk.type === "done") {
          setState((s) => ({
            phase: "done",
            text: bufferRef.current,
            usage: chunk.usage ?? s.usage,
            error: null,
          }));
        } else if (chunk.type === "error") {
          setState((s) => ({ ...s, phase: "error", error: chunk.message }));
        }
      };

      const finish = (phase: StreamPhase, error: string | null) => {
        setState({
          phase,
          text: bufferRef.current,
          usage: null,
          error,
        });
        if (error) options.onError?.(error);
      };

      const success = await withRetry(runOnce, {
        maxAttempts: 3,
        onRetry: (_attempt, delayMs) => {
          setState((s) => ({
            ...s,
            phase: "thinking",
            error: `Nouvelle tentative dans ${Math.round(delayMs / 100) / 10} s…`,
          }));
        },
      });

      if (!success) {
        finish("error", "Impossible d'obtenir une réponse après plusieurs tentatives.");
        return;
      }

      // Le flux s'est terminé (done ou abort). On remonte le texte final.
      if (!controller.signal.aborted) {
        options.onDone?.(bufferRef.current, null);
      }
    },
    [transport, abort],
  );

  return { ...state, start, abort, reset };
}