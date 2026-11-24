// src/server/auth/auth.server.ts

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";

import { getBetterAuth } from "./better-auth.server";
import { authIdentities, sessions, users } from "../db/auth-schema";
import { getDatabase } from "../db/database.server";

const SESSION_COOKIE = "lc_session";
const OAUTH_COOKIE = "lc_google_oauth_tx";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEVELOPMENT_SESSION_PREFIX = "dev.";
const OAUTH_TTL_SECONDS = 60 * 10;
const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const DEVELOPMENT_USER: PublicUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Compte de test",
  firstName: "Compte",
  lastName: "de test",
  email: "developer@localhost.invalid",
  avatarUrl: null,
  plan: "free",
};

export type PublicUser = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
};

const publicUserColumns = {
  id: users.id,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  fullName: users.fullName,
  avatarUrl: users.avatarUrl,
  plan: users.plan,
};

type PublicUserRecord = Pick<
  typeof users.$inferSelect,
  "id" | "email" | "firstName" | "lastName" | "fullName" | "avatarUrl" | "plan"
>;

type GoogleProfile = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
  picture?: unknown;
};

type GoogleTokens = {
  access_token?: unknown;
  token_type?: unknown;
};

export function appUrl(): URL {
  const value = process.env.APP_URL;
  if (!value) throw new Error("APP_URL is required.");
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_URL must contain only the application origin.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  return url;
}

function isSecureCookie(): boolean {
  return appUrl().protocol === "https:";
}

function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }
  return value;
}

export function googleOAuthConfiguration(options?: {
  redirectEnv?: string;
  redirectPath?: string;
}) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const redirectPath = options?.redirectPath ?? "/auth/google/callback";
  const redirectUri = new URL(
    process.env[options?.redirectEnv ?? "GOOGLE_REDIRECT_URI"] ?? redirectPath,
    appUrl(),
  );
  if (
    redirectUri.origin !== appUrl().origin ||
    redirectUri.pathname !== redirectPath ||
    redirectUri.search ||
    redirectUri.hash
  ) {
    throw new Error(
      `${options?.redirectEnv ?? "GOOGLE_REDIRECT_URI"} must be the same-origin callback URL.`,
    );
  }

  return { clientId, clientSecret, redirectUri: redirectUri.toString() };
}

