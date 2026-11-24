// src/server/db/auth-schema.ts

import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = (name = "created_at") =>
  timestamp(name, { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    firstName: text("first_name"),
    lastName: text("last_name"),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    locale: varchar("locale", { length: 12 }).notNull().default("fr"),
    plan: varchar("plan", { length: 32 }).notNull().default("free"),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "date" }),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const authIdentities = pgTable(
  "auth_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    email: text("email").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("auth_identities_provider_user_unique").on(table.provider, table.providerUserId),
    index("auth_identities_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: createdAt(),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_unique").on(table.token),
    index("auth_sessions_user_id_idx").on(table.userId),
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
  },
  (table) => [
    uniqueIndex("auth_accounts_provider_account_unique").on(table.providerId, table.accountId),
    index("auth_accounts_user_id_idx").on(table.userId),
  ],
);

export const authVerifications = pgTable(
  "auth_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)],
);

export const mailAccounts = pgTable(
  "mail_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    address: text("address").notNull(),
    accessTokenEncrypted: text("access_token_encrypted"),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true, mode: "date" }),
    scopes: text("scopes").array().notNull().default([]),
    imapHost: text("imap_host"),
    imapPort: integer("imap_port"),
    status: varchar("status", { length: 24 }).notNull().default("connected"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("mail_accounts_user_provider_identity_unique").on(
      table.userId,
      table.provider,
      table.providerUserId,
    ),
    index("mail_accounts_user_id_idx").on(table.userId),
    index("mail_accounts_status_idx").on(table.status),
  ],
);

export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    companyName: text("company_name"),
    status: text("status").notNull().default("raw"),
    enrichmentData: jsonb("enrichment_data").$type<{
      linkedinUrl?: string;
      phone?: string;
      technologies?: string[];
      companySize?: string;
      customAttributes?: Record<string, unknown>;
    }>(),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
  },
  (table) => [
    index("prospects_user_id_idx").on(table.userId),
    index("prospects_email_idx").on(table.email),
  ],
);
