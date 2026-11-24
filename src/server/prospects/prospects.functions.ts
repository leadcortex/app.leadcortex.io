// src/server/prospects/prospects.functions.ts

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser, isSameOriginRequest } from "../auth/auth.server";
import { getDatabase } from "../db/database.server";
import { prospects } from "../db/auth-schema";

const listInput = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).max(1_000_000).default(0),
});

const createInput = z.object({
  email: z.string().trim().email().max(320),
  companyName: z.string().trim().max(255).optional(),
});

export const listProspects = createServerFn({ method: "GET" })
  .validator((data: unknown) => listInput.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser(getRequest());
    if (!user) throw new Error("Authentification requise.");

    return getDatabase()
      .select({
        id: prospects.id,
        email: prospects.email,
        companyName: prospects.companyName,
        status: prospects.status,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      })
      .from(prospects)
      .where(eq(prospects.userId, user.id))
      .orderBy(desc(prospects.createdAt), desc(prospects.id))
      .limit(data.limit)
      .offset(data.offset);
  });

export const createProspect = createServerFn({ method: "POST" })
  .validator((data: unknown) => createInput.parse(data))
  .handler(async ({ data }) => {
    const request = getRequest();
    if (!isSameOriginRequest(request)) throw new Error("Origine de requête invalide.");

    const user = await getCurrentUser(request);
    if (!user) throw new Error("Authentification requise.");

    const [prospect] = await getDatabase()
      .insert(prospects)
      .values({
        userId: user.id,
        email: data.email.toLowerCase(),
        companyName: data.companyName || null,
      })
      .returning({
        id: prospects.id,
        email: prospects.email,
        companyName: prospects.companyName,
        status: prospects.status,
        createdAt: prospects.createdAt,
        updatedAt: prospects.updatedAt,
      });

    if (!prospect) throw new Error("La création du prospect a échoué.");
    return prospect;
  });
