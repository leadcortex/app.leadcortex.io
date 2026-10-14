import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/academy/review")({
  beforeLoad: () => {
    throw redirect({ to: "/app/academy" });
  },
  component: () => null,
});