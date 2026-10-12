//frontend\lib\workflow-engine\blocks\triggers.ts
import { z } from "zod";

import { branch, cfgBool, cfgNumber, cfgString, defineBlock, ok, skipped } from "./_shared";
import { nextCronOccurrence } from "../scheduler";
import { advancedOptionsSchema, timezoneSchema } from "../schemas";
import type { BlockDefinition } from "../registry";

const advanced = { _advanced: advancedOptionsSchema };

const manualSchema = z
  .object({
    ...advanced,
    allowedRole: z.enum(["owner", "admin", "member"]).default("member"),
    payloadSchema: z.record(z.unknown()).optional(),
    requireConfirmation: z.boolean().default(false),
    maxLaunchesPerHour: z.number().int().min(1).max(1000).default(60),
    testMode: z.boolean().default(true),
    idempotencyKey: z.string().max(200).optional(),
  })
  .passthrough();

const scheduleSchema = z
  .object({
    ...advanced,
    cron: z.string().min(9).max(120).default("0 9 * * 1-5"),
    timezone: timezoneSchema.default("Europe/Paris"),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    overlapStrategy: z.enum(["skip", "queue", "allow"]).default("skip"),
    maxConcurrentInstances: z.number().int().min(1).max(20).default(1),
    runData: z.record(z.unknown()).optional(),
  })
  .passthrough();

const webhookSchema = z
  .object({
    ...advanced,
    workspaceId: z.string().min(1).default("ws_local"),
    publicEndpointId: z.string().min(3).max(64).default("ep_local"),
    allowedMethods: z
      .array(z.enum(["GET", "POST", "PUT", "PATCH"]))
      .min(1)
      .default(["POST"]),
    signatureHeader: z.string().max(80).default("x-signature"),
    signatureAlgorithm: z.enum(["none", "hmac-sha256"]).default("hmac-sha256"),
    secretRef: z.string().max(200).optional(),
    secretVersion: z.number().int().min(1).default(1),
    ipAllowlist: z.array(z.string()).max(50).default([]),
    corsOrigins: z.array(z.string()).max(20).default([]),
    maxBodyBytes: z.number().int().min(1024).max(2_000_000).default(256_000),
    dedupeKeyPath: z.string().max(200).optional(),
    replayWindowMs: z.number().int().min(0).max(86_400_000).default(300_000),
    responseMode: z.enum(["sync", "async"]).default("async"),
    responseStatusCode: z.number().int().min(200).max(299).default(202),
    mapping: z
      .object({
        body: z.string().default("input.body"),
        query: z.string().default("input.query"),
        headers: z.string().default("input.headers"),
      })
      .default({ body: "input.body", query: "input.query", headers: "input.headers" }),
  })
  .passthrough();

const formSchema = z
  .object({
    ...advanced,
    formId: z.string().min(1),
    formVersion: z.number().int().min(1).default(1),
    fieldMapping: z.record(z.string()).default({}),
    consentField: z.string().max(120).optional(),
    requireConsent: z.boolean().default(true),
    honeypotField: z.string().max(120).optional(),
    captcha: z.enum(["none", "turnstile", "recaptcha"]).default("none"),
    dedupeBy: z.enum(["none", "email", "phone"]).default("email"),
    dedupeWindowMs: z
      .number()
      .int()
      .min(0)
      .max(30 * 86_400_000)
      .default(86_400_000),
    attribution: z.record(z.string()).default({}),
  })
  .passthrough();

const listSchema = z
  .object({
    ...advanced,
    listId: z.string().min(1),
    event: z.enum(["added", "removed"]).default("added"),
    batchSize: z.number().int().min(1).max(500).default(50),
    cursor: z.string().max(200).optional(),
    dedupeWindowMs: z
      .number()
      .int()
      .min(0)
      .max(30 * 86_400_000)
      .default(3_600_000),
    catchUpWindowMs: z
      .number()
      .int()
      .min(0)
      .max(30 * 86_400_000)
      .default(86_400_000),
  })
  .passthrough();

const signalSchema = z
  .object({
    ...advanced,
    providerConnectionId: z.string().min(1),
    signalTypes: z.array(z.string().min(1)).min(1).default(["hiring"]),
    minScore: z.number().min(0).max(100).default(50),
    pollingWindowMs: z
      .number()
      .int()
      .min(60_000)
      .max(30 * 86_400_000)
      .default(3_600_000),
    cursor: z.string().max(200).optional(),
    requireEvidence: z.boolean().default(true),
    dedupeWindowMs: z
      .number()
      .int()
      .min(0)
      .max(30 * 86_400_000)
      .default(86_400_000),
  })
  .passthrough();

