//frontend\lib\workflow\command-highlight.ts
import { blockMap, categoryMap } from "./geometry";
import { COMMAND_NAMES } from "./terminal-commands";

export type TokenKind =
  | "command"
  | "unknown"
  | "flag"
  | "flag-value"
  | "key"
  | "operator"
  | "string"
  | "number"
  | "boolean"
  | "node"
  | "block"
  | "port"
  | "comment"
  | "space"
  | "text";

export type SynToken = {
  text: string;
  kind: TokenKind;

  color?: string;
};

export const TOKEN_CLASS: Record<TokenKind, string> = {
  command: "text-syn-command font-semibold",
  unknown: "text-syn-unknown underline decoration-dotted underline-offset-2",
  flag: "text-syn-flag",
  "flag-value": "text-syn-value",
  key: "text-syn-key",
  operator: "text-syn-operator",
  string: "text-syn-string",
  number: "text-syn-number",
  boolean: "text-syn-boolean",
  node: "text-syn-node",
  block: "text-syn-block",
  port: "text-syn-port",
  comment: "text-syn-comment italic",
  space: "",
  text: "text-term-fg",
};

const OPERATORS = new Set([">", "->", "=>", "|", ";", "&&", "+"]);
const NODE_RE = /^(@|#|node_|cmt_|edge_)/;

function blockColor(id: string): string | undefined {
  const def = blockMap[id];
  if (!def) return undefined;
  return categoryMap[def.category]?.color;
}

function classifyWord(word: string, first: boolean): SynToken[] {
  if (first) {
    const known = COMMAND_NAMES.includes(word.toLowerCase());
    return [{ text: word, kind: known ? "command" : "unknown" }];
  }

  if (word.startsWith("#") && !/^#\d+$/.test(word)) {
    return [{ text: word, kind: "comment" }];
  }

  if (OPERATORS.has(word)) return [{ text: word, kind: "operator" }];

  if (word.startsWith("--")) {
    const eq = word.indexOf("=");
    if (eq < 0) return [{ text: word, kind: "flag" }];
    return [
      { text: word.slice(0, eq), kind: "flag" },
      { text: "=", kind: "operator" },
      ...classifyValue(word.slice(eq + 1)),
    ];
  }

  const eq = word.indexOf("=");
  if (eq > 0) {
    return [
      { text: word.slice(0, eq), kind: "key" },
      { text: "=", kind: "operator" },
      ...classifyValue(word.slice(eq + 1)),
    ];
  }

  if (word.includes(":") && !word.startsWith("http")) {
    const [ref, ...rest] = word.split(":");
    return [
      ...classifyValue(ref ?? ""),
      { text: ":", kind: "operator" },
      { text: rest.join(":"), kind: "port" },
    ];
  }

  return classifyValue(word);
}

function classifyValue(word: string): SynToken[] {
  if (!word) return [];
  if (/^["'].*["']$/.test(word) || word.startsWith('"') || word.startsWith("'")) {
    return [{ text: word, kind: "string" }];
  }
  if (word === "true" || word === "false" || word === "on" || word === "off") {
    return [{ text: word, kind: "boolean" }];
  }
  if (!Number.isNaN(Number(word))) return [{ text: word, kind: "number" }];

  const color = blockColor(word);
  if (color) return [{ text: word, kind: "block", color }];

  if (NODE_RE.test(word)) return [{ text: word, kind: "node" }];
  return [{ text: word, kind: "text" }];
}

export function highlightCommand(line: string): SynToken[] {
  const out: SynToken[] = [];
  let rest = line;

  const promptMatch = /^(\s*❯\s*)/.exec(rest);
  if (promptMatch) {
    out.push({ text: promptMatch[1]!, kind: "operator" });
    rest = rest.slice(promptMatch[1]!.length);
  }

  const parts = rest.match(/\s+|"[^"]*"|'[^']*'|[^\s]+/g) ?? [];
  let wordIndex = 0;
  let afterSeparator = true;

  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      out.push({ text: part, kind: "space" });
      continue;
    }
    const first = afterSeparator;
    out.push(...classifyWord(part, first));
    if (part === ";" || part === "&&") {
      afterSeparator = true;
      wordIndex = 0;
    } else {
      afterSeparator = false;
      wordIndex += 1;
    }
  }

  void wordIndex;
  return out;
}

export function highlightOutput(line: string): SynToken[] {
  const parts = line.match(/\s+|[^\s]+/g) ?? [];
  return parts.flatMap<SynToken>((part) => {
    if (/^\s+$/.test(part)) return [{ text: part, kind: "space" }];
    const bare = part.replace(/[.,;:()]+$/, "");
    const color = blockColor(bare);
    if (color) return [{ text: part, kind: "block", color }];
    if (NODE_RE.test(bare)) return [{ text: part, kind: "node" }];
    return [{ text: part, kind: "text" }];
  });
}
