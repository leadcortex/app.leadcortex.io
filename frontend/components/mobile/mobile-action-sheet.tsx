//frontend\components\mobile\mobile-action-sheet.tsx
import { useState, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import type { LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export type MobileActionSheetItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;

  trailing?: ReactNode;
};

export type MobileActionSheetSection = {
  label?: string;
  items: MobileActionSheetItem[];
};

export type MobileActionSheetProps = {
  trigger?: ReactNode;
  title?: string;

  items?: MobileActionSheetItem[];

  sections?: MobileActionSheetSection[];

  cancelLabel?: string | null;

  align?: "start" | "end" | "center";

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function MobileActionSheet({
  trigger,
  title,
  items,
  sections,
  cancelLabel = "Annuler",
  align = "end",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: MobileActionSheetProps) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  if (!isMobile) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-[10rem]">
          {title && (
            <>
              <DropdownMenuLabel className="truncate">{title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          {items?.map((it, i) => (
            <DesktopItem key={`i-${i}`} item={it} />
          ))}

          {sections?.map((section, si) => (
            <div key={`s-${si}`}>
              {si > 0 && <DropdownMenuSeparator />}
              {section.label && (
                <DropdownMenuLabel className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {section.label}
                </DropdownMenuLabel>
              )}
              {section.items.map((it, i) => (
                <DesktopItem key={`s-${si}-${i}`} item={it} />
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /* ------------------------------ Mobile ----------------------------- */
  const handleSelect = (item: MobileActionSheetItem) => {
    if (item.disabled) return;
    setOpen(false);
    // Laisse la sheet se fermer avant d'exécuter l'action (transition fluide).
    requestAnimationFrame(() => item.onSelect());
  };

  return (
    <>
      {trigger ? <Slot onClick={() => setOpen(true)}>{trigger}</Slot> : null}

      <MobileSheet open={open} onOpenChange={setOpen} title={title ?? "Actions"}>
        <div className="px-2 py-1">
          {items && (
            <ul className="space-y-0.5">
              {items.map((it, i) => (
                <MobileRow key={`i-${i}`} item={it} onSelect={() => handleSelect(it)} />
              ))}
            </ul>
          )}

          {sections?.map((section, si) => (
            <div key={`s-${si}`} className={cn(si > 0 && "mt-2 border-t border-border/60 pt-2")}>
              {section.label && (
                <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((it, i) => (
                  <MobileRow key={`s-${si}-${i}`} item={it} onSelect={() => handleSelect(it)} />
                ))}
              </ul>
            </div>
          ))}

          {cancelLabel && (
            <div className="mt-2 border-t border-border/60 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-xl bg-secondary",
                  "text-[15px] font-medium text-foreground transition-colors active:bg-secondary/80",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {cancelLabel}
              </button>
            </div>
          )}
        </div>
      </MobileSheet>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sous-composants                                                           */
/* -------------------------------------------------------------------------- */

function DesktopItem({ item }: { item: MobileActionSheetItem }) {
  const Icon = item.icon;
  return (
    <DropdownMenuItem
      onSelect={item.onSelect}
      disabled={item.disabled}
      className={cn(
        "gap-2",
        item.destructive && "text-destructive focus:bg-destructive/10 focus:text-destructive",
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.trailing && <span className="shrink-0 text-muted-foreground">{item.trailing}</span>}
    </DropdownMenuItem>
  );
}

function MobileRow({ item, onSelect }: { item: MobileActionSheetItem; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        disabled={item.disabled}
        onClick={onSelect}
        className={cn(
          "flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          item.disabled && "opacity-40 pointer-events-none",
          item.destructive
            ? "text-destructive active:bg-destructive/10"
            : "text-foreground active:bg-secondary",
        )}
      >
        {Icon && <Icon className="size-5 shrink-0" strokeWidth={1.8} />}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.trailing && (
          <span className="shrink-0 text-[13px] text-muted-foreground">{item.trailing}</span>
        )}
      </button>
    </li>
  );
}
