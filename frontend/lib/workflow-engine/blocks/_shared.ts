//frontend\lib\workflow-engine\blocks\_shared.ts
import { z } from "zod";

import { WorkflowBlockError } from "../errors";
import { advancedOptionsSchema } from "../schemas";
import type { BlockExecutionContext, BlockResult } from "../types";
import type { BlockDefinition, BlockRuntimeKind } from "../registry";

export const baseConfig = z.object({ _advanced: advancedOptionsSchema }).passthrough();

export function defineBlock(input: {
  blockId: string;
  kind: BlockRuntimeKind;
  schema?: z.ZodTypeAny;
  execute: (ctx: BlockExecutionContext) => Promise<BlockResult>;
  estimatedCostCents?: number;
  externalCall?: boolean;
  durable?: boolean;
}): BlockDefinition {
  const definition: BlockDefinition = {
    blockId: input.blockId,
    kind: input.kind,
    schema: input.schema ?? baseConfig,
    execute: input.execute,
  };
  if (input.estimatedCostCents !== undefined)
    definition.estimatedCostCents = input.estimatedCostCents;
  if (input.externalCall !== undefined) definition.externalCall = input.externalCall;
  if (input.durable !== undefined) definition.durable = input.durable;
  return definition;
}

export function ok(output: unknown, extra: Partial<BlockResult> = {}): BlockResult {
  return { status: "success", output, ...extra };
}

export function branch(branchId: string, output: unknown = null): BlockResult {
  return { status: "branch", branch: branchId, output };
}

export function skipped(reason: string): BlockResult {
  return { status: "skipped", output: { reason } };
}

export function waiting(waitUntil: string, output: unknown = null): BlockResult {
  return { status: "waiting", waitUntil, output };
}

export function cfgString(ctx: BlockExecutionContext, key: string, fallback = ""): string {
  const value = ctx.resolve(ctx.config[key]);
  if (value === undefined || value === null) return fallback;
  return typeof value === "string" ? value : String(value);
}

export function cfgNumber(ctx: BlockExecutionContext, key: string, fallback: number): number {
  const value = Number(ctx.resolve(ctx.config[key]));
  return Number.isFinite(value) ? value : fallback;
}

export function cfgBool(ctx: BlockExecutionContext, key: string, fallback = false): boolean {
  const value = ctx.resolve(ctx.config[key]);
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "oui", "yes"].includes(String(value).toLowerCase());
}

export function cfgList(ctx: BlockExecutionContext, key: string): string[] {
  const value = ctx.resolve(ctx.config[key]);
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

export function asCollection(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === "object") {
    const items = (value as Record<string, unknown>)["items"];
    if (Array.isArray(items)) return items;
    const results = (value as Record<string, unknown>)["results"];
    if (Array.isArray(results)) return results;
  }
  return [value];
}

export function assertNotCancelled(ctx: BlockExecutionContext): void {
  if (ctx.signal.aborted) {
    throw new WorkflowBlockError("CANCELLED", "Exécution annulée.", { retryable: false });
  }
}

export function externalEffect(
  ctx: BlockExecutionContext,
  descriptor: { provider: string; action: string; payload?: Record<string, unknown> },
): BlockResult {
  if (!ctx.services.allowExternalEffects) {
    ctx.log.warn(`Effet externe simulé : ${descriptor.provider}.${descriptor.action}`, {
      provider: descriptor.provider,
      action: descriptor.action,
    });
    return ok({
      simulated: true,
      provider: descriptor.provider,
      action: descriptor.action,
      payload: descriptor.payload ?? {},
      note: "Aucune connexion réelle configurée : sortie mockée (mode test).",
    });
  }
  throw new WorkflowBlockError(
    "BLOCK_NOT_IMPLEMENTED",
    `Le connecteur « ${descriptor.provider} » n'est pas encore branché.`,
    {
      retryable: false,
      nextAction: "Configurez la connexion du fournisseur puis relancez en mode live.",
      details: { action: descriptor.action },
    },
  );
}

export function stableHashNumber(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash / 0xffffffff;
}
