//frontend\lib\workflow-engine\blocks\index.ts
import { BLOCK_META } from "../catalog";
import { registerBlocks, listRegisteredBlocks, registrySummary } from "../registry";
import type { BlockDefinition } from "../registry";
import { defineBlock, externalEffect, ok } from "./_shared";
import { logicBlocks } from "./logic";
import { triggerBlocks } from "./triggers";

/**
 * Point d'entrée du registre. Les blocs implémentés localement sont branchés
 * en premier ; tous les autres reçoivent un handler générique qui, faute de
 * connecteur réel, produit une sortie simulée en mode test et une erreur
 * explicite en mode live. Aucun bloc ne dépend d'un service managé.
 */

let registered = false;

function genericBlocks(): BlockDefinition[] {
  const implemented = new Set([...triggerBlocks, ...logicBlocks].map((b) => b.blockId));
  return BLOCK_META.filter((meta) => !implemented.has(meta.id)).map((meta) => {
    if (meta.executable === false) {
      return defineBlock({
        blockId: meta.id,
        kind: "non-executable",
        execute: async () => ok({ documentation: true }),
      });
    }
    return defineBlock({
      blockId: meta.id,
      kind: "provider",
      externalCall: true,
      estimatedCostCents: 1,
      execute: async (ctx) =>
        externalEffect(ctx, {
          provider: meta.category,
          action: meta.id,
          payload: { config: ctx.config, input: ctx.input },
        }),
    });
  });
}

export function ensureBlocksRegistered(): void {
  if (registered) return;
  registered = true;
  registerBlocks(triggerBlocks);
  registerBlocks(logicBlocks);
  registerBlocks(genericBlocks());
}

ensureBlocksRegistered();

export { listRegisteredBlocks, registrySummary };
