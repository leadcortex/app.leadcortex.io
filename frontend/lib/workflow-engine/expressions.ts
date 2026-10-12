//frontend\lib\workflow-engine\expressions.ts
import { WorkflowBlockError } from "./errors";

export type ExpressionScope = {
  input: unknown;
  variables: Record<string, unknown>;
  item?: { index: number; value: unknown };
  metadata: Record<string, unknown>;

  nodes: Record<string, unknown>;
};

const PATH_SEGMENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const MAX_TEMPLATE_LENGTH = 20_000;

export function getByPath(root: unknown, path: string): unknown {
  const segments = tokenizePath(path);
  let current: unknown = root;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index < 0 ? current.length + index : index];
      continue;
    }
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function tokenizePath(path: string): string[] {
  const out: string[] = [];
  for (const raw of path.split(".")) {
    const bracket = raw.match(/^([^[\]]*)((?:\[[^[\]]+\])*)$/);
    if (!bracket) throw invalid(path);
    const head = bracket[1] ?? "";
    if (head) out.push(head);
    const rest = bracket[2] ?? "";
    for (const m of rest.matchAll(/\[([^[\]]+)\]/g)) {
      out.push((m[1] ?? "").replace(/^['"]|['"]$/g, ""));
    }
  }
  return out.filter((s) => s.length > 0);
}

function invalid(expression: string): WorkflowBlockError {
  return new WorkflowBlockError(
    "EXPRESSION_INVALID",
    "Expression invalide dans la configuration.",
    {
      retryable: false,
      details: { expression },
    },
  );
}

const ROOT_KEYS = ["input", "variables", "vars", "item", "metadata", "meta", "nodes", "now"];

export function resolveReference(reference: string, scope: ExpressionScope): unknown {
  const trimmed = reference.trim();
  if (trimmed.length === 0) throw invalid(reference);
  if (trimmed === "now") return new Date().toISOString();

  const [head, ...restParts] = trimmed.split(".");
  const rest = restParts.join(".");
  const root = head ?? "";

  if (!ROOT_KEYS.includes(root)) {
    return getByPath(scope.variables, trimmed);
  }
  switch (root) {
    case "input":
      return rest ? getByPath(scope.input, rest) : scope.input;
    case "variables":
    case "vars":
      return rest ? getByPath(scope.variables, rest) : scope.variables;
    case "item":
      return rest ? getByPath(scope.item?.value, rest) : scope.item?.value;
    case "metadata":
    case "meta":
      return rest ? getByPath(scope.metadata, rest) : scope.metadata;
    case "nodes":
      return rest ? getByPath(scope.nodes, rest) : scope.nodes;
    default:
      return undefined;
  }
}

const TEMPLATE = /\{\{\s*([^{}]+?)\s*\}\}/g;

export function resolveTemplate(template: string, scope: ExpressionScope): unknown {
  if (template.length > MAX_TEMPLATE_LENGTH) {
    throw new WorkflowBlockError("PAYLOAD_TOO_LARGE", "Expression trop longue.", {
      retryable: false,
    });
  }
  const whole = template.match(/^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/);
  if (whole) return applyPipes(whole[1] ?? "", scope);

  return template.replace(TEMPLATE, (_match, ref: string) => stringify(applyPipes(ref, scope)));
}

function applyPipes(raw: string, scope: ExpressionScope): unknown {
  const [refPart, ...pipes] = raw.split("|").map((p) => p.trim());
  let value = resolveReference(refPart ?? "", scope);
  for (const pipe of pipes) {
    const [name, ...args] = pipe.split(":");
    value = applyPipe((name ?? "").trim(), args.join(":").trim(), value);
  }
  return value;
}

function applyPipe(name: string, arg: string, value: unknown): unknown {
  const literal = arg ? parseLiteral(arg) : undefined;
  switch (name) {
    case "upper":
      return String(value ?? "").toUpperCase();
    case "lower":
      return String(value ?? "").toLowerCase();
    case "trim":
      return String(value ?? "").trim();
    case "slug":
      return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }
    case "json":
      return safeStringify(value);
    case "length":
      if (Array.isArray(value)) return value.length;
      return String(value ?? "").length;
    case "default":
      return value === undefined || value === null || value === "" ? literal : value;
    case "":
      return value;
    default:
      throw invalid(`pipe:${name}`);
  }
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return safeStringify(value);
  return String(value);
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "[unserializable]";
  }
}

/** Résout récursivement toutes les expressions d'une valeur de configuration. */
export function resolveDeep(value: unknown, scope: ExpressionScope, depth = 0): unknown {
  if (depth > 8) return value;
  if (typeof value === "string") return resolveTemplate(value, scope);
  if (Array.isArray(value)) return value.map((v) => resolveDeep(v, scope, depth + 1));
  if (value !== null && typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src)) out[key] = resolveDeep(src[key], scope, depth + 1);
    return out;
  }
  return value;
}

/* ------------------------------------------------------------------ */
/* DSL de condition                                                    */
/* ------------------------------------------------------------------ */

export type ComparisonOperator =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty"
  | "matches";

export type ConditionNode =
  | { kind: "comparison"; left: string; op: ComparisonOperator; right?: unknown }
  | { kind: "and"; children: ConditionNode[] }
  | { kind: "or"; children: ConditionNode[] }
  | { kind: "not"; child: ConditionNode };

const OPERATOR_PATTERN =
  /\s(==|!=|>=|<=|>|<|contains|not_contains|starts_with|ends_with|in|not_in|matches)\s/;

