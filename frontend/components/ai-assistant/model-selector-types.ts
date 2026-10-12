//frontend\components\ai-assistant\model-selector-types.ts
export type AiBrand =
  "claude" | "gemini" | "chatgpt" | "perplexity" | "deepseek" | "mistral" | "groq";

export type AiRole = "research" | "work";

export type ApiProvider =
  "anthropic" | "openai" | "google" | "perplexity" | "deepseek" | "mistral" | "groq";

export interface AiBrandInfo {
  id: AiBrand;

  name: string;

  providerLabel: string;

  providerKey: ApiProvider;
  description: string;

  roles: AiRole[];

  included: boolean;
}

export const AI_BRANDS: AiBrandInfo[] = [
  {
    id: "claude",
    name: "Claude",
    providerLabel: "Anthropic",
    providerKey: "anthropic",
    description: "Excellente rédaction, raisonnement nuancé et analyse fine.",
    roles: ["research", "work"],
    included: true,
  },
  {
    id: "gemini",
    name: "Gemini",
    providerLabel: "Google",
    providerKey: "google",
    description: "Polyvalent, rapide, avec une grande fenêtre de contexte.",
    roles: ["research", "work"],
    included: true,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    providerLabel: "OpenAI",
    providerKey: "openai",
    description: "Référence généraliste, robuste sur tous les sujets.",
    roles: ["research", "work"],
    included: true,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    providerLabel: "Perplexity",
    providerKey: "perplexity",
    description: "Recherche web augmentée avec citations de sources.",
    roles: ["research"],
    included: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    providerLabel: "DeepSeek",
    providerKey: "deepseek",
    description: "Raisonnement structuré et analytique.",
    roles: ["research", "work"],
    included: false,
  },
  {
    id: "mistral",
    name: "Mistral",
    providerLabel: "Mistral",
    providerKey: "mistral",
    description: "Modèles européens rapides et efficaces.",
    roles: ["research", "work"],
    included: false,
  },
  {
    id: "groq",
    name: "Groq",
    providerLabel: "Groq",
    providerKey: "groq",
    description: "Inférence ultra-rapide pour les tâches courtes.",
    roles: ["research", "work"],
    included: false,
  },
];

export function getBrand(id: AiBrand): AiBrandInfo {
  return AI_BRANDS.find((b) => b.id === id) ?? AI_BRANDS[0]!;
}

export function brandsForRole(role: AiRole, mode: SelectionType): AiBrandInfo[] {
  return AI_BRANDS.filter((b) => {
    if (!b.roles.includes(role)) return false;
    if (mode === "app") return b.included;
    return true;
  });
}

export function getProviderLabel(provider: ApiProvider): string {
  const found = AI_BRANDS.find((b) => b.providerKey === provider);
  return found?.providerLabel ?? provider;
}

export interface TeamConfig {
  research: AiBrand;

  work: AiBrand;
}

export type SelectionType = "app" | "user-key";

export interface StoredApiKey {
  id: string;
  provider: ApiProvider;
  apiKey: string;

  label?: string;
}

export interface UserApiKeyConfig {
  provider: ApiProvider;
  apiKey: string;
}

export interface ModelConfig {
  type: SelectionType;
  team: TeamConfig;

  userApiKeyConfig?: UserApiKeyConfig;
}

export const DEFAULT_TEAM: TeamConfig = {
  research: "gemini",
  work: "claude",
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  type: "app",
  team: DEFAULT_TEAM,
};

export const MODEL_STORAGE_KEY = "leadcortex_model_config";
export const API_KEYS_STORAGE_KEY = "leadcortex_api_keys";

export function loadApiKeys(): StoredApiKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredApiKey[]) : [];
  } catch {
    return [];
  }
}

export function saveApiKeys(keys: StoredApiKey[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* Intentionally ignored. */
  }
}

/** Garde-fou : la valeur stockée doit ressembler au nouveau format. */
export function isModelConfig(value: unknown): value is ModelConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<ModelConfig>;
  return (
    (v.type === "app" || v.type === "user-key") &&
    !!v.team &&
    typeof v.team === "object" &&
    typeof (v.team as TeamConfig).research === "string" &&
    typeof (v.team as TeamConfig).work === "string"
  );
}
