// frontend/routes/auth.google.callback.ts

import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRequest } from "@server/auth/auth.server";

export const Route = createFileRoute("/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await handleAuthRequest(request)) ?? new Response("Route introuvable.", { status: 404 }),
    },
  },
});
