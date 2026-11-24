// frontend/components/mail/email-composer.tsx

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Bold,
  ChevronDown,
  Clock,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  Underline,
  UserPlus,
  X,
} from "@/components/icons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import {
  AttachmentDropOverlay,
  AttachmentPillRow,
  AttachFilesButton,
  fileToAttachment,
  useAttachmentDrop,
} from "./email-attachments";
import { ScheduleSendMenu, formatScheduleHint } from "./email-snooze";
import type {
  ComposerMode,
  ComposerState,
  EmailAddress,
  EmailAttachment,
  EmailRecord,
  MailAccount,
} from "@shared/types/email-types";

export type EmailComposerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ComposerState | null;
  account: MailAccount;
  onSend: (payload: ComposerPayload) => void | Promise<void>;
  onSaveDraft?: (payload: ComposerPayload) => void | Promise<void>;
  onScheduleSend?: (payload: ComposerPayload, at: Date) => void | Promise<void>;
  onDiscard?: () => void;
  cortexSuggestion?: {
    body: string;
    onUse?: () => void;
  };
};

export type ComposerPayload = {
  mode: ComposerMode;
  accountId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  attachments: EmailAttachment[];
  inReplyTo?: string;
  threadId?: string;
  draftId?: string;
};

function addrList(list: EmailAddress[] | undefined): EmailAddress[] {
  return list ?? [];
}

function uniqueByEmail(list: EmailAddress[]): EmailAddress[] {
  const seen = new Set<string>();
  const out: EmailAddress[] = [];
  for (const a of list) {
    const k = a.email.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a);
  }
  return out;
}

function buildInitial(state: ComposerState | null, account: MailAccount): ComposerPayload {
  const empty: ComposerPayload = {
    mode: "new",
    accountId: account.id,
    from: { name: account.name, email: account.email },
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    body: "\n\n" + (account.signature ?? ""),
    attachments: [],
  };

  if (!state) return empty;

  if (state.mode === "draft" && state.draft) {
    const d = state.draft;
    return {
      mode: "draft",
      accountId: d.accountId,
      from: d.from,
      to: addrList(d.to),
      cc: addrList(d.cc),
      bcc: addrList(d.bcc),
      subject: d.subject,
      body: d.body,
      attachments: d.attachments ?? [],
      threadId: d.threadId,
      draftId: d.draftId ?? d.id,
    };
  }

  const src = state.source;
  if (!src) {
    return {
      ...empty,
      to: state.presetTo ?? [],
      subject: state.presetSubject ?? "",
      body: (state.presetBody ?? "") + "\n\n" + (account.signature ?? ""),
    };
  }

  if (state.mode === "reply") {
    return {
      ...empty,
      mode: "reply",
      to: [src.from],
      subject: src.subject.startsWith("Re:") ? src.subject : `Re: ${src.subject}`,
      body: `\n\n---\nLe ${new Date(src.date).toLocaleString("fr-FR")}, ${
        src.from.name ?? src.from.email
      } a écrit :\n> ${src.preview}\n`,
      inReplyTo: src.id,
      threadId: src.threadId ?? src.id,
    };
  }

  if (state.mode === "replyAll") {
    const to = uniqueByEmail([
      src.from,
      ...src.to.filter((a) => a.email !== account.email),
    ]);
    const cc = uniqueByEmail(addrList(src.cc).filter((a) => a.email !== account.email));
    return {
      ...empty,
      mode: "replyAll",
      to,
      cc,
      subject: src.subject.startsWith("Re:") ? src.subject : `Re: ${src.subject}`,
      body: `\n\n---\nLe ${new Date(src.date).toLocaleString("fr-FR")}, ${
        src.from.name ?? src.from.email
      } a écrit :\n> ${src.preview}\n`,
      inReplyTo: src.id,
      threadId: src.threadId ?? src.id,
    };
  }

  if (state.mode === "forward") {
    const subject = src.subject.startsWith("Fwd:") ? src.subject : `Fwd: ${src.subject}`;
    const body =
      `\n\n--- Message transféré ---\n` +
      `De : ${src.from.name ?? ""} <${src.from.email}>\n` +
      `Date : ${new Date(src.date).toLocaleString("fr-FR")}\n` +
      `Objet : ${src.subject}\n\n` +
      `${src.body}\n`;
    return {
      ...empty,
      mode: "forward",
      subject,
      body: body + "\n" + (account.signature ?? ""),
      attachments: src.attachments ?? [],
      threadId: src.threadId ?? src.id,
    };
  }

  return empty;
}

