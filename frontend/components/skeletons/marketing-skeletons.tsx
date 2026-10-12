//frontend\components\skeletons\marketing-skeletons.tsx
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

function SiteNavSkeleton() {
  return (
    <div className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <div className="hidden md:flex items-center gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="w-16" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="button" className="w-20" />
          <Skeleton variant="button" className="w-28" />
        </div>
      </div>
    </div>
  );
}

export function LandingSkeleton() {
  return (
    <SkeletonRegion label="Chargement de la page d'accueil">
      <div className="min-h-screen bg-background">
        <SiteNavSkeleton />

        {}
        <section className="mx-auto max-w-7xl px-4 md:px-6 pt-12 md:pt-20 pb-10 md:pb-16">
          <div className="max-w-3xl space-y-4 md:space-y-6">
            <Skeleton className="h-5 w-64 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full md:h-16" />
              <Skeleton className="h-10 w-4/5 md:h-16" />
              <Skeleton className="h-10 w-2/3 md:h-16" />
            </div>
            <Skeleton variant="text" lines={3} className="max-w-[52ch]" />
            <div className="flex flex-wrap gap-2 md:gap-3 pt-2">
              <Skeleton variant="button" className="h-10 w-44 rounded-xl" />
              <Skeleton variant="button" className="h-10 w-36 rounded-xl" />
            </div>
            <div className="flex flex-wrap gap-4 md:gap-6 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="h-2 w-28" />
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="border-y border-border/60 bg-surface/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton variant="text" className="h-2 w-48" />
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="w-16" />
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-24">
          <div className="max-w-2xl mb-8 md:mb-12 space-y-3">
            <Skeleton variant="text" className="h-2 w-28" />
            <Skeleton className="h-9 w-3/4 md:h-14" />
            <Skeleton className="h-9 w-1/2 md:h-14" />
          </div>
          <Skeleton className="h-[320px] md:h-[560px] w-full rounded-2xl md:rounded-3xl" />
        </section>

        {}
        <section className="mx-auto max-w-7xl px-4 md:px-6 pb-12 md:pb-24 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <Skeleton variant="circle" className="size-8" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton variant="text" lines={2} />
            </div>
          ))}
        </section>
      </div>
    </SkeletonRegion>
  );
}

export function ContentPageSkeleton({ withNav = true }: { withNav?: boolean }) {
  return (
    <SkeletonRegion label="Chargement de la page">
      <div className="min-h-screen bg-background">
        {withNav && <SiteNavSkeleton />}
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-20 space-y-6">
          <Skeleton variant="text" className="h-2 w-24" />
          <Skeleton className="h-9 w-3/4 md:h-12" />
          <Skeleton variant="text" lines={3} />
          <div className="space-y-8 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton variant="text" lines={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
