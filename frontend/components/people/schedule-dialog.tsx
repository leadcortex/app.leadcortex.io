// frontend/components/people/schedule-dialog.tsx

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Coffee,
  Phone,
  StickyNote,
  Timer,
  Video,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { DurationPicker } from "@/components/ui/duration-picker";
import { toast } from "sonner";
import { cn } from "@/lib/core/utils";

const meetingTypes = [
  { value: "call", label: "Appel découverte", icon: Phone },
  { value: "video", label: "Visioconférence", icon: Video },
  { value: "coffee", label: "Rendez-vous informel", icon: Coffee },
];

export type ScheduleDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: any;
  onScheduled: (summary: string) => void;
};

export function ScheduleDialog({ open, onOpenChange, lead, onScheduled }: ScheduleDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [type, setType] = useState("call");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return toast.error("Choisissez une date et une heure");
    setIsSubmitting(true);
    setTimeout(() => {
      const typeLabel = meetingTypes.find((t) => t.value === type)?.label ?? "Rendez-vous";
      const dateStr = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      const summary = `${typeLabel} · ${dateStr} à ${time} · ${duration} min`;
      onScheduled(summary);
      toast.success("Meeting planifié", { description: summary });
      setIsSubmitting(false);
      onOpenChange(false);
      setDate(undefined);
      setTime("");
      setNotes("");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-2 border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl italic flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" /> Planifier un rendez-vous
          </DialogTitle>
          <DialogDescription>
            Avec <span className="font-medium text-foreground">{lead.name}</span> — {lead.company}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <CalendarDays className="size-3.5 text-muted-foreground" /> Date
              </label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Clock className="size-3.5 text-muted-foreground" /> Heure
              </label>
              <TimePicker value={time} onChange={setTime} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Type de rendez-vous</label>
            <div className="grid grid-cols-3 gap-2">
              {meetingTypes.map((t) => {
                const Icon = t.icon;
                const sel = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-[10px] transition-colors",
                      sel
                        ? "border-primary bg-primary/5 text-primary shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_30%,transparent)]"
                        : "border-border hover:bg-surface text-muted-foreground shadow-[0_1px_0_var(--border)]",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Timer className="size-3.5 text-muted-foreground" /> Durée
              </label>
              <DurationPicker value={duration} onChange={setDuration} />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <StickyNote className="size-3.5 text-muted-foreground" /> Notes / Ordre du jour
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Points à aborder, contexte, préparation…"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none shadow-[0_2px_0_var(--border)] focus:shadow-none focus:translate-y-[2px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-border rounded-lg bg-background hover:bg-surface shadow-[0_1px_0_var(--border)] active:translate-y-[1px] active:shadow-none transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-50 shadow-[0_2px_0_color-mix(in_oklab,var(--foreground)_70%,black)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <CalendarDays className="size-3.5" /> Confirmer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
