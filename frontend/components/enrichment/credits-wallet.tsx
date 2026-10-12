//frontend\components\enrichment\credits-wallet.tsx
import { AlertTriangle, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreditsWallet({
  total,
  used,
  onRecharge,
}: {
  total: number;
  used: number;
  onRecharge: () => void;
}) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? (used / total) * 100 : 0;
  const isLow = remaining / Math.max(1, total) < 0.2;

  return (
    <div className="rounded-2xl border border-border bg-background p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium">Wallet crédits</p>
            <p className="text-[11px] text-muted-foreground">
              Rechargé à la demande · facturation à l'usage
            </p>
          </div>
        </div>
        {isLow && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3" /> Stock bas
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Total" value={total} />
        <Stat label="Consommés" value={used} tone="muted" />
        <Stat label="Restants" value={remaining} tone={isLow ? "warn" : "primary"} />
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              isLow ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {pct.toFixed(0)}% du budget utilisé ce mois
        </p>
      </div>

      <button
        type="button"
        onClick={onRecharge}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition-opacity hover:opacity-90"
      >
        <Plus className="size-3.5" /> Recharger des crédits
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "muted" | "primary" | "warn";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-lg tabular-nums md:text-xl",
          tone === "muted" && "text-muted-foreground",
          tone === "primary" && "text-primary",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value.toLocaleString("fr-FR")}
      </p>
    </div>
  );
}
