// frontend/components/layout/notification-center.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Bell,
  BellRing,
  Bookmark,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
  Layers,
  Mail,
  MessageSquare,
  Trash2,
  X,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore, type NotificationItem } from "@/lib/state/store";
import { cn } from "@/lib/core/utils";

const PREVIEW_COUNT = 5;
const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 220;
const HOLD_MS = 650;
const CLICK_MS = 220;
const REMOVE_ANIM_MS = 180;

type Section = "important" | "secondary" | "saved";
type Filter = "all" | "unread";
type DeleteTarget = { ids: string[]; title: string; description: string } | null;

function useHoldToDelete({ onInstant, onHold }: { onInstant: () => void; onHold: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const fired = useRef(false);
  const cbs = useRef({ onInstant, onHold });
  cbs.current = { onInstant, onHold };

  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => clear, [clear]);

  const handlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      fired.current = false;
      startedAt.current = performance.now();
      setHolding(true);
      clear();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        timer.current = null;
        cbs.current.onHold();
      }, HOLD_MS);
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || fired.current) return;
      clear();
      const elapsed = performance.now() - startedAt.current;
      const r = e.currentTarget.getBoundingClientRect();
      const inside =
        e.clientX >= r.left - 6 &&
        e.clientX <= r.right + 6 &&
        e.clientY >= r.top - 6 &&
        e.clientY <= r.bottom + 6;
      setHolding(false);
      if (inside && elapsed < CLICK_MS) cbs.current.onInstant();
    },
    onPointerCancel: () => {
      if (fired.current) return;
      clear();
      setHolding(false);
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      if (e.detail === 0) cbs.current.onInstant();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => e.stopPropagation(),
  };

  return { holding, handlers };
}

const clipFillStyle = (holding: boolean) => ({
  clipPath: holding ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
  transition: holding
    ? `clip-path ${HOLD_MS}ms cubic-bezier(0.45, 0, 0.75, 0.55)`
    : "clip-path 240ms cubic-bezier(0.2, 0.8, 0.3, 1)",
});

const fillStyle = (holding: boolean) => ({
  transform: holding ? "scaleX(1)" : "scaleX(0)",
  transition: holding
    ? `transform ${HOLD_MS}ms cubic-bezier(0.45, 0, 0.75, 0.55)`
    : "transform 240ms cubic-bezier(0.2, 0.8, 0.3, 1)",
});

export const OPEN_NOTIFICATIONS_EVENT = "lc:open-notifications";

/** Ouvre le centre de notifications depuis n'importe où (ex. menu du compte mobile). */
export function openNotificationCenter(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_NOTIFICATIONS_EVENT));
}

/**
 * `headless` : n'affiche pas la cloche, seulement le centre (ouvert via
 * `openNotificationCenter()`). Utilisé en mobile, où il n'y a pas de cloche.
 */
