// frontend/components/mail/email-attachments.tsx

import { useCallback, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  Archive,
  Download,
  Eye,
  File,
  FileAudio,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Paperclip,
  X,
} from "@/components/icons";
import { cn } from "@/lib/core/utils";
import {
  classifyMime,
  formatBytes,
  type AttachmentKind,
  type EmailAttachment,
} from "@shared/types/email-types";

function iconFor(kind: AttachmentKind) {
  switch (kind) {
    case "image":
      return ImageIcon;
    case "audio":
      return FileAudio;
    case "video":
      return FileVideo;
    case "archive":
      return Archive;
    case "document":
      return FileText;
    default:
      return File;
  }
}

export function fileToAttachment(file: File): EmailAttachment {
  const kind = classifyMime(file.type);
  const att: EmailAttachment = {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    kind,
  };
  if (kind === "image") att.url = URL.createObjectURL(file);
  return att;
}

export function AttachmentPill({
  attachment,
  onRemove,
  variant = "default",
}: {
  attachment: EmailAttachment;
  onRemove?: (id: string) => void;
  variant?: "default" | "compact";
}) {
  const kind = attachment.kind ?? classifyMime(attachment.mime);
  const Icon = iconFor(kind);
  const removable = Boolean(onRemove);

  return (
    <span
      className={cn(
        "group/pill inline-flex max-w-[220px] items-center gap-2 rounded-lg border border-border bg-background/90 pl-2 pr-1 py-1 text-xs",
        variant === "compact" && "max-w-[180px] py-0.5 text-[11px]",
      )}
    >
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-primary",
          variant === "compact" && "size-5",
        )}
      >
        <Icon className={cn("size-3.5", variant === "compact" && "size-3")} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{attachment.name}</span>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {formatBytes(attachment.size)}
      </span>
      {removable && (
        <button
          type="button"
          aria-label={`Retirer ${attachment.name}`}
          onClick={() => onRemove!(attachment.id)}
          className="grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground opacity-60 transition-opacity hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
        >
          <X className="size-3" strokeWidth={2.25} />
        </button>
      )}
    </span>
  );
}

export function AttachmentPillRow({
  attachments,
  onRemove,
  variant = "default",
  className,
}: {
  attachments: EmailAttachment[];
  onRemove?: (id: string) => void;
  variant?: "default" | "compact";
  className?: string;
}) {
  if (attachments.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {attachments.map((a) => (
        <AttachmentPill key={a.id} attachment={a} onRemove={onRemove} variant={variant} />
      ))}
    </div>
  );
}

export function AttachmentGrid({ attachments }: { attachments: EmailAttachment[] }) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => (a.kind ?? classifyMime(a.mime)) === "image" && a.url);
  const others = attachments.filter((a) => (a.kind ?? classifyMime(a.mime)) !== "image" || !a.url);

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-surface/50"
            >
              <img src={a.url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="pointer-events-none absolute bottom-1.5 left-1.5 right-1.5 truncate text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {a.name}
              </span>
            </a>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border bg-background">
          {others.map((a) => {
            const kind = a.kind ?? classifyMime(a.mime);
            const Icon = iconFor(kind);
            return (
              <li key={a.id} className="flex items-center gap-3 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(a.size)} · {a.mime}
                  </p>
                </div>
                {a.url && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Aperçu"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Eye className="size-3.5" />
                    </a>
                    <a
                      href={a.url}
                      download={a.name}
                      aria-label="Télécharger"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <Download className="size-3.5" />
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function useAttachmentDrop({
  onDrop,
  accept,
}: {
  onDrop: (files: File[]) => void;
  accept?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const counterRef = useRef(0);

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    counterRef.current++;
    if (counterRef.current === 1) setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    counterRef.current--;
    if (counterRef.current <= 0) {
      counterRef.current = 0;
      setDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDropFiles = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      counterRef.current = 0;
      setDragging(false);
      const list = Array.from(e.dataTransfer?.files ?? []);
      if (list.length === 0) return;
      const filtered = accept
        ? list.filter((f) => {
            const acceptList = accept.split(",").map((s) => s.trim().toLowerCase());
            return acceptList.some((token) => {
              if (token.startsWith(".")) return f.name.toLowerCase().endsWith(token);
              if (token.endsWith("/*")) return f.type.startsWith(token.slice(0, -1));
              return f.type === token;
            });
          })
        : list;
      if (filtered.length > 0) onDrop(filtered);
    },
    [onDrop, accept],
  );

  return {
    dragging,
    bind: { onDragEnter, onDragLeave, onDragOver, onDrop: onDropFiles },
  };
}

export function AttachmentDropOverlay({
  label = "Déposez vos fichiers",
  hint = "PDF, images, CSV, DOCX…",
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-primary/[0.06] backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-2 text-primary">
        <span className="grid size-10 place-items-center rounded-2xl bg-primary/15">
          <Paperclip className="size-5" strokeWidth={1.8} />
        </span>
        <p className="text-[12.5px] font-medium">{label}</p>
        <p className="text-[11px] opacity-75">{hint}</p>
      </div>
    </div>
  );
}

export function AttachFilesButton({
  onPick,
  children,
  className,
}: {
  onPick: (files: File[]) => void;
  children?: ReactNode;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Joindre un fichier"
        title="Joindre un fichier"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
          className,
        )}
      >
        {children ?? <Paperclip className="size-4" strokeWidth={1.8} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onPick(files);
          e.target.value = "";
        }}
      />
    </>
  );
}
