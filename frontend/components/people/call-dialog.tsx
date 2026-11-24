// frontend/components/people/call-dialog.tsx

import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  X,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import type { CallPhase } from "@/lib/people/helpers";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

export type CallDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onCompleted: (duration: string) => void;
};

export function CallDialog({ open, onOpenChange, lead, onCompleted }: CallDialogProps) {
  const [phase, setPhase] = useState<CallPhase>("confirm");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("confirm");
    setSeconds(0);
    setMuted(false);
    setSpeaker(false);
    setDialpadOpen(false);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (phase !== "connected") return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  const startCall = () => {
    if (!lead.phone) {
      toast.error("Aucun numéro renseigné pour ce prospect");
      return;
    }
    setPhase("dialing");
    connectTimeoutRef.current = setTimeout(() => setPhase("connected"), 1800);
  };

  const hangUp = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (phase === "connected") {
      onCompleted(fmt(seconds) || "0:00");
      toast.success(`Appel terminé — ${fmt(seconds)}`);
    }
    setPhase("ended");
    window.setTimeout(() => onOpenChange(false), 800);
  };

  const handleOpenChange = (v: boolean) => {
    if (v) {
      onOpenChange(true);
      return;
    }
    if (phase === "connected" || phase === "dialing") {
      hangUp();
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border-2 border-border shadow-2xl overflow-hidden p-0 max-h-[92dvh] flex flex-col">
        <div className="relative shrink-0 bg-gradient-to-b from-primary/[0.07] to-background px-4 pt-5 pb-3 text-center sm:px-5 sm:pt-7 sm:pb-4">
          <div className="mb-2 flex justify-center sm:mb-3">
            <div className="sm:hidden">
              <LetterAvatar name={lead.name} size={64} shape="circle" />
            </div>
            <div className="hidden sm:block">
              <LetterAvatar name={lead.name} size={84} shape="circle" />
            </div>
          </div>
          <DialogTitle className="font-display text-xl italic sm:text-2xl">{lead.name}</DialogTitle>
          <DialogDescription className="font-mono text-[11px] mt-1 sm:text-xs">
            {lead.phone || "Aucun numéro"}
          </DialogDescription>
          <p className="text-[10px] text-muted-foreground mt-0.5 sm:text-[11px]">
            {lead.title} · {lead.company}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            {phase === "confirm" && (
              <div className="text-center space-y-2 sm:space-y-2.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                  <Phone className="size-3.5" />
                  Confirmation requise
                </div>
                <p className="text-sm text-foreground">
                  Voulez-vous vraiment appeler <span className="font-semibold">{lead.name}</span> ?
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {lead.phone || "Numéro non renseigné"}
                </p>
              </div>
            )}

            {phase === "dialing" && (
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-2">
                  <span className="relative flex size-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full size-3 bg-primary" />
                  </span>
                  <p className="text-sm text-muted-foreground">Connexion en cours…</p>
                </div>
                <p className="font-mono text-2xl text-muted-foreground/40 tabular-nums sm:text-3xl">
                  0:00
                </p>
              </div>
            )}

            {phase === "connected" && (
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En communication
                </div>
                <p className="font-mono text-3xl tabular-nums sm:text-4xl">{fmt(seconds)}</p>
              </div>
            )}

            {phase === "ended" && (
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs font-medium">
                  Appel terminé
                </div>
                <p className="font-mono text-3xl text-muted-foreground tabular-nums sm:text-4xl">
                  {fmt(seconds)}
                </p>
              </div>
            )}
          </div>

          <div
            className="px-3 pb-3 sm:px-5 sm:pb-5"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {phase === "confirm" && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-background px-4 py-2 text-sm font-medium hover:bg-surface active:translate-y-[1px] transition-all sm:px-5 sm:py-2.5"
                >
                  <X className="size-4" /> Annuler
                </button>
                <button
                  type="button"
                  onClick={startCall}
                  disabled={!lead.phone}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-2 text-sm font-semibold shadow-[0_3px_0_color-mix(in_oklab,#10b981_60%,black)] hover:brightness-110 active:translate-y-[3px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 sm:px-5 sm:py-2.5"
                >
                  <PhoneCall className="size-4" /> Appeler
                </button>
              </div>
            )}

            {(phase === "dialing" || phase === "connected") && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-center gap-3 sm:gap-4">
                  <CallControl
                    active={muted}
                    onClick={() => setMuted((m) => !m)}
                    icon={muted ? MicOff : Mic}
                    label={muted ? "Micro coupé" : "Micro"}
                  />
                  <CallControl
                    active={speaker}
                    onClick={() => setSpeaker((s) => !s)}
                    icon={speaker ? Volume2 : VolumeX}
                    label={speaker ? "HP actif" : "Écouteur"}
                  />
                  <CallControl
                    active={dialpadOpen}
                    onClick={() => setDialpadOpen((d) => !d)}
                    icon={Keyboard}
                    label="Clavier"
                  />
                </div>

                {dialpadOpen && (
                  <div className="flex justify-center pt-1">
                    <div className="grid grid-cols-[repeat(3,3rem)] sm:grid-cols-[repeat(3,3.5rem)] gap-2">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => toast.info(`Touche ${k}`)}
                          className="grid size-12 sm:size-14 place-items-center rounded-full border border-border bg-background font-mono text-base text-foreground hover:bg-surface active:translate-y-[1px] transition-all sm:text-lg"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex w-full justify-center pt-1">
                  <button
                    type="button"
                    onClick={hangUp}
                    aria-label="Raccrocher"
                    title="Raccrocher"
                    className="grid size-12 sm:size-14 place-items-center rounded-full bg-destructive text-white shadow-[0_3px_0_color-mix(in_oklab,var(--destructive)_60%,black)] hover:brightness-110 active:translate-y-[3px] active:shadow-none transition-all"
                  >
                    <PhoneOff className="size-5 sm:size-6" />
                  </button>
                </div>
              </div>
            )}

            {phase === "ended" && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CallControl({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1">
      <span
        className={cn(
          "grid size-12 sm:size-14 place-items-center rounded-full border-2 transition-all",
          active
            ? "border-primary bg-primary text-primary-foreground shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_50%,black)]"
            : "border-border bg-background text-foreground hover:bg-surface",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}
