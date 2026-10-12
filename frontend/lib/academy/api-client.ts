/**
 * Client HTTP bas niveau de l'API Academy.
 *
 * Le composant Server (Go) expose les routes sous /api/v1 et attend un
 * en-tête X-Learner-ID (fallback "default" en dev). En prod, l'absence
 * d'en-tête renvoie 401.
 *
 * L'URL de base est configurable via la variable d'environnement
 * `VITE_API_BASE_URL`. Par défaut : "/api/v1" (proxy ou même origine).
 *
 * En dev, si le backend tourne sur :8080 et Vite sur :3000, définir :
 *   VITE_API_BASE_URL=http://localhost:8080/api/v1
 * ou configurer un proxy Vite.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/* ─── Learner ID ─────────────────────────────────────────────────────── */

/**
 * Identifiant du Learner courant. En V1 mono-utilisateur, on utilise
 * "default" côté backend. Le setter permettra de brancher l'auth 2.0
 * plus tard sans toucher aux handlers.
 */
let currentLearnerId: string = "default";

export function setLearnerId(id: string | null): void {
  currentLearnerId = id && id.trim() !== "" ? id : "default";
}

export function getLearnerId(): string {
  return currentLearnerId;
}

/* ─── URL base ───────────────────────────────────────────────────────── */

function resolveBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.replace(/\/+$/, "");
  }
  return "/api/v1";
}

const API_BASE = resolveBaseUrl();

/* ─── Request ────────────────────────────────────────────────────────── */

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Si true, on n'ajoute pas X-Learner-ID (routes publiques). */
  publicRoute?: boolean;
};

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(
    API_BASE + path,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (!options.publicRoute) headers["X-Learner-ID"] = currentLearnerId;

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  // 204 No Content → pas de body.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text.length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      // Body non-JSON : on laisse data à null, on traitera comme erreur
      // générique si le status est en erreur.
    }
  }

  if (!response.ok) {
    const errObj = (data ?? {}) as {
      error?: unknown;
      message?: unknown;
      fields?: unknown;
    };
    const code =
      typeof errObj.error === "string" ? errObj.error : `http_${response.status}`;
    const message =
      typeof errObj.message === "string"
        ? errObj.message
        : `HTTP ${response.status}`;
    const fields =
      errObj.fields && typeof errObj.fields === "object"
        ? (errObj.fields as Record<string, string>)
        : undefined;
    throw new ApiError(response.status, code, message, fields);
  }

  return data as T;
}