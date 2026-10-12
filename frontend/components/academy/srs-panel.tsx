//frontend\components\academy\srs-panel.tsx
"use client";

/**
 * SRS Panel — résumé des révisions espacées.
 *
 * Affiche : nb cartes totales, dues, nouvelles, apprentissage, révision,
 * + un petit graphique de charge prévisionnelle (7 jours).
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw } from "lucide-react";

import { useSrsForecast, useSrsStats } from "@/lib/academy/hooks";
import { cn } from "@/lib/utils";

export function SrsPanel({ className }: { className?: string }) {
  const statsQuery = useSrsStats();
  const forecastQuery = useSrsForecast(7);

  if (statsQuery.isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-24 rounded-2xl" />
      </div>
    );
  }

  const stats = statsQuery.data?.stats;
  if (!stats) return null;

  const forecast = forecastQuery.data?.forecast ?? [];
  const maxForecast = Math.max(1, ...forecast.map((f) => f.due_count));

  return (
    <section className={cn("space-y-4", className)}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCcw className="size-4 text-primary" />
          <h2 className="text-sm font-semibold md:text-base">Révisions SRS</h2>
        </div>
        <Link
          to="/app/srs"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Ouvrir <ArrowRight className="size-3" />
        </Link>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <SrsTile label="Dues aujourd'hui" value={stats.due_count} tone="primary" />
        <SrsTile label="Nouvelles" value={stats.new_count} />
        <SrsTile label="En apprentissage" value={stats.learning_count ?? 0} />
        <SrsTile label="En révision" value={stats.review_count ?? 0} />
      </div>

      {/* Forecast — mini histogramme */}
      {forecast.length > 0 ? (
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Charge prévue (7 jours)
          </p>
          <div className="mt-3 flex h-20 items-end gap-1.5">
            {forecast.map((f, i) => {
              const h = maxForecast > 0 ? (f.due_count / maxForecast) * 100 : 0;
              return (
                <div
                  key={f.date}
                  className="flex flex-1 flex-col items-center gap-1"
                  title={`${f.due_count} carte${f.due_count > 1 ? "s" : ""} · ${f.date}`}
                >
                  <span className="font-mono text-[9px] tabular-nums text-muted-foreground">
                    {f.due_count > 0 ? f.due_count : ""}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      i === 0 ? "bg-primary" : "bg-primary/40",
                    )}
                    style={{ height: `${Math.max(4, h)}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {i === 0 ? "J" : `J+${i}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SrsTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "primary"
          ? "border-primary/25 bg-primary/[0.04]"
          : "border-border bg-background",
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-display text-xl tabular-nums",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}