//frontend\lib\workflow\terminal-commands.ts
import { BLOCKS, type BlockDef, type ConfigField } from "@/data/workflow-blocks-catalog";

const blockById = (id: string): BlockDef | undefined => BLOCKS.find((b) => b.id === id);
import type { WDoc, WNode, Viewport } from "./types";
import { compileWorkflow } from "@/lib/workflow-engine/compiler";
import { validateGraph } from "@/lib/workflow-engine/graph";
import { registrySummary } from "@/lib/workflow-engine/blocks";
import { uid, makeNode } from "./geometry";
import { BOOK_SECTIONS, BOOK_CONVENTIONS, BOOK_RECIPES } from "./command-book";

export type LineKind = "input" | "info" | "muted" | "success" | "warning" | "error";

export type TerminalLine = { id: string; kind: LineKind; text: string };

export type TerminalApi = {
  doc: WDoc;

  getDoc: () => WDoc;
  selection: string[];
  viewport: Viewport;
  addBlock: (blockId: string, x?: number, y?: number) => string;
  addComment: (x?: number, y?: number, targetId?: string | null) => void;
  updateNode: (id: string, patch: Partial<WNode>) => void;
  setDoc: (fn: (d: WDoc) => WDoc, commit?: boolean) => void;
  connect: (e: { source: string; sourcePort: string; target: string; targetPort: string }) => void;
  disconnectNode: (id: string) => void;
  setSelection: (ids: string[]) => void;
  focusOn: (id: string) => void;
  fitView: () => void;
  autoLayout: () => void;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  undo: () => void;
  redo: () => void;
  centerWorld: () => { x: number; y: number };
  clear: () => void;
};

export type CommandSpec = {
  name: string;
  aliases?: string[];
  usage: string;
  summary: string;
  details?: string[];
  run: (args: ParsedArgs, api: TerminalApi) => string[] | TerminalLine[] | void;
};

export type ParsedArgs = {
  positional: string[];

  flags: Record<string, string>;

  pairs: Record<string, string>;

  raw: string;
};

export function tokenize(input: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) out.push(current);
  return out;
}

function parseArgs(tokens: string[], raw: string): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const pairs: Record<string, string> = {};

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (t.startsWith("--")) {
      const body = t.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
      } else {
        const next = tokens[i + 1];
        if (next && !next.startsWith("--")) {
          flags[body] = next;
          i++;
        } else {
          flags[body] = "true";
        }
      }
      continue;
    }
    const eq = t.indexOf("=");
    if (eq > 0) {
      pairs[t.slice(0, eq)] = t.slice(eq + 1);
      continue;
    }
    positional.push(t);
  }

  return { positional, flags, pairs, raw };
}

let lineSeq = 0;
export const makeLine = (kind: LineKind, text: string): TerminalLine => ({
  id: `tl_${++lineSeq}`,
  kind,
  text,
});

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/* ------------------------------------------------------------------ */
/* Session de console (état partagé entre commandes)                   */
/* ------------------------------------------------------------------ */

export const session = {
  /** Réorganisation automatique du canevas après chaque création. */
  autoLayout: true,
  /** Dernier bloc créé — cible de `@last` / `@dernier`. */
  lastNodeId: null as string | null,
  /** Historique des commandes réellement exécutées (humain + agent). */
  history: [] as { at: number; source: "user" | "agent"; text: string }[],
};

/**
 * Résout un identifiant de bloc du canevas : id exact, `@last`, index `#n`,
 * suffixe court, ou fragment de titre unique.
 */
function resolveNode(doc: WDoc, ref: string): WNode | null {
  if (!ref) return null;
  let key = ref;
  if (key.startsWith("@")) {
    const alias = norm(key.slice(1));
    if (alias === "last" || alias === "dernier" || alias === "") {
      return doc.nodes.find((n) => n.id === session.lastNodeId) ?? doc.nodes.at(-1) ?? null;
    }
    if (alias === "first" || alias === "premier") return doc.nodes[0] ?? null;
    key = key.slice(1);
  }
  const direct = doc.nodes.find((n) => n.id === key);
  if (direct) return direct;
  if (key.startsWith("#")) {
    const idx = Number(key.slice(1));
    return doc.nodes[idx - 1] ?? null;
  }
  const suffix = doc.nodes.filter((n) => n.id.endsWith(key) || n.id.endsWith(`_${key}`));
  if (suffix.length === 1) return suffix[0]!;
  const byTitle = doc.nodes.filter((n) => norm(n.title).includes(norm(key)));
  if (byTitle.length === 1) return byTitle[0]!;
  return null;
}

/** Une référence désigne-t-elle un bloc EXISTANT plutôt qu'un type du catalogue ? */
function isNodeRef(ref: string) {
  return ref.startsWith("@") || ref.startsWith("#") || ref.startsWith("node_");
}

