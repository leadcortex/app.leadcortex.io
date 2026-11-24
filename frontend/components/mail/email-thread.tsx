// frontend/components/mail/email-thread.tsx

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Forward,
  Loader2,
  Paperclip,
  Reply,
  ReplyAll,
  Star,
} from "@/components/icons";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { Badge } from "@/components/common/ui-primitives";
import { cn } from "@/lib/core/utils";
import {
  formatRelativeDate,
  type EmailLabel,
  type EmailRecord,
} from "@shared/types/email-types";
import { useGmailMessage } from "@/hooks/use-gmail-message";
import { AttachmentGrid, AttachmentPillRow } from "./email-attachments";
import { EmailMessageBody } from "./email-message-body";
import { LabelChipRow } from "./email-labels";

export function groupEmailsByThread(list: EmailRecord[]): EmailRecord[][] {
  const map = new Map<string, EmailRecord[]>();
  for (const e of list) {
    const key = e.threadId ?? e.id;
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.values())
    .map((arr) => arr.slice().sort((a, b) => a.date.localeCompare(b.date)))
    .sort((a, b) => (b[b.length - 1]!.date).localeCompare(a[a.length - 1]!.date));
}

export function getThreadPreview(list: EmailRecord[]): EmailRecord {
  return list[list.length - 1]!;
}

export function ThreadHeader({
  messages,
  labels,
  onReply,
  onReplyAll,
  onForward,
  onToggleStar,
  isStarred,
}: {
  messages: EmailRecord[];
  labels: EmailLabel[];
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onToggleStar?: () => void;
  isStarred?: boolean;
}) {
  const root = messages[0]!;
  const total = messages.length;
  const hasAttachments = messages.some((m) => (m.attachments?.length ?? 0) > 0);
  const labelIds = Array.from(new Set(messages.flatMap((m) => m.labels ?? [])));
  const activeLabels = labels.filter((l) => labelIds.includes(l.id));

  return (
    <div className="border-b border-border bg-background px-3 pt-3 md:px-4 md:pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="min-w-0 flex-1 font-display text-lg italic leading-tight break-words md:text-2xl">
          {root.subject}
        </h1>

        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleStar && (
            <button
              type="button"
              onClick={onToggleStar}
              aria-label="Favori"
              className="grid size-7 place-items-center rounded-lg transition-colors hover:bg-secondary"
            >
              <Star
                className={cn("size-4", isStarred && "fill-amber-400 text-amber-400")}
              />
            </button>
          )}
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              aria-label="Répondre (r)"
              title="Répondre (r)"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Reply className="size-4" />
            </button>
          )}
          {onReplyAll && (
            <button
              type="button"
              onClick={onReplyAll}
              aria-label="Répondre à tous (a)"
              title="Répondre à tous (a)"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ReplyAll className="size-4" />
            </button>
          )}
          {onForward && (
            <button
              type="button"
              onClick={onForward}
              aria-label="Transférer (f)"
              title="Transférer (f)"
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Forward className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pb-3">
        {activeLabels.length > 0 && <LabelChipRow labels={activeLabels} size="sm" />}
        <Badge tone="muted">
          {total === 1 ? "1 message" : `${total} messages`}
        </Badge>
        {hasAttachments && (
          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <Paperclip className="size-3" strokeWidth={1.8} />
            Pièces jointes
          </span>
        )}
      </div>
    </div>
  );
}

