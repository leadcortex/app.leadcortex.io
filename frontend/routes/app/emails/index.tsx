// frontend/routes/app/emails/index.tsx

import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/common/ui-primitives";
import { EmptyState } from "@/components/common/empty-state";
import { MailboxSkeleton } from "@/components/skeletons";
import { useAppStore, type UndoEntry } from "@/lib/state/store";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import {
  ProviderLogo,
  PROVIDER_LABELS,
  PROVIDER_HINTS,
  type MailProvider,
} from "@/components/mail/provider-logos";

import { AttachmentGrid, AttachmentPillRow } from "@/components/mail/email-attachments";
import { LabelPicker, LabelManagerDialog, LabelChipRow } from "@/components/mail/email-labels";
import { SnoozeMenu, formatScheduleHint } from "@/components/mail/email-snooze";
import { useEmailShortcuts, ShortcutsHelpDialog } from "@/components/mail/email-shortcuts";
import {
  SearchBar,
  QuickFilterChips,
  AdvancedFiltersPopover,
} from "@/components/mail/email-search-filters";
import {
  groupEmailsByThread,
  getThreadPreview,
  ThreadHeader,
  ThreadMessageList,
  ThreadPreviewRow,
  ThreadAttachmentsSummary,
} from "@/components/mail/email-thread";
import { EmailComposer, type ComposerPayload } from "@/components/mail/email-composer";

import {
  Inbox,
  Send,
  Star,
  Archive,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  Mail,
  Trash2,
  FileText,
  AlertTriangle,
  PenSquare,
  RefreshCw,
  FolderInput,
  CheckCheck,
  ArrowLeft,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  Clock,
  CircleDot,
  Hash,
  Tag,
  Keyboard,
  X,
  ShieldCheck,
} from "@/components/icons";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  EMPTY_FILTERS,
  hasActiveFilters,
  formatRelativeDate,
  type ComposerMode,
  type ComposerState,
  type EmailAddress,
  type EmailAttachment,
  type EmailRecord,
  type FolderKey,
  type MailAccount,
  type SearchFilters,
} from "@shared/types/email-types";
import type { Email } from "@/lib/data/mock-data";
import { type GmailAccount } from "@/components/mail/gmail-mailbox";
import { useGmailEmails } from "@/hooks/use-gmail-emails";
import { GmailThreadsSkeleton } from "@/components/mail/email-skeleton-gmail";

export const Route = createFileRoute("/app/emails/")({
  head: () => ({ meta: [{ title: "Emails — LeadCortex" }] }),
  pendingComponent: () => <MailboxSkeleton />,
  component: EmailsPage,
});

const FOLDERS: { key: FolderKey; label: string; icon: typeof Inbox }[] = [
  { key: "inbox", label: "Boîte de réception", icon: Inbox },
  { key: "starred", label: "Favoris", icon: Star },
  { key: "sent", label: "Envoyés", icon: Send },
  { key: "drafts", label: "Brouillons", icon: FileText },
  { key: "scheduled", label: "Programmés", icon: Clock },
  { key: "archive", label: "Archives", icon: Archive },
  { key: "spam", label: "Indésirables", icon: AlertTriangle },
  { key: "trash", label: "Corbeille", icon: Trash2 },
];

const INITIAL_ACCOUNTS: MailAccount[] = [
  {
    id: "acc-1",
    name: "Utilisateur",
    email: "utilisateur@leadcortex.io",
    provider: "gmail",
    unread: 3,
    signature: "—\nEnvoyé depuis LeadCortex",
    isDefault: true,
  },
  {
    id: "acc-2",
    name: "LeadCortex Contact",
    email: "contact@leadcortex.io",
    provider: "outlook",
    unread: 0,
    signature: "L'équipe LeadCortex · contact@leadcortex.io",
  },
];

const SIDEBAR_STORAGE_KEY = "lc.emails.sidebarWidth";
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 360;
const SIDEBAR_DEFAULT = 260;

const LIST_STORAGE_KEY = "lc.emails.listWidth";
const LIST_MIN = 280;
const LIST_MAX = 520;
const LIST_DEFAULT = 360;

const RESIZER_W = 8;
const DETAIL_MIN = 320;

type EmailSource =
  | { kind: "demo" }
  | { kind: "gmail"; account: GmailAccount };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function toRecord(e: Email, accountId: string): EmailRecord {
  const [namePart, emailPart] = splitFrom(e.from);
  const to: EmailAddress[] = (e.to ?? [`${accountId}@leadcortex.io`]).map((addr) =>
    typeof addr === "string" ? { email: addr } : addr,
  );

  return {
    id: e.id,
    threadId: e.threadId ?? e.id,
    accountId: e.accountId ?? accountId,
    from: { name: namePart, email: emailPart },
    to,
    cc: e.cc?.map((a) => (typeof a === "string" ? { email: a } : a)),
    bcc: e.bcc?.map((a) => (typeof a === "string" ? { email: a } : a)),
    subject: e.subject,
    preview: e.preview,
    body: e.body ?? buildBodyFromPreview(e),
    date: e.date ?? synthesizeDate(e.time),
    unread: e.unread,
    starred: e.starred,
    status: (e.status as EmailRecord["status"]) ?? "replied",
    folder: (e.folder as FolderKey) ?? inferFolder(e),
    labels: e.labels,
    attachments: (e.attachments ?? []) as EmailAttachment[],
    scheduledAt: e.scheduledAt,
    snoozedUntil: e.snoozedUntil,
  };
}

function splitFrom(raw: string): [string | undefined, string] {
  const m = raw.match(/^(.*?)\s*<\s*(.+?)\s*>$/);
  if (m) return [m[1]?.trim() || undefined, m[2]!.trim()];
  const email = `${raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")}@mail.com`;
  return [raw, email];
}

function buildBodyFromPreview(e: Email): string {
  return `Bonjour,

${e.preview}

Cordialement,
${e.from}`;
}

function synthesizeDate(timeLabel: string): string {
  const now = new Date();
  if (/^\d{2}:\d{2}$/.test(timeLabel)) {
    const [h, m] = timeLabel.split(":").map(Number);
    now.setHours(h!, m!, 0, 0);
    return now.toISOString();
  }
  if (timeLabel === "hier") {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }
  const m = timeLabel.match(/(\d+)\s*jours?/);
  if (m) {
    now.setDate(now.getDate() - Number(m[1]));
    return now.toISOString();
  }
  return now.toISOString();
}

