//frontend\components\tasks\date-time-field.tsx
import { useState } from "react";
import { CalendarDays, Clock, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CustomSelect } from "@/components/custom-select";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatLongDate,
  fromISODate,
  startOfToday,
  timeOptions,
  toISODate,
} from "@/lib/task-utils";

type Props = {
  date: string | undefined;
  time: string | undefined;
  onDateChange: (v: string | undefined) => void;
  onTimeChange: (v: string | undefined) => void;
};

const QUICK = [
  { label: "Aujourd'hui", offset: 0 },
  { label: "Demain", offset: 1 },
  { label: "Dans 3 jours", offset: 3 },
  { label: "Semaine pro.", offset: 7 },
];

export function DateTimeField({ date, time, onDateChange, onTimeChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = fromISODate(date);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => {
          const iso = toISODate(addDays(startOfToday(), q.offset));
          const active = date === iso;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => onDateChange(iso)}
              className={cn(
                "px-2.5 py-1 rounded-full border text-[11px] md:text-xs transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-surface",
              )}
            >
              {q.label}
            </button>
          );
        })}
        {date && (
          <button
            type="button"
            onClick={() => {
              onDateChange(undefined);
              onTimeChange(undefined);
            }}
            className="px-2 py-1 rounded-full border border-border text-[11px] md:text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <X className="size-3" /> Effacer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs md:text-sm hover:border-foreground/20 transition-colors"
            >
              <span className={cn("truncate", !selected && "text-muted-foreground")}>
                {selected ? formatLongDate(selected) : "Choisir une date précise"}
              </span>
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              captionLayout="dropdown"
              startMonth={new Date(new Date().getFullYear() - 2, 0)}
              endMonth={new Date(new Date().getFullYear() + 5, 11)}
              onSelect={(d) => {
                onDateChange(d ? toISODate(d) : undefined);
                setOpen(false);
              }}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <CustomSelect
          value={time ?? "none"}
          onChange={(v) => onTimeChange(v === "none" ? undefined : v)}
          title="Heure d'échéance"
          options={[{ value: "none", label: "Sans heure" }, ...timeOptions()]}
          trigger={
            <button
              type="button"
              className="w-full sm:w-36 flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-xs md:text-sm hover:border-foreground/20 transition-colors"
            >
              <span className={cn(!time && "text-muted-foreground")}>{time ?? "Sans heure"}</span>
              <Clock className="size-4 shrink-0 text-muted-foreground" />
            </button>
          }
        />
      </div>
    </div>
  );
}