function ThreadMessage({
  message,
  labels,
  defaultExpanded,
  isLast,
  source,
}: {
  message: EmailRecord;
  labels: EmailLabel[];
  defaultExpanded: boolean;
  isLast: boolean;
  source: "demo" | "gmail";
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const activeLabels = useMemo(
    () => labels.filter((l) => (message.labels ?? []).includes(l.id)),
    [labels, message.labels],
  );

  const gmail = useGmailMessage({
    accountId: message.accountId,
    messageId: expanded && source === "gmail" ? message.id : null,
    enabled: expanded && source === "gmail",
  });

  const displayBody =
    source === "gmail" ? (gmail.body ?? message.body) : message.body;
  const isLoadingBody = source === "gmail" && gmail.loading;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="group flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-surface/40 md:px-4"
      >
        <LetterAvatar
          name={message.from.name ?? message.from.email}
          size={28}
          shape="circle"
        />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-xs font-medium">
            {message.from.name ?? message.from.email}
          </span>
          {activeLabels.length > 0 && <LabelChipRow labels={activeLabels} size="sm" />}
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
            {formatRelativeDate(message.date)}
          </span>
        </div>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
      </button>
    );
  }

  return (
    <article
      className={cn(
        "border-b border-border px-3 py-4 md:px-4 md:py-5",
        !isLast && "bg-background",
      )}
    >
      <header className="mb-4 flex items-start gap-3">
        <LetterAvatar
          name={message.from.name ?? message.from.email}
          size={36}
          shape="circle"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">
              {message.from.name ?? message.from.email}
            </p>
            {activeLabels.length > 0 && <LabelChipRow labels={activeLabels} size="sm" />}
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
            &lt;{message.from.email}&gt; · à{" "}
            {message.to.map((t) => t.name ?? t.email).join(", ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10.5px] text-muted-foreground">
            {formatRelativeDate(message.date)}
          </span>
          {!isLast && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Replier"
              className="grid size-6 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ChevronDown className="size-3.5 rotate-180" />
            </button>
          )}
        </div>
      </header>

      <div className="pl-0 md:pl-12">
        {isLoadingBody ? (
          <div className="flex items-center gap-2 py-2 text-[11.5px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Chargement du message…
          </div>
        ) : gmail.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11.5px] text-destructive">
            {gmail.error}
          </div>
        ) : (
          <EmailMessageBody body={displayBody} />
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4">
            <AttachmentGrid attachments={message.attachments} />
          </div>
        )}
      </div>
    </article>
  );
}

export function ThreadMessageList({
  messages,
  labels,
  source = "demo",
}: {
  messages: EmailRecord[];
  labels: EmailLabel[];
  source?: "demo" | "gmail";
}) {
  const lastId = messages[messages.length - 1]?.id;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {messages.map((m, i) => (
        <ThreadMessage
          key={m.id}
          message={m}
          labels={labels}
          defaultExpanded={m.id === lastId}
          isLast={i === messages.length - 1}
          source={source}
        />
      ))}
    </div>
  );
}

export function ThreadPreviewRow({
  messages,
  labels,
  active,
  onClick,
  onContext,
}: {
  messages: EmailRecord[];
  labels: EmailLabel[];
  active: boolean;
  onClick: () => void;
  onContext?: (e: React.MouseEvent) => void;
}) {
  const last = messages[messages.length - 1]!;
  const root = messages[0]!;
  const isUnread = messages.some((m) => m.unread);
  const hasAttachments = messages.some((m) => (m.attachments?.length ?? 0) > 0);
  const count = messages.length;
  const activeLabels = labels.filter((l) =>
    messages.some((m) => (m.labels ?? []).includes(l.id)),
  );

  return (
    <button
      onClick={onClick}
      onContextMenu={onContext}
      className={cn(
        "group relative flex w-full flex-col gap-1 border-b border-border/60 px-3 py-3 text-left transition-colors",
        active ? "bg-primary/[0.06]" : "hover:bg-surface/60",
      )}
    >
      <div className="flex items-start gap-2">
        <LetterAvatar
          name={root.from.name ?? root.from.email}
          size={32}
          shape="circle"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "truncate text-xs",
                isUnread ? "font-semibold text-foreground" : "font-medium",
              )}
            >
              {root.from.name ?? root.from.email}
            </span>
            {count > 1 && (
              <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                {count}
              </span>
            )}
            {hasAttachments && (
              <Paperclip
                className="size-2.5 shrink-0 text-muted-foreground"
                strokeWidth={2}
              />
            )}
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
              {formatRelativeDate(last.date)}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[12.5px]",
              isUnread ? "text-foreground font-medium" : "text-foreground/80",
            )}
          >
            {root.subject}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {last.preview}
          </p>
          {activeLabels.length > 0 && (
            <LabelChipRow labels={activeLabels} size="sm" className="mt-1" />
          )}
        </div>
      </div>
    </button>
  );
}

export function ThreadAttachmentsSummary({ messages }: { messages: EmailRecord[] }) {
  const all = messages.flatMap((m) => m.attachments ?? []);
  if (all.length === 0) return null;
  return (
    <div className="border-t border-border bg-surface/40 px-3 py-2 md:px-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {all.length} pièce{all.length > 1 ? "s" : ""} jointe{all.length > 1 ? "s" : ""}
      </p>
      <AttachmentPillRow attachments={all} variant="compact" />
    </div>
  );
}
