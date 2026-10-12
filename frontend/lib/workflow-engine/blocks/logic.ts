//frontend\lib\workflow-engine\blocks\logic.ts
import { z } from "zod";

import {
  asCollection,
  branch,
  cfgBool,
  cfgList,
  cfgNumber,
  cfgString,
  defineBlock,
  ok,
  skipped,
  stableHashNumber,
  waiting,
} from "./_shared";
import { evaluateCondition, parseCondition, resolveDeep, safeStringify } from "../expressions";
import type { ExpressionScope } from "../expressions";
import { WorkflowBlockError } from "../errors";
import { durationToMs, nextBusinessTime } from "../scheduler";
import { advancedOptionsSchema, expressionSchema, timezoneSchema } from "../schemas";
import type { BlockDefinition } from "../registry";

/**
 * Blocs exécutables 100 % localement : conditions, variables, boucles, délais,
 * utilitaires de flux, fins de workflow et gestion d'erreur.
 */

const advanced = { _advanced: advancedOptionsSchema };
const cfg = (shape: z.ZodRawShape) => z.object({ ...advanced, ...shape }).passthrough();

function scopeOf(ctx: Parameters<BlockDefinition["execute"]>[0]) {
  const scope: ExpressionScope = {
    input: ctx.input,
    variables: ctx.variables,
    metadata: { now: ctx.services.clock.isoNow(), runId: ctx.runId, nodeId: ctx.nodeId },
    nodes: (ctx.variables["__nodes"] as Record<string, unknown>) ?? {},
  };
  if (ctx.item) scope.item = ctx.item;
  return scope;
}