/** Convertit une valeur textuelle en valeur de configuration typée. */
function coerce(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

function shortId(id: string) {
  return id.replace(/^node_/, "#");
}

function nodeLabel(n: WNode, index: number) {
  return `${String(index + 1).padStart(2, " ")}. ${n.id.padEnd(10)} ${n.blockId.padEnd(22)} ${n.title}`;
}

/** Adapte le `WDoc` du canevas au contrat du moteur d'exécution. */
function toEngineDoc(doc: WDoc) {
  return {
    nodes: doc.nodes.map((n) => ({
      id: n.id,
      blockId: n.blockId,
      category: n.category,
      title: n.title,
      config: n.config,
      muted: n.muted ?? false,
      inputs: n.inputs.map((p) => ({ id: p.id, label: p.label })),
      outputs: n.outputs.map((p) => ({ id: p.id, label: p.label })),
    })),
    edges: doc.edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourcePort: e.sourcePort,
      target: e.target,
      targetPort: e.targetPort,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Commandes                                                           */
/* ------------------------------------------------------------------ */

export const COMMANDS: CommandSpec[] = [
  {
    name: "help",
    aliases: ["?", "aide"],
    usage: "help [commande]",
    summary: "Liste les commandes disponibles ou détaille l'une d'elles.",
    run: (args) => {
      const target = args.positional[0];
      if (target) {
        const cmd = findCommand(target);
        if (!cmd) return [`Commande inconnue : ${target}`];
        return [
          `${cmd.name}${cmd.aliases?.length ? ` (alias : ${cmd.aliases.join(", ")})` : ""}`,
          `  usage   ${cmd.usage}`,
          `  résumé  ${cmd.summary}`,
          ...(cmd.details ?? []).map((d) => `  ${d}`),
        ];
      }
      const width = Math.max(...COMMANDS.map((c) => c.name.length));
      return [
        "Commandes du workflow — `help <commande>` pour le détail.",
        ...COMMANDS.map((c) => `  ${c.name.padEnd(width)}  ${c.summary}`),
        "",
        "Astuce : Tab complète, ↑/↓ rejoue l'historique, Ctrl+L efface.",
      ];
    },
  },
  {
    name: "clear",
    aliases: ["cls"],
    usage: "clear",
    summary: "Efface l'historique affiché dans la console.",
    run: (_args, api) => {
      api.clear();
    },
  },
  {
    name: "ls",
    aliases: ["list"],
    usage: "ls [nodes|edges|notes] [--filter texte]",
    summary: "Liste les blocs, connexions ou notes du canevas.",
    run: (args, api) => {
      const what = (args.positional[0] ?? "nodes").toLowerCase();
      const filter = args.flags["filter"] ? norm(args.flags["filter"]) : null;
      const { doc } = api;
      if (what.startsWith("e")) {
        if (!doc.edges.length) return ["Aucune connexion."];
        return doc.edges.map(
          (e, i) =>
            `${String(i + 1).padStart(2, " ")}. ${e.id}  ${e.source}:${e.sourcePort} ─▶ ${e.target}:${e.targetPort}`,
        );
      }
      if (what.startsWith("n") && what !== "nodes") {
        if (!doc.comments.length) return ["Aucune note."];
        return doc.comments.map((c, i) => `${i + 1}. ${c.id}  ${c.text.split("\n")[0]}`);
      }
      const nodes = filter
        ? doc.nodes.filter(
            (n) => norm(n.title).includes(filter) || norm(n.blockId).includes(filter),
          )
        : doc.nodes;
      if (!nodes.length) return ["Aucun bloc sur le canevas."];
      return [
        `${nodes.length} bloc(s) :`,
        ...nodes.map((n, i) => nodeLabel(n, i) + (n.muted ? "  (désactivé)" : "")),
      ];
    },
  },
  {
    name: "find",
    aliases: ["search", "catalog"],
    usage: "find <texte> [--cat catégorie] [--limit n]",
    summary: "Recherche un type de bloc dans le catalogue (138 blocs).",
    run: (args) => {
      const q = norm(args.positional.join(" "));
      const cat = args.flags["cat"] ? norm(args.flags["cat"]) : null;
      const limit = Number(args.flags["limit"] ?? 15);
      const res = BLOCKS.filter((b) => {
        if (cat && !norm(b.category).includes(cat)) return false;
        if (!q) return true;
        return (
          norm(b.id).includes(q) ||
          norm(b.title).includes(q) ||
          norm(b.subtitle).includes(q) ||
          (b.tags ?? []).some((t) => norm(t).includes(q))
        );
      });
      if (!res.length) return [`Aucun bloc pour « ${args.positional.join(" ")} ».`];
      return [
        `${res.length} résultat(s)${res.length > limit ? ` — ${limit} affichés` : ""} :`,
        ...res
          .slice(0, limit)
          .map((b) => `  ${b.id.padEnd(24)} ${b.category.padEnd(14)} ${b.title}`),
      ];
    },
  },
  {
    name: "add",
    aliases: ["new"],
    usage: "add <blockId> [clé=valeur ...] [--x n] [--y n] [--title t] [--after <bloc>]",
    summary: "Crée un bloc, le configure et le connecte en une seule ligne.",
    details: [
      "exemple  add trig-webhook --x 200 --y 120",
      "exemple  add log-condition operator=equals --after node_1",
      "--after connecte automatiquement la sortie du bloc cité vers le nouveau bloc.",
    ],
    run: (args, api) => {
      const blockId = args.positional[0];
      if (!blockId) return ["Usage : add <blockId> [clé=valeur ...]"];
      const def = blockById(blockId);
      if (!def) {
        const near = BLOCKS.filter((b) => norm(b.id).includes(norm(blockId)))
          .slice(0, 5)
          .map((b) => b.id);
        return [
          `Bloc inconnu : ${blockId}`,
          ...(near.length ? [`Suggestions : ${near.join(", ")}`] : ["Utilise `find <texte>`."]),
        ];
      }
      const center = api.centerWorld();
      const x = args.flags["x"] !== undefined ? Number(args.flags["x"]) : center.x - 134;
      const y = args.flags["y"] !== undefined ? Number(args.flags["y"]) : center.y - 40;
      const id = api.addBlock(def.id, x, y);

      const patch: Partial<WNode> = {};
      if (args.flags["title"]) patch.title = args.flags["title"];
      const keys = Object.keys(args.pairs);
      const unknown: string[] = [];
      if (keys.length) {
        const config: Record<string, string | number | boolean> = {};
        for (const f of def.configFields)
          if (f.defaultValue !== undefined) config[f.key] = f.defaultValue;
        for (const k of keys) {
          if (!def.configFields.some((f) => f.key === k)) unknown.push(k);
          config[k] = coerce(args.pairs[k]!);
        }
        patch.config = config;
      }
      if (Object.keys(patch).length) api.updateNode(id, patch);

      const after = args.flags["after"];
      const out: string[] = [`✔ ${def.title} créé — ${id} @ (${Math.round(x)}, ${Math.round(y)})`];
      if (after) {
        const src = resolveNode(api.doc, after);
        if (!src) out.push(`⚠ --after : bloc « ${after} » introuvable, connexion ignorée.`);
        else if (!src.outputs.length) out.push(`⚠ ${src.title} n'a pas de sortie.`);
        else {
          api.connect({
            source: src.id,
            sourcePort: src.outputs[0]!.id,
            target: id,
            targetPort: "in",
          });
          out.push(`↳ connecté depuis ${src.id}:${src.outputs[0]!.id}`);
        }
      }
      if (unknown.length) out.push(`⚠ clés hors schéma conservées : ${unknown.join(", ")}`);
      return out;
    },
  },
  {
    name: "set",
    aliases: ["config"],
    usage: "set <bloc> <clé=valeur ...> [--title t] [--mute true|false]",
    summary: "Modifie la configuration d'un bloc existant.",
    run: (args, api) => {
      const ref = args.positional[0];
      const node = ref ? resolveNode(api.doc, ref) : null;
      if (!node) return [`Bloc introuvable : ${ref ?? "(aucun)"}`];
      const patch: Partial<WNode> = {};
      const keys = Object.keys(args.pairs);
      if (keys.length) {
        const config = { ...node.config };
        for (const k of keys) config[k] = coerce(args.pairs[k]!);
        patch.config = config;
      }
      if (args.flags["title"]) patch.title = args.flags["title"];
      if (args.flags["mute"]) patch.muted = args.flags["mute"] !== "false";
      if (args.flags["collapse"]) patch.collapsed = args.flags["collapse"] !== "false";
      if (!Object.keys(patch).length) return ["Rien à modifier (aucune paire clé=valeur)."];
      api.updateNode(node.id, patch);
      return [`✔ ${node.id} mis à jour : ${[...keys, ...Object.keys(args.flags)].join(", ")}`];
    },
  },
  {
    name: "cat",
    aliases: ["inspect", "show"],
    usage: "cat <bloc>",
    summary: "Affiche le détail d'un bloc : ports, configuration, voisins.",
    run: (args, api) => {
      const ref = args.positional[0];
      const node = ref ? resolveNode(api.doc, ref) : null;
      if (!node) return [`Bloc introuvable : ${ref ?? "(aucun)"}`];
      const def = blockById(node.blockId);
      const incoming = api.doc.edges.filter((e) => e.target === node.id);
      const outgoing = api.doc.edges.filter((e) => e.source === node.id);
      const lines = [
        `${node.title} — ${node.blockId}`,
        `  id        ${node.id}`,
        `  catégorie ${node.category}`,
        `  position  (${node.x}, ${node.y})`,
        `  entrées   ${node.inputs.map((p) => p.id).join(", ") || "—"}`,
        `  sorties   ${node.outputs.map((p) => p.id).join(", ") || "—"}`,
        "  config",
      ];
      const fields: ConfigField[] = def?.configFields ?? [];
      if (!fields.length) lines.push("    (aucun champ)");
      for (const f of fields) {
        const v = node.config[f.key];
        lines.push(`    ${f.key.padEnd(20)} = ${v === undefined ? "∅" : String(v)}   [${f.type}]`);
      }
      lines.push(
        `  amont     ${incoming.map((e) => `${e.source}:${e.sourcePort}`).join(", ") || "—"}`,
        `  aval      ${outgoing.map((e) => `${e.target}:${e.targetPort}`).join(", ") || "—"}`,
      );
      return lines;
    },
  },
  {
    name: "link",
    aliases: ["connect"],
    usage: "link <source[:port]> <cible[:port]>",
    summary: "Connecte deux blocs.",
    run: (args, api) => {
      const [a, b] = args.positional;
      if (!a || !b) return ["Usage : link <source[:port]> <cible[:port]>"];
      const [aRef, aPort] = a.split(":");
      const [bRef, bPort] = b.split(":");
      const src = resolveNode(api.doc, aRef!);
      const dst = resolveNode(api.doc, bRef!);
      if (!src) return [`Source introuvable : ${aRef}`];
      if (!dst) return [`Cible introuvable : ${bRef}`];
      const sourcePort = aPort ?? src.outputs[0]?.id;
      const targetPort = bPort ?? dst.inputs[0]?.id;
      if (!sourcePort) return [`${src.title} n'a aucune sortie.`];
      if (!targetPort) return [`${dst.title} n'a aucune entrée.`];
      api.connect({ source: src.id, sourcePort, target: dst.id, targetPort });
      return [`✔ ${src.id}:${sourcePort} ─▶ ${dst.id}:${targetPort}`];
    },
  },
  {
    name: "unlink",
    aliases: ["disconnect"],
    usage: "unlink <bloc|edgeId>",
    summary: "Supprime les connexions d'un bloc, ou une connexion précise.",
    run: (args, api) => {
      const ref = args.positional[0];
      if (!ref) return ["Usage : unlink <bloc|edgeId>"];
      const edge = api.doc.edges.find((e) => e.id === ref);
      if (edge) {
        api.setDoc((d) => ({ ...d, edges: d.edges.filter((e) => e.id !== edge.id) }));
        return [`✔ connexion ${edge.id} supprimée.`];
      }
      const node = resolveNode(api.doc, ref);
      if (!node) return [`Introuvable : ${ref}`];
      const count = api.doc.edges.filter(
        (e) => e.source === node.id || e.target === node.id,
      ).length;
      api.disconnectNode(node.id);
      return [`✔ ${count} connexion(s) retirée(s) de ${node.id}.`];
    },
  },
  {
    name: "rm",
    aliases: ["del", "delete"],
    usage: "rm <bloc ...> | rm --selected | rm --all",
    summary: "Supprime des blocs (et leurs connexions).",
    run: (args, api) => {
      if (args.flags["all"] === "true") {
        const n = api.doc.nodes.length;
        api.setDoc(() => ({ nodes: [], edges: [], comments: [] }));
        api.setSelection([]);
        return [`✔ canevas vidé (${n} bloc(s)).`];
      }
      const refs = args.flags["selected"] === "true" ? api.selection : args.positional;
      if (!refs.length) return ["Usage : rm <bloc ...> | rm --selected"];
      const ids = new Set<string>();
      const missing: string[] = [];
      for (const r of refs) {
        const n = resolveNode(api.doc, r);
        if (n) ids.add(n.id);
        else if (api.doc.comments.some((c) => c.id === r)) ids.add(r);
        else missing.push(r);
      }
      if (ids.size)
        api.setDoc((d) => ({
          nodes: d.nodes.filter((n) => !ids.has(n.id)),
          comments: d.comments.filter((c) => !ids.has(c.id)),
          edges: d.edges.filter((e) => !ids.has(e.id) && !ids.has(e.source) && !ids.has(e.target)),
        }));
      api.setSelection([]);
      return [
        `✔ ${ids.size} élément(s) supprimé(s).`,
        ...(missing.length ? [`⚠ introuvables : ${missing.join(", ")}`] : []),
      ];
    },
  },
  {
    name: "mv",
    aliases: ["move"],
    usage: "mv <bloc> <x> <y>",
    summary: "Déplace un bloc à une position monde précise.",
    run: (args, api) => {
      const [ref, xs, ys] = args.positional;
      const node = ref ? resolveNode(api.doc, ref) : null;
      if (!node) return [`Bloc introuvable : ${ref ?? "(aucun)"}`];
      const x = Number(xs);
      const y = Number(ys);
      if (Number.isNaN(x) || Number.isNaN(y)) return ["Coordonnées invalides."];
      api.updateNode(node.id, { x: Math.round(x), y: Math.round(y) });
      return [`✔ ${node.id} déplacé en (${Math.round(x)}, ${Math.round(y)}).`];
    },
  },
  {
    name: "select",
    aliases: ["sel"],
    usage: "select <bloc ...> | select all | select none",
    summary: "Modifie la sélection courante.",
    run: (args, api) => {
      const first = args.positional[0];
      if (!first || first === "none") {
        api.setSelection([]);
        return ["Sélection vidée."];
      }
      if (first === "all") {
        const ids = [...api.doc.nodes.map((n) => n.id), ...api.doc.comments.map((c) => c.id)];
        api.setSelection(ids);
        return [`${ids.length} élément(s) sélectionné(s).`];
      }
      const ids = args.positional
        .map((r) => resolveNode(api.doc, r)?.id)
        .filter((v): v is string => Boolean(v));
      api.setSelection(ids);
      return [`${ids.length} élément(s) sélectionné(s).`];
    },
  },
  {
    name: "focus",
    aliases: ["goto"],
    usage: "focus <bloc>",
    summary: "Centre la vue sur un bloc et le sélectionne.",
    run: (args, api) => {
      const ref = args.positional[0];
      const node = ref ? resolveNode(api.doc, ref) : null;
      if (!node) return [`Bloc introuvable : ${ref ?? "(aucun)"}`];
      api.focusOn(node.id);
      return [`Vue centrée sur ${node.id}.`];
    },
  },
  {
    name: "fit",
    usage: "fit",
    summary: "Ajuste la vue à l'ensemble du workflow.",
    run: (_a, api) => {
      api.fitView();
      return ["Vue ajustée."];
    },
  },
  {
    name: "zoom",
    usage: "zoom <0.15-2.5>",
    summary: "Applique un niveau de zoom précis.",
    run: (args, api) => {
      const z = Number(args.positional[0]);
      if (Number.isNaN(z)) return [`Zoom actuel : ${api.viewport.zoom.toFixed(2)}×`];
      const next = Math.min(2.5, Math.max(0.15, z));
      api.setViewport((v) => ({ ...v, zoom: next }));
      return [`Zoom : ${next.toFixed(2)}×`];
    },
  },
  {
    name: "layout",
    aliases: ["arrange"],
    usage: "layout [--auto on|off]",
    summary: "Réorganise les blocs en arbre. `--auto off` suspend la réorganisation automatique.",
    details: [
      "Par défaut, toute création de bloc ou de connexion déclenche seule un `layout`.",
      "`layout --auto off` la suspend, `--auto on` la rétablit, `--no-layout` l'ignore une fois.",
    ],
    run: (args, api) => {
      const auto = args.flags["auto"];
      if (auto !== undefined) {
        session.autoLayout = auto !== "off" && auto !== "false";
        return [
          `Réorganisation automatique : ${session.autoLayout ? "activée" : "suspendue"}.`,
          ...(session.autoLayout ? [] : ["Pense à lancer `layout` manuellement."]),
        ];
      }
      api.autoLayout();
      return ["Réorganisation lancée."];
    },
  },

  {
    name: "undo",
    usage: "undo",
    summary: "Annule la dernière modification.",
    run: (_a, api) => {
      api.undo();
      return ["Annulé."];
    },
  },
  {
    name: "redo",
    usage: "redo",
    summary: "Rétablit la modification annulée.",
    run: (_a, api) => {
      api.redo();
      return ["Rétabli."];
    },
  },
  {
    name: "validate",
    aliases: ["lint", "doctor"],
    usage: "validate",
    summary: "Valide le graphe côté moteur (déclencheur, cycles, ports…).",
    run: (_a, api) => {
      const issues = validateGraph(toEngineDoc(api.doc));
      if (!issues.length) return ["✔ Aucun problème détecté sur le graphe."];
      const errors = issues.filter((i) => i.severity === "error");
      const warns = issues.filter((i) => i.severity !== "error");
      return [
        `${errors.length} erreur(s), ${warns.length} avertissement(s) :`,
        ...issues.map(
          (i) =>
            `  ${i.severity === "error" ? "✖" : "⚠"} [${i.code}]${i.nodeId ? ` ${i.nodeId}` : ""} ${i.message}`,
        ),
      ];
    },
  },
  {
    name: "compile",
    aliases: ["build", "plan"],
    usage: "compile",
    summary: "Compile le workflow en plan exécutable et affiche le rapport.",
    run: (_a, api) => {
      const result = compileWorkflow(toEngineDoc(api.doc));
      const r = result.report;
      const head = result.ok
        ? [
            `✔ Compilation réussie — plan ${result.plan.planHash.slice(0, 10)} v${result.plan.planVersion}`,
            `  entrées : ${result.plan.entryNodeIds.join(", ") || "—"}`,
            `  ordre   : ${result.plan.order.join(" → ") || "—"}`,
            `  coût estimé : ${r.estimatedCost.cents} c · ${r.estimatedCost.externalCalls} appel(s) externe(s)`,
          ]
        : ["✖ Compilation impossible."];
      return [
        ...head,
        ...r.errors.map((i) => `  ✖ [${i.code}]${i.nodeId ? ` ${i.nodeId}` : ""} ${i.message}`),
        ...r.warnings.map((i) => `  ⚠ [${i.code}]${i.nodeId ? ` ${i.nodeId}` : ""} ${i.message}`),
      ];
    },
  },
  {
    name: "registry",
    aliases: ["blocks"],
    usage: "registry",
    summary: "État du registre serveur des blocs (handlers disponibles).",
    run: () => {
      const s = registrySummary();
      return [
        `Registre : ${s.total} bloc(s)`,
        `  locaux          ${s.local}`,
        `  fournisseurs    ${s.provider}`,
        `  non exécutables ${s.nonExecutable}`,
        `  handlers manquants : ${s.missing.length ? s.missing.join(", ") : "aucun"}`,
      ];
    },
  },
  {
    name: "stats",
    aliases: ["info"],
    usage: "stats",
    summary: "Statistiques du canevas courant.",
    run: (_a, api) => {
      const { doc } = api;
      const byCat = new Map<string, number>();
      for (const n of doc.nodes) byCat.set(n.category, (byCat.get(n.category) ?? 0) + 1);
      const orphans = doc.nodes.filter(
        (n) => !doc.edges.some((e) => e.source === n.id || e.target === n.id),
      );
      return [
        `Blocs      ${doc.nodes.length}`,
        `Connexions ${doc.edges.length}`,
        `Notes      ${doc.comments.length}`,
        `Sélection  ${api.selection.length}`,
        `Zoom       ${api.viewport.zoom.toFixed(2)}×`,
        `Orphelins  ${orphans.length}${orphans.length ? ` (${orphans.map((n) => n.id).join(", ")})` : ""}`,
        "Par catégorie :",
        ...[...byCat.entries()].map(([c, n]) => `  ${c.padEnd(16)} ${n}`),
      ];
    },
  },
  {
    name: "export",
    usage: "export [--pretty]",
    summary: "Exporte le workflow au format JSON dans la console.",
    run: (args, api) => {
      const json = JSON.stringify(api.doc, null, args.flags["pretty"] ? 2 : 0);
      return json.split("\n");
    },
  },
  {
    name: "import",
    usage: "import <json>",
    summary: "Remplace le canevas par un document JSON.",
    run: (args, api) => {
      const raw = args.raw.slice(args.raw.indexOf("import") + 6).trim();
      if (!raw) return ["Usage : import <json>"];
      try {
        const parsed = JSON.parse(raw) as Partial<WDoc>;
        if (!Array.isArray(parsed.nodes)) return ["JSON invalide : `nodes` manquant."];
        api.setDoc(() => ({
          nodes: parsed.nodes as WDoc["nodes"],
          edges: (parsed.edges ?? []) as WDoc["edges"],
          comments: (parsed.comments ?? []) as WDoc["comments"],
        }));
        api.setSelection([]);
        return [`✔ ${parsed.nodes.length} bloc(s) importé(s).`];
      } catch (e) {
        return [`JSON invalide : ${e instanceof Error ? e.message : String(e)}`];
      }
    },
  },

  /* ---------------------------------------------------------------- */
  /* Construction en lot : flow / mk / chain                           */
  /* ---------------------------------------------------------------- */

  {
    name: "flow",
    aliases: ["pipe"],
    usage: "flow <blockId|@ref>[:port] > <blockId|@ref> > … [--from <bloc>] [--no-layout]",
    summary: "Crée toute une chaîne de blocs ET leurs connexions en une seule commande.",
    details: [
      "exemple  flow trig-webhook > enr-company > ai-summary > act-email",
      "exemple  flow @node_3 > log-condition:true > act-email",
      "Un segment commençant par @ ou # réutilise un bloc existant au lieu d'en créer un.",
      "Le canevas est réorganisé automatiquement à la fin (sauf --no-layout).",
    ],
    run: (args, api) => {
      const segments = args.positional
        .join(" ")
        .split(/>|->|=>/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!segments.length) return ["Usage : flow <bloc> > <bloc> > …"];

      const out: string[] = [];
      const center = api.centerWorld();
      let created = 0;
      let previous: { node: WNode; port?: string } | null = null;

      const from = args.flags["from"];
      if (from) {
        const src = resolveNode(api.doc, from);
        if (!src) return [`--from : bloc « ${from} » introuvable.`];
        previous = { node: src };
      }

      for (const segment of segments) {
        const [rawRef, port] = segment.split(":");
        const ref = (rawRef ?? "").trim();
        if (!ref) continue;

        let node: WNode | null = null;
        if (isNodeRef(ref) || resolveNode(api.doc, ref)) {
          node = resolveNode(api.doc, ref);
          if (!node) {
            out.push(`⚠ bloc « ${ref} » introuvable — segment ignoré.`);
            continue;
          }
        } else {
          const def = blockById(ref);
          if (!def) {
            out.push(`⚠ type de bloc inconnu : ${ref} (essaie \`find ${ref}\`).`);
            continue;
          }
          const id = api.addBlock(def.id, center.x + created * 340, center.y);
          session.lastNodeId = id;
          created += 1;
          node = api.getDoc().nodes.find((n) => n.id === id) ?? null;
          if (!node) continue;
          out.push(`✔ ${def.title} créé — ${id}`);
        }

        if (previous) {
          const sourcePort = previous.port ?? previous.node.outputs[0]?.id;
          const targetPort = node.inputs[0]?.id;
          if (!sourcePort) out.push(`⚠ ${previous.node.title} n'a aucune sortie.`);
          else if (!targetPort) out.push(`⚠ ${node.title} n'a aucune entrée.`);
          else {
            api.connect({
              source: previous.node.id,
              sourcePort,
              target: node.id,
              targetPort,
            });
            out.push(`  ↳ ${previous.node.id}:${sourcePort} ─▶ ${node.id}:${targetPort}`);
          }
        }
        previous = port ? { node, port } : { node };
      }

      out.push(`✔ chaîne construite : ${created} bloc(s) créé(s).`);
      return out;
    },
  },
  {
    name: "mk",
    aliases: ["batch"],
    usage: "mk <blockId ...> [--chain] [--from <bloc>] [clé=valeur ...] [--no-layout]",
    summary: "Crée plusieurs blocs d'un coup (à relier ensuite avec `chain` ou `link`).",
    details: [
      "exemple  mk trig-webhook enr-company act-email",
      "exemple  mk enr-email enr-phone --chain --from node_1",
      "Les paires clé=valeur sont appliquées à TOUS les blocs créés.",
    ],
    run: (args, api) => {
      const ids = args.positional;
      if (!ids.length) return ["Usage : mk <blockId ...> [--chain]"];
      const center = api.centerWorld();
      const out: string[] = [];
      const createdNodes: string[] = [];

      ids.forEach((blockId, i) => {
        const def = blockById(blockId);
        if (!def) {
          const near = BLOCKS.filter((b) => norm(b.id).includes(norm(blockId)))
            .slice(0, 3)
            .map((b) => b.id);
          out.push(
            `⚠ bloc inconnu : ${blockId}${near.length ? ` — proche de ${near.join(", ")}` : ""}`,
          );
          return;
        }
        const id = api.addBlock(
          def.id,
          center.x + (i % 4) * 340,
          center.y + Math.floor(i / 4) * 220,
        );
        createdNodes.push(id);
        session.lastNodeId = id;

        const keys = Object.keys(args.pairs);
        if (keys.length) {
          const config: Record<string, string | number | boolean> = {};
          for (const f of def.configFields)
            if (f.defaultValue !== undefined) config[f.key] = f.defaultValue;
          for (const k of keys) config[k] = coerce(args.pairs[k]!);
          api.updateNode(id, { config });
        }
        out.push(`✔ ${def.title} — ${id}`);
      });

      if (args.flags["chain"] === "true" || args.flags["from"]) {
        const refs = [...createdNodes];
        const from = args.flags["from"];
        if (from) {
          const src = resolveNode(api.doc, from);
          if (src) refs.unshift(src.id);
          else out.push(`⚠ --from : « ${from} » introuvable.`);
        }
        const doChain = args.flags["chain"] === "true" || Boolean(from);
        if (doChain) {
          for (let i = 0; i < refs.length - 1; i++) {
            const doc = api.getDoc();
            const a = doc.nodes.find((n) => n.id === refs[i]);
            const b = doc.nodes.find((n) => n.id === refs[i + 1]);
            const sp = a?.outputs[0]?.id;
            const tp = b?.inputs[0]?.id;
            if (!a || !b || !sp || !tp) continue;
            api.connect({ source: a.id, sourcePort: sp, target: b.id, targetPort: tp });
            out.push(`  ↳ ${a.id}:${sp} ─▶ ${b.id}:${tp}`);
            if (args.flags["chain"] !== "true" && from) break;
          }
        }
      }

      api.setSelection(createdNodes);
      out.push(`✔ ${createdNodes.length} bloc(s) créé(s).`);
      return out;
    },
  },
  {
    name: "chain",
    aliases: ["wire"],
    usage: "chain <bloc>[:port] <bloc>[:port] … [--no-layout]",
    summary: "Relie en série des blocs DÉJÀ créés (mode « blocs d'abord, liaisons ensuite »).",
    details: ["exemple  chain #1 #2 #3", "exemple  chain node_4:true node_9:in"],
    run: (args, api) => {
      const refs = args.positional
        .join(" ")
        .split(/\s|>|->/)
        .filter(Boolean);
      if (refs.length < 2) return ["Usage : chain <bloc> <bloc> [...]"];
      const out: string[] = [];
      let linked = 0;

      for (let i = 0; i < refs.length - 1; i++) {
        const [aRef, aPort] = refs[i]!.split(":");
        const [bRef, bPort] = refs[i + 1]!.split(":");
        const a = resolveNode(api.doc, aRef!);
        const b = resolveNode(api.doc, bRef!);
        if (!a) {
          out.push(`⚠ source introuvable : ${aRef}`);
          continue;
        }
        if (!b) {
          out.push(`⚠ cible introuvable : ${bRef}`);
          continue;
        }
        const sp = aPort ?? a.outputs[0]?.id;
        const tp = bPort ?? b.inputs[0]?.id;
        if (!sp || !tp) {
          out.push(`⚠ ports indisponibles entre ${a.id} et ${b.id}.`);
          continue;
        }
        api.connect({ source: a.id, sourcePort: sp, target: b.id, targetPort: tp });
        out.push(`  ↳ ${a.id}:${sp} ─▶ ${b.id}:${tp}`);
        linked += 1;
      }
      out.push(`✔ ${linked} connexion(s) créée(s).`);
      return out;
    },
  },

  /* ---------------------------------------------------------------- */
  /* Inspection fine                                                   */
  /* ---------------------------------------------------------------- */

  {
    name: "ports",
    aliases: ["io"],
    usage: "ports <bloc|blockId>",
    summary: "Entrées et sorties disponibles — à consulter avant un `link` précis.",
    run: (args, api) => {
      const ref = args.positional[0];
      if (!ref) return ["Usage : ports <bloc|blockId>"];
      const node = resolveNode(api.doc, ref);
      if (node) {
        return [
          `${node.title} — ${node.id}`,
          `  entrées  ${node.inputs.map((p) => `${p.id} (${p.label})`).join("  ·  ") || "—"}`,
          `  sorties  ${node.outputs.map((p) => `${p.id} (${p.label})`).join("  ·  ") || "—"}`,
        ];
      }
      const def = blockById(ref);
      if (!def) return [`Introuvable : ${ref}`];
      // `BlockDef` ne porte pas les ports finaux (ils dépendent de la
      // catégorie, des branches et du drapeau `terminal`) : on fabrique un
      // nœud temporaire pour lire exactement les ports que le canevas créera.
      const sample = makeNode(def.id, 0, 0);
      return [
        `${def.title} — ${def.id} (catalogue)`,
        `  entrées  ${sample.inputs.map((p) => `${p.id} (${p.label})`).join("  ·  ") || "—"}`,
        `  sorties  ${sample.outputs.map((p) => `${p.id} (${p.label})`).join("  ·  ") || "—"}`,
        ...(def.dynamicInputs ? ["  entrées ajoutables directement sur le bloc"] : []),
      ];
    },
  },
  {
    name: "defaults",
    aliases: ["schema"],
    usage: "defaults <blockId>",
    summary: "Champs de configuration d'un type de bloc et valeurs par défaut.",
    run: (args) => {
      const ref = args.positional[0];
      if (!ref) return ["Usage : defaults <blockId>"];
      const def = blockById(ref);
      if (!def) return [`Type de bloc inconnu : ${ref} — essaie \`find ${ref}\`.`];
      if (!def.configFields.length) return [`${def.title} n'a aucun champ de configuration.`];
      return [
        `${def.title} — ${def.id}`,
        ...def.configFields.map(
          (f) =>
            `  ${f.key.padEnd(20)} [${f.type}]${
              f.defaultValue !== undefined ? ` = ${String(f.defaultValue)}` : ""
            }`,
        ),
      ];
    },
  },
  {
    name: "tree",
    aliases: ["graph"],
    usage: "tree",
    summary: "Affiche le graphe sous forme d'arbre indenté (lecture rapide du flux).",
    run: (_a, api) => {
      const { doc } = api;
      if (!doc.nodes.length) return ["Canevas vide."];
      const roots = doc.nodes.filter((n) => !doc.edges.some((e) => e.target === n.id));
      const seen = new Set<string>();
      const out: string[] = [];

      const walk = (id: string, depth: number, portLabel?: string) => {
        const node = doc.nodes.find((n) => n.id === id);
        if (!node) return;
        const prefix = depth === 0 ? "" : `${"   ".repeat(depth - 1)}└─ `;
        out.push(
          `${prefix}${portLabel ? `(${portLabel}) ` : ""}${node.title}  ${node.id}${node.muted ? "  [désactivé]" : ""}`,
        );
        if (seen.has(id)) {
          out.push(`${"   ".repeat(depth)}↺ (déjà visité)`);
          return;
        }
        seen.add(id);
        for (const e of doc.edges.filter((x) => x.source === id))
          walk(e.target, depth + 1, e.sourcePort);
      };

      for (const r of roots) walk(r.id, 0);
      const orphans = doc.nodes.filter((n) => !seen.has(n.id) && !roots.includes(n));
      if (orphans.length) {
        out.push("", "Non rattachés :");
        out.push(...orphans.map((n) => `  ${n.id}  ${n.title}`));
      }
      return out;
    },
  },

  /* ---------------------------------------------------------------- */
  /* Édition rapide                                                    */
  /* ---------------------------------------------------------------- */

  {
    name: "rename",
    usage: "rename <bloc> <nouveau titre>",
    summary: "Renomme un bloc (titre affiché sur le canevas).",
    run: (args, api) => {
      const [ref, ...rest] = args.positional;
      const node = ref ? resolveNode(api.doc, ref) : null;
      if (!node) return [`Bloc introuvable : ${ref ?? "(aucun)"}`];
      const title = rest.join(" ").trim() || args.flags["title"];
      if (!title) return ["Usage : rename <bloc> <nouveau titre>"];
      api.updateNode(node.id, { title });
      return [`✔ ${node.id} renommé en « ${title} ».`];
    },
  },
  {
    name: "mute",
    aliases: ["disable"],
    usage: "mute <bloc ...> [--off]",
    summary: "Désactive des blocs sans les supprimer (`--off` réactive).",
    run: (args, api) => {
      const refs = args.positional.length ? args.positional : api.selection;
      if (!refs.length) return ["Usage : mute <bloc ...>"];
      const muted = args.flags["off"] !== "true";
      let count = 0;
      for (const r of refs) {
        const n = resolveNode(api.doc, r);
        if (!n) continue;
        api.updateNode(n.id, { muted });
        count += 1;
      }
      return [`✔ ${count} bloc(s) ${muted ? "désactivé(s)" : "réactivé(s)"}.`];
    },
  },
  {
    name: "dup",
    aliases: ["clone"],
    usage: "dup <bloc> [--times n]",
    summary: "Duplique un bloc avec sa configuration.",
    run: (args, api) => {
      const ref = args.positional[0];
      const node = ref ? resolveNode(api.doc, ref) : null;
      if (!node) return [`Bloc introuvable : ${ref ?? "(aucun)"}`];
      const times = Math.max(1, Math.min(20, Number(args.flags["times"] ?? 1)));
      const ids: string[] = [];
      for (let i = 1; i <= times; i++) {
        const id = uid("node");
        ids.push(id);
        api.setDoc((d) => ({
          ...d,
          nodes: [...d.nodes, { ...node, id, x: node.x + 40 * i, y: node.y + 40 * i }],
        }));
      }
      session.lastNodeId = ids.at(-1) ?? session.lastNodeId;
      api.setSelection(ids);
      return [`✔ ${times} copie(s) de ${node.id} : ${ids.join(", ")}`];
    },
  },
  {
    name: "note",
    aliases: ["comment"],
    usage: 'note "<texte>" [--on <bloc>]',
    summary: "Ajoute une note/annotation sur le canevas.",
    run: (args, api) => {
      const text = args.positional.join(" ").trim() || args.flags["text"];
      if (!text) return ['Usage : note "<texte>" [--on <bloc>]'];
      const on = args.flags["on"];
      const target = on ? resolveNode(api.doc, on) : null;
      if (on && !target) return [`--on : bloc « ${on} » introuvable.`];
      const center = api.centerWorld();
      api.addComment(
        target ? target.x + 300 : center.x,
        target ? target.y : center.y,
        target?.id ?? null,
      );
      api.setDoc((d) => {
        const last = d.comments.at(-1);
        if (!last) return d;
        return {
          ...d,
          comments: d.comments.map((c) => (c.id === last.id ? { ...c, text } : c)),
        };
      });
      return [`✔ note ajoutée${target ? ` sur ${target.id}` : ""}.`];
    },
  },

  {
    name: "run",
    aliases: ["exec", "simulate"],
    usage: "run [--dry]",
    summary: "Exécution simulée pas à pas du plan compilé (données simulées, aucun appel réseau).",
    run: (args, api) => {
      const result = compileWorkflow(toEngineDoc(api.doc));
      if (!result.ok) {
        return [
          "✖ Impossible d'exécuter : la compilation a échoué.",
          ...result.report.errors.map((i) => `  ✖ [${i.code}] ${i.message}`),
        ];
      }
      const { plan } = result;
      const dry = args.flags["dry"] === "true";
      const doc = api.doc;
      const out: string[] = [
        `▶ ${dry ? "Simulation à blanc" : "Exécution simulée"} — plan ${plan.planHash.slice(0, 10)}`,
        `  ${plan.order.length} étape(s) · départ : ${plan.entryNodeIds.join(", ") || "—"}`,
      ];
      plan.order.forEach((nodeId, i) => {
        const n = doc.nodes.find((x) => x.id === nodeId);
        if (!n) return;
        if (n.muted) {
          out.push(`  ${String(i + 1).padStart(2, " ")}. ⏭ ${n.title} (désactivé)`);
          return;
        }
        const ms = 40 + ((i * 37) % 260);
        out.push(
          `  ${String(i + 1).padStart(2, " ")}. ✔ ${n.title.padEnd(26)} ${n.blockId.padEnd(20)} ${dry ? "—" : `${ms} ms · 1 enregistrement`}`,
        );
      });
      out.push(
        `✔ ${dry ? "Simulation terminée" : "Exécution simulée terminée"} — coût estimé ${result.report.estimatedCost.cents} c.`,
      );
      return out;
    },
  },
  {
    name: "history",
    aliases: ["hist"],
    usage: "history [--clear] [--limit n]",
    summary: "Historique des commandes exécutées (vous + agent backend).",
    run: (args) => {
      if (args.flags["clear"] === "true") {
        session.history = [];
        return ["Historique effacé."];
      }
      if (!session.history.length) return ["Aucune commande dans l'historique."];
      const limit = Number(args.flags["limit"] ?? 25);
      return session.history
        .slice(-limit)
        .map(
          (h, i) =>
            `${String(i + 1).padStart(3, " ")}. [${h.source === "agent" ? "backend" : "vous"}] ${h.text}`,
        );
    },
  },
  {
    name: "echo",
    usage: "echo <texte>",
    summary: "Écrit une ligne dans le flux courant (repères dans un script d'agent).",
    run: (args) => [args.positional.join(" ") || ""],
  },
  {
    name: "book",
    aliases: ["livre", "cheatsheet"],
    usage: "book [section]",
    summary: "Ouvre le livre de commandes (référence partagée avec l'agent IA).",
    run: (args) => {
      const key = args.positional[0] ? norm(args.positional[0]!) : null;
      const sections = key
        ? BOOK_SECTIONS.filter((s) => norm(s.key).includes(key) || norm(s.title).includes(key))
        : BOOK_SECTIONS;
      if (!sections.length)
        return [`Section inconnue. Sections : ${BOOK_SECTIONS.map((s) => s.key).join(", ")}`];

      const out: string[] = [];
      if (!key) {
        out.push(
          "📕 Livre de commandes — `book <section>` pour n'en lire qu'une.",
          "",
          "Conventions :",
        );
        out.push(...BOOK_CONVENTIONS.map((c) => `  • ${c}`));
        out.push("");
      }
      for (const s of sections) {
        out.push(`── ${s.title} ──`, `   ${s.intro}`);
        for (const e of s.entries) {
          out.push(`   ${e.usage}`, `       ${e.summary}`);
          if (e.examples?.length) out.push(...e.examples.map((x) => `       ex: ${x}`));
        }
        out.push("");
      }
      if (!key) {
        out.push("Recettes :");
        for (const r of BOOK_RECIPES) {
          out.push(`  ${r.title}`);
          out.push(...r.script.map((l) => `     ${l}`));
        }
      }
      return out;
    },
  },
  {
    name: "man",
    usage: "man <commande>",
    summary: "Fiche complète d'une commande (usage, détails, entrée du livre).",
    run: (args) => {
      const target = args.positional[0];
      if (!target) return ["Usage : man <commande>"];
      const cmd = findCommand(target);
      const entry = BOOK_SECTIONS.flatMap((s) => s.entries).find(
        (e) => norm(e.name) === norm(target),
      );
      if (!cmd && !entry) return [`Commande inconnue : ${target}`];
      const out: string[] = [];
      if (cmd) {
        out.push(
          `${cmd.name}${cmd.aliases?.length ? ` (alias : ${cmd.aliases.join(", ")})` : ""}`,
          `  usage   ${cmd.usage}`,
          `  résumé  ${cmd.summary}`,
          ...(cmd.details ?? []).map((d) => `  ${d}`),
        );
      }
      if (entry?.examples?.length) out.push(...entry.examples.map((x) => `  ex: ${x}`));
      return out;
    },
  },
];

function findCommand(name: string): CommandSpec | undefined {
  const n = name.toLowerCase();
  return COMMANDS.find((c) => c.name === n || (c.aliases ?? []).includes(n));
}

export const COMMAND_NAMES = COMMANDS.flatMap((c) => [c.name, ...(c.aliases ?? [])]);

/** Commandes qui attendent un identifiant du CATALOGUE en argument. */
const CATALOG_COMMANDS = new Set([
  "add",
  "new",
  "find",
  "search",
  "catalog",
  "mk",
  "batch",
  "flow",
  "pipe",
  "defaults",
  "schema",
  "ports",
  "io",
]);
/** Commandes qui attendent une référence de bloc EXISTANT. */
const NODE_COMMANDS = new Set([
  "set",
  "config",
  "cat",
  "inspect",
  "show",
  "link",
  "connect",
  "unlink",
  "disconnect",
  "rm",
  "del",
  "delete",
  "mv",
  "move",
  "select",
  "sel",
  "focus",
  "goto",
  "chain",
  "wire",
  "rename",
  "mute",
  "disable",
  "dup",
  "clone",
]);

/**
 * Complétion Tab : commandes, identifiants du catalogue, blocs du canevas et
 * sections du livre selon la position du curseur.
 */
export function complete(input: string, doc?: WDoc): string[] {
  const tokens = tokenize(input);
  const trailingSpace = /\s$/.test(input);
  if (tokens.length === 0 || (tokens.length === 1 && !trailingSpace)) {
    const q = (tokens[0] ?? "").toLowerCase();
    return COMMANDS.map((c) => c.name).filter((n) => n.startsWith(q));
  }
  const cmd = findCommand(tokens[0]!);
  if (!cmd) return [];
  const last = (trailingSpace ? "" : (tokens[tokens.length - 1] ?? "")).toLowerCase();

  if (cmd.name === "book") {
    return BOOK_SECTIONS.map((s) => s.key).filter((k) => k.startsWith(last));
  }
  if (cmd.name === "man" || cmd.name === "help") {
    return COMMANDS.map((c) => c.name).filter((n) => n.startsWith(last));
  }

  const out: string[] = [];
  const name = cmd.name;
  if (CATALOG_COMMANDS.has(name)) {
    out.push(...BLOCKS.map((b) => b.id).filter((id) => id.startsWith(last)));
  }
  if ((NODE_COMMANDS.has(name) || name === "flow" || name === "ports") && doc) {
    out.push(...doc.nodes.map((n) => n.id).filter((id) => id.startsWith(last)));
    for (const alias of ["@dernier", "@last", "@premier"]) {
      if (alias.startsWith(last) && last) out.push(alias);
    }
  }
  return [...new Set(out)].slice(0, 24);
}

/* ------------------------------------------------------------------ */
/* Exécution                                                           */
/* ------------------------------------------------------------------ */

/**
 * Enveloppe l'API du store pour que `api.doc` renvoie TOUJOURS le document
 * frais (`getDoc()`). Sans cela, une rafale de commandes exécutées dans le
 * même tick React travaillerait sur un instantané périmé : les blocs créés
 * par la commande précédente seraient invisibles pour la suivante.
 */
export function liveApi(api: TerminalApi): TerminalApi {
  return new Proxy(api, {
    get(target, prop, receiver) {
      if (prop === "doc") return target.getDoc();
      return Reflect.get(target, prop, receiver) as unknown;
    },
  }) as TerminalApi;
}

const kindForText = (text: string): LineKind =>
  text.startsWith("✔")
    ? "success"
    : text.startsWith("✖")
      ? "error"
      : text.startsWith("⚠")
        ? "warning"
        : "info";

export type RunOptions = {
  /** Origine de la commande (journal + historique de session). */
  source?: "user" | "agent";
  /** Ne jamais déclencher la réorganisation automatique. */
  noLayout?: boolean;
};

/** Exécute UNE ligne de commande et renvoie les lignes de sortie. */
export function runCommand(
  input: string,
  api: TerminalApi,
  options: RunOptions = {},
): TerminalLine[] {
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("#")) return [makeLine("muted", trimmed)];

  const live = liveApi(api);
  const tokens = tokenize(trimmed);
  const name = tokens[0]!;
  const cmd = findCommand(name);
  if (!cmd) {
    const near = COMMANDS.map((c) => c.name).filter((n) =>
      n.startsWith(name.toLowerCase()[0] ?? ""),
    );
    return [
      makeLine("error", `Commande inconnue : ${name}`),
      makeLine(
        "muted",
        near.length ? `Peut-être : ${near.join(", ")} — ou \`help\`.` : "Tape `help`.",
      ),
    ];
  }

  const args = parseArgs(tokens.slice(1), trimmed);
  session.history = [
    ...session.history,
    { at: Date.now(), source: options.source ?? "user", text: trimmed },
  ].slice(-300);

  const before = live.doc;
  const beforeCount = before.nodes.length + before.edges.length;

  let lines: TerminalLine[];
  try {
    const out = cmd.run(args, live);
    lines = !out ? [] : out.map((l) => (typeof l === "string" ? makeLine(kindForText(l), l) : l));
  } catch (e) {
    return [makeLine("error", `✖ Erreur : ${e instanceof Error ? e.message : String(e)}`)];
  }

  // Réorganisation automatique : toute création de bloc ou de connexion
  // repositionne le graphe pour qu'aucun bloc ne s'empile au même endroit.
  const after = live.doc;
  const grew = after.nodes.length + after.edges.length > beforeCount;
  const skip =
    options.noLayout === true ||
    args.flags["no-layout"] === "true" ||
    args.flags["nolayout"] === "true" ||
    cmd.name === "layout" ||
    cmd.name === "mv" ||
    cmd.name === "import";
  if (grew && session.autoLayout && !skip) {
    try {
      live.autoLayout();
      lines.push(makeLine("muted", "↻ canevas réorganisé (layout --auto on)"));
    } catch {
      /* la réorganisation ne doit jamais faire échouer une commande */
    }
  }
  if (grew && !session.autoLayout && !skip) {
    lines.push(makeLine("muted", "↻ réorganisation suspendue — `layout` pour ranger le canevas."));
  }

  return lines;
}

/**
 * Découpe un script en commandes : sauts de ligne, et `;` hors guillemets.
 * (`;` à l'intérieur d'une chaîne — `note "a; b"` — n'est pas un séparateur.)
 */
export function splitScript(script: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (const ch of script) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ";" || ch === "\n") {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((l) => l.trim()).filter(Boolean);
}

/**
 * Exécute un script de plusieurs commandes (une par ligne ou séparées par
 * `;`). C'est le point d'entrée utilisé par l'agent IA : un seul appel
 * d'outil suffit à construire un workflow entier.
 */
export function runScript(
  script: string,
  api: TerminalApi,
  options: RunOptions & { onLine?: (line: TerminalLine, command: string) => void } = {},
): TerminalLine[] {
  const commands = splitScript(script);
  if (!commands.length) return [];
  const all: TerminalLine[] = [];
  const live = liveApi(api);

  const before = live.doc;
  const beforeCount = before.nodes.length + before.edges.length;

  for (const command of commands) {
    const echo = makeLine("input", `❯ ${command}`);
    all.push(echo);
    options.onLine?.(echo, command);
    // Une seule réorganisation à la fin du lot : inutile de ranger le canevas
    // entre chaque ligne, c'est du travail (et du rendu) pour rien.
    const lines = runCommand(command, live, { ...options, noLayout: true });
    for (const l of lines) {
      all.push(l);
      options.onLine?.(l, command);
    }
  }

  const after = live.doc;
  if (
    options.noLayout !== true &&
    session.autoLayout &&
    after.nodes.length + after.edges.length > beforeCount
  ) {
    try {
      live.autoLayout();
      const line = makeLine("muted", "↻ canevas réorganisé (fin du lot)");
      all.push(line);
      options.onLine?.(line, "layout");
    } catch {
      /* ignoré : la réorganisation est un confort, pas une garantie */
    }
  }

  return all;
}

export { shortId };
