//frontend\lib\workflow-engine\errors.ts
import type { SerializedError } from "./types";

/**
 * Erreurs machine du moteur : classification `retryable` / fatale,
 * message sûr pour l'utilisateur et détails techniques jamais exposés bruts.
 */

export type WorkflowErrorCode =
  | "CONFIG_INVALID"
  | "GRAPH_INVALID"
  | "EXPRESSION_INVALID"
  | "BLOCK_NOT_FOUND"
  | "BLOCK_NOT_IMPLEMENTED"
  | "BLOCK_NOT_EXECUTABLE"
  | "TIMEOUT"
  | "CANCELLED"
  | "PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "SSRF_BLOCKED"
  | "PAYLOAD_TOO_LARGE"
  | "LIMIT_EXCEEDED"
  | "EXTERNAL_EFFECT_BLOCKED"
  | "SECRET_MISSING"
  | "STOPPED"
  | "ENDED_WITH_ERROR"
  | "INTERNAL";

const RETRYABLE_BY_DEFAULT: ReadonlySet<WorkflowErrorCode> = new Set<WorkflowErrorCode>([
  "TIMEOUT",
  "PROVIDER_ERROR",
  "RATE_LIMITED",
]);

export class WorkflowBlockError extends Error {
  readonly code: WorkflowErrorCode;
  readonly retryable: boolean;
  readonly providerStatus: number | undefined;
  readonly safeMessage: string;
  readonly nextAction: string | undefined;
  /** Détails techniques : restent côté serveur, jamais renvoyés au client. */
  readonly details: Record<string, unknown>;

  constructor(
    code: WorkflowErrorCode,
    safeMessage: string,
    options: {
      retryable?: boolean;
      providerStatus?: number;
      nextAction?: string;
      details?: Record<string, unknown>;
      cause?: unknown;
    } = {},
  ) {
    super(safeMessage);
    this.name = "WorkflowBlockError";
    this.code = code;
    this.retryable = options.retryable ?? RETRYABLE_BY_DEFAULT.has(code);
    this.providerStatus = options.providerStatus;
    this.safeMessage = safeMessage;
    this.nextAction = options.nextAction;
    this.details = redactDeep(options.details ?? {}) as Record<string, unknown>;
    if (options.cause !== undefined) this.cause = options.cause;
  }

  serialize(extra: { attempt?: number; nodeId?: string; blockId?: string } = {}): SerializedError {
    const out: SerializedError = {
      code: this.code,
      retryable: this.retryable,
      safeMessage: this.safeMessage,
    };
    if (this.providerStatus !== undefined) out.providerStatus = this.providerStatus;
    if (this.nextAction !== undefined) out.nextAction = this.nextAction;
    if (extra.attempt !== undefined) out.attempt = extra.attempt;
    if (extra.nodeId !== undefined) out.nodeId = extra.nodeId;
    if (extra.blockId !== undefined) out.blockId = extra.blockId;
    return out;
  }
}

export function toWorkflowError(error: unknown): WorkflowBlockError {
  if (error instanceof WorkflowBlockError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new WorkflowBlockError("CANCELLED", "Exécution interrompue.", { retryable: false });
  }
  return new WorkflowBlockError("INTERNAL", "Erreur interne pendant l'exécution du bloc.", {
    retryable: false,
    details: { message: error instanceof Error ? error.message : String(error) },
    cause: error,
  });
}

const SENSITIVE_KEY =
  /(secret|token|password|passwd|apikey|api_key|authorization|bearer|credential|private[_-]?key|signature|cookie)/i;

export function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactDeep(v, depth + 1));
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).slice(0, 100)) {
      out[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redactDeep(source[key], depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 2000)
    return `${value.slice(0, 2000)}…[truncated]`;
  return value;
}
