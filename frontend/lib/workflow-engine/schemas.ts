//frontend\lib\workflow-engine\schemas.ts
import { z } from "zod";

import type { WorkflowDocument } from "./types";

export const retryPolicySchema = z
  .object({
    maxAttempts: z.number().int().min(1).max(10).default(3),
    initialDelayMs: z.number().int().min(0).max(60_000).default(500),
    maxDelayMs: z.number().int().min(0).max(300_000).default(30_000),
    factor: z.number().min(1).max(10).default(2),
    jitter: z.boolean().default(true),
  })
  .partial()
  .optional();

export const advancedOptionsSchema = z
  .object({
    timeoutMs: z.number().int().min(1000).max(120_000).optional(),
    retryPolicy: retryPolicySchema,
    onError: z.enum(["fail", "continue", "branch"]).optional(),
    idempotencyKey: z.string().min(1).max(200).optional(),
    continueOnEmpty: z.boolean().optional(),
    outputMapping: z.record(z.string()).optional(),
  })
  .optional();

/** Référence stable vers une ressource externe (jamais un libellé humain). */
export const resourceRef = (prefix: string) =>
  z
    .string()
    .min(1)
    .max(128)
    .describe(`Identifiant stable de ressource (${prefix}_…), pas un libellé affiché`);

export const connectionIdSchema = resourceRef("conn");
export const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Fuseau horaire IANA invalide");

export const expressionSchema = z.string().min(1).max(2000);
export const boundedLimit = z.number().int().min(1).max(1000);

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

export const portSchema = z.object({ id: z.string().min(1), label: z.string().optional() });

export const docNodeSchema = z.object({
  id: z.string().min(1),
  blockId: z.string().min(1),
  category: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  muted: z.boolean().optional(),
  inputs: z.array(portSchema).optional(),
  outputs: z.array(portSchema).optional(),
});

export const docEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  sourcePort: z.string().min(1),
  target: z.string().min(1),
  targetPort: z.string().min(1),
});

export const workflowDocumentSchema = z.object({
  nodes: z.array(docNodeSchema).max(500),
  edges: z.array(docEdgeSchema).max(2000),
  comments: z.array(z.unknown()).optional(),
});

export function parseWorkflowDocument(input: unknown): WorkflowDocument {
  return workflowDocumentSchema.parse(input) as WorkflowDocument;
}

/* ------------------------------------------------------------------ */
/* Requêtes HTTP                                                       */
/* ------------------------------------------------------------------ */

export const runRequestSchema = z.object({
  version: z.number().int().min(1).optional(),
  mode: z.enum(["test", "live"]).default("test"),
  input: z.unknown().optional(),
  dryRun: z.boolean().default(false),
  selectedNodeIds: z.array(z.string().min(1)).max(500).optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
  document: workflowDocumentSchema.optional(),
  trigger: z.object({ type: z.string().min(1), input: z.unknown().optional() }).optional(),
});

export const validateRequestSchema = z.object({
  document: workflowDocumentSchema,
  version: z.number().int().min(1).optional(),
});

export const publishRequestSchema = z.object({
  document: workflowDocumentSchema,
  name: z.string().min(1).max(200).optional(),
});

export type RunRequest = z.infer<typeof runRequestSchema>;
export type ValidateRequest = z.infer<typeof validateRequestSchema>;
