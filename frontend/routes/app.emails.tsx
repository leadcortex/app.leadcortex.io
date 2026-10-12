//frontend\routes\app.emails.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui-primitives";
import { EmptyState } from "@/components/empty-state";
import { MailboxSkeleton } from "@/components/skeletons";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import {
  ProviderLogo,
  PROVIDER_LABELS,
  PROVIDER_HINTS,
  PROVIDER_COLORS,
  type MailProvider,
} from "@/components/mail/provider-logos";
import {
  Inbox,
  Send,
  Star,
  Archive,
  Reply,
  Forward,
  MoreVertical,
  Mail,
  Trash2,
  FileText,
  AlertTriangle,
  PenSquare,
  Search,
  Plus,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  FolderInput,
  CheckCheck,
  CircleDot,
  ArrowLeft,
  Paperclip,
  Settings,
  LogOut,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/emails")({
  head: () => ({ meta: [{ title: "Emails — LeadCortex" }] }),
  pendingComponent: () => <MailboxSkeleton />,
  component: EmailsPage,
});

type MailAccount = {
  id: string;
  name: string;
  email: string;
  provider: MailProvider;
  unread?: number;
};

type FolderKey = "inbox" | "starred" | "sent" | "drafts" | "archive" | "spam" | "trash";

const FOLDERS: { key: FolderKey; label: string; icon: typeof Inbox }[] = [
  { key: "inbox", label: "Boîte de réception", icon: Inbox },
  { key: "starred", label: "Favoris", icon: Star },
  { key: "sent", label: "Envoyés", icon: Send },
  { key: "drafts", label: "Brouillons", icon: FileText },
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
  },
  {
    id: "acc-2",
    name: "LeadCortex Contact",
    email: "contact@leadcortex.io",
    provider: "outlook",
    unread: 0,
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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
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

  const W = 230;
  const H = items.length * 36 + 16;
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
            <span className="truncate">{it.label}</span>
          </button>
        </Fragment>
      ))}
    </div>,
    document.body,
  );
}

function useContextTriggers(onOpen: (x: number, y: number) => void) {
  const pressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const clear = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      onOpen(e.clientX, e.clientY);
    },
    onTouchStart: (e: React.TouchEvent) => {
      longPressTriggered.current = false;
      const t = e.touches[0];
      const { clientX, clientY } = t;
      clear();
      pressTimer.current = window.setTimeout(() => {
        longPressTriggered.current = true;
        onOpen(clientX, clientY);
        if (navigator.vibrate) navigator.vibrate(15);
      }, 480);
    },
    onTouchEnd: () => clear(),
    onTouchMove: () => clear(),
    onTouchCancel: () => clear(),
    shouldIgnoreClick: () => longPressTriggered.current,
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
  const current = accounts.find((a) => a.id === currentId) ?? accounts[0];
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

/* -------------------------------------------------------------------------- */
/*  Ligne d'email                                                             */
/* -------------------------------------------------------------------------- */

