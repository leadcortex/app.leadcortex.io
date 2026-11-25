// frontend/components/settings/panels/mobile-nav-editor.tsx
// Éditeur de la barre de navigation mobile : aperçu modifiable (même rendu que la vraie barre).

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  ChevronLeft,
  Lock,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Smartphone,
  X,
} from "@/components/icons";
import { Switch } from "@/components/ui/switch";
import { useMobileNavLayout, writeMobileNavLayout } from "@/lib/core/layout-prefs";
import { cn } from "@/lib/core/utils";
import { NAV_ICON_STYLE } from "@/components/layout/mobile-nav-bar-view";
import {
  DEFAULT_NAV_LAYOUT,
  NAV_CATALOG,
  NAV_MAX,
  NAV_MIN,
  addKey,
  hasBubble,
  moveKey,
  removeKey,
  type MobileNavLayout,
  type NavPage,
} from "@/lib/mobile/nav-layout";

const PAGES = new Map(NAV_CATALOG.map((p) => [p.key, p]));

// Mêmes effets « verre » que la vraie barre (mobile-nav-bar-view.tsx).
const GLASS = cn(
  "border-white/15 dark:border-white/10",
  "shadow-[0_2px_10px_rgba(0,0,0,0.10)]",
  "bg-white/[0.12] dark:bg-white/[0.05]",
  "backdrop-blur-2xl",
);

function EditablePreview({
  layout,
  onChange,
}: {
  layout: MobileNavLayout;
  onChange: (next: MobileNavLayout) => void;
}) {
  const canRemove = layout.keys.length > NAV_MIN;
  const bubble = hasBubble(layout);

  const onDragEnd = (r: DropResult) => {
    if (!r.destination) return;
    navigator.vibrate?.(8);
    onChange(moveKey(layout, r.source.index, r.destination.index));
  };

  return (
    <DragDropContext onDragStart={() => navigator.vibrate?.(10)} onDragEnd={onDragEnd}>
      <Droppable droppableId="mobile-nav" direction="horizontal">
        {(drop) => (
          <div
            ref={drop.innerRef}
            {...drop.droppableProps}
            className="flex h-14 items-stretch select-none"
          >
            {layout.keys.map((key, index) => {
              const page = PAGES.get(key);
              if (!page) return null;
              const isBubble = bubble && index === 0;
              const isFirstOfBar = bubble ? index === 1 : index === 0;
              return (
                <Draggable key={key} draggableId={key} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      {...drag.dragHandleProps}
                      data-key={key}
                      data-cell={isBubble ? "bubble" : "bar"}
                      aria-label={`${page.label} — maintenir pour déplacer`}
                      className={cn(
                        "relative grid shrink-0 touch-none place-items-center text-muted-foreground",
                        GLASS,
                        isBubble
                          ? "mr-2 size-14 rounded-full border"
                          : "h-14 min-w-0 flex-1 border-y",
                        !isBubble && isFirstOfBar && "rounded-l-2xl border-l",
                        snapshot.isDragging &&
                          "z-10 rounded-2xl border bg-background text-primary shadow-xl ring-2 ring-primary/40",
                      )}
                    >
                      <page.icon style={NAV_ICON_STYLE} />
                      <button
                        type="button"
                        aria-label={`Retirer ${page.label}`}
                        disabled={!canRemove}
                        onClick={() => onChange(removeKey(layout, key))}
                        className={cn(
                          "absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full",
                          "bg-foreground/75 text-background transition-opacity",
                          "disabled:opacity-25",
                        )}
                      >
                        <X className="size-2.5" strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {drop.placeholder}

            <div
              data-key="other"
              aria-label="Autre — toujours en dernier"
              className={cn(
                "relative grid h-14 min-w-0 flex-1 place-items-center rounded-r-2xl border-y border-r text-muted-foreground/60",
                GLASS,
              )}
            >
              <MoreHorizontal style={NAV_ICON_STYLE} />
              <Lock className="absolute right-1 top-1 size-3" strokeWidth={2} />
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export function MobileNavEditorView({
  layout,
  onChange,
}: {
  layout: MobileNavLayout;
  onChange: (next: MobileNavLayout) => void;
}) {
  const full = layout.keys.length >= NAV_MAX;
  const groups: { label: string; pages: NavPage[] }[] = [];
  for (const p of NAV_CATALOG) {
    if (layout.keys.includes(p.key)) continue;
    let g = groups.find((x) => x.label === p.group);
    if (!g) groups.push((g = { label: p.group, pages: [] }));
    g.pages.push(p);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-surface/40 p-3">
        <EditablePreview layout={layout} onChange={onChange} />
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Maintenez et glissez pour réordonner · {NAV_MIN} à {NAV_MAX} sections
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h4 className="text-xs font-semibold">Ajouter une section</h4>
          {full && (
            <span className="text-[11px] text-muted-foreground">Barre complète (5 max)</span>
          )}
        </div>
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              {g.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {g.pages.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-label={`Ajouter ${p.label}`}
                  disabled={full}
                  onClick={() => onChange(addKey(layout, p.key))}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs transition-colors",
                    "active:bg-surface disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  <Plus className="size-3" strokeWidth={2.2} />
                  <p.icon className="size-3.5 text-muted-foreground" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {full && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/30 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Mettre la 1ʳᵉ section dans une bulle ronde</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {layout.keys[0] === "academy"
                ? "Academy en 1ʳᵉ position est toujours dans la bulle."
                : "Sinon, la barre occupe toute la largeur."}
            </p>
          </div>
          <Switch
            checked={hasBubble(layout)}
            disabled={layout.keys[0] === "academy"}
            onCheckedChange={(v) => onChange({ ...layout, forceBubble: v })}
            aria-label="Mettre la 1re section dans une bulle ronde"
          />
        </div>
      )}

      <button
        type="button"
        disabled={JSON.stringify(layout) === JSON.stringify(DEFAULT_NAV_LAYOUT)}
        onClick={() => onChange(DEFAULT_NAV_LAYOUT)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium transition-colors active:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCcw className="size-3.5" />
        Rétablir la barre par défaut
      </button>
    </div>
  );
}

/** Éditeur branché sur le réglage enregistré : chaque changement s'applique tout de suite. */
export function MobileNavEditor() {
  const layout = useMobileNavLayout();
  return <MobileNavEditorView layout={layout} onChange={writeMobileNavLayout} />;
}

/** Sous-page « Barre de navigation » de Paramètres › Affichage (mobile uniquement). */
export function MobileNavDrilldown({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour à l'affichage"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-surface"
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
        </button>
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="size-4.5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">Barre de navigation</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Choisissez 4 à 5 sections et leur ordre. « Autre » reste toujours en dernier.
            </p>
          </div>
        </div>
      </div>

      <MobileNavEditor />
    </div>
  );
}
