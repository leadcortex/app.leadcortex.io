//frontend\components\mobile\mobile-select-sheet.tsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CustomSelect, type CustomSelectOption } from "@/components/custom-select";
import { MobileActionSheet } from "@/components/mobile/mobile-action-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type MobileSelectOption = string | CustomSelectOption;

export type MobileSelectSheetProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  title?: string;

  variant?: "pill" | "field";

  triggerClassName?: string;
};

function normalize(o: MobileSelectOption): CustomSelectOption {
  return typeof o === "string" ? { value: o, label: o } : o;
}

export function MobileSelectSheet({
  label,
  value,
  onChange,
  options,
  placeholder = "Sélectionner",
  title,
  variant = "pill",
  triggerClassName,
}: MobileSelectSheetProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <CustomSelect
        label={label}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        title={title}
        variant={variant}
      />
    );
  }

  const normalized = options.map(normalize);
  const current = normalized.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 max-w-full shrink-0 items-center gap-2 rounded-full",
          "border border-border bg-background px-3",
          "text-[13px] font-medium transition-colors active:bg-surface",
          triggerClassName,
        )}
      >
        {label && <span className="shrink-0 text-muted-foreground">{label}</span>}
        <span className="min-w-0 truncate text-foreground">{current?.label ?? placeholder}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
      </button>

      <MobileActionSheet
        open={open}
        onOpenChange={setOpen}
        title={title ?? label ?? "Sélectionner"}
        items={normalized.map((o) => ({
          label: o.label,
          trailing: o.value === value ? "✓" : undefined,
          onSelect: () => {
            onChange(o.value);
            setOpen(false);
          },
        }))}
        cancelLabel="Annuler"
      />
    </>
  );
}
