// frontend/components/ui/date-picker.tsx

import { useState } from "react";
import { format, addMonths, subMonths, addYears, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DatePicker({
  value,
  onChange,
  placeholder = "JJ MM AA",
  disabled,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value || new Date());

  const handleOpenChange = (v: boolean) => {
    if (v) setViewDate(value || new Date());
    setOpen(v);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-[38px] px-3 gap-2 justify-start text-left font-normal",
            "border-border bg-background",
            "shadow-[0_2px_0_var(--border)] active:translate-y-[2px] active:shadow-none transition-all",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 text-primary shrink-0" />
          <span className="flex-1 min-w-0 truncate text-sm">
            {value ? format(value, "dd MMM yyyy", { locale: fr }) : placeholder}
          </span>
          {value && (
            <X
              className="size-3.5 shrink-0 cursor-pointer hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-xl border-2 border-border shadow-xl overflow-hidden"
        align="start"
        collisionPadding={12}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-1 border-b border-border bg-surface/40 px-2 py-1.5">
            <button
              type="button"
              onClick={() => setViewDate(subYears(viewDate, 1))}
              className="rounded-md p-1.5 hover:bg-surface text-muted-foreground transition-colors"
            >
              <ChevronsLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="rounded-md p-1.5 hover:bg-surface text-muted-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="min-w-[110px] text-center text-xs font-semibold capitalize text-foreground">
              {format(viewDate, "MMMM yyyy", { locale: fr })}
            </span>

            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="rounded-md p-1.5 hover:bg-surface text-muted-foreground transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewDate(addYears(viewDate, 1))}
              className="rounded-md p-1.5 hover:bg-surface text-muted-foreground transition-colors"
            >
              <ChevronsRight className="size-4" />
            </button>
          </div>

          <div className="flex justify-center p-2">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange(date);
                setOpen(false);
              }}
              month={viewDate}
              onMonthChange={setViewDate}
              initialFocus
              locale={fr}
              showOutsideDays
              components={{
                Nav: () => <></>,
                MonthCaption: () => <></>,
              }}
              className="rounded-b-xl bg-transparent p-0 w-full [--cell-size:2.25rem]"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
