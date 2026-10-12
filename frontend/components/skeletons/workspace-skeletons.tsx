//frontend\components\skeletons\workspace-skeletons.tsx
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PageHeaderSkeleton,
  KpiRowSkeleton,
  StatRowSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
  TableCardSkeleton,
  CardGridSkeleton,
  ListSkeleton,
  FormPanelSkeleton,
  DetailViewSkeleton,
} from "./layout-skeletons";

export function TableViewSkeleton({
  label = "Chargement de la liste",
  kpis = 0,
  kpiVariant = "kpi",
  rows = 10,
  columns = 6,
  filters = 3,
  comfortable = false,
  withToolbar = true,
  withSearch = true,
  className = "max-w-full",
}: {
  label?: string;
  kpis?: number;
  kpiVariant?: "kpi" | "stat";
  rows?: number;
  columns?: number;
  filters?: number;
  comfortable?: boolean;
  withToolbar?: boolean;
  withSearch?: boolean;
  className?: string;
}) {
  return (
    <SkeletonRegion label={label} className={cn(className, "space-y-3")}>
      <PageHeaderSkeleton withActions="triple" />
      <div className="space-y-4">
        {kpis > 0 &&
          (kpiVariant === "stat" ? (
            <StatRowSkeleton count={kpis} />
          ) : (
            <KpiRowSkeleton count={kpis} />
          ))}
        {withToolbar && <ToolbarSkeleton filters={filters} />}
        <TableSkeleton
          rows={rows}
          columns={columns}
          showSearch={withSearch}
          comfortable={comfortable}
        />
      </div>
    </SkeletonRegion>
  );
}

export function DealsPageSkeleton() {
  return (
    <SkeletonRegion label="Chargement du pipeline" className="max-w-full">
      <PageHeaderSkeleton withActions="single" />
      <div className="mb-4 md:mb-8">
        <KpiRowSkeleton count={4} />
      </div>

      {}
      <div className="overflow-x-auto scrollbar-hide mb-4 md:mb-8">
        <div className="grid grid-cols-5 gap-2 md:gap-3 min-w-[600px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-surface/40 border border-border flex flex-col min-h-[200px] md:min-h-[300px]"
            >
              <div className="p-2 md:p-3 border-b border-border space-y-2">
                <Skeleton variant="text" className="h-2.5 w-20" />
                <Skeleton variant="text" className="h-2 w-16" />
              </div>
              <div className="p-1.5 md:p-2 space-y-2 flex-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="p-2 md:p-3 rounded-lg bg-background border border-border space-y-2"
                  >
                    <Skeleton variant="text" className="h-2.5 w-3/4" />
                    <Skeleton variant="text" className="h-2 w-1/2" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton variant="text" className="h-2.5 w-12" />
                      <Skeleton variant="text" className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Skeleton className="mb-3 h-5 w-48" />
      <TableSkeleton rows={6} columns={6} showSearch />
    </SkeletonRegion>
  );
}

export function MeetingsPageSkeleton() {
  return (
    <SkeletonRegion label="Chargement des meetings" className="max-w-6xl">
      <PageHeaderSkeleton withActions="double" />
      <div className="mb-4 md:mb-8">
        <KpiRowSkeleton count={4} />
      </div>
      <TableSkeleton rows={6} columns={5} showSearch />
      <div className="mt-4 md:mt-6">
        <Skeleton className="mb-3 h-5 w-40" />
        <CardGridSkeleton count={3} lines={2} />
      </div>
    </SkeletonRegion>
  );
}

