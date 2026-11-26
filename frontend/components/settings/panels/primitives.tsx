// frontend/components/settings/panels/primitives.tsx

import type { ComponentType, ReactNode } from "react";
import { AlertCircle, type LucideIcon } from "@/components/icons";

// z-[100] : au-dessus de la feuille mobile (MobileSheet, z-[80]) et de la modale desktop (z-[60]).
export const SELECT_Z = "z-[100] border-border bg-popover";

export type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

export async function fakeRequest(ms = 500) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

export const inputCls =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:h-9";

export const triggerCls = "h-11 w-full border-input bg-background md:h-9";

export function PanelIntro({
  description,
}: {
  icon?: LucideIcon;
  title?: string;
  description: string;
}) {
  return (
    <p className="max-w-prose px-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
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
      <div className="px-1">
        <h3 className="text-base font-semibold text-foreground">{label}</h3>
        {description && (
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export function SettingsCard({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {(title || actions) && (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 px-1">
          {title && <h4 className="text-[13px] font-medium text-muted-foreground">{title}</h4>}
          {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="rounded-xl border border-border bg-background p-4">{children}</div>
      {description && (
        <p className="max-w-prose px-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

export function RowsCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
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
        <p className="text-sm text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
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
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span className="mt-2 block">{children}</span>
      {error && (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> {error}
        </span>
      )}
    </label>
  );
}
