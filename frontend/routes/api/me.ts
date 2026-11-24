// frontend/routes/api/me.ts

import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRequest } from "@server/auth/auth.server";

export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await handleAuthRequest(request)) ?? new Response("Route introuvable.", { status: 404 }),
      PATCH: async ({ request }) =>
        (await handleAuthRequest(request)) ?? new Response("Route introuvable.", { status: 404 }),
    },
  },
});
