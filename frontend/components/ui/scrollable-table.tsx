"use client";

/**
 * Tableau en lecture seule, style chat IA.
 *
 *  - hauteur plafonnée (défaut 280 px) et scroll vertical interne ;
 *  - header collant avec fond opaque ;
 *  - scroll horizontal si les colonnes débordent ;
 *  - alignement par colonne (left | center | right) ;
 *  - zébrures discrètes et bordure douce.
 */
import { cn } from "@/lib/utils";

export type TableAlign = "left" | "center" | "right";

export type ScrollableTableProps = {
  headers: string[];
  rows: string[][];
  align?: TableAlign[];
  maxHeight?: number;
  className?: string;
  caption?: string;
};

function alignClass(a: TableAlign | undefined) {
  switch (a) {
    case "right":
      return "text-right";
    case "center":
      return "text-center";
    default:
      return "text-left";
  }
}

export function ScrollableTable({
  headers,
  rows,
  align = [],
  maxHeight = 280,
  className,
  caption,
}: ScrollableTableProps) {
  if (!headers.length) return null;

  return (
    <div
      className={cn(
        "not-prose my-2 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        className,
      )}
    >
      {caption && (
        <div className="shrink-0 border-b border-border bg-secondary/30 px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          {caption}
        </div>
      )}
      <div
        className="min-h-0 overflow-auto overscroll-contain"
        style={{ maxHeight: `min(${maxHeight}px, 55vh)` }}
      >
        <table className="w-full border-collapse text-[11.5px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "border-b border-border px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground",
                    alignClass(align[i]),
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  "border-b border-border/50 last:border-b-0",
                  ri % 2 === 1 && "bg-secondary/20",
                )}
              >
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-1.5 text-foreground/90 align-top",
                      alignClass(align[ci]),
                    )}
                  >
                    {row[ci] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-3 py-6 text-center text-[11px] text-muted-foreground"
                >
                  Aucune donnée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}