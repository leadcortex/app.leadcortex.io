"use client";

/**
 * Bouton de copie universel.
 *
 * Icône : deux rectangles qui se chevauchent, style Feather / DeepSeek —
 * le rectangle arrière est partiellement masqué par le rectangle avant,
 * les deux ayant la même épaisseur de trait (pas d'opacité réduite).
 *
 * États : idle → copying → copied (retour à idle après 1.2 s).
 * Le libellé du tooltip est configurable (`label`/`copiedLabel`).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ─── Icône copie (deux rectangles imbriqués) ─────────────────────────
 * SVG identique à l'icône « copy » de Feather Icons / DeepSeek :
 * rectangle avant plein, rectangle arrière partiellement caché.
 * ─────────────────────────────────────────────────────────────────── */
export function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

type Size = "xs" | "sm" | "md";
type Variant = "ghost" | "surface";

const SIZE: Record<Size, { btn: string; icon: string }> = {
  xs: { btn: "size-6 rounded-md", icon: "size-3.5" },
  sm: { btn: "size-7 rounded-md", icon: "size-3.5" },
  md: { btn: "size-8 rounded-lg", icon: "size-4" },
};

export type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: Size;
  variant?: Variant;
  className?: string;
  onCopied?: () => void;
  ariaLabel?: string;
};

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback ci-dessous */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({
  text,
  label = "Copier",
  copiedLabel = "Copié",
  size = "sm",
  variant = "ghost",
  className,
  onCopied,
  ariaLabel,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const handle = useCallback(async () => {
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopied(true);
    onCopied?.();
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1200);
  }, [text, onCopied]);

  const dims = SIZE[size];

  const base = cn(
    "grid shrink-0 place-items-center transition-colors",
    dims.btn,
    variant === "ghost" && "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
    variant === "surface" &&
      "border border-border bg-background text-foreground hover:bg-secondary/60",
    copied && "text-primary hover:text-primary",
    className,
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handle}
          aria-label={ariaLabel ?? (copied ? copiedLabel : label)}
          className={base}
        >
          {copied ? (
            <Check className={cn(dims.icon)} strokeWidth={2.2} />
          ) : (
            <CopyIcon className={cn(dims.icon)} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? copiedLabel : label}</TooltipContent>
    </Tooltip>
  );
}