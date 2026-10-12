//frontend\lib\workflow-engine\types.ts
export type WorkflowPort = { id: string; label?: string };

export type WorkflowDocNode = {
  id: string;
  blockId: string;
  category?: string;
  title?: string;
  subtitle?: string;
  config?: Record<string, unknown>;
  muted?: boolean;
  inputs?: WorkflowPort[];
  outputs?: WorkflowPort[];
};

export type WorkflowDocEdge = {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
};

export type WorkflowDocument = {
  nodes: WorkflowDocNode[];
  edges: WorkflowDocEdge[];
  comments?: unknown[];
};

export type CompiledNode = {
  nodeId: string;
  blockId: string;

  config: Record<string, unknown>;

  policy: ResolvedNodePolicy;

  next: Record<string, string[]>;
  terminal: boolean;
};

export type WorkflowPlan = {
  planVersion: number;
  planHash: string;
  createdAt: string;
  entryNodeIds: string[];
  nodes: Record<string, CompiledNode>;
  order: string[];
};

export type RetryPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
};

export type OnErrorStrategy = "fail" | "continue" | "branch";

export type ResolvedNodePolicy = {
  timeoutMs: number;
  retry: RetryPolicy;
  onError: OnErrorStrategy;
  continueOnEmpty: boolean;
  idempotencyKey?: string;
  outputMapping?: Record<string, string>;
};

export type RunMode = "test" | "live";

export type BlockLogger = {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  progress(processed: number, total: number | null, message?: string): void;
};

export type SecretsService = {
  /** Lecture d'un secret par référence — jamais exposé au client ni loggé. */
  read(ref: string): string | undefined;
  has(ref: string): boolean;
};

export type HttpService = {
  request(input: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
  }): Promise<{
    status: number;
    ok: boolean;
    headers: Record<string, string>;
    body: string;
    json: unknown;
    durationMs: number;
  }>;
};

export type ClockService = {
  now(): number;
  isoNow(): string;
};

export type ServiceContainer = {
  http: HttpService;
  secrets: SecretsService;
  clock: ClockService;
  random: () => number;
  mode: RunMode;

  allowExternalEffects: boolean;
};

export type BlockExecutionContext = {
  runId: string;
  nodeExecutionId: string;
  nodeId: string;
  blockId: string;
  attempt: number;
  input: unknown;
  config: Record<string, unknown>;
  variables: Record<string, unknown>;
  item?: { index: number; value: unknown };
  signal: AbortSignal;
  services: ServiceContainer;
  log: BlockLogger;

  resolve: (value: unknown) => unknown;
};

export type BlockResultStatus = "success" | "branch" | "waiting" | "skipped" | "failed";

export type BlockResult = {
  status: BlockResultStatus;
  output?: unknown;
  branch?: string;
  next?: { nodeId: string; input?: unknown }[];
  waitUntil?: string;
  variablePatch?: Record<string, unknown>;
  metrics?: { count?: number; durationMs?: number; costCents?: number };
};

export type RunStatus = "queued" | "running" | "waiting" | "succeeded" | "failed" | "cancelled";

export type RunSummary = {
  nodesTotal: number;
  nodesSucceeded: number;
  nodesFailed: number;
  nodesSkipped: number;
  durationMs: number;
};

export type RunEnvelope = {
  runId: string;
  workflowId: string;
  workflowVersion: number;
  mode: RunMode;
  status: RunStatus;
  startedAt: string;
  endedAt: string | null;
  trigger: { type: string; input: unknown };
  summary: RunSummary;
  error: SerializedError | null;

  resumeAt?: string | null;
};

export type EventLevel = "debug" | "info" | "warn" | "error";

export type EventType =
  | "run.started"
  | "run.completed"
  | "run.failed"
  | "run.cancelled"
  | "run.waiting"
  | "node.queued"
  | "node.started"
  | "node.progress"
  | "node.completed"
  | "node.waiting"
  | "node.skipped"
  | "node.failed"
  | "branch.selected"
  | "retry.scheduled"
  | "rate_limit.waiting"
  | "approval.required"
  | "log"
  | "metric";

export type RunEvent = {
  eventId: string;
  seq: number;
  runId: string;
  traceId: string;
  timestamp: string;
  level: EventLevel;
  type: EventType;
  nodeExecutionId?: string;
  nodeId?: string;
  blockId?: string;
  attempt?: number;
  message: string;
  data?: Record<string, unknown>;
  sensitive: boolean;
};

export type SerializedError = {
  code: string;
  retryable: boolean;
  attempt?: number;
  providerStatus?: number;
  safeMessage: string;
  nextAction?: string;
  nodeId?: string;
  blockId?: string;
};

export type ValidationIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
  nodeId?: string;
  edgeId?: string;
  field?: string;
};

export type ValidationReport = {
  valid: boolean;
  planVersion: number | null;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  estimatedCost: { cents: number; externalCalls: number };
};
