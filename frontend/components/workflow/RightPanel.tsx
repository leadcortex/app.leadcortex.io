//frontend\components\workflow\RightPanel.tsx
import { useEffect, useRef, type FocusEvent } from "react";
import { Sliders } from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import { blockMap, categoryMap } from "@/lib/workflow/geometry";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import { scrollFieldAboveKeyboard } from "@/lib/scroll-field-into-view";
import { NodeSelect } from "./NodeSelect";
import { cn } from "@/lib/utils";

/**
 * Remonte le champ focalisé au-dessus du clavier virtuel. Déclenché
 * uniquement sur `onFocus` (donc uniquement quand l'utilisateur touche
 * explicitement le champ) — jamais au dépliement du panneau.
 *
 * Ne fait défiler QUE le conteneur interne `.props-scroll`, jamais la page :
 * c'est ce qui empêche le champ de "remonter trop haut" sur Safari iOS (voir
 * `scrollFieldAboveKeyboard`).
 */
function scrollFieldIntoView(e: FocusEvent<HTMLElement>) {
  const el = e.currentTarget;
  // recalculer la position : sur iOS, le viewport n'a pas encore sa taille
  window.setTimeout(() => scrollFieldAboveKeyboard(el, ".props-scroll"), 80);
}

function Inspector() {
  const { doc, selection, setDoc } = useWorkflow();
  const node = doc.nodes.find((n) => n.id === selection[0]);
  if (!node)
    return (
      <p className="p-3 text-[11.5px] text-muted-foreground">
        Sélectionne un bloc pour éditer sa configuration.
      </p>
    );
  const block = blockMap[node.blockId];
  const cat = categoryMap[node.category];

  const set = (key: string, value: string | number | boolean) =>
    setDoc((d) => ({
      ...d,
      nodes: d.nodes.map((n) =>
        n.id === node.id ? { ...n, config: { ...n.config, [key]: value } } : n,
      ),
    }));

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: cat.color }} />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold">{node.title}</p>
          <p className="truncate text-[10.5px] text-muted-foreground">{cat.label}</p>
        </div>
      </div>
      {block?.configFields.map((f) => {
        const v = node.config[f.key];
        // paraissent jamais soudés l'un à l'autre, quelle que soit la
        if (f.type === "toggle") {
          return (
            <div key={f.key} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">
                  {f.label}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(v)}
                  aria-label={f.label}
                  onClick={() => set(f.key, !v)}
                  className={cn("h-4 w-8 shrink-0 rounded-full", v ? "bg-primary" : "bg-muted")}
                >
                  <span
                    className="block h-3 w-3 rounded-full bg-background"
                    style={{ transform: v ? "translateX(17px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
              {f.help && (
                <span className="block text-[10px] text-muted-foreground">{f.help}</span>
              )}
            </div>
          );
        }
        return (
          <label key={f.key} className="block space-y-1">
            <span className="block text-[11px] text-muted-foreground">{f.label}</span>
            {f.type === "select" ? (
              <NodeSelect
                value={String(v ?? "")}
                onChange={(val) => set(f.key, val)}
                options={f.options ?? []}
                ariaLabel={f.label}
                size="default"
              />
            ) : f.type === "textarea" || f.type === "code" ? (
              <textarea
                value={String(v ?? "")}
                placeholder={f.placeholder ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                onFocus={scrollFieldIntoView}
                rows={3}
                className="w-full resize-y rounded border border-input bg-input-bg p-1.5 text-[16px] outline-none focus:border-ring sm:text-[11.5px]"
              />
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                value={String(v ?? "")}
                placeholder={f.placeholder ?? ""}
                onChange={(e) =>
                  set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)
                }
                onFocus={scrollFieldIntoView}
                className="h-7 w-full min-w-0 rounded border border-input bg-input-bg px-1.5 text-[16px] outline-none focus:border-ring sm:text-[11.5px]"
              />
            )}
            {f.help && (
              <span className="block text-[10px] text-muted-foreground">{f.help}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export function RightPanel({
  showContent = true,
  onRequestExpand,
  hideHeader = false,
}: {
  showContent?: boolean;
  onRequestExpand?: () => void;
  /** Quand `true`, la barre « Propriétés » n'est pas rendue (c'est le
   *  conteneur parent — `WorkflowRightDock` — qui porte l'onglet). */
  hideHeader?: boolean;
} = {}) {
  const { inset: keyboardInset } = useVirtualKeyboard();
  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      {!hideHeader && (
        <div className={cn("flex shrink-0", showContent && "border-b border-border")}>
          <button
            type="button"
            onClick={() => {
              if (!showContent) onRequestExpand?.();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-foreground"
          >
            <Sliders className="h-3.5 w-3.5" /> Propriétés
          </button>
        </div>
      )}
      {showContent && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className="props-scroll h-full overflow-y-auto overscroll-none"
            style={{ paddingBottom: keyboardInset ? 96 : 0 }}
          >
            <Inspector />
          </div>
        </div>
      )}
    </div>
  );
}