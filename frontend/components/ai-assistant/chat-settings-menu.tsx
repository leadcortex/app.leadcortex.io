"use client";

/**
 * Menu « Paramètres du chat » — un bouton engrenage + un dropdown qui
 * regroupe tous les réglages secondaires de l'assistant, auparavant
 * éparpillés dans l'entête :
 *
 *   - Densité (confortable / compact)
 *   - Rechercher dans la conversation (Ctrl+F)
 *   - Bibliothèque de prompts
 *   - Charger la démo
 *   - Aide / raccourcis clavier (Ctrl+/)
 *
 * L'entête du panneau ne garde ainsi que les deux actions primaires :
 * « Nouvelle conversation » et « Historique ».
 *
 * Pattern de dropdown identique aux autres menus du panneau (click
 * outside + Échap), pour rester cohérent.
 */
import { useEffect, useRef, useState } from "react";
import {
  BookMarked,
  Keyboard,
  Rows3,
  Rows4,
  Search,
  Settings,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  persistDensity,
  type ChatDensity,
} from "./density-toggle";

export function ChatSettingsMenu({
  density,
  onDensityChange,
  onOpenSearch,
  onOpenLibrary,
  onOpenHelp,
  onLoadDemo,
  className,
}: {
  density: ChatDensity;
  onDensityChange: (next: ChatDensity) => void;
  onOpenSearch: () => void;
  onOpenLibrary: () => void;
  onOpenHelp: () => void;
  onLoadDemo: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isCompact = density === "compact";

  const toggleDensity = () => {
    const next: ChatDensity = isCompact ? "comfortable" : "compact";
    onDensityChange(next);
    persistDensity(next);
  };

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="Paramètres du chat"
        title="Paramètres du chat"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground",
          open && "bg-secondary/50 text-foreground",
        )}
      >
        <Settings className="size-4" strokeWidth={1.6} />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-full z-40 mt-1 w-60 origin-top-right rounded-xl border border-border bg-popover p-1 shadow-xl transition-all duration-150 ease-out",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0",
        )}
      >
        <p className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Affichage
        </p>
        <MenuRow
          icon={isCompact ? Rows3 : Rows4}
          label={isCompact ? "Passer en confortable" : "Passer en compact"}
          onClick={toggleDensity}
        />

        <div className="my-1 h-px bg-border/70" />

        <p className="px-2.5 pb-1 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Navigation
        </p>
        <MenuRow
          icon={Search}
          label="Rechercher dans la conversation"
          hint="Ctrl+F"
          onClick={() => run(onOpenSearch)}
        />
        <MenuRow
          icon={BookMarked}
          label="Bibliothèque de prompts"
          onClick={() => run(onOpenLibrary)}
        />

        <div className="my-1 h-px bg-border/70" />

        <p className="px-2.5 pb-1 pt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Divers
        </p>
        <MenuRow
          icon={Wand2}
          label="Charger une conversation de démo"
          onClick={() => run(onLoadDemo)}
        />
        <MenuRow
          icon={Keyboard}
          label="Raccourcis clavier"
          hint="Ctrl+/"
          onClick={() => run(onOpenHelp)}
        />
      </div>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12px] text-foreground transition-colors hover:bg-secondary/60"
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-secondary/60 text-muted-foreground">
        <Icon className="size-3.5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && (
        <kbd className="shrink-0 rounded border border-border bg-background px-1 py-px font-mono text-[10px] text-muted-foreground">
          {hint}
        </kbd>
      )}
    </button>
  );
}