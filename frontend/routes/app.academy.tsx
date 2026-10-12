//frontend\routes\app.academy.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout parent de toutes les routes /app/academy/*.
 *
 * Aucun chrome additionnel : les pages filles utilisent le shell standard
 * (AppShell), SAUF /app/academy/lesson/* qui est rendu en plein écran par
 * AppShell grâce au flag isAcademyLesson.
 */
export const Route = createFileRoute("/app/academy")({
  head: () => ({
    meta: [
      { title: "Academy — LeadCortex" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcademyLayout,
});

function AcademyLayout() {
  return <Outlet />;
}