// frontend/routes/__root.tsx

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
import { RotateCcw, Home, AlertCircle, WifiOff, ShieldAlert, Rocket, ArrowLeft } from "@/components/icons";

import appCss from "../styles.css?url";
import { reportError } from "../lib/core/error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { NativeTitleTooltip } from "@/components/ui/native-title-tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStoreProvider } from "@/lib/state/store";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/core/theme";

import foundingDolphin from "@academy/assets/collector/Founding-dolphin.svg";

function useSmartHomeRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  if (pathname.startsWith("/app")) {
    return { path: "/app", label: "Retour au dashboard" };
  }
  
  return { path: "/", label: "Retour à l'accueil" };
}

function NotFoundComponent() {
  const home = useSmartHomeRoute();
  
  return (
    <ErrorLayout
      icon={Rocket}
      title="Page introuvable"
      description="La page que vous cherchez a peut-être été déplacée ou n'existe pas. Notre dauphin a cherché partout, sans succès."
      imageSrc={foundingDolphin}
      homePath={home.path}
      homeLabel={home.label}
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const home = useSmartHomeRoute();

  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const msg = error?.message?.toLowerCase() || "";
  
  let config = {
    icon: AlertCircle,
    title: "Oups, Cortex a bugué",
    description: "Un problème inattendu est survenu. Pas de panique, notre dauphin fondateur est déjà sur le coup.",
    actionLabel: "Réessayer",
    onAction: () => {
      router.invalidate();
      reset();
    },
  };

  if (msg.includes("chunkloaderror") || msg.includes("failed to fetch dynamically imported module") || msg.includes("importing a module script failed")) {
    config = {
      icon: Rocket,
      title: "Une nouvelle version est disponible",
      description: "L'application a été mise à jour en arrière-plan. Rechargez la page pour profiter de la dernière version.",
      actionLabel: "Recharger la page",
      onAction: () => window.location.reload(),
    };
  } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("offline")) {
    config = {
      icon: WifiOff,
      title: "Connexion perdue",
      description: "Vérifiez votre connexion internet. Dès que vous êtes de retour en ligne, tout refonctionnera.",
      actionLabel: "Réessayer",
      onAction: () => {
        router.invalidate();
        reset();
      },
    };
  } else if (msg.includes("401") || msg.includes("403") || msg.includes("unauthorized")) {
    config = {
      icon: ShieldAlert,
      title: "Accès refusé",
      description: "Vous n'avez pas les autorisations nécessaires pour accéder à cette page. Veuillez vous reconnecter.",
      actionLabel: "Aller à la connexion",
      onAction: () => window.location.assign("/login"),
    };
  }

  return (
    <ErrorLayout
      icon={config.icon}
      title={config.title}
      description={config.description}
      imageSrc={foundingDolphin}
      homePath={home.path}
      homeLabel={home.label}
      primaryAction={{
        label: config.actionLabel,
        onClick: config.onAction,
        icon: RotateCcw,
      }}
    />
  );
}

function ErrorLayout({
  icon: Icon,
  title,
  description,
  imageSrc,
  primaryAction,
  homePath,
  homeLabel,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  imageSrc: string;
  primaryAction?: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }> };
  homePath: string;
  homeLabel: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_8%,transparent)_0%,transparent_60%)]" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 md:flex-row md:items-center md:justify-center md:gap-16">
        
        <div className="flex flex-1 flex-col items-center justify-center text-center md:items-start md:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Icon className="size-3.5" strokeWidth={2} />
            <span>Erreur système</span>
          </div>

          <h1 className="font-display text-3xl italic tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base max-w-md">
            {description}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-all hover:opacity-90 active:scale-95"
              >
                {primaryAction.icon && <primaryAction.icon className="size-4" />}
                {primaryAction.label}
              </button>
            )}
            <Link
              to={homePath}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-medium text-foreground transition-all hover:bg-surface active:scale-95"
            >
              <Home className="size-4" />
              {homeLabel}
            </Link>
          </div>

          <div className="mt-6 w-full">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Revenir à la page précédente
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center md:w-80 lg:w-[400px]">
          <div className="relative size-64 sm:size-72 md:size-80 lg:size-[380px] animate-[float_4s_ease-in-out_infinite]">
            <img
              src={imageSrc}
              alt="Mascotte LeadCortex"
              className="h-full w-full object-contain drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
      `}</style>
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
        <TooltipProvider>
          <AppStoreProvider>
            <RootLayout />
            <NativeTitleTooltip />
            <Toaster />
          </AppStoreProvider>
        </TooltipProvider>
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

  if (isAppRoute) {
    return <Outlet />;
  }

  if (isExempt) {
    return <Outlet />;
  }

  if (pathname === "/") {
    return <Outlet />;
  }

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
