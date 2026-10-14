import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/academy/rewards")({
  beforeLoad: () => {
    throw redirect({ to: "/app/academy" });
  },
  component: () => null,
});