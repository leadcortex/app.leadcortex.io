// frontend/components/payment/checkout/search-select.tsx

import { useId, useState } from "react";
import { Check, ChevronsUpDown } from "@/components/icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/core/utils";

export type SearchOption = { value: string; label: string; badge?: string };

const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function Option({
  option,
  selected,
  onPick,
  keyPrefix = "",
}: {
  option: SearchOption;
  selected: boolean;
  onPick: () => void;
  keyPrefix?: string;
}) {
  return (
    <CommandItem
      value={`${keyPrefix}${option.value} ${option.label}`}
      onSelect={onPick}
      className="flex h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-[14px]"
    >
      {option.badge !== undefined && (
        <span className="w-7 shrink-0 font-mono text-[11px] font-semibold text-muted-foreground">
          {option.badge}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      <Check
        className={cn("size-4 shrink-0 text-primary", selected ? "opacity-100" : "opacity-0")}
      />
    </CommandItem>
  );
}

export function SearchSelect({
  label,
  value,
  options,
  featured,
  onChange,
  onBlur,
  error,
  searchPlaceholder = "Rechercher…",
  className,
}: {
  label: string;
  value: string;
  options: SearchOption[];
  featured?: string[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = options.find((o) => o.value === value);
  const featuredOptions = (featured ?? [])
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is SearchOption => Boolean(o));

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("min-w-0", className)}>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setQuery("");
            onBlur?.();
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-invalid={error ? true : undefined}
            className={cn(
              "relative flex h-14 w-full items-end rounded-xl border bg-background px-3.5 pb-2 pr-10 text-left outline-none transition",
              "focus-visible:border-foreground/40 focus-visible:ring-4 focus-visible:ring-foreground/5",
              open && "border-foreground/40 ring-4 ring-foreground/5",
              error ? "border-destructive/70" : "border-border",
            )}
          >
            <span
              className={cn(
                "absolute left-3.5 text-muted-foreground transition-all",
                current ? "top-2.5 text-[11px]" : "top-1/2 -translate-y-1/2 text-[15px]",
              )}
            >
              {label}
            </span>
            {current && <span className="truncate text-base md:text-[15px]">{current.label}</span>}
            <ChevronsUpDown className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="z-[120] w-[var(--radix-popover-trigger-width)] min-w-[260px] overflow-hidden rounded-2xl p-0 shadow-xl"
        >
          <Command
            filter={(itemValue, search) =>
              normalize(itemValue).includes(normalize(search.trim())) ? 1 : 0
            }
          >
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              className="h-11 text-base md:text-sm"
            />
            <CommandList className="max-h-[min(320px,45vh)] p-1.5">
              <CommandEmpty className="py-6 text-center text-[13px] text-muted-foreground">
                Aucun résultat
              </CommandEmpty>
              {!query && featuredOptions.length > 0 && (
                <CommandGroup heading="Fréquents">
                  {featuredOptions.map((o) => (
                    <Option
                      key={`f-${o.value}`}
                      keyPrefix="★ "
                      option={o}
                      selected={o.value === value}
                      onPick={() => pick(o.value)}
                    />
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading={!query && featuredOptions.length > 0 ? "Tous" : undefined}>
                {options.map((o) => (
                  <Option
                    key={o.value}
                    option={o}
                    selected={o.value === value}
                    onPick={() => pick(o.value)}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1 px-1 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