export function EmailComposer({
  open,
  onOpenChange,
  state,
  account,
  onSend,
  onSaveDraft,
  onScheduleSend,
  onDiscard,
  cortexSuggestion,
}: EmailComposerProps) {
  const [payload, setPayload] = useState<ComposerPayload>(() =>
    buildInitial(state, account),
  );
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const drop = useAttachmentDrop({
    onDrop: (files) =>
      setPayload((p) => ({
        ...p,
        attachments: [...p.attachments, ...files.map(fileToAttachment)],
      })),
  });

  useEffect(() => {
    if (!open) return;
    setPayload(buildInitial(state, account));
    setShowCc(Boolean(state?.source?.cc?.length));
    setShowBcc(Boolean(state?.source?.bcc?.length));
    requestAnimationFrame(() => bodyRef.current?.focus());
  }, [open, state, account]);

  const title = useMemo(() => {
    switch (payload.mode) {
      case "reply":
        return "Répondre";
      case "replyAll":
        return "Répondre à tous";
      case "forward":
        return "Transférer";
      case "draft":
        return "Brouillon";
      default:
        return "Nouveau message";
    }
  }, [payload.mode]);

  const commit = async (
    sender: (p: ComposerPayload) => void | Promise<void>,
    at?: Date,
  ) => {
    setSending(true);
    try {
      if (at && onScheduleSend) {
        await onScheduleSend(payload, at);
        toast.success(`Envoi programmé · ${formatScheduleHint(at)}`);
      } else {
        await sender(payload);
        toast.success("Message envoyé");
      }
      onOpenChange(false);
    } catch {
      toast.error("Échec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (payload.to.length === 0) {
      toast.error("Ajoutez au moins un destinataire");
      return;
    }
    if (!payload.subject.trim()) {
      toast.error("Ajoutez un objet");
      return;
    }
    void commit(onSend);
  };

  const handleDraft = () => {
    if (!onSaveDraft) return;
    void onSaveDraft(payload);
    toast.success("Brouillon enregistré");
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onDiscard?.();
    onOpenChange(false);
  };

  const addAddress = (kind: "to" | "cc" | "bcc", raw: string) => {
    const value = raw.trim().replace(/[,;]+$/, "");
    if (!value) return;
    const tokens = value.split(/[,;]\s*/).filter(Boolean);
    const additions: EmailAddress[] = tokens.map((t) => {
      const m = t.match(/^(.*?)\s*<\s*(.+?)\s*>$/);
      if (m) return { name: m[1]!.trim(), email: m[2]!.trim() };
      return { email: t.trim() };
    });
    setPayload((p) => ({ ...p, [kind]: [...p[kind], ...additions] }));
  };

  const onChipKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    kind: "to" | "cc" | "bcc",
    value: string,
    setValue: (v: string) => void,
  ) => {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      if (value.trim()) {
        addAddress(kind, value);
        setValue("");
      }
    } else if (e.key === "Backspace" && !value) {
      setPayload((p) => {
        const arr = p[kind];
        if (arr.length === 0) return p;
        return { ...p, [kind]: arr.slice(0, -1) };
      });
    }
  };

  const removeAddress = (kind: "to" | "cc" | "bcc", email: string) => {
    setPayload((p) => ({ ...p, [kind]: p[kind].filter((a) => a.email !== email) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "email-composer-shell flex flex-col gap-0 overflow-hidden p-0",
          expanded ? "h-[95vh] w-[95vw] max-w-[1100px]" : "sm:max-w-3xl",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 pr-14">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate font-display text-base italic md:text-lg">{title}</h2>
            {payload.mode === "draft" && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                brouillon
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Réduire" : "Agrandir"}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              aria-label="Fermer"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <div {...drop.bind} className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
          {drop.dragging && <AttachmentDropOverlay />}

          <div className="shrink-0 space-y-0 border-b border-border">
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2">
              <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                De
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <LetterAvatar name={account.name} size={20} shape="rounded" />
                <span className="truncate text-xs">
                  {account.name}{" "}
                  <span className="text-muted-foreground">&lt;{account.email}&gt;</span>
                </span>
              </div>
            </div>

            <RecipientRow
              label="À"
              chips={payload.to}
              input={toInput}
              setInput={setToInput}
              onKeyDown={(e) => onChipKeyDown(e, "to", toInput, setToInput)}
              onAdd={() => {
                addAddress("to", toInput);
                setToInput("");
              }}
              onRemove={(email) => removeAddress("to", email)}
              trailing={
                !showCc ? (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="ml-auto text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cc
                  </button>
                ) : null
              }
            />

            {showCc && (
              <RecipientRow
                label="Cc"
                chips={payload.cc}
                input={ccInput}
                setInput={setCcInput}
                onKeyDown={(e) => onChipKeyDown(e, "cc", ccInput, setCcInput)}
                onAdd={() => {
                  addAddress("cc", ccInput);
                  setCcInput("");
                }}
                onRemove={(email) => removeAddress("cc", email)}
                trailing={
                  !showBcc ? (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="ml-auto text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cci
                    </button>
                  ) : null
                }
              />
            )}

            {showBcc && (
              <RecipientRow
                label="Cci"
                chips={payload.bcc}
                input={bccInput}
                setInput={setBccInput}
                onKeyDown={(e) => onChipKeyDown(e, "bcc", bccInput, setBccInput)}
                onAdd={() => {
                  addAddress("bcc", bccInput);
                  setBccInput("");
                }}
                onRemove={(email) => removeAddress("bcc", email)}
              />
            )}

            <div className="flex items-center gap-3 border-t border-border/60 px-4 py-2">
              <span className="w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Objet
              </span>
              <input
                value={payload.subject}
                onChange={(e) => setPayload((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Sans objet"
                className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex min-h-[200px] flex-1 flex-col">
            <textarea
              ref={bodyRef}
              value={payload.body}
              onChange={(e) => setPayload((p) => ({ ...p, body: e.target.value }))}
              placeholder="Écrivez votre message…"
              className="min-h-[160px] w-full flex-1 resize-none bg-transparent px-4 py-3 text-[12.5px] leading-relaxed outline-none placeholder:text-muted-foreground"
            />
          </div>

          {payload.attachments.length > 0 && (
            <div className="shrink-0 border-t border-border bg-surface/30 px-3 py-2">
              <AttachmentPillRow
                attachments={payload.attachments}
                onRemove={(id) =>
                  setPayload((p) => ({
                    ...p,
                    attachments: p.attachments.filter((a) => a.id !== id),
                  }))
                }
              />
            </div>
          )}

          {cortexSuggestion && (
            <div className="shrink-0 border-t border-primary/30 bg-primary/[0.04] px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Suggestion Cortex
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/80">
                    {cortexSuggestion.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cortexSuggestion.onUse}
                  className="shrink-0 rounded-md border border-primary/40 bg-background px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Utiliser
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-background px-3 py-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || payload.to.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send className="size-3.5" />
            {sending ? "Envoi…" : "Envoyer"}
          </button>

          {onScheduleSend && (
            <ScheduleSendMenu
              onSchedule={(date) => void commit(onSend, date)}
              trigger={
                <button
                  type="button"
                  disabled={sending || payload.to.length === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
                >
                  <Clock className="size-3.5" />
                  <ChevronDown className="size-3" />
                </button>
              }
            />
          )}

          <div className="mx-1 h-5 w-px bg-border" />

          <FormattingToolbar />

          <AttachFilesButton
            onPick={(files) =>
              setPayload((p) => ({
                ...p,
                attachments: [...p.attachments, ...files.map(fileToAttachment)],
              }))
            }
          />

          <button
            type="button"
            aria-label="Ajouter un destinataire"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <UserPlus className="size-3.5" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {onSaveDraft && (
              <button
                type="button"
                onClick={handleDraft}
                className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                Brouillon
              </button>
            )}
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              Annuler
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecipientRow({
  label,
  chips,
  input,
  setInput,
  onKeyDown,
  onAdd,
  onRemove,
  trailing,
}: {
  label: string;
  chips: EmailAddress[];
  input: string;
  setInput: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  onRemove: (email: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 px-4 py-2">
      <span className="mt-1 w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <span
            key={c.email}
            className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px]"
          >
            <span className="truncate font-medium">{c.name ?? c.email}</span>
            {c.name && (
              <span className="truncate text-[10px] text-muted-foreground">
                &lt;{c.email}&gt;
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(c.email)}
              aria-label={`Retirer ${c.email}`}
              className="grid size-3.5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <X className="size-2.5" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (input.trim()) onAdd();
          }}
          placeholder={chips.length === 0 ? "nom@exemple.com" : ""}
          className="min-w-[140px] flex-1 bg-transparent py-0.5 text-xs outline-none placeholder:text-muted-foreground"
          type="email"
        />
      </div>
      {trailing}
    </div>
  );
}

function FormattingToolbar() {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <FmtBtn label="Gras"><Bold className="size-3.5" /></FmtBtn>
      <FmtBtn label="Italique"><Italic className="size-3.5" /></FmtBtn>
      <FmtBtn label="Souligné"><Underline className="size-3.5" /></FmtBtn>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <FmtBtn label="Liste à puces"><List className="size-3.5" /></FmtBtn>
      <FmtBtn label="Liste numérotée"><ListOrdered className="size-3.5" /></FmtBtn>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <FmtBtn label="Lien"><LinkIcon className="size-3.5" /></FmtBtn>
      <FmtBtn label="Pièce jointe"><Paperclip className="size-3.5" /></FmtBtn>
    </div>
  );
}

function FmtBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}
