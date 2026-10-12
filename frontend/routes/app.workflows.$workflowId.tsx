//frontend\routes\app.workflows.$workflowId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import { WorkflowEditorSkeleton } from "@/components/skeletons";

function WorkflowDetailPage() {
  return <WorkflowEditor returnTo="/app/workflows" />;
}

export const Route = createFileRoute("/app/workflows/$workflowId")({
  head: ({ params }) => ({
    meta: [
      { title: `Workflow ${params.workflowId} — LeadCortex` },
      { name: "description", content: `Modifier et visualiser le workflow ${params.workflowId}.` },
      { property: "og:title", content: `Workflow ${params.workflowId} — LeadCortex` },
      {
        property: "og:description",
        content: `Modifier et visualiser le workflow ${params.workflowId}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: () => <WorkflowEditorSkeleton />,
  component: WorkflowDetailPage,
});
