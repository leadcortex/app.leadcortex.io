//frontend\lib\assistant-transport.ts
/**
 * Transport de l'assistant — abstraction entre l'UI et le backend.
 *
 * Le contrat `AssistantTransport` décrit un envoi de message qui produit un
 * flux de chunks (`text-delta`, `done`, `error`). Deux implémentations sont
 * fournies :
 *
 *  - `MockTransport` : simule un flux SSE à partir de `generateReply()`, en
 *    découpant la réponse en morceaux de N caractères. C'est le mode actif
 *    aujourd'hui, tant qu'aucun backend n'existe.
 *
 *  - `HttpSSETransport` : client SSE réel, prêt à brancher dès qu'un endpoint
 *    `POST /api/assistant/stream` renverra un flux `text/event-stream`. Il
 *    gère les erreurs réseau, le timeout, et délègue le retry à l'appelant
 *    (via `withRetry`).
 *
 * L'interface est volontairement minimale : `send(req)` renvoie un
 * `AsyncIterable<StreamChunk>` que l'appelant consomme avec un `for await`.
 * Annulation via `req.signal`. Aucune dépendance à React.
 */
import {
  generateReply,
  type AssistantAttachment,
  type AssistantMessage,
} from "@/components/ai-assistant/assistant-engine";

/* ─── Types ───────────────────────────────────────────────────────────── */

export type Usage = { tokensIn: number; tokensOut: number; cents: number };

export type StreamChunk =
  | { type: "text-delta"; delta: string }
  | { type: "done"; usage?: Usage }
  | { type: "error"; message: string; retryable?: boolean };

export type SendRequest = {
  prompt: string;
  context: string;
  attachments: AssistantAttachment[];
  /** Historique court (dernier échange), pour un vrai backend. */
  history: AssistantMessage[];
  signal: AbortSignal;
};

export interface AssistantTransport {
  send(req: SendRequest): AsyncIterable<StreamChunk>;
}

/* ─── Mock transport (actif par défaut) ───────────────────────────────── */

const MOCK_CHUNK_SIZE = 3;
const MOCK_TICK_MS = 18;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class MockTransport implements AssistantTransport {
  async *send(req: SendRequest): AsyncIterable<StreamChunk> {
    // Petit délai « réflexion » pour l'UX (identique à l'ancien setInterval).
    await sleep(420, req.signal);

    const fullText = generateReply(req.prompt, req.context, req.attachments);
    let i = 0;
    while (i < fullText.length) {
      if (req.signal.aborted) return;
      const delta = fullText.slice(i, i + MOCK_CHUNK_SIZE);
      i += MOCK_CHUNK_SIZE;
      yield { type: "text-delta", delta };
      await sleep(MOCK_TICK_MS, req.signal);
    }

    const approxTokensOut = Math.max(1, Math.round(fullText.length / 4));
    const approxTokensIn = Math.max(1, Math.round(req.prompt.length / 4));
    yield {
      type: "done",
      usage: {
        tokensIn: approxTokensIn,
        tokensOut: approxTokensOut,
        cents: Math.round(((approxTokensIn + approxTokensOut) / 1000) * 0.3 * 100) / 100,
      },
    };
  }
}

/* ─── HTTP SSE transport (prêt à brancher) ────────────────────────────── */

export type HttpSSEOptions = {
  endpoint: string;
  /** En-têtes additionnels (Authorization, X-Team-Id, etc.). */
  headers?: Record<string, string>;
  /** Timeout de connexion avant abandon (ms). Défaut : 30 000. */
  connectTimeoutMs?: number;
};

export class HttpSSETransport implements AssistantTransport {
  constructor(private options: HttpSSEOptions) {}

  async *send(req: SendRequest): AsyncIterable<StreamChunk> {
    const { endpoint, headers = {}, connectTimeoutMs = 30_000 } = this.options;
    const controller = new AbortController();
    const onOuterAbort = () => controller.abort();
    req.signal.addEventListener("abort", onOuterAbort, { once: true });
    const connectTimer = window.setTimeout(() => controller.abort(), connectTimeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...headers },
        body: JSON.stringify({
          prompt: req.prompt,
          context: req.context,
          attachments: req.attachments.map((a) => ({ id: a.id, name: a.name, kind: a.kind })),
          history: req.history.slice(-6),
        }),
        signal: controller.signal,
      });
    } catch (err) {
      window.clearTimeout(connectTimer);
      const message = err instanceof Error ? err.message : String(err);
      yield { type: "error", message, retryable: true };
      return;
    }
    window.clearTimeout(connectTimer);

    if (!response.ok) {
      yield { type: "error", message: `HTTP ${response.status}`, retryable: response.status >= 500 };
      return;
    }
    if (!response.body) {
      yield { type: "error", message: "Flux vide", retryable: false };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const chunk = parseSSEEvent(evt);
          if (chunk) yield chunk;
        }
      }
      if (buffer.trim()) {
        const chunk = parseSSEEvent(buffer);
        if (chunk) yield chunk;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      yield { type: "error", message, retryable: true };
    } finally {
      req.signal.removeEventListener("abort", onOuterAbort);
      try {
        reader.releaseLock();
      } catch {
        /* no-op */
      }
    }
  }
}

function parseSSEEvent(raw: string): StreamChunk | null {
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("data:")) data += line.slice(5).trimStart();
  }
  if (!data || data === "[DONE]") return data === "[DONE]" ? { type: "done" } : null;
  try {
    const obj = JSON.parse(data);
    if (typeof obj.delta === "string") return { type: "text-delta", delta: obj.delta };
    if (obj.done) return { type: "done", usage: obj.usage };
    if (obj.error) return { type: "error", message: String(obj.error), retryable: !!obj.retryable };
  } catch {
    /* Ligne non JSON — on l'ignore silencieusement. */
  }
  return null;
}

/* ─── Retry helper (utilisé par l'appelant) ───────────────────────────── */

export type RetryOptions = {
  maxAttempts?: number;
  /** Délai initial avant la première relance (ms). */
  baseDelayMs?: number;
  /** Multiplicateur de backoff exponentiel. */
  factor?: number;
  /** Ajout aléatoire ± pour éviter le thundering herd. */
  jitterMs?: number;
  /** Callback pour informer l'UI qu'une nouvelle tentative a lieu. */
  onRetry?: (attempt: number, delayMs: number, lastError: string) => void;
};

const DEFAULT_RETRY: Required<Omit<RetryOptions, "onRetry">> = {
  maxAttempts: 3,
  baseDelayMs: 400,
  factor: 2,
  jitterMs: 200,
};

/**
 * Exécute `fn` jusqu'à ce qu'il produise un chunk `done` (retourne true)
 * ou épuise ses tentatives (retourne false). Toute erreur non marquée
 * `retryable` stoppe immédiatement. Les erreurs `AbortError` ne sont
 * **jamais** relancées.
 */
export async function withRetry(
  fn: (attempt: number) => Promise<boolean>,
  options: RetryOptions = {},
): Promise<boolean> {
  const cfg = { ...DEFAULT_RETRY, ...options };
  let lastError = "";
  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    const ok = await fn(attempt);
    if (ok) return true;
    lastError = `Tentative ${attempt} échouée`;
    if (attempt < cfg.maxAttempts) {
      const delay =
        cfg.baseDelayMs * Math.pow(cfg.factor, attempt - 1) + Math.random() * cfg.jitterMs;
      options.onRetry?.(attempt, Math.round(delay), lastError);
      await new Promise((r) => window.setTimeout(r, delay));
    }
  }
  return false;
}