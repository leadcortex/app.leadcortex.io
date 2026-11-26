// frontend/components/conversations/conversation-thread.tsx

import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CheckCheck, FileText, Phone, Settings2, Video } from "@/components/icons";
import { toast } from "sonner";
import {
  CHANNELS,
  CHANNEL_ORDER,
  formatSize,
  type ChannelId,
  type ChatMessage,
  type ProspectThread,
} from "@/lib/conversations-mock";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { MessageComposer } from "./message-composer";

export function ConversationThread({
  thread,
  channel,
  messages,
  onChannelChange,
  onSend,
  onBack,
  onOpenSettings,
}: {
  thread: ProspectThread;
  channel: ChannelId;
  messages: ChatMessage[];
  onChannelChange: (c: ChannelId) => void;
  onSend: (text: string, attachments: ChatMessage["attachments"]) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}) {
  const theme = CHANNELS[channel];
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, channel, thread.id]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header
        className="shrink-0 border-b border-border px-2 py-2 md:px-4 md:py-3"
        style={{ backgroundColor: `color-mix(in oklab, ${theme.accent} 7%, transparent)` }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Retour à la liste"
            className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-surface active:bg-surface/80 md:hidden"
          >
            <ArrowLeft className="size-4" />
          </button>

          <Link
            to="/app/people/$id"
            params={{ id: thread.id }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-foreground/[0.03]"
          >
            <LetterAvatar name={thread.contact} size={36} shape="circle" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{thread.contact}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {[thread.role, thread.company].filter((v) => v && v !== "—").join(" · ")}
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-0.5">
            <HeaderBtn
              label="Appeler"
              onClick={() => toast.info("Appel simulé (démo)")}
              className="hidden sm:grid"
            >
              <Phone className="size-4" />
            </HeaderBtn>
            <HeaderBtn
              label="Visio"
              onClick={() => toast.info("Visio simulée (démo)")}
              className="hidden sm:grid"
            >
              <Video className="size-4" />
            </HeaderBtn>
            <HeaderBtn label="Paramètres" onClick={onOpenSettings}>
              <Settings2 className="size-4" />
            </HeaderBtn>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CHANNEL_ORDER.filter((c) => thread.channels.includes(c)).map((c) => {
            const t = CHANNELS[c];
            const Icon = t.icon;
            const active = c === channel;
            return (
              <button
                key={c}
                onClick={() => onChannelChange(c)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors active:opacity-80"
                style={{
                  borderColor: active ? t.accent : "var(--border)",
                  color: active ? t.accent : "var(--muted-foreground)",
                  backgroundColor: active
                    ? `color-mix(in oklab, ${t.accent} 12%, transparent)`
                    : "transparent",
                }}
              >
                <Icon className="size-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {messages.length === 0 ? (
        <div
          className="relative grid min-h-0 flex-1 place-items-center overflow-hidden p-6"
          style={{ backgroundColor: `color-mix(in oklab, ${theme.accent} 3%, transparent)` }}
        >
          <div className="max-w-sm text-center">
            <span
              className="mx-auto grid size-12 place-items-center rounded-xl text-background"
              style={{ backgroundColor: theme.accent }}
            >
              <theme.icon className="size-6" strokeWidth={1.8} />
            </span>
            <p className="mt-4 text-sm font-medium">Aucun message sur {theme.label}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Écrivez à {thread.contact} dans le champ ci-dessous.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 md:p-6"
          style={{ backgroundColor: `color-mix(in oklab, ${theme.accent} 3%, transparent)` }}
        >
          {messages.map((m) => (
            <Bubble key={m.id} m={m} accent={theme.accent} />
          ))}
        </div>
      )}

      <MessageComposer channel={channel} thread={thread} onSend={(text, at) => onSend(text, at)} />
    </div>
  );
}

function Bubble({ m, accent }: { m: ChatMessage; accent: string }) {
  return (
    <div className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
      <div className="min-w-0 max-w-[88%] md:max-w-[68%]">
        <div
          className="rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line break-words md:text-sm"
          style={
            m.me
              ? { backgroundColor: accent, color: "var(--background)" }
              : { backgroundColor: "var(--background)", border: "1px solid var(--border)" }
          }
        >
          {m.text}
          {m.attachments && m.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {m.attachments.map((a) =>
                a.kind === "image" && a.url ? (
                  <img
                    key={a.id}
                    src={a.url}
                    alt={a.name}
                    className="max-h-48 w-full rounded-xl object-cover"
                  />
                ) : (
                  <span
                    key={a.id}
                    className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${m.me ? "bg-background/20" : "bg-surface/70"}`}
                  >
                    <FileText className="size-4 shrink-0" strokeWidth={1.6} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs">{a.name}</span>
                      <span className="block text-[11px] opacity-70">{formatSize(a.size)}</span>
                    </span>
                  </span>
                ),
              )}
            </div>
          )}
        </div>
        <div
          className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground ${m.me ? "justify-end" : ""}`}
        >
          <span>{m.time}</span>
          {m.me && m.status && (
            <span className="inline-flex items-center gap-0.5">
              {m.status === "lu" ? (
                <CheckCheck className="size-3" style={{ color: accent }} />
              ) : (
                <Check className="size-3" />
              )}
              {m.status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderBtn({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground active:bg-surface/80 md:size-8 ${className}`}
    >
      {children}
    </button>
  );
}
