// frontend/routes/app.tsx

import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { requireWorkspaceUser } from "@server/auth/auth.functions";
import { AppShell } from "@/components/layout/app-shell";
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

const AUTH_CACHE_MS = 60_000;
let authCache: { at: number; value: Awaited<ReturnType<typeof requireWorkspaceUser>> } | null =
  null;

async function cachedRequireWorkspaceUser() {
  if (typeof window === "undefined") return requireWorkspaceUser();
  const now = Date.now();
  if (authCache && now - authCache.at < AUTH_CACHE_MS) return authCache.value;
  const value = await requireWorkspaceUser();
  authCache = { at: now, value };
  return value;
}

export const Route = createFileRoute("/app")({
  beforeLoad: () => cachedRequireWorkspaceUser(),
  head: () => ({
    meta: [{ title: "Espace de travail · LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: AppRouteSkeleton,
  pendingMinMs: 0,
  component: AppLayout,
});

function getAppSkeleton(pathname: string) {
  if (/^\/app\/academy\/lesson\/[^/]+/.test(pathname)) {
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
    <AppShell>
      <HydratedWorkspace />
    </AppShell>
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
