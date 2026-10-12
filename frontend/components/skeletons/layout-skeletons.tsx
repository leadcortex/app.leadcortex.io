//frontend\components\skeletons\layout-skeletons.tsx
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({
  withActions = "double",
}: {
  withActions?: "none" | "single" | "double" | "triple";
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-8 gap-3 md:gap-6">
      <div className="min-w-0">
        <Skeleton variant="text" className="h-2.5 w-20 md:w-24" />
        <Skeleton className="mt-1 h-7 w-44 md:h-10 md:w-64" />
        <Skeleton variant="text" className="mt-1 md:mt-2 h-2.5 w-56 max-w-full" />
      </div>
      {withActions !== "none" && (
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 shrink-0">
          {withActions === "triple" && <Skeleton className="h-7 w-14 rounded-md" />}
          {(withActions === "double" || withActions === "triple") && (
            <Skeleton className="h-7 w-20 rounded-md" />
          )}
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-background p-3 md:p-4 kpi-card">
      <Skeleton variant="text" className="h-2.5 w-1/2" />
      <div className="mt-1 md:mt-1.5 flex items-baseline justify-between gap-2">
        <Skeleton className="h-6 w-16 md:h-8 md:w-20" />
        <Skeleton variant="text" className="h-3 w-10" />
      </div>
      <Skeleton variant="text" className="mt-1 h-2 w-3/5" />
    </div>
  );
}

export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-background p-3 md:p-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-2.5 w-16 md:w-20" />
        <Skeleton variant="circle" className="size-3.5 shrink-0" />
      </div>
      <Skeleton className="mt-1.5 h-6 w-14 md:h-7 md:w-16" />
      <Skeleton variant="text" className="mt-0.5 h-2 w-20 md:w-24" />
    </div>
  );
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ToolbarSkeleton({ filters = 3 }: { filters?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
      {Array.from({ length: filters }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-lg" />
      ))}
      <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
    </div>
  );
}

export function TableSkeleton({
  rows = 8,
  columns = 6,
  showSearch = true,
  showPagination = true,
  comfortable = false,
}: {
  rows?: number;
  columns?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  comfortable?: boolean;
}) {
  const headPad = comfortable ? "px-5 py-3.5" : "px-4 py-3";
  const cellPad = comfortable ? "px-5 py-4" : "px-4 py-3.5";

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative max-w-sm">
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
      )}

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm min-w-[640px] border-separate border-spacing-0">
            <thead className="bg-surface/90">
              <tr>
                <th className={cn(headPad, "border-b border-border w-8")}>
                  <Skeleton variant="circle" className="size-3.5" />
                </th>
                {Array.from({ length: Math.max(1, columns - 1) }).map((_, i) => (
                  <th key={i} className={cn(headPad, "border-b border-border")}>
                    <Skeleton variant="text" className={cn("h-2.5", i === 0 ? "w-24" : "w-16")} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border last:border-0",
                    i % 2 === 1 && "bg-surface/25",
                  )}
                >
                  <td className={cellPad}>
                    <Skeleton variant="circle" className="size-3.5" />
                  </td>
                  {Array.from({ length: Math.max(1, columns - 1) }).map((_, j) => (
                    <td key={j} className={cellPad}>
                      <div className="space-y-1.5">
                        <Skeleton
                          variant="text"
                          className={cn("h-2.5", j === 0 ? "w-3/5" : "w-1/2")}
                        />
                        {j === 0 && <Skeleton variant="text" className="h-2 w-2/5" />}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between text-xs px-0.5">
          <Skeleton variant="text" className="h-3 w-24" />
          <Skeleton className="h-7 w-40 rounded-lg" />
        </div>
      )}
    </div>
  );
}

export function TableCardSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-background">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left text-xs md:text-sm min-w-[500px]">
          <thead className="bg-surface/50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-3 md:px-4 py-2 border-b border-border">
                  <Skeleton variant="text" className="h-2.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="px-3 md:px-4 py-2 md:py-3">
                    <Skeleton variant="text" className="h-2.5 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, lines = 2 }: { count?: number; lines?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/5" />
              <Skeleton variant="text" lines={lines} className="mt-2" />
            </div>
            <Skeleton className="h-4 w-14 rounded-full shrink-0" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton variant="text" className="h-2 w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton variant="button" className="w-20" />
            <Skeleton variant="button" className="w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <Skeleton variant="circle" className="size-4 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="h-2 w-2/5" />
          </div>
          <Skeleton className="h-4 w-12 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function FormPanelSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 md:p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton variant="text" className="mt-3 w-3/5" />
      <div className="mt-6 space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton variant="text" className="h-2 w-24" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton variant="button" className="mt-6 w-32" />
    </div>
  );
}

export function DetailViewSkeleton({
  label = "Chargement de la fiche",
  className = "max-w-6xl",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonRegion label={label} className={className}>
      <Skeleton variant="text" className="h-2.5 w-32 mb-3 md:mb-6" />
      <div className="mb-4 md:mb-8 flex flex-wrap items-start gap-4 md:gap-6">
        <Skeleton variant="circle" className="size-14 md:size-20 shrink-0" />
        <div className="flex-1 min-w-0 space-y-3">
          <Skeleton className="h-7 w-56 md:h-10 md:w-80" />
          <Skeleton variant="text" className="w-2/5" />
          <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
        </div>
        <div className="hidden md:flex gap-2 shrink-0">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="button" className="w-9" />
          <Skeleton variant="button" className="w-9" />
        </div>
      </div>

      <div className="mb-4 md:mb-6 flex gap-3 md:gap-6 border-b border-border pb-2 md:pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-3 w-16 md:w-20" />
        ))}
      </div>

      <div className="grid gap-3 md:gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3 md:space-y-4">
          <FormPanelSkeleton fields={3} />
          <div className="rounded-2xl border border-border bg-background p-4 md:p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4">
              <ListSkeleton rows={4} />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <Skeleton variant="text" className="h-2.5 w-24" />
              <Skeleton variant="text" lines={2} />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