export function NotificationCenter({ headless = false }: { headless?: boolean } = {}) {
  const router = useRouter();
  const {
    notifications,
    markNotificationRead,
    markNotificationUnread,
    markNotificationsRead,
    deleteNotifications,
    restoreNotifications,
    toggleNotificationSaved,
  } = useAppStore();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);
  const [section, setSection] = useState<Section>("important");
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [removing, setRemoving] = useState<Set<string>>(() => new Set());
  const [undo, setUndo] = useState<{ items: NotificationItem[]; order: string[] } | null>(null);
  const undoTimer = useRef<number | null>(null);
  const anchorId = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);

  const importantNotifications = notifications.filter((notification) => notification.important);
  const secondaryNotifications = notifications.filter((notification) => !notification.important);
  const savedNotifications = notifications.filter((notification) => notification.saved);
  const importantUnreadCount = importantNotifications.filter(
    (notification) => !notification.read,
  ).length;
  const previewNotifications = importantNotifications.slice(0, PREVIEW_COUNT);

  const sectionNotifications = useMemo(() => {
    if (section === "important") return importantNotifications;
    if (section === "secondary") return secondaryNotifications;
    return savedNotifications;
  }, [importantNotifications, savedNotifications, section, secondaryNotifications]);
  const visibleNotifications =
    filter === "unread"
      ? sectionNotifications.filter((notification) => !notification.read)
      : sectionNotifications;
  const sectionUnreadCount = sectionNotifications.filter(
    (notification) => !notification.read,
  ).length;
  const removableSecondaryIds = secondaryNotifications
    .filter((notification) => !notification.saved)
    .map((notification) => notification.id);
  const removableReadIds = visibleNotifications
    .filter((notification) => notification.read && !notification.saved)
    .map((notification) => notification.id);

  const visibleIds = useMemo(() => visibleNotifications.map((n) => n.id), [visibleNotifications]);
  const selectedIds = useMemo(
    () => visibleIds.filter((id) => selected.has(id)),
    [visibleIds, selected],
  );
  const selectionCount = selectedIds.length;

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    anchorId.current = null;
  }, []);

  useEffect(() => {
    clearSelection();
  }, [section, filter, centerOpen, clearSelection]);

  const handleRowSelect = (
    id: string,
    e: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => {
    const additive = e.ctrlKey || e.metaKey;
    if (e.shiftKey && anchorId.current && visibleIds.includes(anchorId.current)) {
      const a = visibleIds.indexOf(anchorId.current);
      const b = visibleIds.indexOf(id);
      const range = visibleIds.slice(Math.min(a, b), Math.max(a, b) + 1);
      setSelected((prev) => new Set(additive ? [...prev, ...range] : range));
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    anchorId.current = id;
  };

  const deleteWithUndo = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const order = notifications.map((n) => n.id);
      const items = notifications.filter((n) => ids.includes(n.id));
      deleteNotifications(ids);
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (centerOpen) {
        if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
        setUndo({ items, order });
        undoTimer.current = window.setTimeout(() => setUndo(null), 6000);
        return;
      }
      toast(ids.length > 1 ? `${ids.length} notifications supprimées` : "Notification supprimée", {
        action: { label: "Annuler", onClick: () => restoreNotifications(items, order) },
      });
    },
    [notifications, deleteNotifications, restoreNotifications, centerOpen],
  );

  const holdDelete = useCallback(
    (ids: string[]) => {
      setRemoving((prev) => new Set([...prev, ...ids]));
      window.setTimeout(() => {
        deleteWithUndo(ids);
        setRemoving((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }, REMOVE_ANIM_MS);
    },
    [deleteWithUndo],
  );

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const openSoon = useCallback(() => {
    clearTimer();
    timer.current = window.setTimeout(() => setPreviewOpen(true), OPEN_DELAY_MS);
  }, [clearTimer]);

  const closeSoon = useCallback(() => {
    clearTimer();
    timer.current = window.setTimeout(() => setPreviewOpen(false), CLOSE_DELAY_MS);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);
  useEffect(
    () => () => {
      if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!centerOpen) setUndo(null);
  }, [centerOpen]);

  const selectNotification = (notification: NotificationItem) => {
    markNotificationRead(notification.id);
    setPreviewOpen(false);
    if (notification.href) {
      router.history.push(notification.href);
      setCenterOpen(false);
    }
  };

  const requestDelete = (ids: string[], title: string, description: string) => {
    if (ids.length > 0) setDeleteTarget({ ids, title, description });
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteNotifications(deleteTarget.ids);
    setDeleteTarget(null);
  };

  const markVisibleRead = () => {
    markNotificationsRead(
      visibleNotifications
        .filter((notification) => !notification.read)
        .map((notification) => notification.id),
    );
  };

  const targetIds = (id: string) => (selected.has(id) && selectionCount > 1 ? selectedIds : [id]);

  const markSelected = (read: boolean) => {
    if (read) markNotificationsRead(selectedIds);
    else selectedIds.forEach((id) => markNotificationUnread(id));
  };

  const toggleSavedFor = (ids: string[]) => {
    const items = notifications.filter((n) => ids.includes(n.id));
    const saveAll = items.some((n) => !n.saved);
    items.filter((n) => !!n.saved !== saveAll).forEach((n) => toggleNotificationSaved(n.id));
  };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSelected(new Set(visibleIds));
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && selectionCount > 0) {
      e.preventDefault();
      deleteWithUndo(selectedIds);
    }
  };

  useEffect(() => {
    const onOpen = () => {
      setPreviewOpen(false);
      setCenterOpen(true);
    };
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, onOpen);
  }, []);

  const sectionTitle =
    section === "important"
      ? "Notifications importantes"
      : section === "secondary"
        ? "Notifications secondaires"
        : "Notifications conservées";

  return (
    <>
      {!headless && (
        <div
          ref={rootRef}
          className="relative"
          onMouseEnter={openSoon}
          onMouseLeave={closeSoon}
          onFocus={() => {
            clearTimer();
            setPreviewOpen(true);
          }}
        >
          <button
            type="button"
            aria-label={`Ouvrir les notifications${importantUnreadCount ? `, ${importantUnreadCount} importantes non lues` : ""}`}
            aria-haspopup="dialog"
            onClick={() => {
              clearTimer();
              setPreviewOpen(false);
              setCenterOpen(true);
            }}
            className={cn(
              "relative rounded-lg p-1.5 transition-colors hover:bg-surface md:p-2",
              (previewOpen || centerOpen) && "bg-surface",
            )}
          >
            <Bell className="size-4 md:size-5" strokeWidth={1.5} />
            {importantUnreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold tabular-nums text-white shadow-[0_2px_0_color-mix(in_oklab,var(--destructive)_60%,black)] md:text-[10px]">
                {Math.min(importantUnreadCount, 99)}
                {importantUnreadCount > 99 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1 grid size-2.5 place-items-center rounded-full bg-background text-[8px] font-bold leading-none text-destructive ring-1 ring-destructive/30"
                  >
                    +
                  </span>
                )}
              </span>
            )}
          </button>

          {previewOpen && !centerOpen && (
            <div className="absolute right-0 top-full z-[90] w-80 max-w-[calc(100vw-1rem)] pt-2">
              <div
                role="region"
                aria-label="Notifications importantes récentes"
                className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold">À ne pas manquer</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Les {PREVIEW_COUNT} dernières importantes
                    </p>
                  </div>
                  {importantUnreadCount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {importantUnreadCount > 99 ? "99+" : importantUnreadCount}
                    </span>
                  )}
                </div>
                <div className="max-h-[min(60vh,24rem)] overflow-y-auto p-1.5">
                  {previewNotifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Aucune notification importante.
                    </p>
                  ) : (
                    <ul>
                      {previewNotifications.map((notification) => (
                        <li key={notification.id} className={SEPARATOR_CLASS}>
                          <NotificationRow
                            notification={notification}
                            removing={removing.has(notification.id)}
                            onActivate={() => selectNotification(notification)}
                            onDelete={() => deleteWithUndo([notification.id])}
                            onHoldDelete={() => holdDelete([notification.id])}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOpen(false);
                    setCenterOpen(true);
                  }}
                  className="w-full border-t border-border/60 px-3 py-2.5 text-left text-xs font-medium text-primary transition-colors hover:bg-surface"
                >
                  Ouvrir le centre complet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={centerOpen}
        onOpenChange={(open) => {
          setCenterOpen(open);
          if (!open) setFilter("all");
        }}
      >
        <DialogContent
          className="flex max-h-[88dvh] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl"
          onEscapeKeyDown={(e) => {
            if (selectionCount > 0) {
              e.preventDefault();
              clearSelection();
            }
          }}
        >
          <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
            <DialogTitle className="text-base">Centre de notifications</DialogTitle>
            <DialogDescription className="sr-only">
              Maj+clic sélectionne une plage, Ctrl+clic ajoute ou retire une notification.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1">
            <aside className="flex w-32 shrink-0 flex-col border-r border-border bg-surface/25 p-2 sm:w-44 sm:p-3">
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Sections</p>
              <nav className="space-y-1" role="tablist" aria-label="Sections des notifications">
                <SectionButton
                  active={section === "important"}
                  icon={<BellRing className="size-4" />}
                  label="Importantes"
                  count={importantUnreadCount}
                  onClick={() => {
                    setSection("important");
                    setFilter("all");
                  }}
                />
                <SectionButton
                  active={section === "secondary"}
                  icon={<Layers className="size-4" />}
                  label="Secondaires"
                  count={secondaryNotifications.length}
                  onClick={() => {
                    setSection("secondary");
                    setFilter("all");
                  }}
                />
                <SectionButton
                  active={section === "saved"}
                  icon={<Bookmark className="size-4" />}
                  label="Conservées"
                  count={savedNotifications.length}
                  onClick={() => {
                    setSection("saved");
                    setFilter("all");
                  }}
                />
              </nav>

              {section === "secondary" && removableSecondaryIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    requestDelete(
                      removableSecondaryIds,
                      "Vider les notifications secondaires ?",
                      "Les notifications secondaires non conservées seront supprimées. Les notifications importantes et conservées ne seront pas touchées.",
                    )
                  }
                  className="mt-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[10px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:text-xs"
                >
                  <Trash2 className="size-3.5 shrink-0" />
                  Vider la section
                </button>
              )}
            </aside>

            <section className="relative flex min-w-0 flex-1 flex-col" aria-label={sectionTitle}>
              <div className="flex min-h-[49px] flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2 sm:px-4">
                {selectionCount > 0 ? (
                  <SelectionBar
                    count={selectionCount}
                    onClear={clearSelection}
                    onRead={() => markSelected(true)}
                    onUnread={() => markSelected(false)}
                    onSave={() => toggleSavedFor(selectedIds)}
                    onDelete={() => deleteWithUndo(selectedIds)}
                    onHoldDelete={() => holdDelete(selectedIds)}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-1" role="tablist" aria-label="Filtrer">
                      <FilterButton
                        active={filter === "all"}
                        label="Toutes"
                        count={sectionNotifications.length}
                        onClick={() => setFilter("all")}
                      />
                      <FilterButton
                        active={filter === "unread"}
                        label="Non lues"
                        count={sectionUnreadCount}
                        onClick={() => setFilter("unread")}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={markVisibleRead}
                        disabled={visibleNotifications.every((notification) => notification.read)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-[10px] font-medium text-primary transition-colors hover:border-success/45 hover:bg-success/15 hover:text-[color-mix(in_oklab,var(--success)_60%,black)] disabled:pointer-events-none disabled:border-transparent disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-40 sm:text-xs"
                      >
                        <CheckCheck className="size-3.5" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Tout marquer comme lu</span>
                        <span className="sm:hidden">Tout lire</span>
                      </button>
                      {removableReadIds.length > 0 && section !== "saved" && (
                        <button
                          type="button"
                          onClick={() =>
                            requestDelete(
                              removableReadIds,
                              "Effacer les notifications lues ?",
                              "Les notifications lues de cette section seront supprimées.",
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:text-xs"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="hidden sm:inline">Effacer les lues</span>
                          <span className="sm:hidden">Effacer</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div
                className="min-h-0 flex-1 overflow-y-auto p-2 outline-none sm:p-3"
                tabIndex={-1}
                onKeyDown={onListKeyDown}
              >
                {visibleNotifications.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center">
                    <Bell className="size-7 text-muted-foreground/50" strokeWidth={1.4} />
                    <p className="text-sm font-medium">
                      {section === "important"
                        ? "Aucune alerte importante"
                        : section === "secondary"
                          ? "Aucune notification secondaire"
                          : "Aucune notification conservée"}
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      {section === "secondary"
                        ? "Les confirmations et informations courantes apparaîtront ici. Les plus anciennes sont automatiquement retirées au-delà de 50."
                        : filter === "unread"
                          ? "Toutes les notifications de cette section ont été lues."
                          : "Les nouvelles notifications apparaîtront ici."}
                    </p>
                  </div>
                ) : (
                  <ul className="select-none">
                    {visibleNotifications.map((notification) => {
                      const ids = targetIds(notification.id);
                      const multi = ids.length > 1;
                      return (
                        <li key={notification.id} className={SEPARATOR_CLASS}>
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <div>
                                <NotificationRow
                                  notification={notification}
                                  selected={selected.has(notification.id)}
                                  removing={removing.has(notification.id)}
                                  onActivate={(e) =>
                                    e && (e.shiftKey || e.ctrlKey || e.metaKey)
                                      ? handleRowSelect(notification.id, e)
                                      : (clearSelection(), selectNotification(notification))
                                  }
                                  onToggleSelect={(e) => handleRowSelect(notification.id, e)}
                                  onDelete={() => deleteWithUndo(targetIds(notification.id))}
                                  onHoldDelete={() => holdDelete(targetIds(notification.id))}
                                />
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem
                                onSelect={() => {
                                  if (multi) markNotificationsRead(ids);
                                  else if (notification.read)
                                    markNotificationUnread(notification.id);
                                  else markNotificationRead(notification.id);
                                }}
                              >
                                {multi
                                  ? `Marquer ${ids.length} comme lues`
                                  : notification.read
                                    ? "Marquer comme non lue"
                                    : "Marquer comme lue"}
                              </ContextMenuItem>
                              <ContextMenuItem onSelect={() => toggleSavedFor(ids)}>
                                <Bookmark className="mr-2 size-4" />
                                {multi
                                  ? "Garder / ne plus garder"
                                  : notification.saved
                                    ? "Ne plus garder"
                                    : "Garder la notification"}
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => deleteWithUndo(ids)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                {multi ? `Supprimer ${ids.length} notifications` : "Supprimer"}
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {undo && (
                <div
                  role="status"
                  className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-foreground px-4 py-2 text-xs text-background shadow-lg"
                >
                  <span>
                    {undo.items.length > 1
                      ? `${undo.items.length} notifications supprimées`
                      : "Notification supprimée"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      restoreNotifications(undo.items, undo.order);
                      if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
                      setUndo(null);
                    }}
                    className="font-semibold underline-offset-2 hover:underline"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.title}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const SEPARATOR_CLASS =
  "relative py-px after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-3/4 after:-translate-x-1/2 after:bg-foreground/10 last:after:hidden";

function SelectionBar({
  count,
  onClear,
  onRead,
  onUnread,
  onSave,
  onDelete,
  onHoldDelete,
}: {
  count: number;
  onClear: () => void;
  onRead: () => void;
  onUnread: () => void;
  onSave: () => void;
  onDelete: () => void;
  onHoldDelete: () => void;
}) {
  const { holding, handlers } = useHoldToDelete({ onInstant: onDelete, onHold: onHoldDelete });
  const btn =
    "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium text-foreground/80 transition-colors hover:bg-surface hover:text-foreground sm:text-xs";
  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          aria-label="Annuler la sélection"
          className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
        <span className="text-[11px] font-semibold text-primary sm:text-xs">
          {count} sélectionnée{count > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onRead} className={btn}>
          <CheckCheck className="size-3.5" />
          <span className="hidden sm:inline">Lues</span>
        </button>
        <button type="button" onClick={onUnread} className={btn}>
          <Mail className="size-3.5" />
          <span className="hidden sm:inline">Non lues</span>
        </button>
        <button type="button" onClick={onSave} className={btn}>
          <Bookmark className="size-3.5" />
          <span className="hidden sm:inline">Garder</span>
        </button>
        <button
          type="button"
          {...handlers}
          title="Clic : supprimer · Maintenir : suppression animée"
          className={cn(
            "relative inline-flex touch-none select-none items-center gap-1.5 overflow-hidden rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors hover:bg-destructive/10 sm:text-xs",
            holding ? "text-white" : "text-destructive",
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 origin-left bg-destructive"
            style={fillStyle(holding)}
          />
          <Trash2 className="relative size-3.5" />
          <span className="relative hidden sm:inline">Supprimer</span>
        </button>
      </div>
    </>
  );
}

function SectionButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition-colors sm:text-xs",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 text-[10px] tabular-nums opacity-75">
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1.5 text-[10px] transition-colors sm:text-xs",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-70">{count > 99 ? "99+" : count}</span>
    </button>
  );
}

type ModifierEvent = { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean };

function NotificationRow({
  notification,
  selected = false,
  removing = false,
  onActivate,
  onToggleSelect,
  onDelete,
  onHoldDelete,
}: {
  notification: NotificationItem;
  selected?: boolean;
  removing?: boolean;
  onActivate: (e?: ModifierEvent) => void;
  onToggleSelect?: (e: ModifierEvent) => void;
  onDelete?: () => void;
  onHoldDelete?: () => void;
}) {
  const { holding, handlers } = useHoldToDelete({
    onInstant: () => onDelete?.(),
    onHold: () => onHoldDelete?.(),
  });
  const filled = holding || removing;

  return (
    <div
      aria-selected={onToggleSelect ? selected : undefined}
      className={cn(
        "group relative flex items-start gap-2.5 overflow-hidden rounded-lg px-3 py-2.5 text-left transition-colors",
        selected
          ? "bg-primary/[0.14] ring-1 ring-inset ring-primary/30 hover:bg-primary/[0.17]"
          : notification.read
            ? "hover:bg-surface/80"
            : "bg-primary/[0.05] hover:bg-primary/[0.1]",
        removing && "nc-removing",
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-end gap-2 bg-destructive pr-12 text-xs font-semibold text-white"
        style={clipFillStyle(filled)}
      >
        <Trash2 className="size-4" />
        <span className="whitespace-nowrap">Suppression…</span>
      </span>

      <div className="relative shrink-0">
        <NotificationIcon notification={notification} />
        {onToggleSelect && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={selected ? "Désélectionner" : "Sélectionner"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect({ shiftKey: e.shiftKey, ctrlKey: true, metaKey: e.metaKey });
            }}
            className={cn(
              "absolute inset-0 mt-0.5 grid size-8 place-items-center rounded-lg bg-background transition-opacity focus-visible:opacity-100",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded-[5px] border transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-foreground/30 text-transparent",
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => onActivate(e)}
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left outline-none focus-visible:underline"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={cn(
                "min-w-0 flex-1 text-xs leading-snug",
                notification.read ? "text-muted-foreground" : "font-medium text-foreground",
              )}
            >
              {notification.label}
            </span>
            {!notification.read && (
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
                aria-label="Non lue"
              />
            )}
          </span>
          {notification.important && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-warning">
              <BellRing className="size-3" strokeWidth={2} />
              Importante
            </span>
          )}
          {notification.detail && (
            <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
              {notification.detail}
            </span>
          )}
          {notification.kind === "tokens" && <TokenUsage notification={notification} />}
          <span className="mt-1.5 block text-[10px] text-muted-foreground/80">
            {notification.time}
            {notification.saved && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                <Bookmark className="size-3" />
                Conservée
              </span>
            )}
          </span>
        </span>
      </button>

      {onDelete && (
        <button
          type="button"
          {...handlers}
          aria-label="Supprimer cette notification (clic), maintenir pour une suppression animée"
          title="Clic : supprimer · Maintenir : suppression animée"
          className="relative z-20 grid size-7 shrink-0 touch-none select-none place-items-center rounded-md text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 sm:group-focus-within:pointer-events-auto sm:group-focus-within:opacity-100"
        >
          <Trash2 className="size-3.5" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

function NotificationIcon({ notification }: { notification: NotificationItem }) {
  const Icon =
    notification.kind === "message"
      ? MessageSquare
      : notification.kind === "email"
        ? Mail
        : notification.kind === "warning"
          ? AlertCircle
          : notification.kind === "success"
            ? CheckCircle2
            : notification.kind === "tokens"
              ? AlertCircle
              : notification.kind === "info"
                ? Info
                : Bell;
  const tone =
    notification.kind === "warning" || notification.kind === "tokens"
      ? "text-warning"
      : notification.kind === "success"
        ? "text-success"
        : notification.kind === "email" || notification.kind === "message"
          ? "text-primary"
          : notification.kind === "info"
            ? "text-primary"
            : "text-muted-foreground";
  return (
    <span
      className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface", tone)}
    >
      <Icon className="size-4" strokeWidth={1.8} />
    </span>
  );
}

function TokenUsage({ notification }: { notification: NotificationItem }) {
  const used = notification.meta?.used;
  const limit = notification.meta?.limit;
  if (
    typeof used !== "number" ||
    !Number.isFinite(used) ||
    typeof limit !== "number" ||
    !Number.isFinite(limit) ||
    limit <= 0
  ) {
    return null;
  }
  const percentage = Math.min(100, Math.max(0, (used / limit) * 100));
  const remaining = Math.max(0, limit - used);
  const format = (value: number) => new Intl.NumberFormat("fr-FR").format(value);

  return (
    <span className="mt-2 block">
      <span className="mb-1 flex justify-between gap-2 text-[10px] text-muted-foreground">
        <span>
          {format(used)} / {format(limit)} utilisés
        </span>
        <span>{Math.round(percentage)} %</span>
      </span>
      <span
        className="block h-1.5 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-label="Utilisation de la limite IA"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
      >
        <span
          className={cn(
            "block h-full rounded-full transition-[width]",
            percentage >= 90 ? "bg-destructive" : percentage >= 75 ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </span>
      <span className="mt-1 block text-[10px] text-muted-foreground">
        {format(remaining)} restants
      </span>
    </span>
  );
}
