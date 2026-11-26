// frontend/components/conversations/conversation-list.tsx

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Star, Mail, MailOpen, Copy } from "@/components/icons";
import { CHANNELS, type ProspectThread } from "@/lib/conversations-mock";
import { cn } from "@/lib/core/utils";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  threads: ProspectThread[];
  selectedId: string;
  onSelect: (t: ProspectThread) => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (t: ProspectThread) => void;
  onToggleFavorite?: (id: string) => void;
  onToggleUnread?: (id: string) => void;
};

type MenuState = { x: number; y: number; thread: ProspectThread } | null;

export function ConversationList({
  threads,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onEdit,
  onToggleFavorite,
  onToggleUnread,
}: Props) {
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<MenuState>(null);

  const filtered = useMemo(
    () =>
      threads.filter((t) =>
        `${t.contact} ${t.company} ${t.last}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [threads, q],
  );

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const openMenu = (e: React.MouseEvent, t: ProspectThread) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, thread: t });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background p-3 md:p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h1 className="truncate font-display text-xl italic md:text-2xl">Conversations</h1>
          <button
            onClick={onNew}
            aria-label="Nouvelle conversation"
            title="Nouvelle conversation"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0 px-2.5 md:px-3")}
          >
            <Plus className="size-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Nouvelle</span>
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un prospect…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-primary/50"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-[13px] text-muted-foreground">
            Aucune conversation trouvée.
          </p>
        )}

        {filtered.map((t) => {
          const theme = CHANNELS[t.channel];
          const Icon = theme.icon;
          const active = t.id === selectedId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              onContextMenu={(e) => openMenu(e, t)}
              className={cn(
                "relative flex w-full min-w-0 items-start gap-3 rounded-lg p-3 text-left transition-colors duration-150 ease-out",
                active ? "bg-surface" : "hover:bg-foreground/[0.03] active:bg-surface/70",
              )}
              style={
                active
                  ? {
                      boxShadow: `inset 3px 0 0 0 ${theme.accent}`,
                    }
                  : undefined
              }
            >
              <LetterAvatar name={t.contact} size={40} shape="circle" />
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {t.contact}
                  </span>
                  {t.favorite && <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />}
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{t.time}</span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.company}
                </span>
                <span className="mt-1 block truncate text-[13px] text-foreground/80">
                  {t.last}
                </span>
                <span className="mt-2 flex min-w-0 items-center gap-2">
                  <span
                    className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium"
                    style={{
                      color: theme.accent,
                    }}
                  >
                    <Icon className="size-3" /> {theme.label}
                  </span>
                  {t.unread > 0 && (
                    <span
                      className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full px-1 text-[11px] font-semibold tabular-nums text-background"
                      style={{ backgroundColor: theme.accent }}
                    >
                      {t.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          thread={menu.thread}
          onClose={() => setMenu(null)}
          onEdit={() => {
            onEdit?.(menu.thread);
            setMenu(null);
          }}
          onFavorite={() => {
            onToggleFavorite?.(menu.thread.id);
            setMenu(null);
          }}
          onToggleUnread={() => {
            onToggleUnread?.(menu.thread.id);
            setMenu(null);
          }}
          onCopy={() => {
            void navigator.clipboard?.writeText(
              `${menu.thread.contact} · ${menu.thread.company}\n${menu.thread.last}`,
            );
            setMenu(null);
          }}
          onDelete={() => {
            onDelete?.(menu.thread.id);
            setMenu(null);
          }}
        />
      )}
    </div>
  );
}

function ContextMenu({
  x,
  y,
  thread,
  onClose,
  onEdit,
  onFavorite,
  onToggleUnread,
  onCopy,
  onDelete,
}: {
  x: number;
  y: number;
  thread: ProspectThread;
  onClose: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  onToggleUnread: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const isFav = Boolean(thread.favorite);
  const isUnread = Boolean(thread.unread);

  const W = Math.min(240, window.innerWidth - 24);
  const H = 260;
  const left = Math.min(x, window.innerWidth - W - 12);
  const top = Math.min(y, window.innerHeight - H - 12);

  return (
    <>
      <div className="fixed inset-0 z-[80]" onPointerDown={onClose} />
      <div
        role="menu"
        className="fixed z-[81] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-float"
        style={{ left, top, width: W }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="px-2.5 py-1.5">
          <p className="truncate text-[12px] font-medium">{thread.contact}</p>
          <p className="truncate text-[11px] text-muted-foreground">{thread.company}</p>
        </div>
        <div className="my-1 h-px bg-border" />
        <MenuItem icon={Pencil} label="Modifier les données" onClick={onEdit} />
        <MenuItem
          icon={Star}
          label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={onFavorite}
        />
        <MenuItem
          icon={isUnread ? MailOpen : Mail}
          label={isUnread ? "Marquer comme lu" : "Marquer comme non lu"}
          onClick={onToggleUnread}
        />
        <MenuItem icon={Copy} label="Copier le résumé" onClick={onCopy} />
        <div className="my-1 h-px bg-border" />
        <MenuItem icon={Trash2} label="Supprimer la conversation" onClick={onDelete} danger />
      </div>
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors md:min-h-8",
        danger
          ? "text-destructive hover:bg-destructive/10 active:bg-destructive/15"
          : "hover:bg-secondary/60 active:bg-secondary/70",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
