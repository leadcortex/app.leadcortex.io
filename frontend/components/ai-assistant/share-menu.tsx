"use client";

/**
 * Menu « Partager » — remplace l'ancien `ExportMenu`.
 *
 * Enrichi : exports Markdown/JSON, copies presse-papier, et une section
 * « Autre… » qui déploie des options de partage supplémentaires (lien,
 * PDF, email, Slack…) — en mode « bientôt disponible » pour l'instant.
 *
 * Variant "round" : bouton rond, destiné à être posé dans la rangée
 * dédiée sous le sélecteur de modèle IA (voir `assistant-sidebar.tsx`).
 * Variant "inline" : icône intégrée, réutilisable ailleurs.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  Download,
  FileJson,
  FileText,
  Link2,
  ListChecks,
  Mail,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AssistantMessage } from "./assistant-engine";
import {
  copyToClipboard,
  downloadText,
  filenameFor,
  toJson,
  toMarkdown,
  type ExportMeta,
} from "@/lib/conversation-export";

/* ─── Icône « Partager » (flèche courbée) ─────────────────────────────
 * SVG inline reprenant exactement le tracé de Lucide `Forward` :
 * queue courbée qui remonte de la gauche, ligne horizontale, tête de
 * flèche à droite.
 * ─────────────────────────────────────────────────────────────────── */
function ShareArrowIcon({ className }: { className?: string }) {
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
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
  );
}

type ShareMenuVariant = "round" | "inline";

export function ShareMenu({
  messages,
  title,
  createdAt,
  variant = "round",
  className,
}: {
  messages: AssistantMessage[];
  title: string;
  createdAt: number;
  variant?: ShareMenuVariant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showMore) setShowMore(false);
        else setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, showMore]);

  useEffect(() => {
    if (!open) setShowMore(false);
  }, [open]);

  const meta: ExportMeta = {
    title: title || "Conversation",
    createdAt,
    exportedAt: Date.now(),
  };

  const ping = useCallback((label: string) => {
    setFlash(label);
    window.setTimeout(() => setFlash(null), 900);
  }, []);

  const isEmpty = messages.length === 0;

  const handleMarkdown = () => {
    if (isEmpty) return toast.info("Rien à partager.");
    const md = toMarkdown(messages, meta);
    downloadText(filenameFor(meta.title, "markdown"), md, "text/markdown;charset=utf-8");
    ping("markdown");
    toast.success("Markdown exporté");
    setOpen(false);
  };

  const handleJson = () => {
    if (isEmpty) return toast.info("Rien à partager.");
    const json = toJson(messages, meta);
    downloadText(filenameFor(meta.title, "json"), json, "application/json;charset=utf-8");
    ping("json");
    toast.success("JSON exporté");
    setOpen(false);
  };

  const handleCopyMarkdown = async () => {
    if (isEmpty) return;
    const ok = await copyToClipboard(toMarkdown(messages, meta));
    if (ok) {
      ping("copy-md");
      toast.success("Conversation copiée (Markdown)");
    }
    setOpen(false);
  };

  const handleCopyJson = async () => {
    if (isEmpty) return;
    const ok = await copyToClipboard(toJson(messages, meta));
    if (ok) {
      ping("copy-json");
      toast.success("Conversation copiée (JSON)");
    }
    setOpen(false);
  };

  const handleCopyPlain = async () => {
    if (isEmpty) return;
    const plain = messages
      .map((m) => `${m.role === "user" ? "Vous" : "Assistant"} :\n${m.text}`)
      .join("\n\n———\n\n");
    const ok = await copyToClipboard(plain);
    if (ok) {
      ping("copy-plain");
      toast.success("Conversation copiée (texte brut)");
    }
    setOpen(false);
  };

  const soon = (label: string) => () => {
    toast.info(`${label} — bientôt disponible`);
    setShowMore(false);
    setOpen(false);
  };

  const triggerClass = cn(
    "shrink-0 transition-colors",
    variant === "round" &&
      "grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:border-primary/40 hover:text-foreground",
    variant === "inline" &&
      "grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
    open && variant === "inline" && "bg-secondary/50 text-foreground",
    open && variant === "round" && "border-primary/40 text-foreground",
    className,
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Partager la conversation"
        title="Partager"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        <ShareArrowIcon className="size-4" />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-full z-40 mt-1 w-64 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-xl transition-all duration-150 ease-out",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0",
        )}
      >
        {showMore ? (
          <>
            <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-1.5">
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="-ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                ← Retour
              </button>
            </div>

            <MenuRow
              icon={Link2}
              label="Copier un lien de partage"
              onClick={soon("Lien de partage")}
            />
            <MenuRow
              icon={FileText}
              label="Exporter en PDF"
              onClick={soon("Export PDF")}
            />
            <MenuRow
              icon={Mail}
              label="Envoyer par email"
              onClick={soon("Envoi par email")}
            />
            <MenuRow
              icon={MessageSquare}
              label="Partager sur Slack"
              onClick={soon("Partage Slack")}
            />

            <p className="px-2.5 pb-1.5 pt-1.5 text-[10.5px] italic text-muted-foreground">
              Ces options seront branchées prochainement.
            </p>
          </>
        ) : (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Exporter
            </p>

            <MenuRow
              icon={FileText}
              label="Markdown (.md)"
              done={flash === "markdown"}
              onClick={handleMarkdown}
            />
            <MenuRow
              icon={FileJson}
              label="JSON (.json)"
              done={flash === "json"}
              onClick={handleJson}
            />

            <div className="my-1 h-px bg-border/70" />

            <p className="px-2.5 pb-1 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Copier dans le presse-papier
            </p>
            <MenuRow
              icon={Clipboard}
              label="Version Markdown"
              done={flash === "copy-md"}
              onClick={handleCopyMarkdown}
            />
            <MenuRow
              icon={Clipboard}
              label="Version JSON"
              done={flash === "copy-json"}
              onClick={handleCopyJson}
            />
            <MenuRow
              icon={ListChecks}
              label="Texte brut"
              done={flash === "copy-plain"}
              onClick={handleCopyPlain}
            />

            <div className="my-1 h-px bg-border/70" />

            <MenuRow
              icon={MoreHorizontal}
              label="Autre…"
              onClick={() => setShowMore(true)}
            />

            {isEmpty && (
              <p className="px-2.5 pb-1.5 pt-1 text-[10.5px] italic text-muted-foreground">
                Conversation vide.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  hint,
  done,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  hint?: string;
  done?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12px] text-foreground transition-colors hover:bg-secondary/60"
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-secondary/60 text-muted-foreground">
        {done ? <Check className="size-3.5 text-primary" /> : <Icon className="size-3.5" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && (
        <kbd className="shrink-0 rounded border border-border bg-background px-1 py-px font-mono text-[10px] text-muted-foreground">
          {hint}
        </kbd>
      )}
      {!done && !hint && (
        <Download className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  );
}