import { createFileRoute } from "@tanstack/react-router";
import { LearningPath } from '@/components/academy/learning-path';
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'Mon parcours — Académie Lead Cortex' },
    { name: 'description', content: 'Progressez en prospection B2B avec les parcours de l’Académie Lead Cortex.' },
    { property: 'og:title', content: 'Mon parcours — Académie Lead Cortex' },
    { property: 'og:description', content: 'Vos programmes de prospection, une leçon à la fois.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: LearningPath,
});
