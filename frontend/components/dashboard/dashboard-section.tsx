// frontend/components/dashboard/dashboard-section.tsx

import type { ReactNode } from "react";
import { cn } from "@/lib/core/utils";

export function DashSection({
  title,
  subtitle,
  actions,
  footer,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col", className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>

      <div className="min-w-0 flex-1">{children}</div>

      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}
