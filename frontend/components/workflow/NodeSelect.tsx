//frontend\components\workflow\NodeSelect.tsx
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  ariaLabel?: string;

  size?: "compact" | "default";
  className?: string;
  onPointerDownCapture?: (e: React.PointerEvent) => void;
  /**
   * Autorise la valeur sélectionnée à s'afficher sur plusieurs lignes (au
   * lieu d'être tronquée avec une ellipse) et le champ à grandir
   * verticalement en conséquence. Utile pour les options prédéfinies plus
   * longues qu'une seule ligne, pour qu'elles restent lisibles sans jamais
   * déborder du cadre du bloc.
   */
  autoGrow?: boolean;
};

/**
 * Custom themed dropdown that replaces the native <select>/<option> element.
 * Built on Radix UI Select so opening/closing, keyboard nav and — crucially —
 * collision-aware positioning (flipping the menu above the trigger when there
 * isn't enough room below the viewport) come for free via Radix Popper.
 */
export function NodeSelect({
  value,
  onChange,
  options,
  ariaLabel,
  size = "compact",
  className,
  onPointerDownCapture,
  autoGrow = false,
}: Props) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDownCapture?.(e);
        }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "wf-node-field flex w-full min-w-0 justify-between gap-1 rounded-md border border-input bg-input-bg text-left outline-none transition-colors",
          "hover:border-foreground/20 focus-visible:outline-none data-[state=open]:border-ring",
          autoGrow ? "items-start py-1" : "items-center",
          size === "compact"
            ? cn("px-1.5 text-[11px]", autoGrow ? "min-h-6" : "h-6")
            : cn("px-1.5 text-[11.5px]", autoGrow ? "min-h-7" : "h-7"),
          className,
        )}
      >
        <SelectPrimitive.Value
          className={autoGrow ? "whitespace-normal break-words leading-snug" : "truncate"}
        />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            className={cn(
              "shrink-0 opacity-60",
              size === "compact" ? "size-3" : "size-3.5",
              autoGrow && "mt-0.5",
            )}
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          collisionPadding={8}

          avoidCollisions
          className={cn(
            "z-50 overflow-hidden rounded-xl border border-node-border bg-node text-node-foreground shadow-node-hover",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
          )}
        >
          <SelectPrimitive.Viewport className="max-h-[min(16rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] p-1">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o}
                value={o}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-2.5 pr-7 outline-none transition-colors",
                  size === "compact" ? "text-[11px]" : "text-[11.5px]",
                  "data-[highlighted]:bg-primary/10 data-[state=checked]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                )}
              >
                <SelectPrimitive.ItemText className="truncate">{o}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                  <Check className="size-3.5 text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
