//frontend\lib\workflow-engine\graph.ts
import { BLOCK_META_BY_ID, isExecutableBlock, isTriggerBlock, outputPortsOf } from "./catalog";
import { LIMITS } from "./policies";
import type { ValidationIssue, WorkflowDocument } from "./types";

export type GraphIndex = {
  nodeIds: string[];
  byId: Record<string, WorkflowDocument["nodes"][number]>;
  outgoing: Record<string, { port: string; target: string; edgeId: string }[]>;
  incoming: Record<string, { port: string; source: string; edgeId: string }[]>;
  executableNodeIds: string[];
  entryNodeIds: string[];
};

export function indexGraph(doc: WorkflowDocument): GraphIndex {
  const byId: GraphIndex["byId"] = {};
  const outgoing: GraphIndex["outgoing"] = {};
  const incoming: GraphIndex["incoming"] = {};

  for (const node of doc.nodes) {
    byId[node.id] = node;
    outgoing[node.id] = [];
    incoming[node.id] = [];
  }
  for (const edge of doc.edges) {
    outgoing[edge.source]?.push({ port: edge.sourcePort, target: edge.target, edgeId: edge.id });
    incoming[edge.target]?.push({ port: edge.targetPort, source: edge.source, edgeId: edge.id });
  }

  const executableNodeIds = doc.nodes
    .filter((node) => isExecutableBlock(node.blockId) && node.muted !== true)
    .map((node) => node.id);

  const entryNodeIds = executableNodeIds.filter((id) => {
    const node = byId[id];
    if (!node) return false;
    if (isTriggerBlock(node.blockId)) return true;
    return (incoming[id] ?? []).filter((e) => executableNodeIds.includes(e.source)).length === 0;
  });

  return {
    nodeIds: doc.nodes.map((n) => n.id),
    byId,
    outgoing,
    incoming,
    executableNodeIds,
    entryNodeIds,
  };
}

