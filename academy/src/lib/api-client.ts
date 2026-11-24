// academy/src/lib/api-client.ts

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
const API_BASE = env.VITE_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  learnerId?: string;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.learnerId) {
    headers["X-Learner-ID"] = options.learnerId;
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      try {
        body = await res.text();
      } catch {
      }
    }
    const message =
      (typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as { message?: unknown }).message === "string"
        ? String((body as { message: string }).message)
        : undefined) ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  curriculum: () => apiFetch<unknown>("/curriculum"),
  me: () => apiFetch<unknown>("/me"),
  snapshot: () => apiFetch<unknown>("/me/snapshot"),
  quests: () => apiFetch<unknown>("/quests"),
  srsQueue: () => apiFetch<unknown>("/srs/queue"),
  srsStats: () => apiFetch<unknown>("/srs/stats"),
  avatars: () => apiFetch<unknown>("/avatars"),
  recommendation: () => apiFetch<unknown>("/me/recommendation"),
};
