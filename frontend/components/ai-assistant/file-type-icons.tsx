//frontend\components\ai-assistant\file-type-icons.tsx
/**
 * file-type-icons.tsx
 * ────────────────────────────────────────────────────────────────────────
 * Icônes SVG personnalisées par TYPE de fichier, + icône « Contexte ».
 *
 * - Le mapping extension → kind est centralisé dans `EXT_TO_KIND`
 *   (c'est le « JSON » de configuration : ajouter une extension = 1 ligne).
 * - Chaque kind a son propre SVG (badge coloré + label, façon Finder).
 * - Fallback : `GenericFileIcon` (page neutre).
 *
 * ⚠️  Pour ajouter un nouveau format : ajouter l'entrée dans `EXT_TO_KIND`
 *     puis, si un nouveau visuel est nécessaire, ajouter un `case` dans
 *     `FileKindIcon`. Ne PAS mettre la logique dans assistant-sidebar.tsx.
 */
import React from "react";

export type FileKind =
  "pdf" | "doc" | "xls" | "ppt" | "csv" | "txt" | "zip" | "code" | "image" | "context" | "default";

type IconProps = { className?: string; size?: number };

function FileBadge({
  label,
  bg,
  fg = "#FFFFFF",
  size = 20,
  className,
}: {
  label: string;
  bg: string;
  fg?: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      <rect x="0.75" y="0.75" width="22.5" height="22.5" rx="4.5" fill={bg} />
      <rect
        x="0.75"
        y="0.75"
        width="22.5"
        height="22.5"
        rx="4.5"
        fill="none"
        stroke="rgba(0,0,0,0.10)"
        strokeWidth="0.5"
      />
      <text
        x="12"
        y="16.25"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize={label.length >= 4 ? 7.5 : 9}
        fontWeight={700}
        fill={fg}
        letterSpacing="-0.3"
      >
        {label}
      </text>
    </svg>
  );
}

export function PdfIcon(p: IconProps) {
  return <FileBadge label="PDF" bg="#DC2626" {...p} />;
}
export function DocIcon(p: IconProps) {
  return <FileBadge label="DOC" bg="#2563EB" {...p} />;
}
export function XlsIcon(p: IconProps) {
  return <FileBadge label="XLS" bg="#16A34A" {...p} />;
}
export function PptIcon(p: IconProps) {
  return <FileBadge label="PPT" bg="#EA580C" {...p} />;
}
export function CsvIcon(p: IconProps) {
  return <FileBadge label="CSV" bg="#059669" {...p} />;
}
export function TxtIcon(p: IconProps) {
  return <FileBadge label="TXT" bg="#64748B" {...p} />;
}
export function ZipIcon(p: IconProps) {
  return <FileBadge label="ZIP" bg="#CA8A04" {...p} />;
}
export function CodeIcon(p: IconProps) {
  return <FileBadge label="{ }" bg="#7C3AED" {...p} />;
}

export function GenericFileIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M6 2.75h7.5L19 8.25v12A1 1 0 0 1 18 21.25H6a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z"
        fill="#E2E8F0"
      />
      <path
        d="M13.5 2.75v5.5H19"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 13h8M8 16h6" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ContextBadgeIcon({ className, size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      {}
      <rect x="1.5" y="3.5" width="21" height="17" rx="3.5" fill="#E0E7FF" />
      <rect
        x="1.5"
        y="3.5"
        width="21"
        height="17"
        rx="3.5"
        fill="none"
        stroke="#6366F1"
        strokeWidth="1.2"
      />
      {}
      <path d="M1.5 8h21" stroke="#6366F1" strokeWidth="1.2" />
      <circle cx="4.6" cy="5.75" r="0.9" fill="#6366F1" />
      <circle cx="7.4" cy="5.75" r="0.9" fill="#6366F1" />
      {}
      <circle cx="12" cy="15" r="3.4" fill="none" stroke="#4338CA" strokeWidth="1.2" />
      <path d="M8.6 15h6.8" stroke="#4338CA" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M12 11.6c-1.2 1.8-1.2 5 0 6.8M12 11.6c1.2 1.8 1.2 5 0 6.8"
        fill="none"
        stroke="#4338CA"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const EXT_TO_KIND: Record<string, FileKind> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  odt: "doc",
  rtf: "doc",
  pages: "doc",

  xls: "xls",
  xlsx: "xls",
  ods: "xls",
  numbers: "xls",
  csv: "csv",
  tsv: "csv",

  ppt: "ppt",
  pptx: "ppt",
  odp: "ppt",
  key: "ppt",

  txt: "txt",
  md: "txt",
  log: "txt",

  json: "code",
  xml: "code",
  yml: "code",
  yaml: "code",
  html: "code",
  css: "code",
  js: "code",
  ts: "code",
  tsx: "code",
  jsx: "code",

  zip: "zip",
  rar: "zip",
  "7z": "zip",
  tar: "zip",
  gz: "zip",

  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  heic: "image",
};

export function getFileKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase().trim() ?? "";
  return EXT_TO_KIND[ext] ?? "default";
}

export function FileKindIcon({
  kind,
  size = 20,
  className,
}: {
  kind: FileKind;
  size?: number;
  className?: string;
}) {
  const props = { size, className };
  switch (kind) {
    case "pdf":
      return <PdfIcon {...props} />;
    case "doc":
      return <DocIcon {...props} />;
    case "xls":
      return <XlsIcon {...props} />;
    case "ppt":
      return <PptIcon {...props} />;
    case "csv":
      return <CsvIcon {...props} />;
    case "txt":
      return <TxtIcon {...props} />;
    case "zip":
      return <ZipIcon {...props} />;
    case "code":
      return <CodeIcon {...props} />;
    case "context":
      return <ContextBadgeIcon {...props} />;
    default:
      return <GenericFileIcon {...props} />;
  }
}
