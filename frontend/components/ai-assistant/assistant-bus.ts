//frontend\components\ai-assistant\assistant-bus.ts
import type { AssistantAttachment } from "./assistant-engine";

export const ASSISTANT_OPEN_EVENT = "lc:assistant-open";

export type AssistantOpenDetail = {
  prompt?: string;

  attachments?: AssistantAttachment[];
};

export function openAssistant(detail: AssistantOpenDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AssistantOpenDetail>(ASSISTANT_OPEN_EVENT, { detail }));
}
