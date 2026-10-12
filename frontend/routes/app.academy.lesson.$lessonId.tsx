//frontend\routes\app.academy.lesson.$lessonId.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { LessonPlayer, type LessonSummary } from "@/components/academy/lesson/lesson-player";

export const Route = createFileRoute("/app/academy/lesson/$lessonId")({
  head: () => ({
    meta: [
      { title: "Leçon — Academy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LessonRoutePage,
});

/**
 * Route plein écran de la leçon.
 *
 * La détection "plein écran" est faite côté AppShell par regex sur l'URL.
 * Cette page ne rend QUE le LessonPlayer — pas de chrome, pas de layout.
 *
 * À la sortie ou à la fin, on revient sur /app/academy.
 */
function LessonRoutePage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();

  const handleExit = useCallback(() => {
    navigate({ to: "/app/academy" });
  }, [navigate]);

  const handleFinish = useCallback(
    (_summary: LessonSummary) => {
      navigate({ to: "/app/academy" });
    },
    [navigate],
  );

  return (
    <LessonPlayer
      lessonId={lessonId}
      onExit={handleExit}
      onFinish={handleFinish}
    />
  );
}