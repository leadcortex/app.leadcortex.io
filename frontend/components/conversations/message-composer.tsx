//frontend\components\conversations\message-composer.tsx
import { useLayoutEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Link2, Plus, Send, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHANNELS,
  formatSize,
  type ChannelId,
  type ChatAttachment,
  type ProspectThread,
} from "@/lib/conversations-mock";
import { openAssistant } from "@/components/ai-assistant/assistant-bus";

const EMOJIS = [
  "😀",
  "😄",
  "😊",
  "🙂",
  "😉",
  "😍",
  "🤔",
  "😅",
  "😂",
  "🙃",
  "😎",
  "🤝",
  "👍",
  "👏",
  "🙌",
  "🙏",
  "👋",
  "💪",
  "🔥",
  "✨",
  "⭐",
  "🎉",
  "🚀",
  "💡",
  "✅",
  "❌",
  "❤️",
  "💯",
  "📈",
  "📊",
  "💼",
  "📅",
  "⏰",
  "📍",
  "📎",
  "✉️",
];

const TEXTAREA_MAX = 180;

export function MessageComposer({
  channel,
  thread,
  onSend,
}: {
  channel: ChannelId;
  thread: ProspectThread;
  onSend: (text: string, attachments: ChatAttachment[]) => void;
}) {
  const theme = CHANNELS[channel];
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, TEXTAREA_MAX) + "px";
    el.style.overflowY = el.scrollHeight > TEXTAREA_MAX ? "auto" : "hidden";
  }, [value]);

  const addFiles = (files: FileList | null, kind: "image" | "document") => {
    if (!files) return;
    const next: ChatAttachment[] = Array.from(files).map((f, i) => {
      const isImage = f.type.startsWith("image/");
      const base = {
        id: `at${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        kind: (isImage ? "image" : kind) as "image" | "document",
      };
      return isImage ? { ...base, url: URL.createObjectURL(f) } : base;
    });
    setAttachments((a) => [...a, ...next]);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + emoji);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const attachContext = () => {
    setAddOpen(false);
    openAssistant({
      prompt: `Contexte : conversation avec ${thread.contact} (${thread.company}) sur ${theme.label}. `,
      attachments: [
        {
          id: `ctx_${thread.id}`,
          name: `${thread.contact} · ${theme.label}`,
          size: 0,
          kind: "context",
        },
      ],
    });
  };

  const submit = () => {
    if (!value.trim() && attachments.length === 0) return;
    onSend(value.trim(), attachments);
    setValue("");
    setAttachments([]);
  };

  return (
    // Le composer est ancré en bas de son conteneur (flex-col parent). Le
    // padding inférieur inclut la hauteur réelle de la barre mobile
    // (`--pen-nav-h`) ET la safe-area iOS : c'est ce qui garantit que le
    // champ reste visible et tapable même sur un iPhone avec encoche.
    <div
      className="shrink-0 border-t border-border p-2.5 pb-[calc(var(--pen-nav-h,0px)+env(safe-area-inset-bottom,0px)+0.625rem)] md:p-3 md:pb-3"
      style={{ backgroundColor: `color-mix(in oklab, ${theme.accent} 4%, transparent)` }}
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background py-1 pl-1 pr-1.5"
            >
              {a.kind === "image" && a.url ? (
                <img src={a.url} alt={a.name} className="size-8 rounded-lg object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-lg bg-secondary/60">
                  <FileText className="size-3.5" strokeWidth={1.6} />
                </span>
              )}
              <span className="min-w-0">
                <span className="block max-w-[110px] truncate text-[11px] leading-tight">
                  {a.name}
                </span>
                <span className="block text-[10px] leading-tight text-muted-foreground">
                  {formatSize(a.size)}
                </span>
              </span>
              <button
                onClick={() => setAttachments((p) => p.filter((x) => x.id !== a.id))}
                aria-label="Retirer la pièce jointe"
                className="grid size-7 place-items-center rounded-md hover:bg-surface active:bg-surface/80"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className="rounded-2xl border bg-background transition-colors"
        style={{ borderColor: `color-mix(in oklab, ${theme.accent} 35%, var(--border))` }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={theme.placeholder}
          className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[13px] outline-none placeholder:text-muted-foreground md:text-[12.5px]"
          style={{ minHeight: 44, maxHeight: TEXTAREA_MAX }}
        />
        <div className="flex items-center gap-0.5 px-2 pb-2">
          <AddMenu
            open={addOpen}
            setOpen={setAddOpen}
            onPickImage={() => {
              imageInput.current?.click();
              setAddOpen(false);
            }}
            onPickDocument={() => {
              fileInput.current?.click();
              setAddOpen(false);
            }}
            onPickContext={attachContext}
          />

          <div className="relative hidden md:block">
            <button
              type="button"
              aria-label="Choisir un emoji"
              title="Choisir un emoji"
              onClick={() => setEmojiOpen((v) => !v)}
              className={cn(
                "grid size-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface hover:text-foreground",
                emojiOpen && "bg-surface text-foreground",
              )}
            >
              <Smile className="size-4" strokeWidth={1.6} />
            </button>
            {emojiOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setEmojiOpen(false)} />
                <div className="absolute bottom-full left-0 z-40 mb-2 w-72 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
                  <p className="px-1 pb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Emojis fréquents
                  </p>
                  <div className="grid grid-cols-8 gap-0.5">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => insertEmoji(e)}
                        className="grid size-8 place-items-center rounded-lg text-[17px] hover:bg-secondary/70 active:bg-secondary/80"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={submit}
            aria-label="Envoyer"
            disabled={!value.trim() && attachments.length === 0}
            // 40 px en mobile (cible tactile), 32 px en desktop.
            className="ml-auto grid size-10 place-items-center rounded-xl text-background transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40 md:size-8"
            style={{ backgroundColor: theme.accent }}
          >
            <Send className="size-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <p className="mt-1.5 hidden px-1 text-[10.5px] text-muted-foreground md:block">
        Entrée pour envoyer · Maj+Entrée pour un retour à la ligne · {theme.label}
      </p>

      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files, "document");
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* -------------------------------- AddMenu -------------------------------- */

function AddMenu({
  open,
  setOpen,
  onPickImage,
  onPickDocument,
  onPickContext,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onPickImage: () => void;
  onPickDocument: () => void;
  onPickContext: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ajouter du contenu"
        title="Ajouter du contenu"
        onClick={() => setOpen(!open)}
        // 40 px en mobile, 32 px en desktop.
        className={cn(
          "grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface hover:text-foreground active:bg-surface/80 md:size-8",
          open && "bg-surface text-foreground",
        )}
      >
        <Plus
          className={cn("size-4 transition-transform duration-200", open && "rotate-45")}
          strokeWidth={1.8}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute bottom-full left-0 z-40 mb-2 w-64 max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-popover p-1 shadow-2xl",
            )}
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Ajouter
            </p>
            <AddItem
              icon={ImageIcon}
              label="Image"
              desc="PNG, JPG, capture d'écran"
              onClick={onPickImage}
            />
            <AddItem
              icon={FileText}
              label="Document"
              desc="PDF, DOCX, CSV…"
              onClick={onPickDocument}
            />
            <AddItem
              icon={Link2}
              label="Contexte IA"
              desc="Ouvre l'assistant avec le fil"
              onClick={onPickContext}
            />
          </div>
        </>
      )}
    </div>
  );
}

function AddItem({
  icon: Icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // min-h-12 (48 px) en mobile pour une cible tactile confortable.
      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary/60 active:bg-secondary/80"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-medium leading-tight">{label}</span>
        <span className="block truncate text-[10.5px] leading-tight text-muted-foreground">
          {desc}
        </span>
      </span>
    </button>
  );
}