function EmailRow({
  email,
  active,
  starred,
  onClick,
  onContext,
}: {
  email: {
    id: string;
    from: string;
    subject: string;
    preview: string;
    time: string;
    unread?: boolean;
  };
  active: boolean;
  starred: boolean;
  onClick: () => void;
  onContext: (x: number, y: number) => void;
}) {
  const triggers = useContextTriggers(onContext);

  return (
    <button
      onClick={() => {
        if (triggers.shouldIgnoreClick()) return;
        onClick();
      }}
      {...triggers}
      className={cn(
        "group relative flex w-full flex-col gap-1 border-b border-border/60 px-3 py-3 text-left transition-colors",
        active ? "bg-primary/5" : "hover:bg-surface/60",
      )}
    >
      <div className="flex items-start gap-2">
        <LetterAvatar name={email.from} size={32} shape="circle" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn("truncate text-xs", email.unread ? "font-semibold" : "font-medium")}
            >
              {email.from}
            </span>
            {email.unread && <CircleDot className="size-2.5 text-primary shrink-0" />}
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{email.time}</span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-xs",
              email.unread ? "text-foreground" : "text-foreground/80",
            )}
          >
            {email.subject}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{email.preview}</p>
        </div>
      </div>
      {starred && (
        <Star className="absolute right-2 top-2 size-3 fill-amber-400 text-amber-400 md:opacity-0 md:group-hover:opacity-100" />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function EmailsPage() {
  const { emails, markEmailRead } = useAppStore();

  const [accounts, setAccounts] = useState<MailAccount[]>(INITIAL_ACCOUNTS);
  const [currentAccountId, setCurrentAccountId] = useState(INITIAL_ACCOUNTS[0].id);
  const [folder, setFolder] = useState<FolderKey>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    emailId: string;
  } | null>(null);

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

  const currentAccount = accounts.find((a) => a.id === currentAccountId) ?? accounts[0];

  const baseList = useMemo(() => {
    let list = [...emails];
    switch (folder) {
      case "inbox":
        list = list.filter(
          (e) =>
            (e.status === "replied" || e.status === "opened") &&
            !deletedIds.has(e.id) &&
            !archivedIds.has(e.id),
        );
        break;
      case "sent":
        list = list.filter((e) => e.status === "sent" && !deletedIds.has(e.id));
        break;
      case "starred":
        list = list.filter((e) => starredIds.has(e.id) && !deletedIds.has(e.id));
        break;
      case "spam":
        list = list.filter((e) => e.status === "bounced" && !deletedIds.has(e.id));
        break;
      case "trash":
        list = list.filter((e) => deletedIds.has(e.id));
        break;
      case "archive":
        list = list.filter((e) => archivedIds.has(e.id) && !deletedIds.has(e.id));
        break;
      case "drafts":
        list = [];
        break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.from.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q),
      );
    }
    return list;
  }, [emails, folder, searchQuery, starredIds, deletedIds, archivedIds]);

  const selected = useMemo(
    () =>
      baseList.find((e) => e.id === selectedId) ?? emails.find((e) => e.id === selectedId) ?? null,
    [baseList, emails, selectedId],
  );

  const counts: Record<FolderKey, number> = useMemo(
    () => ({
      inbox: emails.filter(
        (e) =>
          (e.status === "replied" || e.status === "opened") &&
          !deletedIds.has(e.id) &&
          !archivedIds.has(e.id),
      ).length,
      starred: emails.filter((e) => starredIds.has(e.id) && !deletedIds.has(e.id)).length,
      sent: emails.filter((e) => e.status === "sent" && !deletedIds.has(e.id)).length,
      drafts: 0,
      archive: archivedIds.size,
      spam: emails.filter((e) => e.status === "bounced" && !deletedIds.has(e.id)).length,
      trash: deletedIds.size,
    }),
    [emails, starredIds, deletedIds, archivedIds],
  );

  const openEmail = (id: string) => {
    setSelectedId(id);
    markEmailRead?.(id);
    setMobileDetailOpen(true);
  };

  const toggleStar = (id: string) =>
    setStarredIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const archive = (id: string) => {
    setArchivedIds((prev) => new Set(prev).add(id));
    if (selectedId === id) {
      setSelectedId(null);
      setMobileDetailOpen(false);
    }
    toast.success("Email archivé");
  };

  const remove = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    if (selectedId === id) {
      setSelectedId(null);
      setMobileDetailOpen(false);
    }
    toast.success("Email déplacé vers la corbeille");
  };

  const restore = (id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success("Email restauré");
  };

  const contextItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    const id = contextMenu.emailId;
    const email = emails.find((e) => e.id === id);
    if (!email) return [];
    const isStarred = starredIds.has(id);
    const isDeleted = deletedIds.has(id);

    const items: ContextMenuItem[] = [
      {
        label: "Répondre",
        icon: Reply,
        onSelect: () => {
          setSelectedId(id);
          setMobileDetailOpen(true);
          toast("Réponse ouverte");
        },
      },
      {
        label: "Transférer",
        icon: Forward,
        onSelect: () => toast("Transfert préparé"),
      },
      {
        label: isStarred ? "Retirer des favoris" : "Marquer comme favori",
        icon: Star,
        onSelect: () => toggleStar(id),
      },
      {
        label: "Marquer comme lu",
        icon: CheckCheck,
        onSelect: () => markEmailRead?.(id),
      },
      {
        label: "Déplacer vers…",
        icon: FolderInput,
        separatorBefore: true,
        onSelect: () => archive(id),
      },
    ];

    if (isDeleted) {
      items.push({
        label: "Restaurer",
        icon: RefreshCw,
        tone: "default",
        onSelect: () => restore(id),
      });
    } else {
      items.push({
        label: "Supprimer",
        icon: Trash2,
        tone: "danger",
        separatorBefore: true,
        onSelect: () => remove(id),
      });
    }
    return items;
  }, [contextMenu, emails, starredIds, deletedIds]);

  const folderLabel = FOLDERS.find((f) => f.key === folder)?.label ?? "Boîte de réception";

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
            onClick={() => toast("Nouveau message — éditeur à venir")}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
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
            Comptes
          </p>
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
        </nav>

        <div className="shrink-0 border-t border-border p-2">
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
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={() => toast("Actualisation…")}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
            aria-label="Actualiser"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <h2 className="truncate font-display text-base italic">{folderLabel}</h2>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {baseList.length} messages
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {baseList.length === 0 ? (
            <div className="relative isolate m-3 overflow-hidden rounded-xl">
              <img
                src="/images/e-mail.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-[0.18] md:opacity-25"
              />
              <div className="relative z-10 bg-background/45 backdrop-blur-[1px]">
                <EmptyState
                  icon={Mail}
                  title="Aucun message"
                  description={`Rien à afficher dans « ${folderLabel} ».`}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            baseList.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                active={selectedId === email.id}
                starred={starredIds.has(email.id)}
                onClick={() => openEmail(email.id)}
                onContext={(x, y) => setContextMenu({ x, y, emailId: email.id })}
              />
            ))
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
        {!selected ? (
          <div className="relative isolate h-full w-full overflow-hidden">
            <img
              src="/images/select-email.webp"
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
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5 md:px-3 md:py-2">
              <button
                onClick={() => {
                  setMobileDetailOpen(false);
                  setSelectedId(null);
                }}
                className="rounded-lg p-1.5 transition-colors hover:bg-secondary md:hidden"
                aria-label="Retour"
              >
                <ArrowLeft className="size-4" />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
                <button
                  onClick={() => toggleStar(selected.id)}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Favori"
                >
                  <Star
                    className={cn(
                      "size-4",
                      starredIds.has(selected.id) && "fill-amber-400 text-amber-400",
                    )}
                  />
                </button>
                <button
                  onClick={() => archive(selected.id)}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Archiver"
                >
                  <Archive className="size-4" />
                </button>
                <button
                  onClick={() => remove(selected.id)}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Supprimer"
                >
                  <Trash2 className="size-4" />
                </button>
                <span className="mx-1 h-4 w-px shrink-0 bg-border" />
                <button
                  onClick={() => toast("Réponse ouverte")}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Répondre"
                >
                  <Reply className="size-4" />
                </button>
                <button
                  onClick={() => toast("Transfert préparé")}
                  className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-secondary"
                  title="Transférer"
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

            <div className="shrink-0 border-b border-border p-3 md:p-4">
              <h1 className="font-display text-lg md:text-2xl italic leading-tight break-words">
                {selected.subject}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <LetterAvatar name={selected.from} size={36} shape="circle" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs md:text-sm font-medium">
                    {selected.from}{" "}
                    <span className="font-normal text-muted-foreground">
                      &lt;{selected.from.toLowerCase().replace(/\s+/g, ".")}@mail.com&gt;
                    </span>
                  </p>
                  <p className="truncate text-[10px] md:text-xs text-muted-foreground">
                    à {currentAccount.email} · {selected.time}
                  </p>
                </div>
                <Badge
                  tone={
                    selected.status === "replied"
                      ? "primary"
                      : selected.status === "bounced"
                        ? "destructive"
                        : "muted"
                  }
                >
                  {selected.status}
                </Badge>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 text-xs leading-relaxed md:p-4 md:text-sm">
              <p>Bonjour Utilisateur,</p>
              <p className="break-words">{selected.preview}</p>
              <p className="break-words">
                J'ai regardé rapidement LeadCortex et je pense qu'il y a un vrai angle avec notre
                équipe R&D. Auriez-vous 30 minutes cette semaine pour en discuter ?
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Paperclip className="size-3" /> piece-jointe.pdf · 128 Ko
              </p>
              <p className="border-t border-border pt-4 text-[10px] text-muted-foreground md:text-xs">
                — {selected.from}
              </p>
            </div>

            <div className="shrink-0 border-t border-border bg-surface/30 p-3 md:p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Réponse suggérée par Cortex
              </p>
              <div className="rounded-lg border border-border bg-background p-3">
                <textarea
                  rows={3}
                  defaultValue="Merci pour ce retour rapide. Je vous propose jeudi 14h ou vendredi 10h. Quel créneau vous conviendrait ?"
                  className="w-full resize-none bg-transparent text-xs focus:outline-none md:text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => toast.success("Email envoyé")}
                    className="rounded-md bg-foreground px-3 py-1.5 text-[10px] text-background transition-opacity hover:opacity-90 md:text-xs"
                  >
                    Envoyer
                  </button>
                  <button
                    onClick={() => toast("Régénération…")}
                    className="rounded-md border border-border px-3 py-1.5 text-[10px] transition-colors hover:bg-surface md:text-xs"
                  >
                    Régénérer
                  </button>
                </div>
              </div>
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
