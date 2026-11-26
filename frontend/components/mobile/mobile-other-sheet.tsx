// frontend/components/mobile/mobile-other-sheet.tsx

import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "@/components/icons";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { isLinkActive, type MobileNavSection } from "@/lib/mobile/nav-tree";
import { cn } from "@/lib/core/utils";

export type MobileOtherSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: MobileNavSection;
};

export function MobileOtherSheet({ open, onOpenChange, section }: MobileOtherSheetProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const handleSelect = (to: string) => {
    onOpenChange(false);
    requestAnimationFrame(() => navigate({ to: to as "/app" }));
  };

  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={section.label}>
      <div className="space-y-6 px-4 py-4">
        {section.groups?.map((group) => (
          <section key={group.label}>
            <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">{group.label}</h3>
            <ul className="overflow-hidden rounded-2xl border border-border/70 bg-surface/30">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                const active = isLinkActive(item, pathname);
                return (
                  <li key={item.to}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.to)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                        "active:bg-surface/70",
                        i < group.items.length - 1 && "border-b border-border/50",
                        active && "bg-primary/[0.06]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                        strokeWidth={1.75}
                      />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[15px]",
                          active && "font-medium text-primary",
                        )}
                      >
                        {item.label}
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground"
                        strokeWidth={1.75}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </MobileSheet>
  );
}
