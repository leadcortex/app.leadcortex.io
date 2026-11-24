// frontend/routes/auth.logout.ts

import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRequest } from "@server/auth/auth.server";

export const Route = createFileRoute("/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await handleAuthRequest(request)) ?? new Response("Route introuvable.", { status: 404 }),
    },
  },
});