export function TasksListSkeleton() {
  return (
    <SkeletonRegion label="Chargement des tâches" className="max-w-6xl">
      <PageHeaderSkeleton withActions="single" />

      {}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-background px-3 py-2 md:px-4 md:py-3"
          >
            <Skeleton className="h-6 w-10 md:h-8 md:w-12" />
            <Skeleton variant="text" className="mt-1.5 h-2.5 w-20" />
          </div>
        ))}
      </div>

      {}
      <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      {}
      {Array.from({ length: 2 }).map((_, gi) => (
        <section key={gi} className="mb-5 md:mb-7">
          <div className="mb-2 md:mb-3 flex items-center gap-2">
            <Skeleton variant="text" className="h-2.5 w-24" />
            <Skeleton variant="text" className="h-2.5 w-6" />
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2 md:space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-background p-3 md:p-4 flex items-center gap-3"
              >
                <Skeleton variant="circle" className="size-4 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="h-2.5 w-3/5" />
                  <Skeleton variant="text" className="h-2 w-2/5" />
                </div>
                <Skeleton className="h-4 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </SkeletonRegion>
  );
}

export function SavedPageSkeleton() {
  return (
    <SkeletonRegion label="Chargement des favoris" className="max-w-full">
      <PageHeaderSkeleton withActions="none" />
      <div className="mb-3 md:mb-4 inline-flex gap-1 border border-border rounded-md p-0.5 bg-surface/40">
        <Skeleton className="h-7 w-28 rounded" />
        <Skeleton className="h-7 w-32 rounded" />
      </div>
      <TableCardSkeleton rows={6} columns={5} />
    </SkeletonRegion>
  );
}

export function CardViewSkeleton({
  label = "Chargement",
  cards = 6,
  kpis = 0,
  className = "max-w-5xl",
}: {
  label?: string;
  cards?: number;
  kpis?: number;
  className?: string;
}) {
  return (
    <SkeletonRegion label={label} className={className}>
      <PageHeaderSkeleton withActions="single" />
      {kpis > 0 && (
        <div className="mb-4 md:mb-8">
          <KpiRowSkeleton count={kpis} />
        </div>
      )}
      <TableSkeleton rows={Math.max(4, cards)} columns={5} showSearch showPagination />
    </SkeletonRegion>
  );
}

export function SequencesListSkeleton() {
  return (
    <SkeletonRegion label="Chargement des séquences" className="max-w-full">
      <PageHeaderSkeleton withActions="single" />
      <div className="mb-4 md:mb-6">
        <KpiRowSkeleton count={4} />
      </div>

      <div className="mb-4 md:mb-6">
        <Skeleton className="mb-2 h-3 w-40" />
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <article
              key={i}
              className="rounded-xl border border-border bg-background p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton variant="text" className="h-3 w-2/3" />
                  <Skeleton variant="text" className="h-2 w-4/5" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton variant="text" className="h-2 w-20" />
                <Skeleton variant="text" className="h-2 w-28" />
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-7 w-full rounded-lg" />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </article>
          ))}
        </div>
      </div>

      <TableSkeleton rows={6} columns={6} showSearch />
    </SkeletonRegion>
  );
}

export function WorkflowsSkeleton() {
  return (
    <SkeletonRegion label="Chargement des workflows" className="mx-auto max-w-6xl">
      <PageHeaderSkeleton withActions="single" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton variant="text" className="h-3 w-3/4" />
                <Skeleton variant="text" className="h-2 w-full" />
                <Skeleton variant="text" className="h-2 w-4/5" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <Skeleton variant="text" className="h-2 w-12" />
                  <Skeleton variant="text" className="h-3 w-8" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-3">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </article>
        ))}
      </div>

      <section className="mt-12">
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <Skeleton variant="text" className="h-3 w-2/3" />
              <Skeleton variant="text" className="h-2 w-full" />
              <Skeleton variant="text" className="h-2 w-4/5" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonRegion>
  );
}

