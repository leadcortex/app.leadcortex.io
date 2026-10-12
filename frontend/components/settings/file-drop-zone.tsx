//frontend\components\settings\file-drop-zone.tsx
import { useCallback, useRef, useState, type DragEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type DroppedFile = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type FileDropZoneProps = {
  accept?: string[];

  maxSize?: number;

  value: DroppedFile | null;
  onChange: (file: DroppedFile | null) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;

  onReject?: (reason: "type" | "size", file: { name: string; size: number }) => void;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*  Composant                                                                 */
/* -------------------------------------------------------------------------- */

export function FileDropZone({
  accept = [".json", ".md", ".txt"],
  maxSize = 2 * 1024 * 1024,
  value,
  onChange,
  label = "Déposez un fichier de compétence",
  hint,
  disabled = false,
  className,
  onReject,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptAttr = accept.join(",");
  const computedHint =
    hint ??
    `${accept.map((e) => e.replace(/^\./, "").toUpperCase()).join(", ")} · ${formatFileSize(
      maxSize,
    )} max`;

  const handleFile = useCallback(
    (file: File) => {
      const ext = getExtension(file.name);
      if (!accept.includes(ext)) {
        onReject?.("type", { name: file.name, size: file.size });
        return;
      }
      if (file.size > maxSize) {
        onReject?.("size", { name: file.name, size: file.size });
        return;
      }
      onChange({
        name: file.name,
        size: file.size,
        type: file.type || ext.replace(/^\./, ""),
        lastModified: file.lastModified,
      });
    },
    [accept, maxSize, onChange, onReject],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  /* ----------------------- Fichier sélectionné → chip ---------------------- */

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3",
          className,
        )}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatFileSize(value.size)} ·{" "}
            {new Date(value.lastModified).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Retirer le fichier"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  /* --------------------------- Zone vide → DnD ----------------------------- */

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-disabled={disabled}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border bg-surface/30 hover:border-primary/40 hover:bg-surface/50",
        disabled && "cursor-not-allowed opacity-50 hover:border-border hover:bg-surface/30",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-10 place-items-center rounded-xl transition-colors",
          dragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <UploadCloud className="size-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{computedHint}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
