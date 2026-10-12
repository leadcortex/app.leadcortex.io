//frontend\components\skeletons\dashboard-skeleton.tsx
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function DashboardKpiSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-background p-3 md:p-4">
      <Skeleton variant="text" className="h-2.5 w-1/2" />
      <div className="flex min-w-0 items-baseline gap-2">
        <Skeleton className="h-6 w-16 md:h-7 md:w-20" />
        <Skeleton className="h-4 w-10 shrink-0 rounded-full" />
      </div>
      <Skeleton variant="text" className="h-2 w-3/4" />
    </div>
  );
}

function ChartCardSkeleton({
  height = 280,
  withActions = false,
  withFooter = true,
}: {
  height?: number;
  withActions?: boolean;
  withFooter?: boolean;
}) {
  return (
    <section className="min-w-0 flex flex-col rounded-2xl border border-border bg-background p-4 md:p-6">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 md:mb-6">
        <div className="min-w-0 space-y-2">
          <Skeleton variant="text" className="h-3 w-40" />
          <Skeleton variant="text" className="h-2 w-56 max-w-full" />
        </div>
        {withActions && <Skeleton className="h-7 w-24 shrink-0 rounded-lg" />}
      </header>
      <div className="min-w-0 flex-1">
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </div>
      {withFooter && (
        <div className="mt-4 border-t border-border pt-3">
          <Skeleton variant="text" className="h-2.5 w-40" />
        </div>
      )}
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <SkeletonRegion
      label="Chargement du tableau de bord"
      className="mx-auto w-full max-w-[1400px] pb-10"
    >
      {}
      <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
        <div className="min-w-0">
          <Skeleton variant="text" className="h-2.5 w-32" />
          <Skeleton className="mt-1 h-7 w-56 md:h-10 md:w-72" />
          <Skeleton variant="text" className="mt-1 md:mt-2 h-2.5 w-80 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 shrink-0">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {}
      <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <DashboardKpiSkeleton key={i} />
        ))}
      </div>

      {}
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCardSkeleton height={280} withActions withFooter />
        <ChartCardSkeleton height={240} withFooter />
      </div>

      {}
      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCardSkeleton height={250} withActions withFooter />
        <ChartCardSkeleton height={240} withFooter />
      </div>

      {}
      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-3">
        {}
        <section className="min-w-0 rounded-2xl border border-border bg-background p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Skeleton variant="text" className="h-4 w-40" />
            <Skeleton variant="text" className="h-2.5 w-16" />
          </div>
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" className="h-2.5 w-3/5" />
                  <Skeleton variant="text" className="ml-auto h-2.5 w-8 shrink-0" />
                </div>
                <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
              </li>
            ))}
          </ul>
        </section>

        {}
        <section className="min-w-0 rounded-2xl border border-border bg-background p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton variant="text" className="h-4 w-32" />
              <Skeleton variant="text" className="h-2.5 w-6" />
            </div>
            <Skeleton variant="text" className="h-2.5 w-16 shrink-0" />
          </div>
          <ul className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2">
                <Skeleton variant="circle" className="size-4 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton variant="text" className="h-2.5 w-3/5" />
                  <Skeleton variant="text" className="h-2 w-2/5" />
                </div>
                <Skeleton className="h-4 w-12 shrink-0 rounded-full" />
              </li>
            ))}
          </ul>
        </section>

        {}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-background p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Skeleton variant="text" className="h-4 w-40" />
            <Skeleton variant="circle" className="size-4 shrink-0" />
          </div>
          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex min-w-0 gap-3 px-2 py-1.5">
                <Skeleton className="h-12 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5 border-l border-border pl-3">
                  <Skeleton variant="text" className="h-2.5 w-4/5" />
                  <Skeleton variant="text" className="h-2 w-3/5" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {}
      <section className="mt-4 rounded-2xl border border-border bg-background p-4 md:mt-6 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Skeleton variant="text" className="h-4 w-48" />
          <Skeleton variant="text" className="h-2.5 w-32" />
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                {["Opportunité", "Contact", "Étape", "Proba.", "Montant", "Clôture"].map((_, i) => (
                  <th
                    key={i}
                    className={cn("border-b border-border px-3 py-2", i >= 3 && "text-right")}
                  >
                    <Skeleton
                      variant="text"
                      className={cn("h-2.5", i >= 3 ? "ml-auto w-12" : "w-20")}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-3">
                    <Skeleton variant="text" className="mb-1 h-2.5 w-3/5" />
                    <Skeleton variant="text" className="h-2 w-2/5" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton variant="text" className="h-2.5 w-3/4" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton variant="text" className="ml-auto h-2.5 w-10" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton variant="text" className="ml-auto h-2.5 w-20" />
                  </td>
                  <td className="px-3 py-3">
                    <Skeleton variant="text" className="ml-auto h-2.5 w-16" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SkeletonRegion>
  );
}

export function DashboardRightPanelSkeleton() {
  return (
    <SkeletonRegion label="Chargement du panneau Cortex" className="p-5 space-y-6">
      <div>
        <Skeleton variant="text" className="mb-3 h-2.5 w-32" />
        <div className="space-y-2 rounded-xl border border-border bg-background p-4">
          <Skeleton variant="text" lines={3} />
          <Skeleton variant="button" className="mt-3 w-full" />
        </div>
      </div>
      <div>
        <Skeleton variant="text" className="mb-3 h-2.5 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton variant="circle" className="mt-1 size-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" className="h-2.5 w-3/5" />
                <Skeleton variant="text" className="h-2 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
