// frontend/components/payment/checkout/fields.tsx

import { useId, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "@/components/icons";
import { cn } from "@/lib/core/utils";

const box = (invalid?: boolean) =>
  cn(
    "peer h-14 w-full rounded-xl border bg-background px-3.5 pb-1.5 pt-5 text-base outline-none transition md:text-[15px]",
    "focus:border-foreground/40 focus:ring-4 focus:ring-foreground/5",
    invalid ? "border-destructive/70" : "border-border",
  );

const floating =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground transition-all " +
  "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] " +
  "peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]";

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  maxLength?: number;
  adornment?: ReactNode;
};

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  error,
  className,
  inputClassName,
  adornment,
  ...rest
}: TextFieldProps) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <div className="relative">
        <input
          id={id}
          value={value}
          placeholder=" "
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cn(box(Boolean(error)), adornment && "pr-14", inputClassName)}
          {...rest}
        />
        <label htmlFor={id} className={floating}>
          {label}
        </label>
        {adornment && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {adornment}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-1 px-1 text-[12px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  autoComplete,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  autoComplete?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        id={id}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(box(false), "appearance-none pr-10")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-2.5 text-[11px] text-muted-foreground"
      >
        {label}
      </label>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-xl bg-surface/80 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background font-semibold text-foreground shadow-sm"
                : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ConsentCheck({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <label htmlFor={id} className="cursor-pointer text-[13px] leading-snug text-muted-foreground">
        {children}
      </label>
    </div>
  );
}

export function RevealLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left text-[13px] font-medium text-primary hover:underline"
    >
      + {label}
    </button>
  );
}

export function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="px-1 text-[13px] font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}
