// frontend/components/mail/email-snooze.tsx

import { useMemo, useState } from "react";
import { CalendarClock, Clock, Sunrise, Sun, Moon, Calendar, ChevronRight } from "@/components/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TimeOption } from "@shared/types/email-types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function nextWeekday(d: Date, day: number): Date {
  const x = startOfDay(d);
  const diff = (day - x.getDay() + 7) % 7 || 7;
  x.setDate(x.getDate() + diff);
  return x;
}

function tomorrowAt(hour: number, minute = 0): Date {
  const x = new Date();
  x.setDate(x.getDate() + 1);
  x.setHours(hour, minute, 0, 0);
  return x;
}

function todayAt(hour: number, minute = 0): Date {
  const x = new Date();
  x.setHours(hour, minute, 0, 0);
  if (x.getTime() <= Date.now()) x.setDate(x.getDate() + 1);
  return x;
}

export function formatScheduleHint(d: Date): string {
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() + 1;

  const time = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (sameDay) return `Aujourd'hui · ${time}`;
  if (tomorrow) return `Demain · ${time}`;

  const days = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  const months = [
    "jan", "fév", "mar", "avr", "mai", "juin",
    "juil", "août", "sept", "oct", "nov", "déc",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} · ${time}`;
}

export const SNOOZE_OPTIONS: TimeOption[] = [
  { id: "later-today", label: "Plus tard aujourd'hui", hint: "18:00", compute: () => todayAt(18) },
  { id: "tomorrow", label: "Demain matin", hint: "08:00", compute: () => tomorrowAt(8) },
  { id: "weekend", label: "Ce week-end", hint: "sam. 09:00", compute: () => nextWeekday(new Date(), 6) },
  { id: "next-week", label: "La semaine prochaine", hint: "lun. 08:00", compute: () => nextWeekday(new Date(), 1) },
  { id: "next-month", label: "Dans un mois", hint: "+30 j", compute: () => {
    const x = new Date();
    x.setDate(x.getDate() + 30);
    x.setHours(8, 0, 0, 0);
    return x;
  } },
];

export const SCHEDULE_OPTIONS: TimeOption[] = [
  { id: "in-1h", label: "Dans 1 heure", compute: () => new Date(Date.now() + 60 * 60 * 1000) },
  { id: "in-3h", label: "Dans 3 heures", compute: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  { id: "tomorrow-8", label: "Demain matin", hint: "08:00", compute: () => tomorrowAt(8) },
  { id: "monday-8", label: "Lundi prochain", hint: "08:00", compute: () => nextWeekday(new Date(), 1) },
];

export function SnoozeMenu({
  onSnooze,
  trigger,
}: {
  onSnooze: (date: Date, optionId: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => SNOOZE_OPTIONS, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64 p-1">
        <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Reporter à
        </p>
        <ul>
          {options.map((opt) => {
            const date = opt.compute();
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSnooze(date, opt.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-secondary"
                >
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {opt.hint ?? ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border p-1">
          <button
            type="button"
            onClick={() => {
              onSnooze(nextWeekday(new Date(), 1), "custom");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Calendar className="size-3.5" />
            Choisir une date…
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ScheduleSendMenu({
  onSchedule,
  trigger,
}: {
  onSchedule: (date: Date, optionId: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64 p-1">
        <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Programmer l'envoi
        </p>
        <ul>
          {SCHEDULE_OPTIONS.map((opt) => {
            const date = opt.compute();
            const Icon =
              opt.id.includes("8") ? Sunrise :
              opt.id === "in-3h" ? Sun :
              Clock;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSchedule(date, opt.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-secondary"
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {formatScheduleHint(date).split("·")[1]?.trim() ?? ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border p-1">
          <button
            type="button"
            onClick={() => {
              onSchedule(new Date(Date.now() + 4 * 60 * 60 * 1000), "custom");
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <span className="flex items-center gap-2.5">
              <CalendarClock className="size-3.5" />
              Choisir une date…
            </span>
            <ChevronRight className="size-3" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SnoozedBanner({ until }: { until: string }) {
  const date = new Date(until);
  return (
    <div className="mx-3 my-2 flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11px]">
      <Moon className="size-3.5 shrink-0" />
      <span>
        Reporté jusqu'au <strong>{formatScheduleHint(date)}</strong>
      </span>
    </div>
  );
}
