// frontend/components/mobile/mobile-profile-drawer.tsx

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpCircle,
  Bell,
  ChevronRight,
  CircleHelp,
  Download,
  Globe,
  Info,
  LogOut,
  Settings as SettingsIcon,
  Tag,
  X,
  type LucideIcon,
} from "@/components/icons";

import { cn } from "@/lib/core/utils";
import { useAppStore } from "@/lib/state/store";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSettings } from "@/components/settings/settings-context";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { openNotificationCenter } from "@/components/layout/notification-center";
import { setAssistantDocked, useAssistantDocked } from "@/components/ai-assistant/assistant-dock";

export type MobileProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileProfileDrawer({ open, onOpenChange }: MobileProfileDrawerProps) {
  const queryClient = useQueryClient();
  const { clearUser, notifications } = useAppStore();
  const assistantDocked = useAssistantDocked();
  const unreadImportant = notifications.filter((n) => n.important && !n.read).length;
  const { openSettings } = useSettings();
  const user = useCurrentUser();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const close = () => onOpenChange(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const handleOpenSettings = (section?: Parameters<typeof openSettings>[0]) => {
    close();
    openSettings(section ?? "general");
  };

  const confirmLogout = async () => {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      clearUser();
      queryClient.setQueryData(["current-user"], null);
      setLogoutOpen(false);
      close();
      toast.success("Vous avez été déconnecté");
      window.location.assign("/login");
    } catch {
      toast.error("La déconnexion a échoué. Veuillez réessayer.");
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[90] bg-foreground/45 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={close}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu du compte"
        className={cn(
          "fixed inset-y-0 left-0 z-[91] flex w-[85vw] max-w-[340px] flex-col",
          "bg-background shadow-[16px_0_60px_-20px_rgba(0,0,0,0.4)]",
          "animate-in slide-in-from-left duration-200 ease-out",
        )}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-border/60 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <span className="relative block size-12 shrink-0">
            <LetterAvatar name={user.fullName} size={48} shape="circle" />
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 size-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            {user.email && (
              <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
            )}
            <p className="mt-1 truncate text-xs text-muted-foreground">Forfait · {user.plan}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors active:bg-surface"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </header>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
          <MenuGroup>
            <MenuRow
              icon={SettingsIcon}
              label="Paramètres"
              onClick={() => handleOpenSettings("general")}
            />
            <MenuRow
              icon={Bell}
              label="Notifications"
              trailingNode={
                unreadImportant > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold tabular-nums text-white">
                    {unreadImportant > 99 ? "99+" : unreadImportant}
                  </span>
                ) : undefined
              }
              onClick={() => {
                close();
                requestAnimationFrame(() => openNotificationCenter());
              }}
            />
            <MenuRow
              icon={Globe}
              label="Langue"
              onClick={() => {
                close();
                openSettings("general");
                toast.info("Langue : modifiable dans la section Général");
              }}
            />
            <MenuRow
              icon={CircleHelp}
              label="Obtenir de l'aide"
              onClick={() => {
                close();
                toast.info("Centre d'aide bientôt disponible.");
              }}
            />
          </MenuGroup>

          <MenuGroup>
            <MenuRow
              icon={Tag}
              label="Étiquette de l'assistant IA"
              description={
                assistantDocked
                  ? "Masquée · l'assistant est dans la barre du haut"
                  : "Affichée sur le bord de l'écran"
              }
              role="switch"
              checked={!assistantDocked}
              trailingNode={<Toggle on={!assistantDocked} />}
              onClick={() => {
                const nextDocked = !assistantDocked;
                setAssistantDocked(nextDocked);
                toast.success(
                  nextDocked
                    ? "Assistant IA placé dans la barre du haut"
                    : "Étiquette de l'assistant IA réaffichée",
                );
              }}
            />
          </MenuGroup>

          <MenuGroup>
            <MenuRow
              icon={ArrowUpCircle}
              label="Mettre le forfait à niveau"
              onClick={() => handleOpenSettings("billing")}
            />
            <MenuRow
              icon={Download}
              label="Applications et extensions"
              onClick={() => {
                close();
                toast.info("Applications et extensions bientôt disponibles.");
              }}
            />
            <MenuRow
              icon={Info}
              label="En savoir plus"
              trailing="chevron"
              onClick={() => {
                close();
                toast.info("Page « En savoir plus » bientôt disponible.");
              }}
            />
          </MenuGroup>
        </nav>

        <footer className="shrink-0 border-t border-border/60 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <MenuGroup className="mb-0">
            <MenuRow
              icon={LogOut}
              label="Se déconnecter"
              variant="destructive"
              onClick={() => {
                close();
                setLogoutOpen(true);
              }}
            />
          </MenuGroup>
        </footer>
      </aside>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={confirmLogout}
        title="Se déconnecter ?"
        description="Votre travail enregistré restera disponible à votre prochaine connexion."
        confirmLabel="Se déconnecter"
        cancelLabel="Rester connecté"
        variant="destructive"
      />
    </>,
    document.body,
  );
}

function MenuGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "mx-3 mb-4 overflow-hidden rounded-2xl border border-border/60 bg-surface/30",
        className,
      )}
    >
      {children}
    </ul>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  trailing,
  trailingNode,
  description,
  role,
  checked,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  trailing?: "chevron";
  trailingNode?: ReactNode;
  description?: string;
  role?: "switch";
  checked?: boolean;
}) {
  const isDestructive = variant === "destructive";
  return (
    <li className="border-b border-border/40 last:border-b-0">
      <button
        type="button"
        onClick={onClick}
        role={role}
        aria-checked={role === "switch" ? checked : undefined}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition-colors",
          isDestructive
            ? "text-destructive active:bg-destructive/10"
            : "text-foreground active:bg-surface/70",
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0",
            isDestructive ? "text-destructive" : "text-muted-foreground",
          )}
          strokeWidth={1.75}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{label}</span>
          {description && (
            <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
              {description}
            </span>
          )}
        </span>
        {trailingNode}
        {trailing === "chevron" && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        )}
      </button>
    </li>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
          on && "translate-x-4",
        )}
      />
    </span>
  );
}
