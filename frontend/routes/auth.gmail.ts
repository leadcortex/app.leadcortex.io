// frontend/routes/auth.gmail.ts

import { createFileRoute } from "@tanstack/react-router";
import { handleGmailRequest } from "@server/mail/gmail.server";

export const Route = createFileRoute("/auth/gmail")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await handleGmailRequest(request)) ?? new Response("Route introuvable.", { status: 404 }),
    },
  },
});
