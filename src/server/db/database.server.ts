// src/server/db/database.server.ts

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./auth-schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

export function getDatabase(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to use the database.");
  }

  if (!client || !database) {
    const { hostname } = new URL(url);
    client = postgres(url, {
      ssl:
        hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
          ? false
          : "require",
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    database = drizzle(client, { schema });
  }

  return database;
}
