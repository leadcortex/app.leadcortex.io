//frontend\components\settings\panels\primitives.tsx
import type { ComponentType, ReactNode } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const SELECT_Z = "z-[70] border-border bg-popover";

export type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

export async function fakeRequest(ms = 500) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

export const inputCls =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

export function PanelIntro({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

export function PanelGroup({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-border/50 pb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
          {label}
        </h3>
        {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SettingsCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2 px-1">
          <div className="flex min-w-0 items-start gap-2">
            {Icon && (
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            )}
            <div className="min-w-0">
              {title && <h4 className="text-xs font-semibold text-foreground">{title}</h4>}
              {description && (
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="rounded-xl border border-border bg-background p-4 md:p-5">{children}</div>
    </div>
  );
}

export function RowsCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 md:p-5">
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

export function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/*  Field — label + hint + champ + message d'erreur                           */

export function Field({
  label,
  hint,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {Icon && <Icon className="size-3" strokeWidth={1.8} />}
          {label}
        </span>
        {hint && <span className="text-[10px] text-muted-foreground/70">{hint}</span>}
      </span>
      <span className="mt-2 block">{children}</span>
      {error && (
        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="size-3" /> {error}
        </span>
      )}
    </label>
  );
}
