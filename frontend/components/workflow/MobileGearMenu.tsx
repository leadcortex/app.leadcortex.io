//frontend\components\workflow\MobileGearMenu.tsx
import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { MenuEntry, MenuSection } from "./menu-model";

function resolveLevel(root: MenuEntry[], path: number[]) {
  const titles: string[] = [];
  let entries = root;
  for (const index of path) {
    const entry = entries[index];
    if (!entry || entry.kind !== "sub") break;
    titles.push(entry.label);
    entries = entry.children;
  }
  return { entries, titles };
}

const rowClass =
  "flex h-11 w-full items-center gap-3 px-3 text-left text-[14px] outline-none transition-colors active:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-45";

function MiniSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        on ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform",
          on && "translate-x-4",
        )}
      />
    </span>
  );
}

export function MobileGearMenu({ sections }: { sections: MenuSection[] }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<number[]>([]);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const root: MenuEntry[] = sections.map((section) => ({
    kind: "sub",
    label: section.label,
    icon: section.icon,
    children: section.entries,
  }));
  const { entries, titles } = resolveLevel(root, path);
  const depth = titles.length;

  const onOpenChange = (next: boolean) => {
    setOpen(next);

    if (!next) setPath([]);
  };

  const enter = (index: number) => {
    setDirection("forward");
    setPath([...path.slice(0, depth), index]);
  };

  const back = () => {
    setDirection("back");
    setPath(path.slice(0, Math.max(0, depth - 1)));
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 data-[state=open]:bg-accent"
          aria-label="Menu de l'éditeur"
          title="Menu"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={8}

        onCloseAutoFocus={(event) => event.preventDefault()}
        className="w-[min(88vw,320px)] overflow-hidden p-0"
      >
        <div role="menu" aria-label="Menu de l'éditeur" className="flex flex-col">
          <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-1.5">
            {depth > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={back}
                aria-label="Retour au niveau précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Settings className="mx-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">
              {depth > 0 ? titles.join(" › ") : "Menu"}
            </p>
          </div>

          <div
            key={path.slice(0, depth).join("-") || "root"}
            className={cn(
              "max-h-[min(66dvh,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain py-1 animate-in fade-in-0 duration-150 motion-reduce:animate-none",
              direction === "forward" ? "slide-in-from-right-4" : "slide-in-from-left-4",
            )}
          >
            {entries.map((entry, index) => {
              switch (entry.kind) {
                case "separator":
                  return <div key={index} role="separator" className="my-1 h-px bg-border" />;
                case "label":
                  return (
                    <p
                      key={index}
                      className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {entry.label}
                    </p>
                  );
                case "sub": {
                  const Icon = entry.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      role="menuitem"
                      aria-haspopup="menu"
                      onClick={() => enter(index)}
                      className={rowClass}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                }
                case "check":
                  return (
                    <button
                      key={index}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={entry.checked}
                      onClick={() => entry.onCheckedChange(!entry.checked)}
                      className={rowClass}
                    >
                      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                      <MiniSwitch on={entry.checked} />
                    </button>
                  );
                case "item": {
                  const Icon = entry.icon;
                  return (
                    <button
                      key={index}
                      type="button"
                      role="menuitem"
                      disabled={entry.disabled}
                      onClick={() => {
                        setOpen(false);
                        setPath([]);
                        entry.onSelect();
                      }}
                      className={rowClass}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                    </button>
                  );
                }
              }
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
