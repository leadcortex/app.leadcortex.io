// src/server/mail/gmail.server.ts

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { mailAccounts } from "../db/auth-schema";
import {
  appUrl,
  cookie,
  expiredCookie,
  getCurrentUser,
  googleOAuthConfiguration,
  isSameOriginRequest,
  readCookie,
  responseWithCookies,
} from "../auth/auth.server";
import { getDatabase } from "../db/database.server";
import { assertTokenEncryptionKey, decryptToken, encryptToken } from "./token-crypto.server";
import type { EmailRecord } from "@shared/types/email-types";

const GMAIL_OAUTH_COOKIE = "lc_gmail_oauth_tx";
const GMAIL_OAUTH_TTL_SECONDS = 60 * 10;
const GMAIL_READ_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_PROFILE_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const GMAIL_API_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me";

type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type: "Bearer";
};

function parseGoogleTokens(payload: unknown): GoogleTokens {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Google returned an invalid Gmail token response.");
  }
  const values = payload as Record<string, unknown>;
  if (typeof values.access_token !== "string" || values.token_type !== "Bearer") {
    throw new Error("Google returned an invalid Gmail token response.");
  }
  return {
    access_token: values.access_token,
    token_type: "Bearer",
    ...(typeof values.refresh_token === "string" ? { refresh_token: values.refresh_token } : {}),
    ...(typeof values.expires_in === "number" ? { expires_in: values.expires_in } : {}),
    ...(typeof values.scope === "string" ? { scope: values.scope } : {}),
  };
}

type GoogleProfile = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
};

type GmailMessage = {
  id?: unknown;
  threadId?: unknown;
  labelIds?: unknown;
  internalDate?: unknown;
  snippet?: unknown;
  payload?: {
    headers?: Array<{ name?: unknown; value?: unknown }>;
    mimeType?: unknown;
    body?: { data?: unknown };
    parts?: GmailMessage["payload"][];
  };
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function gmailRedirectUri() {
  return googleOAuthConfiguration({
    redirectEnv: "GOOGLE_GMAIL_REDIRECT_URI",
    redirectPath: "/auth/gmail/callback",
  });
}

function beginGmailOAuth(userId: string): Response {
  assertTokenEncryptionKey();
  const { clientId, redirectUri } = gmailRedirectUri();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: `openid email profile ${GMAIL_READ_SCOPE}`,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent select_account",
  }).toString();

  const transaction = Buffer.from(JSON.stringify({ state, verifier, userId })).toString(
    "base64url",
  );
  return responseWithCookies(Response.redirect(authorizationUrl, 302), [
    cookie(GMAIL_OAUTH_COOKIE, transaction, GMAIL_OAUTH_TTL_SECONDS),
  ]);
}

function decodeTransaction(request: Request, returnedState: string | null) {
  const rawTransaction = readCookie(request, GMAIL_OAUTH_COOKIE);
  if (!returnedState || !rawTransaction) {
    throw new Error("The Gmail OAuth response is incomplete.");
  }

  let transaction: { state?: unknown; verifier?: unknown; userId?: unknown };
  try {
    transaction = JSON.parse(Buffer.from(rawTransaction, "base64url").toString("utf8"));
  } catch {
    throw new Error("The Gmail OAuth transaction is invalid.");
  }
  if (
    typeof transaction.state !== "string" ||
    typeof transaction.verifier !== "string" ||
    typeof transaction.userId !== "string" ||
    !safeEqual(returnedState, transaction.state)
  ) {
    throw new Error("The Gmail OAuth state check failed.");
  }
  return { verifier: transaction.verifier, userId: transaction.userId };
}

