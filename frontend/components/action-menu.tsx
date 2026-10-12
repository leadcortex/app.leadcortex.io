//frontend\components\action-menu.tsx
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";

export type ActionMenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  tone?: "default" | "danger";
  separatorBefore?: boolean;
};

type Props = {
  items: ActionMenuItem[];
  align?: "left" | "right";
  className?: string;
  title?: string;
};

export function ActionMenu({ items, align = "right", className = "", title = "Actions" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg border border-border hover:bg-surface transition-colors"
      >
        <MoreHorizontal className="size-3.5 md:size-4 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-background shadow-lg p-1 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, i) => (
            <div key={item.label}>
              {item.separatorBefore && i > 0 && <div className="my-1 h-px bg-border" />}
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpen(false);
                  item.onSelect();
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md text-left transition-colors ${
                  item.tone === "danger"
                    ? "text-destructive hover:bg-destructive/10"
                    : "hover:bg-surface"
                }`}
              >
                {item.icon && <item.icon className="size-3.5" />}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
