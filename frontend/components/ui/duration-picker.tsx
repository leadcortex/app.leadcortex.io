// frontend/components/ui/duration-picker.tsx

import { useState } from "react";
import { Timer, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/core/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DURATIONS = ["15", "30", "45", "60", "90"];

export function DurationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm shadow-[0_2px_0_var(--border)] transition-all active:translate-y-[2px] active:shadow-none"
        >
          <span className="flex items-center gap-2">
            <Timer className="size-4 text-primary shrink-0" />
            <span className="font-mono">{value} min</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[140px] p-1 rounded-xl border-2 border-border shadow-xl"
        align="start"
        collisionPadding={12}
      >
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              onChange(d);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-1.5 text-sm transition-colors",
              value === d
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground hover:bg-surface",
            )}
          >
            <span className="font-mono">{d} min</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
