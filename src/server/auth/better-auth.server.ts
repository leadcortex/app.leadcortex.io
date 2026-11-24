// src/server/auth/better-auth.server.ts

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { authAccounts, authSessions, authVerifications, users } from "../db/auth-schema";
import { getDatabase } from "../db/database.server";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to use Better Auth.`);
  return value;
}

function createAuth() {
  const baseURL = requiredEnv("APP_URL");
  const secret = requiredEnv("BETTER_AUTH_SECRET");

  return betterAuth({
    baseURL,
    secret,
    trustedOrigins: [new URL(baseURL).origin],
    database: drizzleAdapter(getDatabase(), {
      provider: "pg",
      schema: {
        user: users,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: requiredEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
      },
    },
    user: {
      fields: {
        name: "fullName",
        image: "avatarUrl",
      },
    },
    advanced: {
      database: {
        generateId: false,
      },
    },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getBetterAuth() {
  if (auth) return auth;
  auth = createAuth();
  return auth;
}
