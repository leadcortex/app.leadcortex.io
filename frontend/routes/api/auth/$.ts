// frontend/routes/api/auth/$.ts

import { createFileRoute } from "@tanstack/react-router";

import { getBetterAuth } from "@server/auth/better-auth.server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) =>
        process.env.BETTER_AUTH_ENABLED === "true"
          ? getBetterAuth().handler(request)
          : new Response("Better Auth n’est pas encore activé.", { status: 404 }),
      POST: ({ request }) =>
        process.env.BETTER_AUTH_ENABLED === "true"
          ? getBetterAuth().handler(request)
          : new Response("Better Auth n’est pas encore activé.", { status: 404 }),
    },
  },
});