export function WorkflowEditorSkeleton() {
  return (
    <SkeletonRegion
      label="Chargement de l'éditeur de workflow"
      className="workflow-shell flex h-[100dvh] w-full flex-col overflow-hidden bg-background"
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-panel px-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="button" className="size-7" />
          <Skeleton variant="button" className="size-7" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-40 sm:w-56" />
            <Skeleton variant="text" className="h-2 w-28 sm:w-40" />
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="button" className="size-7" />
          ))}
        </div>
      </div>
      <div className="hidden h-8 shrink-0 items-center gap-3 border-b border-border bg-panel px-3 sm:flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-2 w-12" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 bg-muted/40 p-2 lg:grid-cols-[220px_1fr_280px]">
        <div className="hidden space-y-2 rounded-xl border border-border bg-background p-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-lg" />
          ))}
        </div>
        <div className="relative mx-0 overflow-hidden rounded-xl border border-border bg-surface/30 p-4 lg:mx-2 lg:p-6">
          <div className="mx-auto max-w-sm space-y-8 pt-12 sm:pt-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border bg-background p-4">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="h-2 w-3/4" />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-end gap-2">
            <Skeleton variant="button" className="w-28" />
            <Skeleton className="h-16 flex-1 rounded-lg" />
          </div>
        </div>
        <div className="hidden space-y-3 rounded-xl border border-border bg-background p-3 lg:block">
          <Skeleton variant="text" className="h-2 w-24" />
          <Skeleton variant="text" lines={4} />
          <Skeleton variant="button" className="w-full" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function SettingsSkeleton() {
  return (
    <SkeletonRegion label="Chargement des réglages" className="max-w-5xl">
      <div className="mb-4 md:mb-10">
        <Skeleton variant="text" className="h-2 w-20" />
        <Skeleton className="mt-3 h-8 w-40 md:h-11 md:w-56" />
      </div>
      <Skeleton className="mb-5 h-16 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function MailboxSkeleton() {
  return (
    <SkeletonRegion
      label="Chargement de la boîte mail"
      className="flex h-full min-h-0 w-full md:gap-0 md:bg-muted/40 md:p-2"
    >
      {}
      <aside className="hidden md:flex h-full min-h-0 w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="shrink-0 space-y-2 border-b border-border p-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <nav className="min-h-0 flex-1 space-y-1 p-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-lg" />
          ))}
        </nav>
      </aside>

      {}
      <div className="hidden md:block w-2 shrink-0" />

      {}
      <section className="flex h-full min-h-0 flex-1 flex-col bg-background md:w-[360px] md:flex-none md:overflow-hidden md:rounded-xl md:border md:border-border md:shadow-sm">
        <div className="flex shrink-0 items-center gap-2 border-b border-border p-2">
          <Skeleton className="h-7 flex-1 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-2.5 w-16" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2 border-b border-border/60 px-3 py-3">
              <Skeleton variant="circle" className="size-8 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton variant="text" className="h-2.5 w-1/3" />
                  <Skeleton variant="text" className="ml-auto h-2 w-10 shrink-0" />
                </div>
                <Skeleton variant="text" className="h-2.5 w-4/5" />
                <Skeleton variant="text" className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {}
      <div className="hidden md:block w-2 shrink-0" />

      {}
      <section className="hidden md:flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background md:overflow-hidden md:rounded-xl md:border md:border-border md:shadow-sm">
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-7 rounded-lg" />
          ))}
        </div>
        <div className="shrink-0 border-b border-border p-4 space-y-3">
          <Skeleton className="h-6 w-3/5" />
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="size-9" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="text" className="h-2.5 w-2/5" />
              <Skeleton variant="text" className="h-2 w-1/3" />
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-3 p-4">
          <Skeleton variant="text" lines={8} />
        </div>
        <div className="shrink-0 border-t border-border bg-surface/30 p-4 space-y-2">
          <Skeleton variant="text" className="h-2.5 w-40" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </section>
    </SkeletonRegion>
  );
}

export const InboxSkeleton = MailboxSkeleton;