export function validateGraph(doc: WorkflowDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const index = indexGraph(doc);

  if (doc.nodes.length === 0) {
    issues.push({
      code: "GRAPH_EMPTY",
      severity: "error",
      message: "Le workflow ne contient aucun bloc.",
    });
    return issues;
  }
  if (doc.nodes.length > LIMITS.maxNodes) {
    issues.push({
      code: "GRAPH_TOO_LARGE",
      severity: "error",
      message: `Le workflow dépasse ${LIMITS.maxNodes} blocs.`,
    });
  }

  // Identifiants uniques
  const seen = new Set<string>();
  for (const node of doc.nodes) {
    if (seen.has(node.id)) {
      issues.push({
        code: "NODE_DUPLICATE_ID",
        severity: "error",
        message: `Identifiant de bloc dupliqué : ${node.id}.`,
        nodeId: node.id,
      });
    }
    seen.add(node.id);
    if (!BLOCK_META_BY_ID[node.blockId]) {
      issues.push({
        code: "BLOCK_UNKNOWN",
        severity: "error",
        message: `Bloc inconnu : ${node.blockId}.`,
        nodeId: node.id,
      });
    }
  }

  // Arêtes cohérentes
  for (const edge of doc.edges) {
    const source = index.byId[edge.source];
    const target = index.byId[edge.target];
    if (!source || !target) {
      issues.push({
        code: "EDGE_DANGLING",
        severity: "error",
        message: "Une connexion pointe vers un bloc inexistant.",
        edgeId: edge.id,
      });
      continue;
    }
    if (edge.source === edge.target) {
      issues.push({
        code: "EDGE_SELF_LOOP",
        severity: "error",
        message: "Un bloc ne peut pas se connecter à lui-même.",
        edgeId: edge.id,
      });
    }
    const ports = outputPortsOf(source.blockId);
    if (ports.length === 0) {
      issues.push({
        code: "EDGE_FROM_TERMINAL",
        severity: "error",
        message: `Le bloc terminal « ${source.blockId} » ne peut rien enchaîner.`,
        edgeId: edge.id,
        nodeId: source.id,
      });
    } else if (!ports.includes(edge.sourcePort)) {
      issues.push({
        code: "EDGE_UNKNOWN_PORT",
        severity: "error",
        message: `Port de sortie « ${edge.sourcePort} » inconnu pour « ${source.blockId} ».`,
        edgeId: edge.id,
        nodeId: source.id,
      });
    }
    if (!isExecutableBlock(source.blockId) || !isExecutableBlock(target.blockId)) {
      issues.push({
        code: "EDGE_NON_EXECUTABLE",
        severity: "warning",
        message: "Une connexion relie un bloc documentaire : elle sera ignorée à l'exécution.",
        edgeId: edge.id,
      });
    }
  }

  // Déclencheur
  const triggers = doc.nodes.filter((n) => isTriggerBlock(n.blockId) && n.muted !== true);
  if (triggers.length === 0) {
    issues.push({
      code: "TRIGGER_MISSING",
      severity: "error",
      message: "Aucun déclencheur actif : ajoutez un bloc de la catégorie « Déclencheurs ».",
    });
  }
  for (const trigger of triggers) {
    if ((index.incoming[trigger.id] ?? []).length > 0) {
      issues.push({
        code: "TRIGGER_HAS_INPUT",
        severity: "error",
        message: "Un déclencheur ne peut pas recevoir d'entrée.",
        nodeId: trigger.id,
      });
    }
  }

  // Cycles
  for (const cycle of findCycles(index)) {
    issues.push({
      code: "GRAPH_CYCLE",
      severity: "error",
      message: `Cycle détecté : ${cycle.join(" → ")}. Utilisez un bloc de boucle dédié.`,
      nodeId: cycle[0] ?? "",
    });
  }

  // Atteignabilité et terminaison
  const reachable = reachableFrom(index, index.entryNodeIds);
  for (const nodeId of index.executableNodeIds) {
    if (!reachable.has(nodeId)) {
      issues.push({
        code: "NODE_UNREACHABLE",
        severity: "warning",
        message: "Ce bloc n'est atteignable depuis aucun déclencheur.",
        nodeId,
      });
    }
    const node = index.byId[nodeId];
    if (!node) continue;
    const ports = outputPortsOf(node.blockId);
    const used = new Set((index.outgoing[nodeId] ?? []).map((e) => e.port));
    for (const port of ports) {
      if (!used.has(port) && ports.length > 1) {
        issues.push({
          code: "BRANCH_NOT_CONNECTED",
          severity: "warning",
          message: `La branche « ${port} » n'est reliée à aucun bloc.`,
          nodeId,
        });
      }
    }
  }

  return issues;
}

export function findCycles(index: GraphIndex): string[][] {
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  const visit = (nodeId: string) => {
    const current = state.get(nodeId) ?? 0;
    if (current === 1) {
      const start = stack.indexOf(nodeId);
      if (start >= 0) cycles.push([...stack.slice(start), nodeId]);
      return;
    }
    if (current === 2) return;
    state.set(nodeId, 1);
    stack.push(nodeId);
    for (const edge of index.outgoing[nodeId] ?? []) visit(edge.target);
    stack.pop();
    state.set(nodeId, 2);
  };

  for (const nodeId of index.executableNodeIds) visit(nodeId);
  return cycles;
}

export function reachableFrom(index: GraphIndex, roots: string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || seen.has(nodeId)) continue;
    seen.add(nodeId);
    for (const edge of index.outgoing[nodeId] ?? []) queue.push(edge.target);
  }
  return seen;
}

export function topologicalOrder(index: GraphIndex): string[] {
  const indegree = new Map<string, number>();
  for (const nodeId of index.executableNodeIds) {
    indegree.set(
      nodeId,
      (index.incoming[nodeId] ?? []).filter((e) => index.executableNodeIds.includes(e.source))
        .length,
    );
  }
  const queue = index.executableNodeIds.filter((id) => (indegree.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId) break;
    order.push(nodeId);
    for (const edge of index.outgoing[nodeId] ?? []) {
      if (!indegree.has(edge.target)) continue;
      const next = (indegree.get(edge.target) ?? 1) - 1;
      indegree.set(edge.target, next);
      if (next === 0) queue.push(edge.target);
    }
  }
  for (const nodeId of index.executableNodeIds) {
    if (!order.includes(nodeId)) order.push(nodeId);
  }
  return order;
}