async function fetchGmailTokens(request: Request, verifier: string): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = gmailRedirectUri();
  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: new URL(request.url).searchParams.get("code") ?? "",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) throw new Error("Google rejected the Gmail authorization code.");
  const tokens = parseGoogleTokens(await tokenResponse.json());
  if (tokens.scope && !tokens.scope.split(/\s+/).includes(GMAIL_READ_SCOPE)) {
    throw new Error("Google did not grant the required Gmail read-only permission.");
  }
  return tokens;
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch(GOOGLE_PROFILE_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Google profile lookup failed.");
  const profile = (await response.json()) as GoogleProfile;
  if (
    typeof profile.sub !== "string" ||
    typeof profile.email !== "string" ||
    profile.email_verified !== true
  ) {
    throw new Error("Google did not return a verified Gmail account identity.");
  }
  return { providerUserId: profile.sub, address: profile.email.trim().toLowerCase() };
}

async function completeGmailOAuth(request: Request): Promise<Response> {
  const user = await getCurrentUser(request);
  if (!user) {
    return responseWithCookies(
      Response.redirect(new URL("/login?error=auth_required", appUrl()), 302),
      [expiredCookie(GMAIL_OAUTH_COOKIE)],
    );
  }
  const code = new URL(request.url).searchParams.get("code");
  const transaction = decodeTransaction(request, new URL(request.url).searchParams.get("state"));
  if (!safeEqual(user.id, transaction.userId)) {
    throw new Error("The Gmail OAuth session changed during authorization.");
  }
  if (!code) throw new Error("Google did not return a Gmail authorization code.");

  const tokens = await fetchGmailTokens(request, transaction.verifier);
  const profile = await fetchGoogleProfile(tokens.access_token);
  const db = getDatabase();
  const existing = await db
    .select({
      refreshTokenEncrypted: mailAccounts.refreshTokenEncrypted,
    })
    .from(mailAccounts)
    .where(
      and(
        eq(mailAccounts.userId, user.id),
        eq(mailAccounts.provider, "gmail"),
        eq(mailAccounts.providerUserId, profile.providerUserId),
      ),
    )
    .limit(1);
  const refreshToken =
    typeof tokens.refresh_token === "string"
      ? tokens.refresh_token
      : existing[0]?.refreshTokenEncrypted
        ? decryptToken(existing[0].refreshTokenEncrypted)
        : null;
  if (!refreshToken) {
    throw new Error("Google did not issue a refresh token. Revoke app access and reconnect Gmail.");
  }

  const grantedScopes =
    typeof tokens.scope === "string"
      ? tokens.scope.split(/\s+/).filter(Boolean)
      : ["openid", "email", "profile", GMAIL_READ_SCOPE];
  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
  await db
    .insert(mailAccounts)
    .values({
      userId: user.id,
      provider: "gmail",
      providerUserId: profile.providerUserId,
      address: profile.address,
      accessTokenEncrypted: encryptToken(tokens.access_token),
      refreshTokenEncrypted: encryptToken(refreshToken),
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: grantedScopes,
      status: "connected",
    })
    .onConflictDoUpdate({
      target: [mailAccounts.userId, mailAccounts.provider, mailAccounts.providerUserId],
      set: {
        address: profile.address,
        accessTokenEncrypted: encryptToken(tokens.access_token),
        refreshTokenEncrypted: encryptToken(refreshToken),
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        scopes: grantedScopes,
        status: "connected",
      },
    });

  return responseWithCookies(
    Response.redirect(new URL("/app/emails?gmail=connected", appUrl()), 302),
    [expiredCookie(GMAIL_OAUTH_COOKIE)],
  );
}

async function getGmailAccounts(request: Request): Promise<Response> {
  const user = await getCurrentUser(request);
  if (!user) return json({ error: "Authentification requise." }, 401);
  const rows = await getDatabase()
    .select({
      id: mailAccounts.id,
      address: mailAccounts.address,
      scopes: mailAccounts.scopes,
      status: mailAccounts.status,
    })
    .from(mailAccounts)
    .where(and(eq(mailAccounts.userId, user.id), eq(mailAccounts.provider, "gmail")));
  return json({ accounts: rows });
}