function inferFolder(e: Email): FolderKey {
  if (e.status === "draft") return "drafts";
  if (e.status === "scheduled") return "scheduled";
  if (e.status === "sent") return "sent";
  if (e.status === "bounced") return "spam";
  if (e.folder) return e.folder as FolderKey;
  return "inbox";
}

function applyFilters(
  threads: EmailRecord[][],
  filters: SearchFilters,
  snoozedEmails: Record<string, string>,
): EmailRecord[][] {
  const now = Date.now();
  return threads.filter((t) => {
    const hasActiveSnooze = t.some((m) => {
      const until = m.snoozedUntil ?? snoozedEmails[m.id];
      return until && new Date(until).getTime() > now;
    });
    const folder = t[t.length - 1]?.folder;
    if (hasActiveSnooze && folder !== "archive" && folder !== "trash") return false;

    if (filters.isUnread && !t.some((m) => m.unread)) return false;
    if (filters.isStarred && !t.some((m) => m.starred)) return false;
    if (filters.hasAttachment && !t.some((m) => (m.attachments?.length ?? 0) > 0)) return false;

    if (filters.labels && filters.labels.length > 0) {
      const has = t.some((m) => (m.labels ?? []).some((l) => filters.labels!.includes(l)));
      if (!has) return false;
    }

    if (filters.folder && !t.some((m) => m.folder === filters.folder)) return false;

    if (filters.from) {
      const q = filters.from.toLowerCase();
      if (
        !t.some(
          (m) =>
            m.from.email.toLowerCase().includes(q) || (m.from.name ?? "").toLowerCase().includes(q),
        )
      )
        return false;
    }

    if (filters.to) {
      const q = filters.to.toLowerCase();
      if (!t.some((m) => m.to.some((a) => a.email.toLowerCase().includes(q)))) return false;
    }

    if (filters.subject) {
      const q = filters.subject.toLowerCase();
      if (!t.some((m) => m.subject.toLowerCase().includes(q))) return false;
    }

    if (filters.dateFrom) {
      const min = new Date(filters.dateFrom).getTime();
      if (!t.some((m) => new Date(m.date).getTime() >= min)) return false;
    }

    if (filters.dateTo) {
      const max = new Date(filters.dateTo).getTime() + 86_400_000;
      if (!t.some((m) => new Date(m.date).getTime() <= max)) return false;
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      const ok = t.some(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q) ||
          (m.from.name ?? "").toLowerCase().includes(q) ||
          m.from.email.toLowerCase().includes(q),
      );
      if (!ok) return false;
    }

    return true;
  });
}

function Resizer({
  onPointerDown,
  onDoubleClick,
  label,
}: {
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick: () => void;
  label: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      title="Glisser pour redimensionner · double-clic pour réinitialiser"
      className="group relative z-30 hidden w-2 shrink-0 cursor-ew-resize md:block"
    >
      <span className="pointer-events-none absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-border/70 transition-colors group-hover:bg-primary" />
    </div>
  );
}

type ContextMenuItem = {
  label: string;
  icon: typeof Reply;
  onSelect: () => void;
  tone?: "default" | "danger";
  separatorBefore?: boolean;
  shortcut?: string;
};

function MailContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onDoc = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("click", onDoc);
    window.addEventListener("contextmenu", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onDoc);
      window.removeEventListener("contextmenu", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const W = 240;
  const H = items.length * 34 + 16;
  const cx = Math.min(x, (window.innerWidth || 0) - W - 8);
  const cy = Math.min(y, (window.innerHeight || 0) - H - 8);

  return createPortal(
    <div
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: cx, top: cy, width: W }}
      className="fixed z-[60] rounded-xl border border-border bg-popover py-1.5 text-xs shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95"
    >
      {items.map((it, i) => (
        <Fragment key={i}>
          {it.separatorBefore && <div className="my-1 h-px bg-border" />}
          <button
            onClick={() => {
              it.onSelect();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
              it.tone === "danger"
                ? "text-destructive hover:bg-destructive/10"
                : "text-foreground hover:bg-secondary",
            )}
          >
            <it.icon className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate flex-1">{it.label}</span>
            {it.shortcut && (
              <kbd className="shrink-0 rounded border border-border bg-surface px-1 font-mono text-[9px] text-muted-foreground">
                {it.shortcut}
              </kbd>
            )}
          </button>
        </Fragment>
      ))}
    </div>,
    document.body,
  );
}

type TriggerStore = {
  timers: Map<string, number>;
  triggered: Map<string, boolean>;
};

type ContextTriggers = {
  onContextMenu: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
  onTouchCancel: () => void;
  shouldIgnoreClick: () => boolean;
};

function createContextTriggers(
  key: string,
  onOpen: (x: number, y: number) => void,
  store: TriggerStore,
): ContextTriggers {
  const clear = () => {
    const id = store.timers.get(key);
    if (id !== undefined) {
      window.clearTimeout(id);
      store.timers.delete(key);
    }
  };

  return {
    onContextMenu: (e) => {
      e.preventDefault();
      onOpen(e.clientX, e.clientY);
    },
    onTouchStart: (e) => {
      store.triggered.set(key, false);
      const t = e.touches[0];
      if (!t) return;
      const { clientX, clientY } = t;
      clear();
      const id = window.setTimeout(() => {
        store.triggered.set(key, true);
        onOpen(clientX, clientY);
        if (navigator.vibrate) navigator.vibrate(15);
      }, 480);
      store.timers.set(key, id);
    },
    onTouchEnd: clear,
    onTouchMove: clear,
    onTouchCancel: clear,
    shouldIgnoreClick: () => store.triggered.get(key) ?? false,
  };
}

