// frontend/components/ui/scrollable-table.tsx

"use client";

import { cn } from "@/lib/core/utils";

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
        "not-prose my-2 flex flex-col overflow-hidden table-tactile",
        className,
      )}
    >
      {caption && (
        <div className="shrink-0 border-b border-border bg-secondary/30 px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          {caption}
        </div>
      )}
      <div
        className="scrollbar-compact min-h-0 overflow-auto overscroll-contain"
        style={{ maxHeight: `min(${maxHeight}px, 55vh)` }}
      >
        <table className="w-full border-collapse text-[11.5px]">
          <thead className="sticky top-0 z-10">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-3 py-2 text-[10.5px]",
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
              <tr key={ri}>
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