async function revokeGmailAccount(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return json({ error: "Origine de requête invalide." }, 403);
  const user = await getCurrentUser(request);
  if (!user) return json({ error: "Authentification requise." }, 401);
  const accountId = new URL(request.url).searchParams.get("accountId");
  if (!accountId || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(accountId)) {
    return json({ error: "Identifiant de compte Gmail invalide." }, 400);
  }

  const db = getDatabase();
  const account = await db
    .select({
      id: mailAccounts.id,
      accessTokenEncrypted: mailAccounts.accessTokenEncrypted,
      refreshTokenEncrypted: mailAccounts.refreshTokenEncrypted,
    })
    .from(mailAccounts)
    .where(
      and(
        eq(mailAccounts.id, accountId),
        eq(mailAccounts.userId, user.id),
        eq(mailAccounts.provider, "gmail"),
      ),
    )
    .limit(1);
  const found = account[0];
  if (!found) return json({ error: "Compte Gmail introuvable." }, 404);

  const encryptedToken = found.refreshTokenEncrypted ?? found.accessTokenEncrypted;
  if (encryptedToken) {
    let response: Response;
    try {
      response = await fetch(GOOGLE_REVOKE_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: decryptToken(encryptedToken) }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return json(
        { error: "Google n’a pas pu être contacté pour révoquer l’accès. Réessayez." },
        502,
      );
    }
    if (!response.ok) {
      return json({ error: "Google n’a pas confirmé la révocation. Réessayez." }, 502);
    }
  }

  await db
    .delete(mailAccounts)
    .where(and(eq(mailAccounts.id, found.id), eq(mailAccounts.userId, user.id)));
  return json({ ok: true });
}

async function getAccessToken(account: {
  id: string;
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
}): Promise<string> {
  if (
    account.accessTokenEncrypted &&
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() > Date.now() + 60_000
  ) {
    return decryptToken(account.accessTokenEncrypted);
  }
  if (!account.refreshTokenEncrypted) {
    throw new Error("The Gmail account has no refresh token.");
  }

  const { clientId, clientSecret } = gmailRedirectUri();
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptToken(account.refreshTokenEncrypted),
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    await getDatabase()
      .update(mailAccounts)
      .set({ status: "reauth_required" })
      .where(eq(mailAccounts.id, account.id));
    throw new Error("Google rejected the Gmail refresh token.");
  }
  const tokens = parseGoogleTokens(await response.json());
  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
  const updates = {
    accessTokenEncrypted: encryptToken(tokens.access_token),
    tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
    ...(typeof tokens.refresh_token === "string"
      ? { refreshTokenEncrypted: encryptToken(tokens.refresh_token) }
      : {}),
  };
  await getDatabase().update(mailAccounts).set(updates).where(eq(mailAccounts.id, account.id));
  return tokens.access_token;
}

function headerValue(message: GmailMessage, headerName: string): string {
  const headers = message.payload?.headers ?? [];
  const header = headers.find(
    (item) => typeof item.name === "string" && item.name.toLowerCase() === headerName.toLowerCase(),
  );
  return typeof header?.value === "string" ? header.value : "";
}