export function ConversationsSkeleton() {
  return (
    <SkeletonRegion
      label="Chargement des conversations"
      className="flex h-full min-h-0 w-full md:gap-0 md:bg-muted/40 md:p-2"
    >
      {}
      <div className="h-full min-h-0 w-full shrink-0 overflow-hidden bg-background md:w-[320px] md:rounded-xl md:border md:border-border md:shadow-sm">
        <div className="border-b border-border p-3 space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton variant="circle" className="size-8 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton variant="text" className="h-2.5 w-1/2" />
                  <Skeleton variant="text" className="h-2 w-3/4" />
                </div>
                <Skeleton variant="text" className="h-2 w-8 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="hidden md:block w-2 shrink-0" />

      {}
      <div className="hidden md:flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="shrink-0 border-b border-border p-4 flex items-center gap-3">
          <Skeleton variant="circle" className="size-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-3 w-40" />
            <Skeleton variant="text" className="h-2 w-28" />
          </div>
          <Skeleton className="size-7 rounded-md" />
        </div>
        <div className="min-h-0 flex-1 space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[70%] rounded-2xl border border-border p-3 space-y-2",
                i % 2 === 0 ? "self-start bg-surface/40" : "ml-auto bg-primary/10",
              )}
            >
              <Skeleton variant="text" className="h-2.5 w-40" />
              <Skeleton variant="text" className="h-2 w-56" />
            </div>
          ))}
        </div>
        <div className="shrink-0 border-t border-border p-3">
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function EnrichmentSkeleton() {
  return (
    <SkeletonRegion
      label="Chargement de l'enrichissement"
      className="mx-auto w-full max-w-6xl pb-10"
    >
      <PageHeaderSkeleton withActions="single" />

      <div className="mb-6 md:mb-8">
        <KpiRowSkeleton count={4} />
      </div>

      <section className="mb-6 md:mb-8 rounded-2xl border border-border bg-background p-4 md:p-5 space-y-3">
        <Skeleton variant="text" className="h-3 w-40" />
        <Skeleton variant="text" className="h-2 w-2/3" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </section>

      <section className="mb-6 md:mb-8 space-y-3">
        <Skeleton variant="text" className="h-3 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-3">
          <Skeleton variant="text" className="h-3 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </section>
        <aside className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </aside>
      </div>
    </SkeletonRegion>
  );
}

export function AnalyticsSkeleton() {
  return (
    <SkeletonRegion label="Chargement des analyses" className="mx-auto w-full max-w-[1400px] pb-10">
      <div className="mb-6 md:mb-10 space-y-2">
        <Skeleton variant="text" className="h-2.5 w-20" />
        <Skeleton className="h-8 w-56 md:h-12 md:w-72" />
        <Skeleton variant="text" className="h-2.5 w-80 max-w-full" />
      </div>

      <div className="mb-6 md:mb-8">
        <KpiRowSkeleton count={4} />
      </div>

      {}
      <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCardSkeleton height={300} />
        <ChartCardSkeleton height={300} />
      </div>

      {}
      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCardSkeleton height={260} />
        <ChartCardSkeleton height={260} />
      </div>

      {}
      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ChartCardSkeleton key={i} height={240} />
        ))}
      </div>

      {}
      <div className="mt-4 md:mt-6 rounded-2xl border border-border bg-background p-4 md:p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-3 w-48" />
          <Skeleton variant="text" className="h-2 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton variant="text" className="h-2.5 w-24" />
                <Skeleton variant="text" className="h-2.5 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}

function ChartCardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <section className="min-w-0 flex flex-col rounded-2xl border border-border bg-background p-4 md:p-6">
      <header className="mb-4 md:mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton variant="text" className="h-3 w-40" />
          <Skeleton variant="text" className="h-2 w-56 max-w-full" />
        </div>
        <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
      </header>
      <div className="min-w-0 flex-1">
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <Skeleton variant="text" className="h-2.5 w-40" />
      </div>
    </section>
  );
}

