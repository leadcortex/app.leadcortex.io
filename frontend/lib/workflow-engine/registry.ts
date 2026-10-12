//frontend\lib\workflow-engine\registry.ts
import type { z } from "zod";

import { BLOCK_META_BY_ID, isExecutableBlock, outputPortsOf } from "./catalog";
import { WorkflowBlockError } from "./errors";
import type { BlockExecutionContext, BlockResult } from "./types";

export type BlockRuntimeKind = "local" | "provider" | "non-executable";

export type BlockHandler = (ctx: BlockExecutionContext) => Promise<BlockResult>;

export type BlockDefinition = {
  blockId: string;
  kind: BlockRuntimeKind;

  schema: z.ZodTypeAny;
  execute: BlockHandler;

  estimatedCostCents?: number;

  externalCall?: boolean;

  durable?: boolean;
};

const registry = new Map<string, BlockDefinition>();

export function registerBlock(definition: BlockDefinition): BlockDefinition {
  if (!BLOCK_META_BY_ID[definition.blockId]) {
    throw new Error(`Bloc inconnu dans le catalogue: ${definition.blockId}`);
  }
  registry.set(definition.blockId, definition);
  return definition;
}

export function registerBlocks(definitions: BlockDefinition[]): void {
  for (const definition of definitions) registerBlock(definition);
}

export function getBlockDefinition(blockId: string): BlockDefinition | undefined {
  return registry.get(blockId);
}

export function requireBlockDefinition(blockId: string): BlockDefinition {
  const definition = registry.get(blockId);
  if (!definition) {
    throw new WorkflowBlockError("BLOCK_NOT_FOUND", `Bloc « ${blockId} » introuvable.`, {
      retryable: false,
      nextAction: "Retirez ce bloc du canevas ou mettez à jour le moteur.",
    });
  }
  if (definition.kind === "non-executable" || !isExecutableBlock(blockId)) {
    throw new WorkflowBlockError(
      "BLOCK_NOT_EXECUTABLE",
      `Le bloc « ${blockId} » est documentaire et ne s'exécute pas.`,
      { retryable: false },
    );
  }
  return definition;
}

export function listRegisteredBlocks(): BlockDefinition[] {
  return [...registry.values()];
}

export function registrySummary(): {
  total: number;
  local: number;
  provider: number;
  nonExecutable: number;
  missing: string[];
} {
  const all = [...registry.values()];
  const missing = Object.keys(BLOCK_META_BY_ID).filter((id) => !registry.has(id));
  return {
    total: all.length,
    local: all.filter((b) => b.kind === "local").length,
    provider: all.filter((b) => b.kind === "provider").length,
    nonExecutable: all.filter((b) => b.kind === "non-executable").length,
    missing,
  };
}

export { outputPortsOf };
