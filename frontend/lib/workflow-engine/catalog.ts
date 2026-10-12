//frontend\lib\workflow-engine\catalog.ts
/**
 * Métadonnées d'exécution des blocs — générées à partir du catalogue visuel
 * mais **volontairement dupliquées** ici : le backend ne doit pas dépendre de
 * `BlockDef` (React/lucide). Seul l'identifiant textuel est partagé.
 */

export type BlockCategory =
  | "trigger"
  | "search"
  | "enrichment"
  | "qualification"
  | "ai"
  | "condition"
  | "loop"
  | "variable"
  | "delay"
  | "meeting"
  | "crm"
  | "email"
  | "linkedin"
  | "phone"
  | "export"
  | "notification"
  | "webhook"
  | "api"
  | "integration"
  | "utility"
  | "report"
  | "error"
  | "end"
  | "organisation"
  | "custom";

export type BlockMeta = {
  id: string;
  category: BlockCategory;

  branches?: string[];

  inputs?: string[];
  /** Bloc terminal : jamais de sortie. */
  terminal?: boolean;

  executable?: boolean;

  trigger?: boolean;
};

export const BLOCK_META: BlockMeta[] = [
  { id: "trig-webhook", category: "trigger", trigger: true },
  { id: "trig-form", category: "trigger", trigger: true },
  { id: "trig-list", category: "trigger", trigger: true },
  { id: "trig-schedule", category: "trigger", trigger: true },
  { id: "trig-signal", category: "trigger", trigger: true },
  { id: "trig-manual", category: "trigger", trigger: true },
  { id: "trig-meeting-booked", category: "trigger", trigger: true },
  { id: "trig-email-reply", category: "trigger", trigger: true },
  { id: "search-people", category: "search" },
  { id: "search-company", category: "search" },
  { id: "search-lookalike", category: "search" },
  { id: "search-intent", category: "search" },
  { id: "search-domain", category: "search" },
  { id: "search-network", category: "search" },
  { id: "search-news", category: "search" },
  { id: "enrich-contact", category: "enrichment" },
  { id: "enrich-company", category: "enrichment" },
  { id: "enrich-verify-email", category: "enrichment" },
  { id: "enrich-social", category: "enrichment" },
  { id: "enrich-firmographics", category: "enrichment" },
  { id: "enrich-fingerprint", category: "enrichment" },
  { id: "qual-score", category: "qualification" },
  { id: "qual-tier", category: "qualification", branches: ["a", "b", "c"] },
  { id: "qual-icp-match", category: "qualification" },
  { id: "qual-budget", category: "qualification" },
  { id: "qual-engagement", category: "qualification" },
  { id: "ai-summarize", category: "ai" },
  { id: "ai-personalize", category: "ai" },
  { id: "ai-classify-intent", category: "ai" },
  { id: "ai-sentiment", category: "ai", branches: ["positive", "neutral", "negative"] },
  { id: "ai-agent", category: "ai", inputs: ["in", "context", "tools"] },
  { id: "ai-predict-churn", category: "ai" },
  { id: "ai-transcribe-call", category: "ai" },
  { id: "cond-if-else", category: "condition", branches: ["true", "false"] },
  { id: "cond-switch", category: "condition", branches: ["case1", "case2", "case3", "default"] },
  { id: "cond-country-router", category: "condition", branches: ["fr", "us", "other"] },
  { id: "cond-filter", category: "condition" },
  { id: "cond-random-split", category: "condition", branches: ["a", "b"] },
  { id: "cond-dedupe", category: "condition", branches: ["unique", "duplicate"] },
  { id: "loop-foreach", category: "loop" },
  { id: "loop-retry", category: "loop" },
  { id: "loop-paginate", category: "loop" },
  { id: "loop-batch", category: "loop" },
  { id: "loop-break", category: "loop" },
  { id: "var-set", category: "variable" },
  { id: "var-transform", category: "variable" },
  { id: "var-counter", category: "variable" },
  { id: "var-format-text", category: "variable" },
  { id: "var-toggle-flag", category: "variable" },
  { id: "var-uuid", category: "variable" },
  { id: "delay-wait", category: "delay" },
  { id: "delay-until-date", category: "delay" },
  { id: "delay-business-hours", category: "delay" },
  { id: "delay-snooze", category: "delay" },
  { id: "delay-pause", category: "delay" },
  { id: "meeting-propose-slots", category: "meeting" },
  { id: "meeting-remind", category: "meeting" },
  { id: "meeting-noshow", category: "meeting", branches: ["attended", "noshow"] },
  { id: "meeting-video-create", category: "meeting" },
  { id: "meeting-followup", category: "meeting" },
  { id: "crm-create-contact", category: "crm" },
  { id: "crm-update-stage", category: "crm" },
  { id: "crm-create-deal", category: "crm" },
  { id: "crm-assign-owner", category: "crm" },
  { id: "crm-log-activity", category: "crm" },
  { id: "email-send", category: "email" },
  { id: "email-sequence", category: "email" },
  { id: "email-check-reply", category: "email", branches: ["replied", "no-reply"] },
  { id: "email-track-open", category: "email" },
  { id: "email-unsubscribe", category: "email" },
  { id: "email-bounce", category: "email", branches: ["delivered", "bounced"] },
  { id: "li-connect", category: "linkedin" },
  { id: "li-message", category: "linkedin" },
  { id: "li-view-profile", category: "linkedin" },
  { id: "li-engage-post", category: "linkedin" },
  { id: "li-check-accepted", category: "linkedin", branches: ["accepted", "pending"] },
  { id: "phone-call-task", category: "phone" },
  { id: "phone-dial-auto", category: "phone" },
  { id: "phone-voicemail", category: "phone" },
  { id: "phone-sms", category: "phone" },
  { id: "phone-transfer", category: "phone" },
  { id: "phone-whatsapp", category: "phone" },
  { id: "export-csv", category: "export" },
  { id: "export-json", category: "export" },
  { id: "export-pdf-report", category: "export" },
  { id: "export-google-sheets", category: "export" },
  { id: "export-warehouse", category: "export" },
  { id: "notif-slack", category: "notification" },
  { id: "notif-inapp", category: "notification" },
  { id: "notif-email-internal", category: "notification" },
  { id: "notif-hot-lead", category: "notification" },
  { id: "notif-digest", category: "notification", inputs: ["in", "in2"] },
  { id: "webhook-send", category: "webhook" },
  { id: "webhook-listen", category: "webhook" },
  { id: "webhook-transform-payload", category: "webhook" },
  { id: "webhook-signature", category: "webhook" },
  { id: "webhook-relay", category: "webhook" },
  { id: "api-call", category: "api" },
  { id: "api-graphql", category: "api" },
  { id: "api-oauth-refresh", category: "api" },
  { id: "api-rate-limit", category: "api" },
  { id: "api-parse-response", category: "api" },
  { id: "int-salesforce", category: "integration" },
  { id: "int-hubspot", category: "integration" },
  { id: "int-slack-workflow", category: "integration" },
  { id: "int-zapier", category: "integration" },
  { id: "int-chrome-extension", category: "integration" },
  { id: "int-intercom", category: "integration" },
  { id: "util-comment", category: "utility", executable: false },
  { id: "util-sub-workflow", category: "utility" },
  { id: "util-merge", category: "utility", inputs: ["in", "in2", "in3"] },
  { id: "util-dedup-clean", category: "utility" },
  { id: "util-approval", category: "utility", branches: ["approved", "rejected"] },
  { id: "util-throttle", category: "utility" },
  { id: "report-generate", category: "report", inputs: ["in", "in2"] },
  { id: "report-funnel", category: "report" },
  { id: "report-trend", category: "report" },
  { id: "report-benchmark", category: "report" },
  { id: "report-export-dashboard", category: "report" },
  { id: "error-try-catch", category: "error", branches: ["success", "error"] },
  { id: "error-retry-policy", category: "error" },
  { id: "error-fallback", category: "error", inputs: ["in", "error"] },
  { id: "error-stop-workflow", category: "error", terminal: true },
  { id: "error-alert-oncall", category: "error" },
  { id: "end-workflow", category: "end", terminal: true },
  { id: "end-branch", category: "end", terminal: true },
  { id: "end-error", category: "end", terminal: true },
  { id: "custom-script", category: "custom" },
  { id: "custom-template", category: "custom" },
  { id: "custom-note", category: "custom", executable: false },
  { id: "custom-experiment", category: "custom" },
  { id: "custom-placeholder", category: "custom", executable: false },
  { id: "org-note", category: "organisation", executable: false },
  { id: "org-section", category: "organisation", executable: false },
  { id: "org-checklist", category: "organisation", executable: false },
  { id: "org-tag", category: "organisation", executable: false },
  { id: "org-team-message", category: "organisation", executable: false },
  { id: "org-highlight", category: "organisation", executable: false },
];

export const BLOCK_META_BY_ID: Record<string, BlockMeta> = Object.fromEntries(
  BLOCK_META.map((meta) => [meta.id, meta]),
);

export function isExecutableBlock(blockId: string): boolean {
  return BLOCK_META_BY_ID[blockId]?.executable !== false;
}

export function isTriggerBlock(blockId: string): boolean {
  return BLOCK_META_BY_ID[blockId]?.trigger === true;
}

export function outputPortsOf(blockId: string): string[] {
  const meta = BLOCK_META_BY_ID[blockId];
  if (!meta || meta.terminal) return [];
  return meta.branches && meta.branches.length > 0 ? meta.branches : ["out"];
}

export const TOTAL_BLOCKS = BLOCK_META.length;
