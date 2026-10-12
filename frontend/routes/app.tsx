//frontend\routes\app.tsx
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppStoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { HydrationGate } from "@/components/skeletons/hydration-gate";
import {
  AnalyticsSkeleton,
  AppShellSkeleton,
  AppShellSkeletonFullBleed,
  CardViewSkeleton,
  ConversationsSkeleton,
  CreateFormSkeleton,
  DealDetailSkeleton,
  DealsPageSkeleton,
  DetailViewSkeleton,
  EnrichmentSkeleton,
  MailboxSkeleton,
  MeetingsPageSkeleton,
  SavedPageSkeleton,
  SequencesListSkeleton,
  SettingsSkeleton,
  TableViewSkeleton,
  TaskDetailSkeleton,
  TasksListSkeleton,
  WelcomeSkeleton,
  WorkflowEditorSkeleton,
  WorkflowsSkeleton,
} from "@/components/skeletons";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [{ title: "Workspace — LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: AppRouteSkeleton,
  component: AppLayout,
});

/*  ⚠️  Sur /app (racine du workspace), on renvoie WelcomeSkeleton : la route */
/*     visible doit être le skeleton de la page d'accueil — jamais celui      */
/*     d'un dashboard classique qui n'existera peut-être jamais.              */

function getAppSkeleton(pathname: string) {
  if (/^\/app\/academy\/lesson\/[^/]+/.test(pathname)) {
    // Le Lesson Player gère son propre skeleton plein écran.
    return <WelcomeSkeleton />;
  }

  if (pathname === "/app" || pathname === "/app/") {
    return <WelcomeSkeleton />;
  }

  if (/^\/app\/workflows\/(new|[^/]+)\/?$/.test(pathname)) {
    return <WorkflowEditorSkeleton />;
  }
  if (/^\/app\/workflows\/?$/.test(pathname)) {
    return <WorkflowsSkeleton />;
  }

  if (/^\/app\/people\/[^/]+\/?$/.test(pathname)) {
    return <DetailViewSkeleton label="Chargement du prospect" />;
  }
  if (/^\/app\/companies\/[^/]+\/?$/.test(pathname)) {
    return <DetailViewSkeleton label="Chargement de l'entreprise" />;
  }
  if (/^\/app\/deals\/[^/]+\/?$/.test(pathname)) {
    return <DealDetailSkeleton />;
  }
  if (/^\/app\/sequences\/[^/]+\/?$/.test(pathname)) {
    return <DetailViewSkeleton label="Chargement de la séquence" />;
  }
  if (/^\/app\/tasks\/[^/]+\/?$/.test(pathname)) {
    return <TaskDetailSkeleton />;
  }

  if (/^\/app\/people\/new\/?$/.test(pathname)) {
    return <CreateFormSkeleton variant="person" />;
  }
  if (/^\/app\/companies\/new\/?$/.test(pathname)) {
    return <CreateFormSkeleton variant="company" />;
  }
  if (/^\/app\/sequences\/new\/?$/.test(pathname)) {
    return <CreateFormSkeleton variant="sequence" />;
  }

  if (/^\/app\/emails\/?$/.test(pathname)) {
    return <MailboxSkeleton />;
  }
  if (/^\/app\/conversations\/?$/.test(pathname)) {
    return <ConversationsSkeleton />;
  }

  if (/^\/app\/analytics\/?$/.test(pathname)) {
    return <AnalyticsSkeleton />;
  }
  if (/^\/app\/enrichment\/?$/.test(pathname)) {
    return <EnrichmentSkeleton />;
  }
  if (/^\/app\/settings(?:\/billing)?\/?$/.test(pathname)) {
    return <SettingsSkeleton />;
  }
  if (/^\/app\/tasks\/?$/.test(pathname)) {
    return <TasksListSkeleton />;
  }
  if (/^\/app\/deals\/?$/.test(pathname)) {
    return <DealsPageSkeleton />;
  }
  if (/^\/app\/meetings\/?$/.test(pathname)) {
    return <MeetingsPageSkeleton />;
  }
  if (/^\/app\/saved\/?$/.test(pathname)) {
    return <SavedPageSkeleton />;
  }
  if (/^\/app\/sequences\/?$/.test(pathname)) {
    return <SequencesListSkeleton />;
  }

  if (/^\/app\/forms\/?$/.test(pathname)) {
    return <CardViewSkeleton label="Chargement des formulaires" kpis={3} />;
  }
  if (/^\/app\/lists\/?$/.test(pathname)) {
    return <CardViewSkeleton label="Chargement des listes" kpis={0} />;
  }

  if (/^\/app\/people\/?$/.test(pathname)) {
    return (
      <TableViewSkeleton
        label="Chargement des prospects"
        kpis={4}
        kpiVariant="stat"
        rows={10}
        columns={6}
        filters={4}
        comfortable
      />
    );
  }
  if (/^\/app\/companies\/?$/.test(pathname)) {
    return (
      <TableViewSkeleton
        label="Chargement des entreprises"
        kpis={4}
        kpiVariant="stat"
        rows={10}
        columns={6}
        filters={4}
      />
    );
  }
  if (/^\/app\/calls\/?$/.test(pathname)) {
    return <TableViewSkeleton label="Chargement des appels" kpis={4} rows={8} columns={5} />;
  }
  if (/^\/app\/visitors\/?$/.test(pathname)) {
    return <TableViewSkeleton label="Chargement des visiteurs" kpis={4} rows={8} columns={5} />;
  }

  return <WelcomeSkeleton />;
}

function AppRouteSkeleton() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const content = getAppSkeleton(pathname);

  const isWorkflowEditor =
    /^\/app\/workflows\/(?!$)/.test(pathname) &&
    pathname !== "/app/workflows" &&
    pathname !== "/app/workflows/";
  if (isWorkflowEditor) {
    return <AppShellSkeleton variant="workflow">{content}</AppShellSkeleton>;
  }

  if (/^\/app\/(conversations|emails)\/?$/.test(pathname)) {
    return <AppShellSkeletonFullBleed>{content}</AppShellSkeletonFullBleed>;
  }

  return <AppShellSkeleton>{content}</AppShellSkeleton>;
}

function AppLayout() {
  return (
    <AppStoreProvider>
      {/*
        AppShell (et donc la sidebar classique) est monté ici, au niveau du
        layout /app, qui ne se démonte jamais lors de la navigation entre les
        pages enfants (/app/people, /app/emails, etc.). Seul <Outlet /> change :
        la sidebar reste stable, et l'utilisateur ne voit qu'un chargement dans
        l'écran central, jamais sur la barre.
      */}
      <AppShell>
        <HydratedWorkspace />
      </AppShell>
    </AppStoreProvider>
  );
}

function HydratedWorkspace() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <HydrationGate fallback={getAppSkeleton(pathname)}>
      <Outlet />
    </HydrationGate>
  );
}