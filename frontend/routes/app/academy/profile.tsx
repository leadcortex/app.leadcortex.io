// frontend/routes/app/academy/profile.tsx

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/academy/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/app/academy" });
  },
  component: () => null,
});
