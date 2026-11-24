// frontend/components/skeletons/mobile-people-skeleton.tsx

export function MobilePeopleSkeleton({
  label = "Chargement des prospects",
}: {
  label?: string;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="animate-fade-in">
      <span className="sr-only">{label}</span>

      <header className="bg-background/95 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="skeleton h-5 w-28 rounded-md" />
            <div className="skeleton h-3 w-44 rounded-md" />
          </div>
          <div className="skeleton size-10 shrink-0 rounded-full" />
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-2">
          <div className="skeleton h-10 w-36 shrink-0 rounded-full" />
          <div className="skeleton h-10 w-24 shrink-0 rounded-full" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 px-3 pt-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-xl border-2 border-border bg-background p-3 shadow-[0_3px_0_var(--border)]"
          >
            <div className="skeleton h-2.5 w-16 rounded" />
            <div className="skeleton h-6 w-14 rounded" />
            <div className="skeleton h-2.5 w-20 rounded" />
          </div>
        ))}
      </div>

      <div className="px-3 pt-3">
        <div className="skeleton h-10 rounded-full" />
      </div>

      <div className="px-3 pb-2 pt-2">
        <div className="max-h-[55vh] min-h-[400px] overflow-hidden rounded-2xl border border-border/60 bg-surface/20 p-2 shadow-inner">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative flex items-center gap-3 rounded-2xl border border-border bg-background p-3 shadow-sm"
              >
                <div className="skeleton size-11 shrink-0 rounded-full" />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="skeleton h-3.5 w-32 rounded" />
                    <div className="skeleton h-4 w-8 rounded" />
                  </div>
                  <div className="skeleton h-2.5 w-40 rounded" />
                </div>

                <div className="skeleton absolute right-2.5 top-2.5 size-10 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 px-3 pb-6">
        <div className="rounded-2xl border-2 border-border bg-background p-4 shadow-[0_3px_0_var(--border)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-2.5"
              >
                <div className="skeleton size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-2.5 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
