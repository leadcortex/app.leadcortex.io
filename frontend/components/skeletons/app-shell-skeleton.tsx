// frontend/components/skeletons/app-shell-skeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";

const NAV_GROUPS: { label: string; items: number }[] = [
  { label: "Accueil", items: 2 },
  { label: "Prospecter & enrichir", items: 3 },
  { label: "Engager", items: 2 },
  { label: "Gagner", items: 2 },
  { label: "Outils", items: 2 },
  { label: "Inbound", items: 2 },
];

const CONTAINER_STYLE_MOBILE = {
  paddingBottom: "calc(var(--pen-nav-h, 76px) + 0.5rem)",
} as const;

export function AppShellSkeleton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "workflow";
}) {
  if (variant === "workflow") {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-muted/40 p-2 gap-2 text-sm text-foreground pb-[calc(var(--pen-nav-h,76px)+0.5rem)] md:pb-0">
        <TopBarSkeleton />
        <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40 p-2 gap-2 text-sm text-foreground pb-[calc(var(--pen-nav-h,76px)+0.5rem)] md:pb-0">
      <SidebarSkeleton />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <TopBarSkeleton />
        <div className="flex min-h-0 flex-1 gap-2">
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
              <div className="p-3 md:p-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function AppShellSkeletonFullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40 p-2 gap-2 text-sm text-foreground pb-[calc(var(--pen-nav-h,76px)+0.5rem)] md:pb-0">
      <SidebarSkeleton />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <TopBarSkeleton />
        <div className="flex min-h-0 flex-1 gap-2">
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            <div className="h-full min-h-0 max-w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside
      aria-hidden="true"
      className="hidden h-full w-64 shrink-0 flex-col gap-2 overflow-hidden rounded-2xl border border-border/70 bg-background p-2 shadow-sm md:flex"
    >
      <div className="flex shrink-0 items-center justify-between rounded-xl bg-surface/40 py-1.5 pl-2.5 pr-1">
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="size-7 shrink-0 rounded-lg" />
      </div>
      <nav className="min-h-0 flex-1 overflow-hidden rounded-xl bg-surface/30 p-1.5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="mb-2 last:mb-0">
            <Skeleton variant="text" className="mx-2 mb-1 h-2 w-16" />
            <ul className="space-y-0.5">
              {Array.from({ length: group.items }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-8 w-full rounded-lg" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 rounded-xl bg-surface/40 p-1.5">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </aside>
  );
}

function TopBarSkeleton() {
  return (
    <header
      aria-hidden="true"
      className="flex shrink-0 items-center gap-2 rounded-2xl border border-border/70 bg-background px-2 py-2 shadow-sm md:px-3 md:py-2.5"
    >
      <div className="hidden w-full items-center justify-between gap-2 md:flex">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          <Skeleton className="h-8 w-28 shrink-0 rounded-lg md:w-32" />
          <Skeleton className="h-8 w-28 shrink-0 rounded-lg md:w-32" />
          <Skeleton className="h-8 w-28 shrink-0 rounded-lg md:w-32" />
          <Skeleton className="h-8 w-28 shrink-0 rounded-lg md:w-32" />
        </div>
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>

      <div className="flex w-full items-center gap-1.5 md:hidden">
        <Skeleton variant="circle" className="size-10 shrink-0" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton variant="circle" className="size-10 shrink-0" />
      </div>
    </header>
  );
}
