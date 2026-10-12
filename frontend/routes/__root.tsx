//frontend\routes\__root.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AppStoreProvider } from "@/lib/store";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-4 font-display text-6xl italic text-foreground">Page introuvable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl italic text-foreground">
          Un instant, il y a eu un souci.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Rechargez la page ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LeadCortex — Équipe d'agents IA de prospection B2B" },
      {
        name: "description",
        content:
          "L'équipe d'agents IA autonome qui trouve, enrichit et contacte vos leads B2B. Une IA de recherche, une IA de travail. Pour founders solo, duos et équipes commerciales.",
      },
      { name: "author", content: "LeadCortex" },
      { property: "og:title", content: "LeadCortex — Équipe d'agents IA de prospection B2B" },
      {
        property: "og:description",
        content:
          "Trouvez, enrichissez et contactez vos prospects B2B avec une équipe d'agents IA. Modèles inclus ou BYOK. Conçu pour les équipes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
        {}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppStoreProvider>
          <RootLayout />
          <Toaster />
        </AppStoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const APP_ROUTE_PREFIX = "/app";

const SITE_EXEMPT_ROUTES = ["/onboarding"];

function RootLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isAppRoute = pathname === APP_ROUTE_PREFIX || pathname.startsWith(`${APP_ROUTE_PREFIX}/`);
  const isExempt = SITE_EXEMPT_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // ── Routes /app : AppShell gère déjà son propre conteneur ────────────────
  if (isAppRoute) {
    return <Outlet />;
  }

  // ── Routes exemptées : rendu brut ────────────────────────────────────────
  if (isExempt) {
    return <Outlet />;
  }

  // ── Routes « site » : cadre arrondi fixe, scroll interne ────────────────
  //
  // Structure :
  //   ┌─ h-dvh overflow-hidden  (empêche le scroll de la page entière)
  //   │  ┌─ p-2 md:p-3          (padding périphérique autour du cadre)
  //   │  │  ┌─ rounded-2xl border
  //   │  │  │  ┌─ overflow-y-auto (seul élément qui scrolle)
  //   │  │  │  │  <Outlet />     (nav + contenu + footer, tels quels)
  //
  // La nav (SiteNav) et le footer (SiteFooter) restent rendus par les pages
  // elles-mêmes : ils apparaissent à l'intérieur du cadre, en haut et en bas
  // du contenu scrollable. `position: sticky` sur la nav la fait coller au
  // bord supérieur du cadre quand on scrolle — comportement navigateur
  // standard, rien à changer.
  return (
    <div className="h-dvh w-full overflow-hidden bg-canvas">
      <div className="h-full min-h-0 p-2 md:p-3">
        <div className="mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