function parseAddress(value: string) {
  const match = value.match(/^(.*?)\s*<([^<>]+)>$/);
  if (!match) return { email: value.trim() };
  return {
    name: match[1]!.trim().replace(/^["']|["']$/g, "") || undefined,
    email: match[2]!.trim(),
  };
}

async function fetchGmailMessages(request: Request): Promise<Response> {
  const user = await getCurrentUser(request);
  if (!user) return json({ error: "Authentification requise." }, 401);
  const query = new URL(request.url).searchParams;
  const requestedAccountId = query.get("accountId");
  if (
    requestedAccountId &&
    !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(requestedAccountId)
  ) {
    return json({ error: "Identifiant de compte Gmail invalide." }, 400);
  }
  const db = getDatabase();
  const accountConditions = [
    eq(mailAccounts.userId, user.id),
    eq(mailAccounts.provider, "gmail"),
    eq(mailAccounts.status, "connected"),
  ];
  if (requestedAccountId) accountConditions.push(eq(mailAccounts.id, requestedAccountId));
  const account = await db
    .select({
      id: mailAccounts.id,
      address: mailAccounts.address,
      accessTokenEncrypted: mailAccounts.accessTokenEncrypted,
      refreshTokenEncrypted: mailAccounts.refreshTokenEncrypted,
      tokenExpiresAt: mailAccounts.tokenExpiresAt,
    })
    .from(mailAccounts)
    .where(and(...accountConditions))
    .limit(1);
  const selectedAccount = account[0];
  if (!selectedAccount) return json({ error: "Aucun compte Gmail connecté." }, 404);

  let accessToken: string;
  try {
    accessToken = await getAccessToken(selectedAccount);
  } catch (error) {
    const isRefreshError =
      error instanceof Error && error.message === "Google rejected the Gmail refresh token.";
    return json(
      {
        error: isRefreshError
          ? "L’autorisation Gmail a expiré. Reconnectez le compte dans les intégrations."
          : "Impossible de renouveler l’accès Gmail.",
      },
      isRefreshError ? 401 : 502,
    );
  }

  const requestedMessageId = query.get("messageId");
  if (requestedMessageId) {
    if (!/^[\w-]+$/.test(requestedMessageId)) {
      return json({ error: "Identifiant de message invalide." }, 400);
    }
    return fetchGmailMessageDetails(selectedAccount.id, requestedMessageId, accessToken);
  }

  const q = query.get("q") || "in:inbox";
  const rawMax = Number(query.get("maxResults") ?? "25");
  const maxResults = Number.isFinite(rawMax)
    ? Math.min(Math.max(Math.trunc(rawMax), 1), 50)
    : 25;

  const listUrl = new URL(`${GMAIL_API_ENDPOINT}/messages`);
  listUrl.search = new URLSearchParams({
    maxResults: String(maxResults),
    q,
  }).toString();
  let listResponse: Response;
  try {
    listResponse = await fetch(listUrl, {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return json({ error: "Google n’a pas pu être contacté pour lire la boîte Gmail." }, 502);
  }
  if (listResponse.status === 401) {
    await db
      .update(mailAccounts)
      .set({ status: "reauth_required" })
      .where(eq(mailAccounts.id, selectedAccount.id));
    return json(
      { error: "L’autorisation Gmail a expiré. Reconnectez le compte dans les intégrations." },
      401,
    );
  }
  if (!listResponse.ok) {
    return json({ error: "Impossible de lire la boîte Gmail." }, 502);
  }
  const listed = (await listResponse.json()) as {
    messages?: Array<{ id?: unknown }>;
    resultSizeEstimate?: number;
  };
  const ids = (listed.messages ?? [])
    .map((message) => message.id)
    .filter((id): id is string => typeof id === "string");
  let messages: EmailRecord[];
  try {
    messages = await Promise.all(
      ids.map(async (id) => {
        const detailUrl = new URL(`${GMAIL_API_ENDPOINT}/messages/${encodeURIComponent(id)}`);
        const params = new URLSearchParams({ format: "metadata" });
        for (const header of ["From", "To", "Subject", "Date"]) {
          params.append("metadataHeaders", header);
        }
        detailUrl.search = params.toString();
        const response = await fetch(detailUrl, {
          headers: { authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error("A Gmail message could not be loaded.");
        const message = (await response.json()) as GmailMessage;
        const labelIds = Array.isArray(message.labelIds)
          ? message.labelIds.filter((label): label is string => typeof label === "string")
          : [];
        const date = Number(message.internalDate);
        return {
          id,
          threadId: typeof message.threadId === "string" ? message.threadId : id,
          accountId: selectedAccount.id,
          from: parseAddress(headerValue(message, "From")),
          to: [parseAddress(headerValue(message, "To"))].filter((address) => address.email),
          subject: headerValue(message, "Subject") || "(Sans objet)",
          preview: typeof message.snippet === "string" ? message.snippet : "",
          body: typeof message.snippet === "string" ? message.snippet : "",
          date: Number.isFinite(date) ? new Date(date).toISOString() : new Date().toISOString(),
          unread: labelIds.includes("UNREAD"),
          status: "opened" as const,
          folder: "inbox" as const,
          labels: labelIds,
        };
      }),
    );
  } catch {
    return json({ error: "Impossible de charger la liste des messages Gmail." }, 502);
  }
  return json({
    account: { id: selectedAccount.id, address: selectedAccount.address },
    messages,
    resultSizeEstimate: listed.resultSizeEstimate ?? messages.length,
  });
}

function plainTextBody(part: GmailMessage["payload"]): string | null {
  if (!part) return null;
  const mimeType = typeof part.mimeType === "string" ? part.mimeType.toLowerCase() : "";
  if (mimeType === "text/plain" && typeof part.body?.data === "string") {
    return Buffer.from(part.body.data, "base64url").toString("utf8");
  }
  for (const child of part.parts ?? []) {
    const text = plainTextBody(child);
    if (text) return text;
  }
  if (mimeType === "text/html" && typeof part.body?.data === "string") {
    return Buffer.from(part.body.data, "base64url")
      .toString("utf8")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:div|p|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }
  return null;
}

async function fetchGmailMessageDetails(
  accountId: string,
  messageId: string,
  accessToken: string,
): Promise<Response> {
  const url = new URL(`${GMAIL_API_ENDPOINT}/messages/${encodeURIComponent(messageId)}`);
  url.searchParams.set("format", "full");
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return json({ error: "Message Gmail introuvable." }, 404);
  if (!response.ok) return json({ error: "Impossible de lire ce message Gmail." }, 502);
  const message = (await response.json()) as GmailMessage;
  if (typeof message.id !== "string") return json({ error: "Message Gmail invalide." }, 502);
  const body = plainTextBody(message.payload);
  return json({
    message: {
      id: message.id,
      threadId: typeof message.threadId === "string" ? message.threadId : message.id,
      accountId,
      from: parseAddress(headerValue(message, "From")),
      to: [parseAddress(headerValue(message, "To"))].filter((address) => address.email),
      subject: headerValue(message, "Subject") || "(Sans objet)",
      preview: typeof message.snippet === "string" ? message.snippet : "",
      body: body || (typeof message.snippet === "string" ? message.snippet : ""),
      date: Number.isFinite(Number(message.internalDate))
        ? new Date(Number(message.internalDate)).toISOString()
        : new Date().toISOString(),
      unread:
        Array.isArray(message.labelIds) && message.labelIds.some((label) => label === "UNREAD"),
      status: "opened" as const,
      folder: "inbox" as const,
      labels: Array.isArray(message.labelIds)
        ? message.labelIds.filter((label): label is string => typeof label === "string")
        : [],
    },
  });
}

export async function handleGmailRequest(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (pathname === "/auth/gmail" && request.method === "GET") {
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.redirect(new URL("/login?error=auth_required", appUrl()), 302);
    }
    try {
      return beginGmailOAuth(user.id);
    } catch (error) {
      console.error(
        "Gmail OAuth start failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      return Response.redirect(new URL("/app/emails?gmail=connect_error", appUrl()), 302);
    }
  }

  if (pathname === "/auth/gmail/callback" && request.method === "GET") {
    if (new URL(request.url).searchParams.has("error")) {
      return responseWithCookies(
        Response.redirect(new URL("/app/emails?gmail=denied", appUrl()), 302),
        [expiredCookie(GMAIL_OAUTH_COOKIE)],
      );
    }
    try {
      return await completeGmailOAuth(request);
    } catch (error) {
      console.error(
        "Gmail OAuth callback failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      return responseWithCookies(
        Response.redirect(new URL("/app/emails?gmail=connect_error", appUrl()), 302),
        [expiredCookie(GMAIL_OAUTH_COOKIE)],
      );
    }
  }

  if (pathname === "/api/mail/accounts" && request.method === "GET") {
    return getGmailAccounts(request);
  }
  if (pathname === "/api/mail/accounts" && request.method === "DELETE") {
    return revokeGmailAccount(request);
  }
  if (pathname === "/api/mail/messages" && request.method === "GET") {
    return fetchGmailMessages(request);
  }
  return null;
}
