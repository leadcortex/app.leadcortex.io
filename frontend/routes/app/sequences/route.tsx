//frontend\routes\app\sequences\route.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/sequences")({
  component: SequencesLayout,
});

function SequencesLayout() {
  return <Outlet />;
}