export const logicBlocks: BlockDefinition[] = [
  defineBlock({
    blockId: "cond-if-else",
    kind: "local",
    schema: cfg({
      expression: expressionSchema,
      defaultBranch: z.enum(["true", "false"]).default("false"),
    }),
    execute: async (ctx) => {
      const expression = cfgString(ctx, "expression");
      if (!expression)
        throw new WorkflowBlockError("CONFIG_INVALID", "Condition vide.", { retryable: false });
      const result = evaluateCondition(parseCondition(expression), scopeOf(ctx));
      ctx.log.info("Condition évaluée", { expression, result });
      return branch(result ? "true" : "false", { matched: result, input: ctx.input });
    },
  }),

  defineBlock({
    blockId: "cond-switch",
    kind: "local",
    schema: cfg({
      cases: z
        .array(z.object({ branch: z.string().min(1), expression: expressionSchema }))
        .max(3)
        .default([]),
    }),
    execute: async (ctx) => {
      const cases = (ctx.config["cases"] as { branch: string; expression: string }[]) ?? [];
      for (const item of cases) {
        if (evaluateCondition(parseCondition(item.expression), scopeOf(ctx))) {
          return branch(item.branch, ctx.input);
        }
      }
      return branch("default", ctx.input);
    },
  }),

  defineBlock({
    blockId: "cond-country-router",
    kind: "local",
    schema: cfg({ countryPath: z.string().default("input.country") }),
    execute: async (ctx) => {
      const raw = resolveDeep(
        `{{${cfgString(ctx, "countryPath", "input.country")}}}`,
        scopeOf(ctx),
      );
      const code = String(raw ?? "")
        .trim()
        .toLowerCase();
      const target =
        code === "fr" || code === "france"
          ? "fr"
          : code === "us" || code === "usa"
            ? "us"
            : "other";
      return branch(target, { country: code || null });
    },
  }),

  defineBlock({
    blockId: "cond-filter",
    kind: "local",
    schema: cfg({ expression: expressionSchema, keepEmpty: z.boolean().default(false) }),
    execute: async (ctx) => {
      const expression = cfgString(ctx, "expression");
      const condition = parseCondition(expression);
      const items = asCollection(ctx.input);
      const kept = items.filter((value, index) =>
        evaluateCondition(condition, { ...scopeOf(ctx), item: { index, value } }),
      );
      ctx.log.progress(items.length, items.length, `${kept.length} élément(s) conservé(s)`);
      if (kept.length === 0 && !cfgBool(ctx, "keepEmpty")) {
        return skipped("Aucun élément ne satisfait le filtre.");
      }
      return ok(
        { items: kept, kept: kept.length, dropped: items.length - kept.length },
        {
          metrics: { count: kept.length },
        },
      );
    },
  }),

  defineBlock({
    blockId: "cond-random-split",
    kind: "local",
    schema: cfg({
      percentA: z.number().min(0).max(100).default(50),
      seedPath: z.string().max(200).optional(),
    }),
    execute: async (ctx) => {
      const percentA = cfgNumber(ctx, "percentA", 50);
      const seedPath = cfgString(ctx, "seedPath");
      const draw = seedPath
        ? stableHashNumber(safeStringify(resolveDeep(`{{${seedPath}}}`, scopeOf(ctx))))
        : ctx.services.random();
      return branch(draw * 100 < percentA ? "a" : "b", { draw });
    },
  }),

  defineBlock({
    blockId: "cond-dedupe",
    kind: "local",
    schema: cfg({
      keyPath: z.string().default("input.email"),
      scope: z.enum(["run", "workflow"]).default("run"),
    }),
    execute: async (ctx) => {
      const key = safeStringify(
        resolveDeep(`{{${cfgString(ctx, "keyPath", "input.email")}}}`, scopeOf(ctx)),
      );
      const bucket = (ctx.variables["__dedupe"] as Record<string, true> | undefined) ?? {};
      if (bucket[key]) return branch("duplicate", { key });
      return {
        status: "branch",
        branch: "unique",
        output: { key },
        variablePatch: { __dedupe: { ...bucket, [key]: true } },
      };
    },
  }),

  /* ---------------------------- Variables ----------------------------- */
  defineBlock({
    blockId: "var-set",
    kind: "local",
    schema: cfg({ name: z.string().min(1).max(80), value: z.unknown() }),
    execute: async (ctx) => {
      const name = cfgString(ctx, "name");
      if (!name)
        throw new WorkflowBlockError("CONFIG_INVALID", "Nom de variable requis.", {
          retryable: false,
        });
      const value = ctx.resolve(ctx.config["value"]);
      return ok({ [name]: value }, { variablePatch: { [name]: value } });
    },
  }),

  defineBlock({
    blockId: "var-transform",
    kind: "local",
    schema: cfg({
      name: z.string().min(1).max(80),
      expression: expressionSchema,
    }),
    execute: async (ctx) => {
      const name = cfgString(ctx, "name");
      const value = resolveDeep(cfgString(ctx, "expression"), scopeOf(ctx));
      return ok({ [name]: value }, { variablePatch: { [name]: value } });
    },
  }),

  defineBlock({
    blockId: "var-counter",
    kind: "local",
    schema: cfg({
      name: z.string().min(1).max(80),
      step: z.number().default(1),
      reset: z.boolean().default(false),
    }),
    execute: async (ctx) => {
      const name = cfgString(ctx, "name", "counter");
      const step = cfgNumber(ctx, "step", 1);
      const current = cfgBool(ctx, "reset") ? 0 : Number(ctx.variables[name] ?? 0);
      const next = (Number.isFinite(current) ? current : 0) + step;
      return ok({ [name]: next }, { variablePatch: { [name]: next } });
    },
  }),

  defineBlock({
    blockId: "var-format-text",
    kind: "local",
    schema: cfg({
      name: z.string().min(1).max(80).default("text"),
      template: z.string().max(5000),
    }),
    execute: async (ctx) => {
      const name = cfgString(ctx, "name", "text");
      const value = String(resolveDeep(cfgString(ctx, "template"), scopeOf(ctx)) ?? "");
      return ok({ [name]: value }, { variablePatch: { [name]: value } });
    },
  }),

  defineBlock({
    blockId: "var-toggle-flag",
    kind: "local",
    schema: cfg({
      name: z.string().min(1).max(80),
      value: z.enum(["toggle", "true", "false"]).default("toggle"),
    }),
    execute: async (ctx) => {
      const name = cfgString(ctx, "name", "flag");
      const mode = cfgString(ctx, "value", "toggle");
      const next = mode === "toggle" ? !Boolean(ctx.variables[name]) : mode === "true";
      return ok({ [name]: next }, { variablePatch: { [name]: next } });
    },
  }),

  defineBlock({
    blockId: "var-uuid",
    kind: "local",
    schema: cfg({ name: z.string().min(1).max(80).default("uuid") }),
    execute: async (ctx) => {
      const name = cfgString(ctx, "name", "uuid");
      const value =
        typeof globalThis.crypto?.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `uid_${Math.floor(ctx.services.random() * 1e16).toString(36)}`;
      return ok({ [name]: value }, { variablePatch: { [name]: value } });
    },
  }),

  /* ------------------------------ Délais ------------------------------ */
  defineBlock({
    blockId: "delay-wait",
    kind: "local",
    durable: true,
    schema: cfg({
      value: z.number().min(0).max(365).default(1),
      unit: z.enum(["seconds", "minutes", "hours", "days", "weeks"]).default("hours"),
    }),
    execute: async (ctx) => {
      const ms = durationToMs(cfgNumber(ctx, "value", 1), cfgString(ctx, "unit", "hours"));
      return waiting(new Date(ctx.services.clock.now() + ms).toISOString(), { delayMs: ms });
    },
  }),

  defineBlock({
    blockId: "delay-until-date",
    kind: "local",
    durable: true,
    schema: cfg({ date: z.string().min(4), timezone: timezoneSchema.default("Europe/Paris") }),
    execute: async (ctx) => {
      const raw = cfgString(ctx, "date");
      const target = Date.parse(raw);
      if (!Number.isFinite(target)) {
        throw new WorkflowBlockError("CONFIG_INVALID", `Date invalide : ${raw}`, {
          retryable: false,
        });
      }
      if (target <= ctx.services.clock.now()) return ok({ skippedWait: true, date: raw });
      return waiting(new Date(target).toISOString(), { date: raw });
    },
  }),

  defineBlock({
    blockId: "delay-business-hours",
    kind: "local",
    durable: true,
    schema: cfg({
      timezone: timezoneSchema.default("Europe/Paris"),
      days: z.array(z.number().int().min(1).max(7)).default([1, 2, 3, 4, 5]),
      startHour: z.number().int().min(0).max(23).default(9),
      endHour: z.number().int().min(1).max(24).default(18),
      holidays: z.array(z.string()).default([]),
    }),
    execute: async (ctx) => {
      const next = nextBusinessTime(new Date(ctx.services.clock.now()), {
        timezone: cfgString(ctx, "timezone", "Europe/Paris"),
        days: (ctx.config["days"] as number[]) ?? [1, 2, 3, 4, 5],
        startHour: cfgNumber(ctx, "startHour", 9),
        endHour: cfgNumber(ctx, "endHour", 18),
        holidays: cfgList(ctx, "holidays"),
      });
      if (next.getTime() <= ctx.services.clock.now() + 1000)
        return ok({ withinBusinessHours: true });
      return waiting(next.toISOString(), { withinBusinessHours: false });
    },
  }),

  defineBlock({
    blockId: "delay-snooze",
    kind: "local",
    durable: true,
    schema: cfg({ untilExpression: expressionSchema }),
    execute: async (ctx) => {
      const value = resolveDeep(cfgString(ctx, "untilExpression"), scopeOf(ctx));
      const target = Date.parse(String(value));
      if (!Number.isFinite(target)) return ok({ snoozed: false });
      return waiting(new Date(target).toISOString(), { snoozed: true });
    },
  }),

  defineBlock({
    blockId: "delay-pause",
    kind: "local",
    durable: true,
    schema: cfg({ reason: z.string().max(300).default("Pause manuelle") }),
    execute: async (ctx) => {
      ctx.log.warn("Workflow mis en pause", { reason: cfgString(ctx, "reason") });
      return waiting(new Date(ctx.services.clock.now() + 365 * 86_400_000).toISOString(), {
        manualResumeRequired: true,
      });
    },
  }),

  /* ------------------------------ Boucles ----------------------------- */
  defineBlock({
    blockId: "loop-foreach",
    kind: "local",
    schema: cfg({ maxItems: z.number().int().min(1).max(10_000).default(1000) }),
    execute: async (ctx) => {
      const items = asCollection(ctx.input).slice(0, cfgNumber(ctx, "maxItems", 1000));
      ctx.log.progress(items.length, items.length, "Itération préparée");
      return ok({ items, count: items.length }, { metrics: { count: items.length } });
    },
  }),

  defineBlock({
    blockId: "loop-batch",
    kind: "local",
    schema: cfg({ size: z.number().int().min(1).max(1000).default(50) }),
    execute: async (ctx) => {
      const size = cfgNumber(ctx, "size", 50);
      const items = asCollection(ctx.input);
      const batches: unknown[][] = [];
      for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
      return ok({ batches, batchCount: batches.length, size });
    },
  }),

  defineBlock({
    blockId: "loop-paginate",
    kind: "local",
    schema: cfg({
      pageSize: z.number().int().min(1).max(500).default(50),
      maxPages: z.number().int().min(1).max(100).default(10),
    }),
    execute: async (ctx) => {
      const pageSize = cfgNumber(ctx, "pageSize", 50);
      const maxPages = cfgNumber(ctx, "maxPages", 10);
      const items = asCollection(ctx.input);
      const pages = Math.min(maxPages, Math.max(1, Math.ceil(items.length / pageSize)));
      return ok({ pages, pageSize, total: items.length });
    },
  }),

  defineBlock({
    blockId: "loop-retry",
    kind: "local",
    schema: cfg({ maxAttempts: z.number().int().min(1).max(10).default(3) }),
    execute: async (ctx) =>
      ok({ retryScope: true, maxAttempts: cfgNumber(ctx, "maxAttempts", 3), input: ctx.input }),
  }),

  defineBlock({
    blockId: "loop-break",
    kind: "local",
    schema: cfg({ expression: expressionSchema.optional() }),
    execute: async (ctx) => {
      const expression = cfgString(ctx, "expression");
      const shouldBreak = expression
        ? evaluateCondition(parseCondition(expression), scopeOf(ctx))
        : true;
      return shouldBreak ? skipped("Sortie de boucle demandée.") : ok({ continue: true });
    },
  }),

  /* --------------------------- Flux / fins ---------------------------- */
  defineBlock({
    blockId: "util-merge",
    kind: "local",
    schema: cfg({ strategy: z.enum(["concat", "shallow", "first"]).default("concat") }),
    execute: async (ctx) => {
      const strategy = cfgString(ctx, "strategy", "concat");
      const inputs = Array.isArray(ctx.input) ? ctx.input : [ctx.input];
      if (strategy === "first") return ok(inputs[0] ?? null);
      if (strategy === "shallow")
        return ok(Object.assign({}, ...inputs.filter((i) => i && typeof i === "object")));
      return ok({ items: inputs.flatMap((i) => asCollection(i)) });
    },
  }),

  defineBlock({
    blockId: "util-dedup-clean",
    kind: "local",
    schema: cfg({ keyPath: z.string().default("item.email") }),
    execute: async (ctx) => {
      const path = cfgString(ctx, "keyPath", "item.email");
      const seen = new Set<string>();
      const items = asCollection(ctx.input).filter((value, index) => {
        const key = safeStringify(
          resolveDeep(`{{${path}}}`, { ...scopeOf(ctx), item: { index, value } }),
        );
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return ok({ items, count: items.length });
    },
  }),

  defineBlock({
    blockId: "util-throttle",
    kind: "local",
    schema: cfg({ perMinute: z.number().int().min(1).max(10_000).default(60) }),
    execute: async (ctx) => {
      const perMinute = cfgNumber(ctx, "perMinute", 60);
      return ok({ throttled: true, perMinute, spacingMs: Math.ceil(60_000 / perMinute) });
    },
  }),

  defineBlock({
    blockId: "error-stop-workflow",
    kind: "local",
    schema: cfg({ reason: z.string().max(300).default("Arrêt demandé") }),
    execute: async (ctx) => {
      throw new WorkflowBlockError("STOPPED", cfgString(ctx, "reason", "Arrêt demandé"), {
        retryable: false,
      });
    },
  }),

  defineBlock({
    blockId: "error-retry-policy",
    kind: "local",
    schema: cfg({
      maxAttempts: z.number().int().min(1).max(10).default(3),
      initialDelayMs: z.number().int().min(100).max(60_000).default(1000),
    }),
    execute: async (ctx) =>
      ok({
        policy: {
          maxAttempts: cfgNumber(ctx, "maxAttempts", 3),
          initialDelayMs: cfgNumber(ctx, "initialDelayMs", 1000),
        },
      }),
  }),

  defineBlock({
    blockId: "end-workflow",
    kind: "local",
    schema: cfg({ status: z.enum(["success", "neutral"]).default("success") }),
    execute: async (ctx) =>
      ok({ ended: true, status: cfgString(ctx, "status", "success"), input: ctx.input }),
  }),

  defineBlock({
    blockId: "end-branch",
    kind: "local",
    execute: async () => ok({ ended: true, scope: "branch" }),
  }),

  defineBlock({
    blockId: "end-error",
    kind: "local",
    schema: cfg({ message: z.string().max(300).default("Fin en erreur") }),
    execute: async (ctx) => {
      throw new WorkflowBlockError("ENDED_WITH_ERROR", cfgString(ctx, "message", "Fin en erreur"), {
        retryable: false,
      });
    },
  }),
];
