//frontend\routes\app.academy.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LearningPath } from "../../academy/src/components/academy/learning-path";

export const Route = createFileRoute("/app/academy/")({
  head: () => ({
    meta: [
      { title: "Mon parcours — Académie Lead Cortex" },
      { description: "Progressez en prospection B2B avec les parcours de l’Académie Lead Cortex." },
    ],
  }),
  component: LearningPath,
});