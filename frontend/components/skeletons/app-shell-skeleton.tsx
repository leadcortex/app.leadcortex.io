//frontend\components\skeletons\app-shell-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const NAV_GROUPS: { label: string; items: number }[] = [
  { label: "Accueil", items: 1 },
  { label: "Prospecter & enrichir", items: 4 },
  { label: "Engager", items: 4 },
  { label: "Gagner", items: 3 },
  { label: "Outils", items: 2 },
  { label: "Inbound", items: 2 },
  { label: "Sauvegardés", items: 1 },
];

/**
 * Chrome de l'app (sidebar + topbar) reproduit pendant le **pendingComponent**
 * de la route `/app`, c'est-à-dire AVANT que le vrai `AppShell` ne soit monté.
 *
 * Rôle : éviter le « jump » visuel où le skeleton d'une page s'affiche en
 * plein écran, puis "saute" à l'intérieur du shell une fois le route monté.
 * Avec cette enveloppe, la silhouette de la sidebar apparaît immédiatement,
 * le contenu est déjà décalé à sa position définitive.
 *
 * ⚠️ Ne pas utiliser ce composant DANS `HydrationGate` : à ce moment-là,
 *    `AppShell` est déjà monté et rend la sidebar + le topbar réels. Le
 *    fallback de `HydrationGate` doit être le skeleton de page brut.
 */
export function AppShellSkeleton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;

  variant?: "default" | "workflow";
}) {
  if (variant === "workflow") {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-muted/40 p-2 gap-2 text-sm text-foreground">
        <TopBarSkeleton />
        <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40 p-2 gap-2 text-sm text-foreground">
      <SidebarSkeleton />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <TopBarSkeleton />
        <div className="flex min-h-0 flex-1 gap-2">
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
            <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-20 md:pb-0">
              <div className="p-3 md:p-6">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Variante « full-bleed » pour Emails et Conversations : ces pages gèrent
 * elles-mêmes leur layout multi-colonnes (dossiers | liste | détail) avec
 * leurs propres gouttières redimensionnables. Le contenu ne doit donc PAS
 * être emballé dans un `p-3 md:p-6` — exactement comme dans le vrai AppShell
 * (`isFullBleed` dans `app-shell.tsx`).
 */
export function AppShellSkeletonFullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40 p-2 gap-2 text-sm text-foreground">
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
      {}
      <div className="flex shrink-0 items-center justify-between rounded-xl bg-surface/40 py-1.5 pl-2.5 pr-1">
        <Skeleton className="h-7 w-32 rounded-md" />
        <Skeleton className="size-7 shrink-0 rounded-lg" />
      </div>

      {}
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

      {}
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
      className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background px-2 py-2 shadow-sm md:px-3 md:py-2.5"
    >
      {}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <Skeleton className="h-8 w-28 shrink-0 rounded-lg md:w-32" />
        <Skeleton className="h-8 w-28 shrink-0 rounded-lg md:w-32" />
        <Skeleton className="hidden h-8 w-28 shrink-0 rounded-lg md:block md:w-32" />
      </div>

      {}
      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
    </header>
  );
}