/**
 * Parse une expression textuelle en AST restreint.
 * Grammaire : `expr := term (('and'|'or') term)*`, `term := ref op literal | ref op`.
 */
export function parseCondition(expression: string): ConditionNode {
  const source = expression.trim();
  if (!source) throw invalid(expression);
  if (source.length > 2000) throw invalid("condition too long");

  const orParts = splitTopLevel(source, /\s+(?:or|\|\|)\s+/i);
  if (orParts.length > 1) {
    return { kind: "or", children: orParts.map(parseCondition) };
  }
  const andParts = splitTopLevel(source, /\s+(?:and|&&)\s+/i);
  if (andParts.length > 1) {
    return { kind: "and", children: andParts.map(parseCondition) };
  }
  if (/^not\s+/i.test(source)) {
    return { kind: "not", child: parseCondition(source.replace(/^not\s+/i, "")) };
  }
  if (source.startsWith("(") && source.endsWith(")")) {
    return parseCondition(source.slice(1, -1));
  }

  const emptyMatch = source.match(/^(.+?)\s+(is_empty|is_not_empty)$/);
  if (emptyMatch) {
    return {
      kind: "comparison",
      left: cleanRef(emptyMatch[1] ?? ""),
      op: (emptyMatch[2] ?? "is_empty") as ComparisonOperator,
    };
  }

  const opMatch = source.match(OPERATOR_PATTERN);
  if (!opMatch || opMatch.index === undefined) throw invalid(expression);
  const op = (opMatch[1] ?? "==") as ComparisonOperator;
  const left = source.slice(0, opMatch.index).trim();
  const right = source.slice(opMatch.index + opMatch[0].length).trim();
  return { kind: "comparison", left: cleanRef(left), op, right: parseLiteral(right) };
}

function splitTopLevel(source: string, separator: RegExp): string[] {
  const out: string[] = [];
  let depth = 0;
  let buffer = "";
  let quote: string | null = null;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i] ?? "";
    if (quote) {
      buffer += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth === 0) {
      const rest = source.slice(i);
      const m = rest.match(separator);
      if (m && m.index === 0) {
        out.push(buffer);
        buffer = "";
        i += m[0].length - 1;
        continue;
      }
    }
    buffer += char;
  }
  out.push(buffer);
  return out.map((s) => s.trim()).filter((s) => s.length > 0);
}

function cleanRef(raw: string): string {
  const trimmed = raw.trim().replace(/^\{\{\s*|\s*\}\}$/g, "");
  if (!trimmed) throw invalid(raw);
  return trimmed;
}

export function parseLiteral(raw: string): unknown {
  const value = raw.trim();
  if (value === "") return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((v) => parseLiteral(v))
      .filter((v) => v !== "");
  }
  return value;
}

export function evaluateCondition(node: ConditionNode, scope: ExpressionScope): boolean {
  switch (node.kind) {
    case "and":
      return node.children.every((child) => evaluateCondition(child, scope));
    case "or":
      return node.children.some((child) => evaluateCondition(child, scope));
    case "not":
      return !evaluateCondition(node.child, scope);
    case "comparison":
      return compare(resolveReference(node.left, scope), node.op, resolveRight(node.right, scope));
    default:
      return false;
  }
}

function resolveRight(right: unknown, scope: ExpressionScope): unknown {
  if (typeof right === "string" && /^\{\{[^{}]+\}\}$/.test(right.trim())) {
    return resolveTemplate(right, scope);
  }
  return right;
}

function compare(left: unknown, op: ComparisonOperator, right: unknown): boolean {
  switch (op) {
    case "==":
      return looseEqual(left, right);
    case "!=":
      return !looseEqual(left, right);
    case ">":
      return numeric(left) > numeric(right);
    case ">=":
      return numeric(left) >= numeric(right);
    case "<":
      return numeric(left) < numeric(right);
    case "<=":
      return numeric(left) <= numeric(right);
    case "contains":
      return Array.isArray(left)
        ? left.some((v) => looseEqual(v, right))
        : String(left ?? "")
            .toLowerCase()
            .includes(String(right ?? "").toLowerCase());
    case "not_contains":
      return !compare(left, "contains", right);
    case "starts_with":
      return String(left ?? "")
        .toLowerCase()
        .startsWith(String(right ?? "").toLowerCase());
    case "ends_with":
      return String(left ?? "")
        .toLowerCase()
        .endsWith(String(right ?? "").toLowerCase());
    case "in":
      return Array.isArray(right) ? right.some((v) => looseEqual(v, left)) : false;
    case "not_in":
      return !compare(left, "in", right);
    case "is_empty":
      return isEmpty(left);
    case "is_not_empty":
      return !isEmpty(left);
    case "matches":
      return safeMatches(String(left ?? ""), String(right ?? ""));
    default:
      return false;
  }
}

function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a === "object" || typeof b === "object") return safeStringify(a) === safeStringify(b);
  return String(a).toLowerCase() === String(b).toLowerCase();
}

function numeric(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : Number.NaN;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

/** Regex bornée : longueur limitée pour éviter les catastrophic backtracking évidents. */
function safeMatches(input: string, pattern: string): boolean {
  if (pattern.length > 200 || input.length > 10_000) return false;
  try {
    return new RegExp(pattern).test(input);
  } catch {
    throw invalid(`regex:${pattern.slice(0, 40)}`);
  }
}
