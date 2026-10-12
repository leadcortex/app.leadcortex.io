//frontend\components\skeletons\auth-skeletons.tsx
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export function AuthSkeleton() {
  return (
    <SkeletonRegion label="Chargement de la page de connexion">
      <div className="min-h-screen grid lg:grid-cols-2 auth-grid">
        <div className="flex flex-col p-4 md:p-12">
          <Skeleton className="h-6 w-32" />
          <div className="flex-1 flex items-center">
            <div className="w-full max-w-sm mx-auto space-y-6 md:space-y-8">
              <div className="space-y-3">
                <Skeleton className="h-9 w-48 md:h-12 md:w-64" />
                <Skeleton variant="text" className="w-3/4" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Skeleton variant="text" className="h-px flex-1" />
                <Skeleton variant="text" className="h-2 w-8" />
                <Skeleton variant="text" className="h-px flex-1" />
              </div>
              <div className="space-y-3">
                <Skeleton variant="text" className="h-2 w-16" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton variant="text" className="h-2 w-2/3" />
            </div>
          </div>
        </div>
        <div className="hidden lg:block border-l border-border bg-surface/30 p-12">
          <div className="h-full flex flex-col justify-center gap-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton variant="text" lines={3} />
            <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function OnboardingSkeleton() {
  return (
    <SkeletonRegion label="Chargement de l'onboarding">
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/60">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <div className="flex items-center gap-1.5 md:gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-1 w-6 md:w-8 rounded-full" />
              ))}
            </div>
            <Skeleton variant="text" className="h-2 w-12" />
          </div>
          <div className="border-t border-border/40">
            <div className="mx-auto max-w-3xl px-4 md:px-6 py-2 flex items-center justify-between">
              <Skeleton variant="text" className="h-2 w-24" />
              <Skeleton variant="text" className="h-2 w-16" />
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center">
          <div className="w-full mx-auto max-w-2xl px-4 md:px-6 py-8 md:py-16">
            <Skeleton className="h-8 w-3/4 md:h-12" />
            <Skeleton variant="text" className="mt-4 w-1/2" />
            <div className="mt-6 md:mt-10 grid grid-cols-2 gap-2 md:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 md:h-20 w-full rounded-xl" />
              ))}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Skeleton variant="button" className="w-24" />
              <Skeleton variant="button" className="w-32" />
            </div>
          </div>
        </main>
      </div>
    </SkeletonRegion>
  );
}
