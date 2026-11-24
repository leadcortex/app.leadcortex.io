// frontend/lib/mail/gmail-label-mapping.ts

import type { FolderKey } from "@shared/types/email-types";

export const GMAIL_SYSTEM_LABELS = [
  "INBOX",
  "SENT",
  "DRAFT",
  "SPAM",
  "TRASH",
  "UNREAD",
  "STARRED",
  "IMPORTANT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
] as const;

export type GmailSystemLabel = (typeof GMAIL_SYSTEM_LABELS)[number];

export type GmailFolderQuery =
  | "inbox"
  | "starred"
  | "sent"
  | "drafts"
  | "scheduled"
  | "archive"
  | "spam"
  | "trash";

export function gmailQueryForFolder(folder: GmailFolderQuery): string {
  switch (folder) {
    case "sent":
      return "in:sent";
    case "drafts":
      return "in:drafts";
    case "spam":
      return "in:spam";
    case "trash":
      return "in:trash";
    case "starred":
      return "is:starred -in:trash -in:spam";
    case "archive":
      return "-in:inbox -in:sent -in:drafts -in:trash -in:spam";
    case "scheduled":
      return "in:drafts";
    case "inbox":
    default:
      return "in:inbox";
  }
}

export function folderFromLabelIds(labelIds: string[]): FolderKey {
  const set = new Set(labelIds);
  if (set.has("TRASH")) return "trash";
  if (set.has("SPAM")) return "spam";
  if (set.has("DRAFT")) return "drafts";
  if (set.has("SENT")) return "sent";
  if (set.has("INBOX")) return "inbox";
  return "archive";
}

export function customLabelsFromLabelIds(labelIds: string[]): string[] {
  return labelIds.filter((id) => id.startsWith("Label_"));
}

export function flagsFromLabelIds(labelIds: string[]): {
  starred: boolean;
  unread: boolean;
  important: boolean;
} {
  const set = new Set(labelIds);
  return {
    starred: set.has("STARRED"),
    unread: set.has("UNREAD"),
    important: set.has("IMPORTANT"),
  };
}

export function isCategoryLabel(id: string): boolean {
  return id.startsWith("CATEGORY_");
}
