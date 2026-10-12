//frontend\lib\assistant-onboarding.ts
/**
 * Suivi « première visite » de l'assistant.
 *
 * Objectif : afficher des indices contextuels à la première ouverture, puis
 * ne plus jamais les montrer — sans harceler l'utilisateur. Aucun stockage
 * serveur : tout est local.
 *
 * Trois drapeaux indépendants :
 *  - `welcomeSeen`   : l'écran d'accueil de l'assistant a été affiché au
 *    moins une fois.
 *  - `searchHintSeen`: l'indice « Ctrl+F pour rechercher » a déjà été
 *    montré (après le 3ᵉ message).
 *  - `dragHintSeen`  : l'indice « glisser un fichier » a déjà été montré
 *    (après un dépôt réussi, ou une fois qu'un fichier a été joint).
 *
 * Les fonctions sont pures : elles lisent/écrivent localStorage et
 * retournent la valeur résultante. Aucune réactivité — c'est à l'appelant
 * de décider quand marquer.
 */

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
    /* Intentionally ignored. */
  }
  return next;
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Intentionally ignored. */
  }
}