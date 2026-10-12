"use client";

/**
 * Restitution de pièces jointes reçues.
 *
 * Deux exports :
 *  - `AttachmentDownloadCard` : carte individuelle (aperçu + nom + bouton
 *    de téléchargement). Se branche sur `attachment.url` quand il existe,
 *    sinon déclenche un toast « bientôt disponible ».
 *  - `AttachmentDownloadList` : liste **scrollable** (max-height plafonnée)
 *    qui empile les cartes, avec compteur et état vide. À utiliser dans une
 *    bulle de message IA pour restituer un lot de fichiers.
 *
 * Accepte à la fois les `AssistantAttachment` de l'assistant latéral et les
 * `ChatAttachment` du canevas — les champs communs suffisent.
 */
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FileKindIcon, getFileKind } from "./file-type-icons";

export type AttachmentLike = {
  id: string;
  name: string;
  size?: number;
  kind?: "image" | "document" | "context";
  url?: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function AttachmentDownloadCard({
  attachment,
  className,
}: {
  attachment: AttachmentLike;
  className?: string;
}) {
  const isImage = attachment.kind === "image" && attachment.url;
  const fileName = attachment.name;

  const handleDownload = () => {
    if (attachment.url) {
      const a = document.createElement("a");
      a.href = attachment.url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`« ${fileName} » téléchargé`);
      return;
    }
    toast.info("Restitution du fichier — bientôt disponible");
  };

  return (
    <div
      className={cn(
        "flex max-w-full items-center gap-2 rounded-xl border border-border bg-background p-1.5 pr-2",
        className,
      )}
    >
      {isImage ? (
        <img
          src={attachment.url}
          alt={fileName}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center">
          <FileKindIcon kind={getFileKind(fileName)} size={36} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-medium leading-tight">{fileName}</p>
        {attachment.size !== undefined && (
          <p className="text-[10px] text-muted-foreground">{formatSize(attachment.size)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        aria-label={`Restituer ${fileName}`}
        className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        <Download className="size-3.5" strokeWidth={1.8} />
      </button>
    </div>
  );
}

export function AttachmentDownloadList({
  attachments,
  maxHeight = 260,
  caption,
  className,
}: {
  attachments: AttachmentLike[];
  maxHeight?: number;
  caption?: string;
  className?: string;
}) {
  if (!attachments.length) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-center text-[11px] text-muted-foreground",
          className,
        )}
      >
        <FileText className="mx-auto mb-1.5 size-4 opacity-60" />
        Aucun fichier à restituer.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-background",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-secondary/30 px-2.5 py-1.5">
        <FileText className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
        <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          {caption ?? "Fichiers"}
        </span>
        <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary tabular-nums">
          {attachments.length}
        </span>
      </div>
      <div
        className="min-h-0 overflow-y-auto overscroll-contain p-1.5"
        style={{ maxHeight: `min(${maxHeight}px, 45vh)` }}
      >
        <div className="flex flex-col gap-1.5">
          {attachments.map((a) => (
            <AttachmentDownloadCard key={a.id} attachment={a} />
          ))}
        </div>
      </div>
    </div>
  );
}