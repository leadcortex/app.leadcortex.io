//frontend\routes\app.workflows.new.tsx
import { createFileRoute } from "@tanstack/react-router";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import { WorkflowEditorSkeleton } from "@/components/skeletons";

function NewWorkflowPage() {
  return <WorkflowEditor returnTo="/app/workflows" />;
}

export const Route = createFileRoute("/app/workflows/new")({
  head: () => ({
    meta: [
      { title: "Nouveau workflow — LeadCortex" },
      { name: "description", content: "Créer un nouveau workflow de prospection automatisée." },
      { property: "og:title", content: "Nouveau workflow — LeadCortex" },
      {
        property: "og:description",
        content: "Créer un nouveau workflow de prospection automatisée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => <WorkflowEditorSkeleton />,
  component: NewWorkflowPage,
});