const meetingBookedSchema = z
  .object({
    ...advanced,
    calendarConnectionId: z.string().min(1),
    calendarId: z.string().min(1),
    eventTypes: z.array(z.string()).default([]),
    windowMs: z
      .number()
      .int()
      .min(60_000)
      .max(30 * 86_400_000)
      .default(86_400_000),
    timezone: timezoneSchema.default("Europe/Paris"),
    participantMapping: z.record(z.string()).default({}),
  })
  .passthrough();

const emailReplySchema = z
  .object({
    ...advanced,
    mailboxConnectionId: z.string().min(1),
    folders: z.array(z.string()).default(["INBOX"]),
    sequenceIds: z.array(z.string()).default([]),
    senderFilter: z.string().max(200).optional(),
    threadFilter: z.string().max(200).optional(),
    windowMs: z
      .number()
      .int()
      .min(60_000)
      .max(30 * 86_400_000)
      .default(86_400_000),
    readBody: z.boolean().default(false),
  })
  .passthrough();

function passthroughTrigger(blockId: string, schema: z.ZodTypeAny, kind: "local" | "provider") {
  return defineBlock({
    blockId,
    kind,
    schema,
    execute: async (ctx) => {
      const payload = ctx.input ?? {};
      ctx.log.info("Déclencheur initialisé", { blockId });
      return ok({ trigger: blockId, receivedAt: ctx.services.clock.isoNow(), payload });
    },
  });
}

export const triggerBlocks: BlockDefinition[] = [
  defineBlock({
    blockId: "trig-manual",
    kind: "local",
    schema: manualSchema,
    execute: async (ctx) => {
      const payload = ctx.input ?? {};
      ctx.log.info("Lancement manuel", { mode: ctx.services.mode });
      return ok({
        trigger: "manual",
        mode: ctx.services.mode,
        startedAt: ctx.services.clock.isoNow(),
        payload,
      });
    },
  }),

  defineBlock({
    blockId: "trig-schedule",
    kind: "local",
    schema: scheduleSchema,
    execute: async (ctx) => {
      const cron = cfgString(ctx, "cron", "0 9 * * 1-5");
      const timezone = cfgString(ctx, "timezone", "Europe/Paris");
      const next = nextCronOccurrence(cron);
      if (!next) {
        return skipped(`Expression cron invalide : ${cron}`);
      }
      const validUntil = cfgString(ctx, "validUntil");
      if (validUntil && Date.parse(validUntil) < Date.now()) {
        return skipped("Fenêtre de validité du planning expirée.");
      }
      ctx.log.info("Planification résolue", { cron, timezone, next: next.toISOString() });
      return ok({
        trigger: "schedule",
        cron,
        timezone,
        firedAt: ctx.services.clock.isoNow(),
        nextOccurrence: next.toISOString(),
        payload: ctx.input ?? ctx.config["runData"] ?? {},
      });
    },
  }),

  defineBlock({
    blockId: "trig-webhook",
    kind: "local",
    schema: webhookSchema,
    execute: async (ctx) => {
      const payload = (ctx.input ?? {}) as Record<string, unknown>;
      const maxBytes = cfgNumber(ctx, "maxBodyBytes", 256_000);
      const size = JSON.stringify(payload)?.length ?? 0;
      if (size > maxBytes) {
        return skipped(`Payload webhook trop volumineux (${size} > ${maxBytes}).`);
      }
      const responseMode = cfgString(ctx, "responseMode", "async");
      ctx.log.info("Webhook reçu", { responseMode, size });
      return ok({
        trigger: "webhook",
        endpointId: cfgString(ctx, "publicEndpointId"),
        responseMode,
        signatureVerified: cfgBool(ctx, "signatureVerified", true),
        body: payload["body"] ?? payload,
        query: payload["query"] ?? {},
        headers: payload["headers"] ?? {},
      });
    },
  }),

  passthroughTrigger("trig-form", formSchema, "local"),
  passthroughTrigger("trig-list", listSchema, "provider"),
  passthroughTrigger("trig-signal", signalSchema, "provider"),
  passthroughTrigger("trig-meeting-booked", meetingBookedSchema, "provider"),
  passthroughTrigger("trig-email-reply", emailReplySchema, "provider"),
];

/** Exporté pour les tests et la route webhook publique. */
export const triggerSchemas = {
  manual: manualSchema,
  schedule: scheduleSchema,
  webhook: webhookSchema,
  form: formSchema,
  list: listSchema,
  signal: signalSchema,
  meetingBooked: meetingBookedSchema,
  emailReply: emailReplySchema,
};

export const __unusedBranchHelper = branch;
