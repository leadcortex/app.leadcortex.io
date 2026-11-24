// frontend/lib/auth/better-auth-client.ts

import { createAuthClient } from "better-auth/react";

export const betterAuthEnabled = import.meta.env.VITE_BETTER_AUTH_ENABLED === "true";
export const betterAuthClient = createAuthClient();
