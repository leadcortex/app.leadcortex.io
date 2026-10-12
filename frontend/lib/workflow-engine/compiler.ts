//frontend\lib\workflow-engine\compiler.ts
import { z } from "zod";

import { isExecutableBlock, isTriggerBlock, outputPortsOf } from "./catalog";
import { WorkflowBlockError } from "./errors";
import { indexGraph, topologicalOrder, validateGraph } from "./graph";
import { hashString } from "./idempotency";
import { resolveNodePolicy } from "./policies";
import { getBlockDefinition } from "./registry";
import type {
  CompiledNode,
  ValidationIssue,
  ValidationReport,
  WorkflowDocument,
  WorkflowPlan,
} from "./types";

/**
 * Compilation `WDoc` -> `WorkflowPlan` immuable et versionné.
 * Un run ne lit jamais un canevas en cours d'édition : il lit un plan.
 */

export type CompileResult =
  | { ok: true; plan: WorkflowPlan; report: ValidationReport }
  | { ok: false; plan: null; report: ValidationReport };

export function compileWorkflow(doc: WorkflowDocument, planVersion = 1): CompileResult {
  const issues: ValidationIssue[] = validateGraph(doc);
  const index = indexGraph(doc);
  const nodes: Record<string, CompiledNode> = {};

  for (const nodeId of index.executableNodeIds) {
    const node = index.byId[nodeId];
    if (!node) continue;

    const definition = getBlockDefinition(node.blockId);
    if (!definition) {
      issues.push({
        code: "BLOCK_NOT_IMPLEMENTED",
        severity: "error",
        message: `Aucun handler serveur pour « ${node.blockId} ».`,
        nodeId,
      });
      continue;
    }
    if (definition.kind === "non-executable") continue;

    const parsed = definition.schema.safeParse(node.config ?? {});
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".");
        const entry: ValidationIssue = {
          code: "CONFIG_INVALID",
          severity: "error",
          message: `${node.blockId} — ${issue.message}`,
          nodeId,
        };
        if (field) entry.field = field;
        issues.push(entry);
      }

      continue;
    }

    const next: Record<string, string[]> = {};
    for (const port of outputPortsOf(node.blockId)) {
      next[port] = (index.outgoing[nodeId] ?? [])
        .filter((edge) => edge.port === port && index.executableNodeIds.includes(edge.target))
        .map((edge) => edge.target);
    }

    nodes[nodeId] = {
      nodeId,
      blockId: node.blockId,
      config: parsed.data as Record<string, unknown>,
      policy: resolveNodePolicy((node.config ?? {}) as Record<string, unknown>),
      next,
      terminal: outputPortsOf(node.blockId).length === 0,
    };
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const estimatedCost = estimateCost(Object.values(nodes));

  if (errors.length > 0) {
    return {
      ok: false,
      plan: null,
      report: { valid: false, planVersion: null, errors, warnings, estimatedCost },
    };
  }

  const entryNodeIds = index.entryNodeIds.filter((id) => nodes[id] !== undefined);
  const plan: WorkflowPlan = {
    planVersion,
    planHash: hashString(
      JSON.stringify({
        nodes: Object.values(nodes).map((n) => [n.nodeId, n.blockId, n.config, n.next]),
      }),
    ),
    createdAt: new Date().toISOString(),
    entryNodeIds,
    nodes,
    order: topologicalOrder(index).filter((id) => nodes[id] !== undefined),
  };

  return { ok: true, plan, report: { valid: true, planVersion, errors, warnings, estimatedCost } };
}

function estimateCost(nodes: CompiledNode[]): { cents: number; externalCalls: number } {
  let cents = 0;
  let externalCalls = 0;
  for (const node of nodes) {
    const definition = getBlockDefinition(node.blockId);
    if (!definition) continue;
    cents += definition.estimatedCostCents ?? 0;
    if (definition.externalCall) externalCalls += 1;
  }
  return { cents, externalCalls };
}

/**
 * Migration des configurations ambiguës : un libellé humain là où le backend
 * attend un identifiant de ressource rend le workflow non publiable.
 */
const HUMAN_LABEL_FIELDS = ["listName", "formId", "provider", "account", "pipeline", "owner"];

export function auditAmbiguousConfig(doc: WorkflowDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const node of doc.nodes) {
    if (!isExecutableBlock(node.blockId)) continue;
    const config = (node.config ?? {}) as Record<string, unknown>;
    for (const field of HUMAN_LABEL_FIELDS) {
      const value = config[field];
      if (typeof value !== "string" || value.length === 0) continue;
      const looksLikeId =
        /^[a-z0-9]+_[A-Za-z0-9-]{3,}$/.test(value) || /^[a-z0-9-]{8,}$/.test(value);
      if (!looksLikeId) {
        issues.push({
          code: "CONFIG_AMBIGUOUS",
          severity: "warning",
          message: `« ${value} » ressemble à un libellé affiché : remplacez-le par un identifiant de ressource stable.`,
          nodeId: node.id,
          field,
        });
      }
    }
  }
  return issues;
}

export function assertTriggerCompatible(plan: WorkflowPlan, triggerType: string): void {
  const entries = plan.entryNodeIds
    .map((id) => plan.nodes[id])
    .filter((node): node is CompiledNode => node !== undefined);
  const hasMatching = entries.some(
    (node) =>
      !isTriggerBlock(node.blockId) || node.blockId === triggerType || triggerType === "manual",
  );
  if (!hasMatching) {
    throw new WorkflowBlockError(
      "GRAPH_INVALID",
      "Aucun déclencheur ne correspond à cette exécution.",
      {
        retryable: false,
      },
    );
  }
}

export const planVersionSchema = z.number().int().min(1);
