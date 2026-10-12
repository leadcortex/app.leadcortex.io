//frontend\components\custom-select.tsx
import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type CustomSelectOption = { value: string; label: string; description?: string };

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  title?: string;
  variant?: "pill" | "field";
  trigger?: ReactNode;
};

function normalize(o: string | CustomSelectOption): CustomSelectOption {
  return typeof o === "string" ? { value: o, label: o } : o;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Sélectionner",
  title,
  variant = "pill",
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const opts = options.map(normalize);
  const current = opts.find((o) => o.value === value);

  const defaultTrigger =
    variant === "pill" ? (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border rounded-md hover:bg-surface transition-colors"
      >
        {label && <span className="text-muted-foreground">{label}</span>}
        <span className="font-medium text-foreground">{current?.label ?? placeholder}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>
    ) : (
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-sm hover:border-foreground/20 transition-colors"
      >
        <span className={current ? "text-foreground" : "text-muted-foreground"}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="font-display text-2xl italic tracking-tight">
            {title ?? label ?? "Sélectionner"}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
          {opts.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selected ? "bg-primary/8" : "hover:bg-surface"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm ${selected ? "font-medium text-foreground" : "text-foreground"}`}
                  >
                    {o.label}
                  </div>
                  {o.description && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{o.description}</div>
                  )}
                </div>
                {selected && <Check className="size-4 text-primary mt-0.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
