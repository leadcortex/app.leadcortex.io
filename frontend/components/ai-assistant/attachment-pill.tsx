// frontend/components/ai-assistant/attachment-pill.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "@/components/icons";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import { FileKindIcon, getFileKind } from "./file-type-icons";
import type { AssistantAttachment } from "./assistant-engine";

const FIXED_W = "w-[150px]";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function AttachmentPill({
  attachment,
  variant = "message",
  onRemove,
  error,
  className,
}: {
  attachment: AssistantAttachment;
  variant?: "message" | "input";
  onRemove?: () => void;
  error?: string;
  className?: string;
}) {
  const isImage = attachment.kind === "image" && attachment.url;
  const isContext = attachment.kind === "context";

  const handleDownload = () => {
    if (attachment.url) {
      const a = document.createElement("a");
      a.href = attachment.url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`« ${attachment.name} » téléchargé`);
      return;
    }
    toast.info("Restitution du fichier — bientôt disponible");
  };

  if (isImage) {
    const thumbSize = variant === "input" ? "size-12" : "size-14";
    return (
      <div
        className={cn(
          "group/img relative shrink-0 overflow-hidden rounded-lg border border-border bg-background",
          thumbSize,
          className,
        )}
        title={attachment.name}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="h-full w-full object-cover"
        />

        {variant === "input" && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Retirer ${attachment.name}`}
            className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-foreground/85 text-background transition-colors hover:bg-foreground"
          >
            <X className="size-2.5" strokeWidth={2.6} />
          </button>
        )}

        {variant === "message" && (
          <button
            type="button"
            onClick={handleDownload}
            aria-label={`Restituer ${attachment.name}`}
            className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-foreground/85 text-background opacity-0 transition-opacity hover:bg-foreground group-hover/img:opacity-100"
          >
            <Download className="size-2.5" strokeWidth={2.6} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background py-1 pl-1 pr-1.5",
        FIXED_W,
        className,
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center">
        <FileKindIcon
          kind={isContext ? "context" : getFileKind(attachment.name)}
          name={isContext ? undefined : attachment.name}
          size={32}
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="block truncate text-[11.5px] font-medium leading-tight">
          {attachment.name}
        </span>
        {error ? (
          <span className="block truncate text-[10px] leading-tight text-destructive" title={error}>
            {error}
          </span>
        ) : (
          <span className="block truncate text-[10px] leading-tight text-muted-foreground">
            {isContext ? "Contexte de page" : formatSize(attachment.size)}
          </span>
        )}
      </span>

      {variant === "input" && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${attachment.name}`}
          className="ml-0.5 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}

      {variant === "message" && !isContext && (
        <button
          type="button"
          onClick={handleDownload}
          aria-label={`Restituer ${attachment.name}`}
          className="ml-0.5 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <Download className="size-3.5" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

export function AttachmentPillRow({
  attachments,
  variant = "message",
  align = "start",
  onRemove,
  errors,
}: {
  attachments: AssistantAttachment[];
  variant?: "message" | "input";
  align?: "start" | "end";
  onRemove?: (id: string) => void;
  errors?: Record<string, string>;
}) {
  if (!attachments.length) return null;

  if (variant === "input") {
    return <AttachmentInputRow attachments={attachments} onRemove={onRemove} errors={errors} />;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        align === "end" ? "justify-end" : "justify-start",
      )}
    >
      {attachments.map((a) => (
        <AttachmentPill key={a.id} attachment={a} variant={variant} />
      ))}
    </div>
  );
}

function AttachmentInputRow({
  attachments,
  onRemove,
  errors,
}: {
  attachments: AssistantAttachment[];
  onRemove?: (id: string) => void;
  errors?: Record<string, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [attachments.length, updateArrows]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center gap-1">
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Faire défiler vers la gauche"
          className="grid size-6 shrink-0 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" strokeWidth={2.2} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex min-h-14 min-w-0 flex-1 items-start gap-1.5 overflow-x-auto overscroll-x-contain py-1 scrollbar-none"
      >
        {attachments.map((a) => (
          <AttachmentPill
            key={a.id}
            attachment={a}
            variant="input"
            onRemove={onRemove ? () => onRemove(a.id) : undefined}
            error={errors?.[a.id]}
          />
        ))}
      </div>

      {canRight && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Faire défiler vers la droite"
          className="grid size-6 shrink-0 place-items-center rounded-md bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <ChevronRight className="size-3.5" strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
