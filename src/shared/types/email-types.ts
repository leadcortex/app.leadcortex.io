// src/shared/types/email-types.ts

export type MailProvider = "gmail" | "outlook" | "yahoo" | "icloud" | "imap";

export type FolderKey =
  "inbox" | "starred" | "sent" | "drafts" | "scheduled" | "archive" | "spam" | "trash";

export type MailAccount = {
  id: string;
  name: string;
  email: string;
  provider: MailProvider;
  unread?: number;
  signature?: string;
  isDefault?: boolean;
};

export type EmailAddress = {
  name?: string;
  email: string;
};

export type AttachmentKind = "image" | "document" | "audio" | "video" | "archive" | "other";

export type EmailAttachment = {
  id: string;
  name: string;
  size: number;
  mime: string;
  url?: string;
  kind?: AttachmentKind;
};

export type EmailLabel = {
  id: string;
  name: string;
  color: string;
};

export type EmailStatus = "replied" | "opened" | "sent" | "bounced" | "draft" | "scheduled";

export type EmailRecord = {
  id: string;
  threadId?: string;
  accountId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  preview: string;
  body: string;
  date: string;
  unread: boolean;
  starred?: boolean;
  status: EmailStatus;
  folder: FolderKey;
  labels?: string[];
  attachments?: EmailAttachment[];
  inReplyTo?: string;
  draftId?: string;
  scheduledAt?: string;
  snoozedUntil?: string;
};

export type ComposerMode = "new" | "reply" | "replyAll" | "forward" | "draft";

export type ComposerState = {
  mode: ComposerMode;
  source?: EmailRecord;
  draft?: EmailRecord;
  presetTo?: EmailAddress[];
  presetSubject?: string;
  presetBody?: string;
};

export type SearchFilters = {
  query: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  labels?: string[];
  folder?: FolderKey;
  dateFrom?: string;
  dateTo?: string;
  provider?: MailProvider;
};

export const EMPTY_FILTERS: SearchFilters = { query: "" };

export function hasActiveFilters(f: SearchFilters): boolean {
  return Boolean(
    f.query ||
    f.from ||
    f.to ||
    f.subject ||
    f.hasAttachment ||
    f.isUnread ||
    f.isStarred ||
    (f.labels && f.labels.length > 0) ||
    f.dateFrom ||
    f.dateTo,
  );
}

export type TimeOption = {
  id: string;
  label: string;
  hint?: string;
  compute: () => Date;
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function classifyMime(mime: string): AttachmentKind {
  if (!mime) return "other";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  if (/zip|rar|7z|tar|gzip/.test(mime)) return "archive";
  if (/word|excel|powerpoint|text|sheet|presentation/.test(mime)) return "document";
  return "other";
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const diff = now - date.getTime();
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < min) return "à l'instant";
  if (diff < hour) return `il y a ${Math.floor(diff / min)} min`;
  if (diff < day) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }
  if (diff < 7 * day) {
    const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
    return days[date.getDay()] ?? "";
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