export function CreateFormSkeleton({
  variant = "person",
}: {
  variant?: "person" | "company" | "sequence";
}) {
  if (variant === "company") {
    return (
      <SkeletonRegion label="Chargement du formulaire" className="p-4 md:p-8 max-w-4xl">
        <div className="mb-6 flex items-start gap-4">
          <Skeleton variant="button" className="size-7 shrink-0 mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-2.5 w-20" />
            <Skeleton className="h-7 w-48 md:h-9 md:w-64" />
            <Skeleton variant="text" className="h-2.5 w-64 max-w-full" />
          </div>
        </div>
        <Skeleton className="mb-5 h-14 w-full rounded-xl" />
        <FormPanelSkeleton fields={6} />
      </SkeletonRegion>
    );
  }

  if (variant === "sequence") {
    return (
      <SkeletonRegion label="Chargement du formulaire" className="p-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton variant="button" className="size-7 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-2.5 w-20" />
            <Skeleton className="h-7 w-48 md:h-9 md:w-64" />
            <Skeleton variant="text" className="h-2.5 w-72 max-w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 p-6 space-y-3">
          <Skeleton variant="text" className="h-3 w-40" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-background p-6 space-y-4">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </SkeletonRegion>
    );
  }

  return (
    <SkeletonRegion label="Chargement du formulaire" className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Skeleton variant="button" className="size-7 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56 md:h-9 md:w-64" />
          <Skeleton variant="text" className="h-2.5 w-72 max-w-full" />
        </div>
        <Skeleton className="hidden sm:block h-7 w-16 rounded-md" />
      </div>

      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0 gap-2">
            <Skeleton variant="circle" className="size-6 md:size-7 shrink-0" />
            <Skeleton variant="text" className="h-2.5 w-20 hidden sm:block" />
            {i < 2 && <span className="mx-1 md:mx-2 h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <FormPanelSkeleton fields={5} />
    </SkeletonRegion>
  );
}

export function DealDetailSkeleton() {
  return (
    <SkeletonRegion label="Chargement de l'opportunité" className="p-4 md:p-8 max-w-6xl">
      <Skeleton variant="text" className="h-2.5 w-32 mb-3 md:mb-6" />
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56 md:h-11 md:w-72" />
          <div className="flex gap-4">
            <Skeleton variant="text" className="h-3 w-32" />
            <Skeleton variant="text" className="h-3 w-32" />
            <Skeleton variant="text" className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="button" className="w-9" />
          <Skeleton variant="button" className="w-9" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mb-8">
        <KpiRowSkeleton count={4} />
      </div>

      <Skeleton className="mb-8 h-20 w-full rounded-xl" />

      <div className="mb-6 flex gap-6 border-b border-border pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-3 w-20" />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormPanelSkeleton fields={4} />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function TaskDetailSkeleton() {
  return (
    <SkeletonRegion label="Chargement de la tâche" className="p-4 md:p-8 max-w-3xl">
      <Skeleton variant="text" className="h-2.5 w-32 mb-4 md:mb-6" />

      <div className="flex items-start gap-4 mb-6 md:mb-8">
        <Skeleton variant="circle" className="size-7 md:size-8 shrink-0 mt-1" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-7 w-56 md:h-10 md:w-80" />
          <div className="flex gap-3">
            <Skeleton variant="text" className="h-2.5 w-32" />
            <Skeleton variant="text" className="h-2.5 w-24" />
            <Skeleton variant="text" className="h-2.5 w-28" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton variant="button" className="w-28" />
          <Skeleton variant="button" className="w-28" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <FormPanelSkeleton fields={4} />
        <div className="rounded-xl border border-border bg-background p-4 md:p-6 space-y-3">
          <Skeleton variant="text" className="h-3 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}

export {
  PageHeaderSkeleton,
  KpiRowSkeleton,
  StatRowSkeleton,
  ToolbarSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  ListSkeleton,
  FormPanelSkeleton,
  DetailViewSkeleton,
};