export function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function cookie(name: string, value: string, maxAge: number): string {
  const secure = isSecureCookie() ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function expiredCookie(name: string): string {
  const secure = isSecureCookie() ? "; Secure" : "";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function sessionTokenHash(token: string): string {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

function developmentSessionToken(): string {
  const payload = `${Date.now()}.${randomBytes(32).toString("base64url")}`;
  const signature = createHmac("sha256", sessionSecret())
    .update(`${DEVELOPMENT_SESSION_PREFIX}${payload}`)
    .digest("base64url");
  return `${DEVELOPMENT_SESSION_PREFIX}${payload}.${signature}`;
}

function isDevelopmentSessionToken(token: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const [prefix, issuedAtValue, nonce, signature, ...rest] = token.split(".");
  if (
    prefix !== "dev" ||
    !issuedAtValue ||
    !/^\d{13}$/.test(issuedAtValue) ||
    !nonce ||
    !signature ||
    rest.length > 0
  ) {
    return false;
  }

  const issuedAt = Number(issuedAtValue);
  const now = Date.now();
  if (issuedAt > now + 60_000 || now - issuedAt > SESSION_TTL_SECONDS * 1000) return false;

  const payload = `${issuedAtValue}.${nonce}`;
  const expected = createHmac("sha256", sessionSecret())
    .update(`${DEVELOPMENT_SESSION_PREFIX}${payload}`)
    .digest("base64url");
  return safeEqual(signature, expected);
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function errorResponse(message: string, status: number): Response {
  return json({ error: message }, status);
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === appUrl().origin;
  } catch {
    return false;
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;

  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function publicUser(user: PublicUserRecord): PublicUser {
  return {
    id: user.id,
    name: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
  };
}

export function responseWithCookies(response: Response, cookies: string[]): Response {
  const headers = new Headers(response.headers);
  for (const value of cookies) headers.append("Set-Cookie", value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clearOAuthCookie(): string {
  return expiredCookie(OAUTH_COOKIE);
}

export async function getCurrentUser(request: Request): Promise<PublicUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (token && isDevelopmentSessionToken(token)) return DEVELOPMENT_USER;

  if (token) {
    const rows = await getDatabase()
      .select({ user: publicUserColumns })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(eq(sessions.tokenHash, sessionTokenHash(token)), gt(sessions.expiresAt, new Date())),
      )
      .limit(1);
    if (rows[0]) return publicUser(rows[0].user);
  }

  if (process.env.BETTER_AUTH_ENABLED !== "true") return null;

  const session = await getBetterAuth().api.getSession({ headers: request.headers });
  if (!session) return null;

  const rows = await getDatabase()
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return rows[0] ? publicUser(rows[0]) : null;
}

async function beginDevelopmentSession(): Promise<Response> {
  if (process.env.NODE_ENV !== "development") {
    return errorResponse("Route introuvable.", 404);
  }

  const token = developmentSessionToken();
  return responseWithCookies(Response.redirect(new URL("/app", appUrl()), 302), [
    cookie(SESSION_COOKIE, token, SESSION_TTL_SECONDS),
  ]);
}

async function beginGoogleOAuth(): Promise<Response> {
  const { clientId, redirectUri } = googleOAuthConfiguration();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  }).toString();

  const transaction = Buffer.from(JSON.stringify({ state, verifier })).toString("base64url");
  return responseWithCookies(Response.redirect(authorizationUrl, 302), [
    cookie(OAUTH_COOKIE, transaction, OAUTH_TTL_SECONDS),
  ]);
}

async function fetchGoogleProfile(
  request: Request,
): Promise<GoogleProfile & { sub: string; email: string }> {
  const { clientId, clientSecret, redirectUri } = googleOAuthConfiguration();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const rawTransaction = readCookie(request, OAUTH_COOKIE);
  if (!code || !returnedState || !rawTransaction) {
    throw new Error("The Google OAuth response is incomplete.");
  }

  let transaction: { state?: unknown; verifier?: unknown };
  try {
    transaction = JSON.parse(Buffer.from(rawTransaction, "base64url").toString("utf8"));
  } catch {
    throw new Error("The Google OAuth transaction is invalid.");
  }
  if (
    typeof transaction.state !== "string" ||
    typeof transaction.verifier !== "string" ||
    !safeEqual(returnedState, transaction.state)
  ) {
    throw new Error("The Google OAuth state check failed.");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: transaction.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) throw new Error("Google rejected the authorization code.");
  const tokens = (await tokenResponse.json()) as GoogleTokens;
  if (typeof tokens.access_token !== "string" || tokens.token_type !== "Bearer") {
    throw new Error("Google returned an invalid access token response.");
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!profileResponse.ok) throw new Error("Google profile lookup failed.");
  const profile = (await profileResponse.json()) as GoogleProfile;
  if (
    typeof profile.sub !== "string" ||
    typeof profile.email !== "string" ||
    profile.email_verified !== true
  ) {
    throw new Error("Google did not return a verified account identity.");
  }

  return { ...profile, sub: profile.sub, email: profile.email };
}

type GoogleOAuthCallbackStage =
  | "google_profile"
  | "database_connection"
  | "database_identity_lookup"
  | "database_email_lookup"
  | "database_user_create"
  | "database_identity_create"
  | "database_user_update"
  | "database_session_create";

async function completeGoogleOAuth(
  request: Request,
  setStage: (stage: GoogleOAuthCallbackStage) => void,
): Promise<Response> {
  const profile = await fetchGoogleProfile(request);
  const email = profile.email.trim().toLowerCase();
  const firstName = typeof profile.given_name === "string" ? profile.given_name : null;
  const lastName = typeof profile.family_name === "string" ? profile.family_name : null;
  const fullName =
    typeof profile.name === "string"
      ? profile.name
      : [firstName, lastName].filter(Boolean).join(" ") || null;
  const avatarUrl = typeof profile.picture === "string" ? profile.picture : null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const db = getDatabase();

  setStage("database_connection");
  const isNewUser = await db.transaction(async (tx) => {
    setStage("database_identity_lookup");
    const identityRows = await tx
      .select({ id: users.id })
      .from(authIdentities)
      .innerJoin(users, eq(authIdentities.userId, users.id))
      .where(
        and(eq(authIdentities.provider, "google"), eq(authIdentities.providerUserId, profile.sub)),
      )
      .limit(1);

    let userId = identityRows[0]?.id;
    let created = false;
    if (!userId) {
      setStage("database_email_lookup");
      const existingEmail = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existingEmail.length) {
        throw new Error("An account already uses this email; sign in with its linked provider.");
      }

      setStage("database_user_create");
      const inserted = await tx
        .insert(users)
        .values({ email, firstName, lastName, fullName, avatarUrl, lastLoginAt: new Date() })
        .returning({ id: users.id });
      userId = inserted[0]?.id;
      if (!userId) throw new Error("The user account could not be created.");
      setStage("database_identity_create");
      await tx.insert(authIdentities).values({
        userId,
        provider: "google",
        providerUserId: profile.sub,
        email,
      });
      created = true;
    } else {
      setStage("database_user_update");
      const updated = await tx
        .update(users)
        .set({ email, firstName, lastName, fullName, avatarUrl, lastLoginAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      if (!updated[0]) throw new Error("The user profile could not be updated.");
    }

    setStage("database_session_create");
    await tx.insert(sessions).values({
      userId,
      tokenHash: sessionTokenHash(token),
      expiresAt,
      userAgent,
    });
    return created;
  });

  const destination = new URL(isNewUser ? "/onboarding" : "/app", appUrl());
  const response = Response.redirect(destination, 302);
  return responseWithCookies(response, [
    clearOAuthCookie(),
    cookie(SESSION_COOKIE, token, SESSION_TTL_SECONDS),
  ]);
}

async function handleMe(request: Request): Promise<Response> {
  if (request.method === "GET") {
    const user = await getCurrentUser(request);
    return user ? json({ user }) : errorResponse("Authentification requise.", 401);
  }

  if (request.method === "PATCH") {
    if (!isSameOriginRequest(request)) return errorResponse("Origine de requête invalide.", 403);
    const user = await getCurrentUser(request);
    if (!user) return errorResponse("Authentification requise.", 401);

    const rawBody = await readLimitedBody(request, 4_096);
    if (rawBody === null) {
      return errorResponse("La requête est trop volumineuse.", 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse("Le corps JSON est invalide.", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("Le profil fourni est invalide.", 400);
    }

    const input = body as Record<string, unknown>;
    if (
      (input.firstName !== undefined &&
        (typeof input.firstName !== "string" || input.firstName.length > 100)) ||
      (input.lastName !== undefined &&
        (typeof input.lastName !== "string" || input.lastName.length > 100))
    ) {
      return errorResponse("Le nom fourni est invalide.", 422);
    }

    const firstName =
      typeof input.firstName === "string" ? input.firstName.trim() || null : user.firstName;
    const lastName =
      typeof input.lastName === "string" ? input.lastName.trim() || null : user.lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
    const profileUpdate =
      process.env.BETTER_AUTH_ENABLED === "true"
        ? { firstName, lastName, fullName, updatedAt: new Date() }
        : { firstName, lastName, fullName };
    const updated = await getDatabase()
      .update(users)
      .set(profileUpdate)
      .where(eq(users.id, user.id))
      .returning(publicUserColumns);
    if (!updated[0]) return errorResponse("Profil introuvable.", 404);
    return json({ user: publicUser(updated[0]) });
  }

  return errorResponse("Méthode non autorisée.", 405);
}

async function logout(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) return errorResponse("Origine de requête invalide.", 403);
  const token = readCookie(request, SESSION_COOKIE);
  const isDevelopmentSession = token !== null && isDevelopmentSessionToken(token);
  if (token && !isDevelopmentSession) {
    await getDatabase()
      .delete(sessions)
      .where(eq(sessions.tokenHash, sessionTokenHash(token)));
  }

  if (!isDevelopmentSession && process.env.BETTER_AUTH_ENABLED === "true") {
    const signOutRequest = new Request(new URL("/api/auth/sign-out", request.url), {
      method: "POST",
      headers: request.headers,
    });
    const response = await getBetterAuth().handler(signOutRequest);
    return responseWithCookies(response, [expiredCookie(SESSION_COOKIE)]);
  }

  return responseWithCookies(json({ ok: true }), [expiredCookie(SESSION_COOKIE)]);
}

export async function handleAuthRequest(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);

  if (pathname === "/auth/dev-login" && request.method === "GET") {
    return beginDevelopmentSession();
  }

  if (pathname === "/auth/google" && request.method === "GET") {
    try {
      return await beginGoogleOAuth();
    } catch {
      try {
        return Response.redirect(new URL("/login?error=google_not_configured", appUrl()), 302);
      } catch {
      }
      return errorResponse(
        "La connexion Google n’est pas configurée. Vérifiez les variables serveur requises.",
        503,
      );
    }
  }

  if (pathname === "/auth/google/callback" && request.method === "GET") {
    if (new URL(request.url).searchParams.has("error")) {
      return responseWithCookies(
        Response.redirect(new URL("/login?error=google_denied", appUrl()), 302),
        [clearOAuthCookie()],
      );
    }
    let stage: GoogleOAuthCallbackStage = "google_profile";
    try {
      return await completeGoogleOAuth(request, (nextStage) => {
        stage = nextStage;
      });
    } catch (error) {
      const databaseErrorCode =
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof error.code === "string" &&
        /^[A-Z0-9_]{2,10}$/.test(error.code)
          ? error.code
          : undefined;
      console.error(
        "Google OAuth callback failed",
        stage,
        error instanceof Error ? error.name : "UnknownError",
        databaseErrorCode,
      );
      const reason =
        error instanceof Error && error.message.includes("already uses this email")
          ? "account_exists"
          : stage.startsWith("database_")
            ? "database_unavailable"
            : "google_failed";
      return responseWithCookies(
        Response.redirect(new URL(`/login?error=${reason}`, appUrl()), 302),
        [clearOAuthCookie()],
      );
    }
  }

  if (pathname === "/api/me") return handleMe(request);
  if (pathname === "/auth/logout" && request.method === "POST") return logout(request);
  return null;
}
