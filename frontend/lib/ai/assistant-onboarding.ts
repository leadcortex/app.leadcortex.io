// frontend/lib/ai/assistant-onboarding.ts

const STORAGE_KEY = "lc.assistant.onboarding.v1";

export type OnboardingState = {
  welcomeSeen: boolean;
  searchHintSeen: boolean;
  dragHintSeen: boolean;
};

const DEFAULTS: OnboardingState = {
  welcomeSeen: false,
  searchHintSeen: false,
  dragHintSeen: false,
};

export function loadOnboarding(): OnboardingState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...(parsed as Partial<OnboardingState>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveOnboarding(patch: Partial<OnboardingState>): OnboardingState {
  const next = { ...loadOnboarding(), ...patch };
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
  }
  return next;
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