function AccountSwitcher({
  accounts,
  currentId,
  onSelect,
  onAdd,
  onManage,
}: {
  accounts: MailAccount[];
  currentId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onManage: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current = accounts.find((a) => a.id === currentId) ?? accounts[0]!;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-background px-2.5 py-2 text-left transition-colors hover:bg-surface"
      >
        <LetterAvatar name={current.name} size={28} shape="rounded" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{current.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{current.email}</p>
        </div>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="max-h-[280px] overflow-y-auto p-1">
            {accounts.map((a) => {
              const active = a.id === currentId;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    onSelect(a.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
                    active ? "bg-primary/8" : "hover:bg-secondary",
                  )}
                >
                  <LetterAvatar name={a.name} size={24} shape="rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{a.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{a.email}</p>
                  </div>
                  {active && <Check className="size-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-border">
            <button
              onClick={() => {
                setOpen(false);
                onAdd();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-secondary"
            >
              <Plus className="size-3.5 text-muted-foreground" />
              Ajouter un compte
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onManage();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Settings className="size-3.5" />
              Gérer les comptes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddAccountDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (account: MailAccount) => void;
}) {
  const [provider, setProvider] = useState<MailProvider>("gmail");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setImapHost("");
    setImapPort("993");
    setProvider("gmail");
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Nom et adresse email requis");
      return;
    }
    if (provider === "imap" && !imapHost.trim()) {
      toast.error("Serveur IMAP requis");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      onAdd({
        id: `acc-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        provider,
        signature: `—\nEnvoyé de ${email.trim()}`,
      });
      toast.success(`Compte "${email.trim()}" ajouté`);
      reset();
      setLoading(false);
      onOpenChange(false);
    }, 700);
  };

  const providers: MailProvider[] = ["gmail", "outlook", "yahoo", "icloud", "imap"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg dialog-content">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Ajouter un compte mail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fournisseur
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {providers.map((p) => {
                const active = provider === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all",
                      active
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-surface",
                    )}
                  >
                    <ProviderLogo provider={p} className="size-6" />
                    <span className="text-[10px] font-medium truncate w-full text-center">
                      {PROVIDER_LABELS[p].split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{PROVIDER_HINTS[provider]}</p>
          </div>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nom affiché
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Utilisateur"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Adresse email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mot de passe d'application
            </span>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 pr-9 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </label>

          {provider === "imap" && (
            <div className="grid grid-cols-3 gap-2">
              <label className="col-span-2 block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Serveur IMAP
                </span>
                <input
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="imap.exemple.com"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Port
                </span>
                <input
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-surface"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="size-3 animate-spin" /> Connexion…
              </>
            ) : (
              <>
                <Check className="size-3" /> Ajouter le compte
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UndoBanner({
  undo,
  onUndo,
  onClose,
}: {
  undo: UndoEntry;
  onUndo: () => void;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-popover px-4 py-2 shadow-2xl backdrop-blur">
      <span className="text-xs">{undo.label}</span>
      <button
        onClick={onUndo}
        className="rounded-full bg-foreground px-3 py-1 text-[10.5px] font-semibold text-background transition-opacity hover:opacity-90"
      >
        Annuler
      </button>
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function BulkBar({
  count,
  onClear,
  onArchive,
  onDelete,
  onMarkRead,
  onMarkUnread,
  onStar,
}: {
  count: number;
  onClear: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onStar: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border bg-primary/[0.06] px-2 py-1.5">
      <button
        onClick={onClear}
        aria-label="Annuler la sélection"
        className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
      <span className="text-xs font-medium">
        {count} sélectionné{count > 1 ? "s" : ""}
      </span>
      <div className="mx-1 h-4 w-px bg-border" />
      <BulkActionBtn label="Archiver" icon={Archive} onClick={onArchive} />
      <BulkActionBtn label="Supprimer" icon={Trash2} onClick={onDelete} tone="danger" />
      <BulkActionBtn label="Marquer lu" icon={CheckCheck} onClick={onMarkRead} />
      <BulkActionBtn label="Non lu" icon={CircleDot} onClick={onMarkUnread} />
      <BulkActionBtn label="Favori" icon={Star} onClick={onStar} />
    </div>
  );
}

function BulkActionBtn({
  label,
  icon: Icon,
  onClick,
  tone,
}: {
  label: string;
  icon: typeof Archive;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors",
        tone === "danger"
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.8} />
    </button>
  );
}

function EmailsPage() {
  const [account, setAccount] = useState<GmailAccount | null>(null);
  const [needsReauthorization, setNeedsReauthorization] = useState(false);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);

  useEffect(() => {
    const gmailStatus = new URLSearchParams(window.location.search).get("gmail");
    if (gmailStatus === "denied") setOauthMessage("L’autorisation Gmail a été annulée.");
    if (gmailStatus === "connect_error") {
      setOauthMessage(
        "La connexion Gmail a échoué. Vérifiez la configuration Google Cloud et réessayez.",
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/mail/accounts", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Impossible de vérifier Gmail (${response.status}).`);
        return (await response.json()) as { accounts: GmailAccount[] };
      })
      .then((payload) => {
        if (!active) return;
        const connected = payload.accounts.find((item) => item.status === "connected") ?? null;
        setAccount(connected);
        setNeedsReauthorization(
          !connected && payload.accounts.some((item) => item.status === "reauth_required"),
        );
      })
      .catch((cause: unknown) => {
        if (active) {
          setAccountError(cause instanceof Error ? cause.message : "Impossible de vérifier Gmail.");
        }
      })
      .finally(() => {
        if (active) setLoadingAccount(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadingAccount) return <MailboxSkeleton />;
  if (account) return <EmailWorkspace source={{ kind: "gmail", account }} />;
  if (showDemo) return <EmailWorkspace source={{ kind: "demo" }} />;

  return (
    <div className="flex h-full min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-background p-6 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-500/10 text-red-600">
          <Mail className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl italic">Connectez votre Gmail</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Consultez votre boîte de réception en lecture seule. Les messages sont récupérés à la
            demande et ne sont pas copiés dans LeadCortex.
          </p>
        </div>
        {(oauthMessage || accountError || needsReauthorization) && (
          <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
            {oauthMessage ??
              accountError ??
              "L’autorisation Gmail a expiré. Reconnectez votre compte."}
          </p>
        )}
        <a
          href="/auth/gmail"
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {needsReauthorization ? "Reconnecter Gmail" : "Connecter Gmail"}
        </a>
        {accountError && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="block w-full text-xs text-muted-foreground underline"
          >
            Réessayer
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowDemo(true)}
          className="block w-full text-xs text-muted-foreground underline"
        >
          Ouvrir les données de démonstration
        </button>
      </div>
    </div>
  );
}

function EmailWorkspace({ source }: { source: EmailSource }) {
  const isGmail = source.kind === "gmail";
  const {
    emails: rawEmails,
    labels,
    snoozedEmails,
    markEmailRead,
    toggleEmailRead,
    toggleEmailStar,
    archiveEmail,
    deleteEmail,
    restoreEmail,
    snoozeEmail,
    toggleEmailLabel,
    addEmailLabel,
    deleteEmailLabel,
    saveDraft,
    deleteDraft,
    sendEmail,
    scheduleEmail,
    pushUndo,
    undoLastAction,
    lastUndo,
    clearUndo,
    moveEmailToFolder,
  } = useAppStore();

  const guardWrite = (label: string): boolean => {
    if (!isGmail) return true;
    toast.info(`Lecture seule — ${label} est désactivé sur Gmail.`, {
      description: "Les emails Gmail ne sont jamais modifiés par LeadCortex.",
    });
    return false;
  };

  const [accounts, setAccounts] = useState<MailAccount[]>(INITIAL_ACCOUNTS);
  const [currentAccountId, setCurrentAccountId] = useState(INITIAL_ACCOUNTS[0]!.id);
  const [folder, setFolder] = useState<FolderKey>("inbox");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerState, setComposerState] = useState<ComposerState | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    threadId: string;
  } | null>(null);

  const triggerStoreRef = useRef<TriggerStore>({
    timers: new Map<string, number>(),
    triggered: new Map<string, boolean>(),
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [listWidth, setListWidth] = useState(LIST_DEFAULT);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawSidebar = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (rawSidebar) {
      const n = Number(rawSidebar);
      if (!Number.isNaN(n)) setSidebarWidth(clamp(n, SIDEBAR_MIN, SIDEBAR_MAX));
    }
    const rawList = window.localStorage.getItem(LIST_STORAGE_KEY);
    if (rawList) {
      const n = Number(rawList);
      if (!Number.isNaN(n)) setListWidth(clamp(n, LIST_MIN, LIST_MAX));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LIST_STORAGE_KEY, String(listWidth));
  }, [listWidth]);

  useEffect(() => {
    if (!containerWidth) return;
    const budget = containerWidth - 2 * RESIZER_W - DETAIL_MIN;
    if (budget <= 0) return;
    if (sidebarWidth + listWidth <= budget) return;

    const nextList = Math.max(LIST_MIN, budget - sidebarWidth);
    let nextSidebar = sidebarWidth;
    if (nextList + nextSidebar > budget) {
      nextSidebar = Math.max(SIDEBAR_MIN, budget - nextList);
    }
    if (nextList !== listWidth) setListWidth(nextList);
    if (nextSidebar !== sidebarWidth) setSidebarWidth(nextSidebar);
  }, [containerWidth, sidebarWidth, listWidth]);

  const startSidebarResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSidebar = sidebarWidth;
    const startList = listWidth;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const onMove = (ev: PointerEvent) => {
      const rawDelta = ev.clientX - startX;
      const minDelta = Math.max(SIDEBAR_MIN - startSidebar, startList - LIST_MAX);
      const maxDelta = Math.min(SIDEBAR_MAX - startSidebar, startList - LIST_MIN);
      const delta = clamp(rawDelta, minDelta, maxDelta);
      setSidebarWidth(startSidebar + delta);
      setListWidth(startList - delta);
    };

    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startListResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startList = listWidth;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    const onMove = (ev: PointerEvent) => {
      const rawDelta = ev.clientX - startX;
      const maxListFromContainer = containerWidth - 2 * RESIZER_W - sidebarWidth - DETAIL_MIN;
      const upper = Math.min(LIST_MAX, Math.max(LIST_MIN, maxListFromContainer));
      setListWidth(clamp(startList + rawDelta, LIST_MIN, upper));
    };

    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const gmail = useGmailEmails({
    accountId: isGmail ? source.account.id : null,
    folder,
    enabled: isGmail,
  });

  const currentAccount = accounts.find((a) => a.id === currentAccountId) ?? accounts[0]!;

  const records: EmailRecord[] = useMemo(() => {
    if (isGmail) return gmail.emails;
    return rawEmails.map((e) => toRecord(e, currentAccountId));
  }, [isGmail, gmail.emails, rawEmails, currentAccountId]);

  const allThreads = useMemo(() => groupEmailsByThread(records), [records]);

  const filteredThreads = useMemo(() => {
    if (isGmail) {
      return applyFilters(allThreads, filters, snoozedEmails);
    }

    let list = allThreads.filter((t) => {
      const last = t[t.length - 1]!;
      switch (folder) {
        case "starred":
          return t.some((m) => m.starred);
        case "snoozed":
          return false;
        case "drafts":
          return last.folder === "drafts";
        case "scheduled":
          return last.folder === "scheduled";
        case "spam":
          return last.folder === "spam";
        case "trash":
          return last.folder === "trash";
        case "archive":
          return last.folder === "archive";
        case "sent":
          return last.folder === "sent";
        case "inbox":
        default:
          return last.folder === "inbox";
      }
    });

    list = applyFilters(list, filters, snoozedEmails);

    return list;
  }, [isGmail, allThreads, folder, filters, snoozedEmails]);

  const counts: Record<FolderKey, number> = useMemo(() => {
    if (isGmail) {
      return {
        inbox: 0, starred: 0, sent: 0, drafts: 0,
        scheduled: 0, archive: 0, spam: 0, trash: 0,
      };
    }
    const pick = (predicate: (t: EmailRecord[]) => boolean) =>
      allThreads.filter((t) => predicate(t)).length;
    return {
      inbox: pick((t) => t[t.length - 1]!.folder === "inbox"),
      starred: pick((t) => t.some((m) => m.starred)),
      sent: pick((t) => t[t.length - 1]!.folder === "sent"),
      drafts: pick((t) => t[t.length - 1]!.folder === "drafts"),
      scheduled: pick((t) => t[t.length - 1]!.folder === "scheduled"),
      archive: pick((t) => t[t.length - 1]!.folder === "archive"),
      spam: pick((t) => t[t.length - 1]!.folder === "spam"),
      trash: pick((t) => t[t.length - 1]!.folder === "trash"),
    };
  }, [isGmail, allThreads]);

  const unreadCount = useMemo(() => records.filter((r) => r.unread).length, [records]);

  const currentThread = useMemo(
    () => filteredThreads.find((t) => t.some((m) => m.threadId === selectedThreadId)) ?? null,
    [filteredThreads, selectedThreadId],
  );

  const openThread = (threadId: string) => {
    const thread = allThreads.find((t) => t.some((m) => m.threadId === threadId));
    setSelectedThreadId(threadId);
    if (thread) {
      for (const m of thread) {
        if (m.unread) markEmailRead(m.id);
      }
    }
    setMobileDetailOpen(true);
  };

  const applyArchive = (threadId: string) => {
    if (!guardWrite("archiver")) return;
    const thread = recordsInThread(threadId);
    const ids = thread.map((m) => m.id);
    const previousFolders = thread.map((m) => m.folder ?? "inbox");
    ids.forEach(archiveEmail);
    toast.success("Message archivé");
    pushUndo({
      id: `undo-${Date.now()}`,
      label: "Message archivé",
      expiresAt: Date.now() + 8000,
      revert: () => {
        ids.forEach((id, i) => {
          const prev = previousFolders[i] ?? "inbox";
          moveEmailToFolder(id, prev);
        });
      },
    });
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
      setMobileDetailOpen(false);
    }
  };

  const applyDelete = (threadId: string) => {
    if (!guardWrite("supprimer")) return;
    const ids = recordsInThread(threadId).map((m) => m.id);
    ids.forEach(deleteEmail);
    toast.success("Message déplacé vers la corbeille");
    pushUndo({
      id: `undo-${Date.now()}`,
      label: "Message supprimé",
      expiresAt: Date.now() + 8000,
      revert: () => ids.forEach(restoreEmail),
    });
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
      setMobileDetailOpen(false);
    }
  };

  const applyStar = (threadId: string) => {
    if (!guardWrite("mettre en favori")) return;
    const last = recordsInThread(threadId)[recordsInThread(threadId).length - 1];
    if (last) toggleEmailStar(last.id);
  };

  const applyToggleRead = (threadId: string) => {
    if (!guardWrite("marquer comme lu/non lu")) return;
    const ids = recordsInThread(threadId).map((m) => m.id);
    const anyUnread = recordsInThread(threadId).some((m) => m.unread);
    ids.forEach((id) => {
      const rec = records.find((r) => r.id === id);
      if (!rec) return;
      if (anyUnread && rec.unread) markEmailRead(id);
      if (!anyUnread && !rec.unread) toggleEmailRead(id);
    });
  };

  const applySnooze = (threadId: string, date: Date) => {
    if (!guardWrite("reporter")) return;
    const ids = recordsInThread(threadId).map((m) => m.id);
    const iso = date.toISOString();
    ids.forEach((id) => snoozeEmail(id, iso));
    toast.success(`Reporté · ${formatScheduleHint(date)}`);
    pushUndo({
      id: `undo-${Date.now()}`,
      label: "Message reporté",
      expiresAt: Date.now() + 8000,
      revert: () => {
        toast.info("Report annulé — rechargement conseillé");
      },
    });
  };

  const recordsInThread = (threadId: string): EmailRecord[] =>
    allThreads.find((t) => t.some((m) => m.threadId === threadId)) ?? [];

  const openComposer = (state: ComposerState) => {
    if (!guardWrite("composer un message")) return;
    setComposerState(state);
    setComposerOpen(true);
  };

  const handleCompose = () => openComposer({ mode: "new" });
  const handleReply = () => {
    const last = currentThread?.[currentThread.length - 1];
    if (!last) return;
    openComposer({ mode: "reply", source: last });
  };
  const handleReplyAll = () => {
    const last = currentThread?.[currentThread.length - 1];
    if (!last) return;
    openComposer({ mode: "replyAll", source: last });
  };
  const handleForward = () => {
    const last = currentThread?.[currentThread.length - 1];
    if (!last) return;
    openComposer({ mode: "forward", source: last });
  };

  const handleSend = (payload: ComposerPayload) => {
    const id = `e-${Date.now()}`;
    const email: Email = {
      id,
      threadId: payload.threadId ?? id,
      accountId: payload.accountId,
      from: payload.from.name ?? payload.from.email,
      to: payload.to.map((a) => a.email),
      cc: payload.cc.map((a) => a.email),
      bcc: payload.bcc.map((a) => a.email),
      subject: payload.subject,
      preview: payload.body.split("\n").slice(0, 2).join(" ").slice(0, 140),
      body: payload.body,
      time: "à l'instant",
      date: new Date().toISOString(),
      unread: false,
      status: "sent",
      folder: "sent",
      attachments: payload.attachments.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        mime: a.mime,
        kind: a.kind,
      })),
    };
    sendEmail(email);
  };

  const handleSaveDraft = (payload: ComposerPayload) => {
    const id = payload.draftId ?? `draft-${Date.now()}`;
    const email: Email = {
      id,
      threadId: payload.threadId ?? id,
      accountId: payload.accountId,
      from: payload.from.name ?? payload.from.email,
      to: payload.to.map((a) => a.email),
      subject: payload.subject,
      preview: payload.body.split("\n").slice(0, 2).join(" ").slice(0, 140),
      body: payload.body,
      time: "à l'instant",
      date: new Date().toISOString(),
      unread: false,
      status: "draft",
      folder: "drafts",
      attachments: payload.attachments.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        mime: a.mime,
        kind: a.kind,
      })),
    };
    saveDraft(email);
  };

  const handleScheduleSend = (payload: ComposerPayload, at: Date) => {
    const id = `sched-${Date.now()}`;
    const email: Email = {
      id,
      threadId: payload.threadId ?? id,
      accountId: payload.accountId,
      from: payload.from.name ?? payload.from.email,
      to: payload.to.map((a) => a.email),
      subject: payload.subject,
      preview: payload.body.split("\n").slice(0, 2).join(" ").slice(0, 140),
      body: payload.body,
      time: formatScheduleHint(at),
      date: new Date().toISOString(),
      unread: false,
      status: "scheduled",
      folder: "scheduled",
      scheduledAt: at.toISOString(),
      attachments: payload.attachments.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        mime: a.mime,
        kind: a.kind,
      })),
    };
    scheduleEmail(email, at.toISOString());
  };

  const toggleSelect = (threadId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(threadId) ? next.delete(threadId) : next.add(threadId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkIds = () => {
    const ids: string[] = [];
    for (const tid of selectedIds) {
      for (const m of recordsInThread(tid)) ids.push(m.id);
    }
    return ids;
  };

  const bulkArchive = () => {
    if (!guardWrite("archiver en masse")) return;
    const ids = bulkIds();
    ids.forEach(archiveEmail);
    toast.success(`${selectedIds.size} fil(s) archivé(s)`);
    pushUndo({
      id: `undo-${Date.now()}`,
      label: `${selectedIds.size} fil(s) archivé(s)`,
      expiresAt: Date.now() + 8000,
      revert: () => ids.forEach(restoreEmail),
    });
    clearSelection();
  };

  const bulkDelete = () => {
    if (!guardWrite("supprimer en masse")) return;
    const ids = bulkIds();
    ids.forEach(deleteEmail);
    toast.success(`${selectedIds.size} fil(s) supprimé(s)`);
    pushUndo({
      id: `undo-${Date.now()}`,
      label: `${selectedIds.size} fil(s) supprimé(s)`,
      expiresAt: Date.now() + 8000,
      revert: () => ids.forEach(restoreEmail),
    });
    clearSelection();
  };

  const bulkMarkRead = () => {
    if (!guardWrite("marquer comme lu en masse")) return;
    bulkIds().forEach(markEmailRead);
    clearSelection();
  };
  const bulkMarkUnread = () => {
    if (!guardWrite("marquer comme non lu en masse")) return;
    bulkIds().forEach((id) => {
      const rec = records.find((r) => r.id === id);
      if (rec && !rec.unread) toggleEmailRead(id);
    });
    clearSelection();
  };
  const bulkStar = () => {
    if (!guardWrite("mettre en favori en masse")) return;
    bulkIds().forEach(toggleEmailStar);
    clearSelection();
  };

  const contextItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    const threadId = contextMenu.threadId;
    const thread = recordsInThread(threadId);
    if (thread.length === 0) return [];
    const last = thread[thread.length - 1]!;
    const isStarred = thread.some((m) => m.starred);
    const isUnread = thread.some((m) => m.unread);

    return [
      {
        label: "Répondre",
        icon: Reply,
        shortcut: "r",
        onSelect: () => {
          setSelectedThreadId(threadId);
          openComposer({ mode: "reply", source: last });
        },
      },
      {
        label: "Répondre à tous",
        icon: ReplyAll,
        shortcut: "a",
        onSelect: () => {
          setSelectedThreadId(threadId);
          openComposer({ mode: "replyAll", source: last });
        },
      },
      {
        label: "Transférer",
        icon: Forward,
        shortcut: "f",
        onSelect: () => {
          setSelectedThreadId(threadId);
          openComposer({ mode: "forward", source: last });
        },
      },
      {
        label: isStarred ? "Retirer des favoris" : "Marquer comme favori",
        icon: Star,
        shortcut: "s",
        separatorBefore: true,
        onSelect: () => applyStar(threadId),
      },
      {
        label: isUnread ? "Marquer comme lu" : "Marquer comme non lu",
        icon: isUnread ? CheckCheck : CircleDot,
        shortcut: isUnread ? "u" : "⇧u",
        onSelect: () => applyToggleRead(threadId),
      },
      {
        label: "Reporter à…",
        icon: Clock,
        shortcut: "b",
        onSelect: () => {
          applySnooze(threadId, new Date(Date.now() + 24 * 60 * 60 * 1000));
        },
      },
      {
        label: "Déplacer vers…",
        icon: FolderInput,
        onSelect: () => applyArchive(threadId),
      },
      {
        label: "Supprimer",
        icon: Trash2,
        tone: "danger",
        separatorBefore: true,
        shortcut: "#",
        onSelect: () => applyDelete(threadId),
      },
    ];
  }, [contextMenu, records]);

  useEmailShortcuts({
    disabled: composerOpen || shortcutsOpen || labelManagerOpen,
    onCompose: isGmail ? undefined : handleCompose,
    onReply: !isGmail && currentThread ? handleReply : undefined,
    onReplyAll: !isGmail && currentThread ? handleReplyAll : undefined,
    onForward: !isGmail && currentThread ? handleForward : undefined,
    onArchive: !isGmail && currentThread
      ? () => applyArchive(currentThread[0]!.threadId!)
      : undefined,
    onDelete: !isGmail && currentThread
      ? () => applyDelete(currentThread[0]!.threadId!)
      : undefined,
    onToggleStar: !isGmail && currentThread
      ? () => applyStar(currentThread[0]!.threadId!)
      : undefined,
    onToggleRead: !isGmail && currentThread
      ? () => applyToggleRead(currentThread[0]!.threadId!)
      : undefined,
    onSnooze: !isGmail && currentThread
      ? () => applySnooze(currentThread[0]!.threadId!, new Date(Date.now() + 86_400_000))
      : undefined,
    onNext: () => {
      if (!filteredThreads.length) return;
      const idx = filteredThreads.findIndex((t) => t.some((m) => m.threadId === selectedThreadId));
      const next = filteredThreads[Math.min(idx + 1, filteredThreads.length - 1)];
      if (next) openThread(next[0]!.threadId!);
    },
    onPrev: () => {
      if (!filteredThreads.length) return;
      const idx = filteredThreads.findIndex((t) => t.some((m) => m.threadId === selectedThreadId));
      const prev = filteredThreads[Math.max(idx - 1, 0)];
      if (prev) openThread(prev[0]!.threadId!);
    },
    onEscape: () => {
      if (contextMenu) setContextMenu(null);
      else if (mobileDetailOpen) {
        setMobileDetailOpen(false);
        setSelectedThreadId(null);
      }
    },
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>("[data-email-search] input");
      input?.focus();
    },
    onHelp: () => setShortcutsOpen(true),
  });

  const folderLabel = FOLDERS.find((f) => f.key === folder)?.label ?? "Boîte de réception";
  const activeFilters = hasActiveFilters(filters);

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full overflow-hidden bg-background md:gap-0 md:bg-muted/40 md:p-2"
    >
      {foldersOpen && (
        <div
          onClick={() => setFoldersOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-background",
          "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transition-transform duration-200",
          foldersOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:z-auto md:h-full md:min-h-0 md:translate-x-0 md:shrink-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:shadow-sm md:w-[var(--emails-sidebar-w)]",
        )}
        style={{ ["--emails-sidebar-w" as string]: `${sidebarWidth}px` }}
      >
        <div className="shrink-0 space-y-2 border-b border-border p-3">
          <AccountSwitcher
            accounts={accounts}
            currentId={currentAccountId}
            onSelect={setCurrentAccountId}
            onAdd={() => setAddAccountOpen(true)}
            onManage={() => setManageOpen(true)}
          />
          <button
            onClick={handleCompose}
            disabled={isGmail}
            title={isGmail ? "Lecture seule — impossible de composer depuis Gmail" : "Nouveau message"}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PenSquare className="size-3.5" />
            Nouveau message
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dossiers
          </p>
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const active = folder === f.key;
            const count = counts[f.key];
            return (
              <button
                key={f.key}
                onClick={() => {
                  setFolder(f.key);
                  setFoldersOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span className="flex-1 truncate text-left">{f.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-mono",
                      active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <p className="mt-4 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Labels
          </p>
          {labels.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  labels: prev.labels?.includes(l.id)
                    ? prev.labels.filter((x) => x !== l.id)
                    : [...(prev.labels ?? []), l.id],
                }));
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                filters.labels?.includes(l.id)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="flex-1 truncate text-left">{l.name}</span>
            </button>
          ))}
          <button
            onClick={() => setLabelManagerOpen(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Tag className="size-3.5" />
            <span>Gérer les labels</span>
          </button>

          <p className="mt-4 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Comptes
          </p>
          {isGmail ? (
            <div className="flex w-full items-center gap-2 rounded-lg bg-primary/[0.06] px-2 py-1.5 text-xs">
              <ProviderLogo provider="gmail" className="size-3.5 shrink-0" />
              <span className="flex-1 truncate text-left">{source.account.address}</span>
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-mono text-primary">
                RO
              </span>
            </div>
          ) : (
            <>
              {accounts.map((a) => {
                const active = a.id === currentAccountId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setCurrentAccountId(a.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60",
                    )}
                  >
                    <ProviderLogo provider={a.provider} className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate text-left">{a.email}</span>
                    {typeof a.unread === "number" && a.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-mono text-primary">
                        {a.unread}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => setAddAccountOpen(true)}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Plus className="size-3.5" />
                <span>Ajouter un compte</span>
              </button>
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-border p-2 space-y-0.5">
          <button
            onClick={() => setShortcutsOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Keyboard className="size-3.5" />
            <span>Raccourcis clavier</span>
          </button>
          <button
            onClick={() => setManageOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="size-3.5" />
            <span>Paramètres des comptes</span>
          </button>
        </div>
      </aside>

      <Resizer
        onPointerDown={startSidebarResize}
        onDoubleClick={() => {
          setSidebarWidth(SIDEBAR_DEFAULT);
          setListWidth(LIST_DEFAULT);
        }}
        label="Redimensionner les dossiers"
      />

      <section
        className={cn(
          "flex h-full min-h-0 flex-col bg-background",
          "w-full md:w-[var(--emails-list-w)] md:shrink-0 md:overflow-hidden md:rounded-xl md:border md:border-border md:shadow-sm",
          mobileDetailOpen ? "hidden md:flex" : "flex",
        )}
        style={{ ["--emails-list-w" as string]: `${listWidth}px` }}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border p-2">
          <button
            onClick={() => setFoldersOpen((v) => !v)}
            className="rounded-lg p-1.5 transition-colors hover:bg-secondary md:hidden"
            aria-label="Dossiers"
          >
            <Inbox className="size-4" />
          </button>
          <div data-email-search className="flex-1 min-w-0">
            <SearchBar
              value={filters.query}
              onChange={(q) => setFilters((prev) => ({ ...prev, query: q }))}
              onOpenAdvanced={() => setAdvancedOpen(true)}
              activeFilters={filters}
            />
          </div>
          <button
            onClick={() => {
              if (isGmail) {
                void gmail.refresh();
              } else {
                toast("Actualisation…");
              }
            }}
            disabled={isGmail && gmail.loading}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary disabled:opacity-50"
            aria-label="Actualiser"
          >
            <RefreshCw
              className={cn("size-3.5", isGmail && gmail.loading && "animate-spin")}
            />
          </button>
        </div>

        <div className="shrink-0 border-b border-border px-3 py-2">
          <QuickFilterChips filters={filters} onChange={(f) => setFilters(f)} />
        </div>

        <BulkBar
          count={selectedIds.size}
          onClear={clearSelection}
          onArchive={bulkArchive}
          onDelete={bulkDelete}
          onMarkRead={bulkMarkRead}
          onMarkUnread={bulkMarkUnread}
          onStar={bulkStar}
        />

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate font-display text-base italic">{folderLabel}</h2>
            {isGmail && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-medium text-primary">
                <ShieldCheck className="size-2.5" />
                Lecture seule
              </span>
            )}
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {filteredThreads.length} fil{filteredThreads.length > 1 ? "s" : ""}
            {activeFilters && " · filtrés"}
            {isGmail && gmail.resultSizeEstimate > 0 && (
              <> · ~{gmail.resultSizeEstimate}</>
            )}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {isGmail && gmail.error && (
            <div
              role="alert"
              className="m-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11.5px] text-destructive"
            >
              {gmail.error}
            </div>
          )}
          {isGmail && gmail.loading && filteredThreads.length === 0 ? (
            <GmailThreadsSkeleton rows={6} />
          ) : filteredThreads.length === 0 ? (
            <div className="relative isolate m-3 overflow-hidden rounded-xl">
              <img
                src="/images/app/emails.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
              />
              <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
                <EmptyState
                  icon={Mail}
                  title="Aucun message"
                  description={
                    activeFilters
                      ? "Aucun résultat pour ces filtres."
                      : `Rien à afficher dans « ${folderLabel} ».`
                  }
                  size="sm"
                />
              </div>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const threadId = thread[0]!.threadId!;
              const active = thread.some((m) => m.threadId === selectedThreadId);
              const triggers = createContextTriggers(
                threadId,
                (x, y) => setContextMenu({ x, y, threadId }),
                triggerStoreRef.current,
              );
              return (
                <div key={threadId} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(threadId)}
                    onChange={() => toggleSelect(threadId)}
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "absolute left-2 top-3 z-10 size-3.5 cursor-pointer rounded border-border accent-primary",
                      !selectedIds.has(threadId) &&
                        "opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100",
                    )}
                    aria-label="Sélectionner"
                  />
                  <div
                    className="group relative"
                    onContextMenu={triggers.onContextMenu}
                    onTouchStart={triggers.onTouchStart}
                    onTouchEnd={triggers.onTouchEnd}
                    onTouchMove={triggers.onTouchMove}
                    onTouchCancel={triggers.onTouchCancel}
                  >
                    <ThreadPreviewRow
                      messages={thread}
                      labels={labels}
                      active={active}
                      onClick={() => {
                        if (triggers.shouldIgnoreClick()) return;
                        openThread(threadId);
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <Resizer
        onPointerDown={startListResize}
        onDoubleClick={() => setListWidth(LIST_DEFAULT)}
        label="Redimensionner la liste"
      />

      <section
        className={cn(
          "flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background",
          "md:overflow-hidden md:rounded-xl md:border md:border-border md:shadow-sm",
          mobileDetailOpen ? "flex" : "hidden md:flex",
        )}
      >
        {!currentThread ? (
          <div className="relative isolate h-full w-full overflow-hidden">
            <img
              src="/images/app/emails-select.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
            />
            <div className="relative z-10 grid h-full place-items-center bg-background/45 p-6 backdrop-blur-[1px]">
              <div className="text-center">
                <Mail className="mx-auto size-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Sélectionnez un message pour le lire.
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  Appuyez sur{" "}
                  <kbd className="rounded border border-border bg-surface px-1 font-mono text-[10px]">
                    ?
                  </kbd>{" "}
                  pour voir les raccourcis.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5 md:px-3 md:py-2">
              <button
                onClick={() => {
                  setMobileDetailOpen(false);
                  setSelectedThreadId(null);
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-secondary md:hidden"
                aria-label="Retour"
              >
                <ArrowLeft className="size-4" />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
                <button
                  onClick={() => applyStar(currentThread[0]!.threadId!)}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Favori (s)"
                >
                  <Star
                    className={cn(
                      "size-4",
                      currentThread.some((m) => m.starred) && "fill-amber-400 text-amber-400",
                    )}
                  />
                </button>
                <button
                  onClick={() => applyArchive(currentThread[0]!.threadId!)}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Archiver (e)"
                >
                  <Archive className="size-4" />
                </button>
                <button
                  onClick={() => applyDelete(currentThread[0]!.threadId!)}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Supprimer (#)"
                >
                  <Trash2 className="size-4" />
                </button>

                <SnoozeMenu
                  onSnooze={(date) => applySnooze(currentThread[0]!.threadId!, date)}
                  trigger={
                    <button
                      className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                      title="Reporter (b)"
                    >
                      <Clock className="size-4" />
                    </button>
                  }
                />

                <LabelPicker
                  labels={labels}
                  selectedIds={Array.from(new Set(currentThread.flatMap((m) => m.labels ?? [])))}
                  onToggle={(labelId) => {
                    for (const m of currentThread) toggleEmailLabel(m.id, labelId);
                  }}
                  onCreate={(name, color) =>
                    addEmailLabel({
                      id: `label-${Date.now()}`,
                      name,
                      color,
                    })
                  }
                  onManage={() => setLabelManagerOpen(true)}
                  trigger={
                    <button
                      className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                      title="Labels"
                    >
                      <Tag className="size-4" />
                    </button>
                  }
                />

                <span className="mx-1 h-4 w-px shrink-0 bg-border" />
                <button
                  onClick={handleReply}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Répondre (r)"
                >
                  <Reply className="size-4" />
                </button>
                <button
                  onClick={handleReplyAll}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Répondre à tous (a)"
                >
                  <ReplyAll className="size-4" />
                </button>
                <button
                  onClick={handleForward}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Transférer (f)"
                >
                  <Forward className="size-4" />
                </button>
              </div>

              <button
                onClick={() => toast("Plus d'options…")}
                className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                title="Plus"
              >
                <MoreVertical className="size-4" />
              </button>
            </div>

            {currentThread.some((m) => m.snoozedUntil) && (
              <div className="flex items-center gap-2 border-b border-warning/40 bg-warning/10 px-3 py-1.5 text-[11px]">
                <Clock className="size-3.5 shrink-0 text-warning" />
                <span>
                  Reporté ·{" "}
                  {formatScheduleHint(
                    new Date(currentThread.find((m) => m.snoozedUntil)!.snoozedUntil!),
                  )}
                </span>
              </div>
            )}

            <ThreadHeader
              messages={currentThread}
              labels={labels}
              onReply={handleReply}
              onReplyAll={handleReplyAll}
              onForward={handleForward}
              onToggleStar={() => applyStar(currentThread[0]!.threadId!)}
              isStarred={currentThread.some((m) => m.starred)}
            />

            <ThreadMessageList
              messages={currentThread}
              labels={labels}
              source={isGmail ? "gmail" : "demo"}
            />

            <ThreadAttachmentsSummary messages={currentThread} />

            <div className="shrink-0 border-t border-border bg-surface/30 p-3 md:p-4">
              <button
                onClick={handleReply}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-surface md:text-sm"
              >
                <Reply className="mr-2 inline size-3.5" />
                Répondre à {currentThread[currentThread.length - 1]?.from.name ?? "l'expéditeur"}…
              </button>
            </div>
          </>
        )}
      </section>

      {contextMenu && (
        <MailContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {lastUndo && (
        <UndoBanner
          undo={lastUndo}
          onUndo={() => {
            undoLastAction();
            toast.success("Action annulée");
          }}
          onClose={clearUndo}
        />
      )}

      <EmailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        state={composerState}
        account={currentAccount}
        onSend={handleSend}
        onSaveDraft={handleSaveDraft}
        onScheduleSend={handleScheduleSend}
        onDiscard={() => {
          const draftId = composerState?.draft?.id;
          if (draftId) deleteDraft(draftId);
        }}
      />

      <AdvancedFiltersPopover
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        filters={filters}
        onChange={setFilters}
        labels={labels}
      />

      <ShortcutsHelpDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <LabelManagerDialog
        open={labelManagerOpen}
        onOpenChange={setLabelManagerOpen}
        labels={labels}
        onCreate={(name, color) => addEmailLabel({ id: `label-${Date.now()}`, name, color })}
        onDelete={deleteEmailLabel}
      />

      <AddAccountDialog
        open={addAccountOpen}
        onOpenChange={setAddAccountOpen}
        onAdd={(acc) => {
          setAccounts((prev) => [...prev, acc]);
          setCurrentAccountId(acc.id);
        }}
      />

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md dialog-content">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Comptes connectés</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <LetterAvatar name={a.name} size={32} shape="rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{a.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{a.email}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <ProviderLogo provider={a.provider} className="size-2.5" />
                  {PROVIDER_LABELS[a.provider]}
                </span>
                {accounts.length > 1 && (
                  <button
                    onClick={() => {
                      setAccounts((prev) => prev.filter((x) => x.id !== a.id));
                      if (currentAccountId === a.id) {
                        const next = accounts.find((x) => x.id !== a.id);
                        if (next) setCurrentAccountId(next.id);
                      }
                      toast.success("Compte déconnecté");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Déconnecter"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setManageOpen(false);
                setAddAccountOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" /> Ajouter un compte
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
