//frontend\components\conversations\conversation-settings.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, Building2, MapPin, Star, Tag, User, X } from "lucide-react";
import { toast } from "sonner";
import {
  CHANNELS,
  CHANNEL_ORDER,
  type ChannelId,
  type ProspectThread,
} from "@/lib/conversations-mock";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function ConversationSettings({
  open,
  thread,
  channel,
  onChannelChange,
  onClose,
}: {
  open: boolean;
  thread: ProspectThread;
  channel: ChannelId;
  onChannelChange: (c: ChannelId) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(thread.notes);
  const [muted, setMuted] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => setNotes(thread.notes), [thread.id, thread.notes]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const theme = CHANNELS[channel];

  const content = (
    <>
      {}
      {isMobile && (
        <section
          className="rounded-2xl border border-border p-4"
          style={{
            backgroundColor: `color-mix(in oklab, ${theme.accent} 6%, transparent)`,
          }}
        >
          <div className="flex items-center gap-3">
            <LetterAvatar name={thread.contact} size={48} shape="circle" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{thread.contact}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {thread.role} · {thread.company}
              </p>
            </div>
          </div>
        </section>
      )}

      {!isMobile && (
        <section className="rounded-xl border border-border p-3">
          <div className="flex items-center gap-3">
            <LetterAvatar name={thread.contact} size={44} shape="circle" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{thread.contact}</p>
              <p className="truncate text-[11px] text-muted-foreground">{thread.role}</p>
            </div>
          </div>
          <dl className="mt-3 space-y-1.5 text-[11.5px]">
            <Info icon={Building2} label="Entreprise" value={thread.company} />
            <Info icon={MapPin} label="Localisation" value={thread.location} />
            <Info icon={User} label="Étape" value={thread.stage} />
          </dl>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {thread.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Tag className="size-2.5" /> {t}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className={cn("rounded-xl border border-border", isMobile ? "p-4" : "p-3")}>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Canaux du prospect
        </p>
        <div className="mt-2 space-y-1.5">
          {CHANNEL_ORDER.filter((c) => thread.channels.includes(c)).map((c) => {
            const t = CHANNELS[c];
            const Icon = t.icon;
            const active = c === channel;
            return (
              <button
                key={c}
                onClick={() => onChannelChange(c)}
                className={cn(
                  "flex min-h-12 w-full items-center gap-2.5 rounded-lg border px-3 text-left transition-colors active:bg-surface/80",
                  isMobile ? "py-2.5" : "py-2",
                )}
                style={{
                  borderColor: active ? t.accent : "var(--border)",
                  backgroundColor: active
                    ? `color-mix(in oklab, ${t.accent} 10%, transparent)`
                    : undefined,
                }}
              >
                <Icon className="size-4 shrink-0" style={{ color: t.accent }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium">{t.label}</span>
                  <span className="block truncate text-[10.5px] text-muted-foreground">
                    {t.handleLabel} : {thread.handles[c] ?? "—"}
                  </span>
                </span>
                {active && (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase text-background"
                    style={{ backgroundColor: t.accent }}
                  >
                    Actif
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-1.5">
        <OptionRow
          icon={muted ? BellOff : Bell}
          label={muted ? "Notifications coupées" : "Notifications activées"}
          onClick={() => {
            setMuted((m) => !m);
            toast.success(muted ? "Notifications réactivées" : "Conversation en sourdine");
          }}
          active={!muted}
          large={isMobile}
        />
        <OptionRow
          icon={Star}
          label={favorite ? "Retiré des favoris" : "Ajouter aux favoris"}
          onClick={() => {
            setFavorite((f) => !f);
            toast.success(favorite ? "Retiré des favoris" : "Ajouté aux favoris");
          }}
          active={favorite}
          large={isMobile}
        />
      </section>

      <section className={cn("rounded-xl border border-border", isMobile ? "p-4" : "p-3")}>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Notes internes
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={isMobile ? 6 : 5}
          className={cn(
            "mt-2 w-full resize-none rounded-lg border border-border bg-background p-2.5 outline-none focus:border-primary/50",
            isMobile ? "text-[13px]" : "text-[12px]",
          )}
        />
        <button
          onClick={() => toast.success("Notes enregistrées")}
          className={cn(
            "mt-2 w-full rounded-lg bg-foreground text-background hover:opacity-90 active:opacity-80",
            isMobile ? "py-3 text-[13px]" : "py-2 text-[11.5px]",
          )}
        >
          Enregistrer les notes
        </button>
      </section>
    </>
  );

  /* ─────────────────────────────────────────────────────────────────── */
  /* Version mobile — MobileSheet                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <MobileSheet
        open={open}
        onOpenChange={(v) => !v && onClose()}
        title="Paramètres de la conversation"
      >
        <div className="space-y-3 px-4 py-4">{content}</div>
      </MobileSheet>
    );
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /* Version desktop — drawer latéral (comportement existant)            */
  /* ─────────────────────────────────────────────────────────────────── */
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl">
        <header
          className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3"
          style={{ backgroundColor: `color-mix(in oklab, ${theme.accent} 8%, transparent)` }}
        >
          <h2 className="flex-1 truncate font-display text-lg italic">
            Paramètres de la conversation
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-8 place-items-center rounded-md hover:bg-surface"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">{content}</div>
      </aside>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto truncate font-medium">{value}</dd>
    </div>
  );
}

function OptionRow({
  icon: Icon,
  label,
  onClick,
  active,
  large = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active: boolean;
  /** Cible tactile élargie (mobile) : hauteur ≥ 48 px. */
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-border text-left transition-colors hover:bg-surface/60 active:bg-surface/70",
        large ? "min-h-12 px-4 py-3" : "px-3 py-2.5",
      )}
    >
      <Icon
        className={cn(
          "shrink-0",
          active ? "text-primary" : "text-muted-foreground",
          large ? "size-5" : "size-4",
        )}
      />
      <span className={cn("flex-1 truncate", large ? "text-[13px]" : "text-[12px]")}>{label}</span>
    </button>
  );
}
