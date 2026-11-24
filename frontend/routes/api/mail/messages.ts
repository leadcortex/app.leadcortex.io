// frontend/routes/api/mail/messages.ts

import { createFileRoute } from "@tanstack/react-router";
import { handleGmailRequest } from "@server/mail/gmail.server";

export const Route = createFileRoute("/api/mail/messages")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await handleGmailRequest(request)) ?? new Response("Route introuvable.", { status: 404 }),
    },
  },
});
