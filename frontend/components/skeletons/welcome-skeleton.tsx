//frontend\components\skeletons\welcome-skeleton.tsx
/**
 * Skeleton miroir de <EmptyDashboard /> : même silhouette, mêmes
 * container queries, mêmes proportions (tuiles 4:3, pastille + titre,
 * bandeau bas) pour éviter tout « saut » entre le pending et le contenu.
 *
 * Si tu modifies la grille de `empty-dashboard.tsx` / `welcome-hero.tsx` /
 * `step-card.tsx`, répercute les breakpoints ici.
 */
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

const STEPS = [0, 1, 2, 3] as const;

export function WelcomeSkeleton() {
  return (
    <SkeletonRegion
      label="Chargement de la page de démarrage"
      className="@container mx-auto w-full min-w-0 max-w-[1180px]"
    >
      <div className="space-y-6 pb-10 @2xl:space-y-8">
        {}
        <div className="space-y-3">
          <Skeleton variant="text" className="h-2.5 w-24" />
          <Skeleton className="h-9 w-64 max-w-full @2xl:h-11 @2xl:w-96" />
          <Skeleton variant="text" className="h-3.5 w-80 max-w-full" />
        </div>

        {}
        <div className="rounded-3xl border border-primary/10 bg-primary/[0.06] px-5 py-8 @2xl:px-8 @2xl:py-10">
          <div className="mx-auto mb-8 max-w-xl space-y-2 text-center @2xl:mb-10">
            <Skeleton className="mx-auto h-6 w-64 max-w-full" />
            <Skeleton variant="text" className="mx-auto h-3 w-72 max-w-full" />
          </div>

          <div className="grid gap-x-6 gap-y-10 @lg:grid-cols-2 @5xl:grid-cols-4 @5xl:gap-x-8">
            {STEPS.map((i) => (
              <div key={i} className="mx-auto w-full min-w-0 max-w-[15rem]">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <div className="mt-3 flex items-center gap-3">
                  <Skeleton variant="circle" className="size-8 shrink-0" />
                  <Skeleton className="h-4 w-32 max-w-full" />
                </div>
                <Skeleton variant="text" lines={2} className="mt-3" />
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="grid gap-4 @3xl:grid-cols-2">
          {STEPS.map((i) => (
            <div
              key={i}
              className="@container min-w-0 rounded-2xl border border-border bg-background p-5"
            >
              <div className="grid items-center gap-4 @sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] @sm:gap-5 @lg:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)]">
                <Skeleton className="mx-auto aspect-[4/3] w-full max-w-[14rem] rounded-2xl @sm:mx-0 @sm:max-w-none" />
                <div className="min-w-0 space-y-2.5">
                  <Skeleton className="h-5 w-9 rounded-full" />
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton variant="text" lines={2} />
                  <Skeleton variant="button" className="mt-2 h-9 w-32 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-primary/[0.05] px-5 py-4 @5xl:flex-row @5xl:items-center @5xl:justify-between @5xl:gap-6">
          <div className="flex min-w-0 flex-col gap-2 @3xl:flex-row @3xl:items-center @3xl:gap-4">
            <div className="flex shrink-0 items-center gap-3">
              <Skeleton variant="circle" className="size-5 shrink-0" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton variant="text" className="h-3 w-72 max-w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2 @5xl:shrink-0 @5xl:flex-nowrap">
            <Skeleton variant="button" className="h-10 w-36" />
            <Skeleton variant="button" className="h-10 w-28" />
            <Skeleton variant="button" className="h-10 w-36" />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
