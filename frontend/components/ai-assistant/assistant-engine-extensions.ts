//frontend\components\ai-assistant\assistant-engine-extensions.ts
import { AiBrand, ModelConfig, DEFAULT_MODEL_CONFIG, getBrand } from "./model-selector-types";
import { getPersonalizationHint } from "./assistant-engine";

export function buildFinalSystemPrompt(config?: ModelConfig, basePrompt?: string): string {
  const defaultBase =
    basePrompt ||
    "Vous êtes LeadCortex Copilot, un assistant IA intelligent spécialisé dans le B2B, la gestion de prospects et l'optimisation des ventes.";

  if (!config) return defaultBase;

  const research = getBrand(config.team.research);
  const work = getBrand(config.team.work);
  const mode = config.type === "app" ? "modèles inclus" : "clé API personnelle";

  const hint = getPersonalizationHint();

  return [
    defaultBase,
    "",
    `[Équipe IA active (${mode})]`,
    `- IA de recherche : ${research.name} (${research.providerLabel}) — collecte, vérifie et synthétise les informations.`,
    `- IA de travail   : ${work.name} (${work.providerLabel}) — analyse, rédige et structure les livrables.`,
    "Exploitez leurs forces respectives : la recherche nourrit le travail, le travail produit la réponse finale.",
    ...(hint ? ["", "[Préférences utilisateur]", hint] : []),
  ].join("\n");
}

/* --------------------------- Capacités modèle ----------------------------- */

export type ModelCapabilities = {
  /** Étiquette courte ex. "Claude + Gemini". */
  label: string;
  /** Fournisseurs affichés ex. "Anthropic · Google". */
  providerLabel: string;
  research: { id: AiBrand; name: string; provider: string };
  work: { id: AiBrand; name: string; provider: string };
  /** Vrai si l'utilisateur utilise ses propres clés. */
  isUserKey: boolean;
};

export function getModelCapabilities(config?: ModelConfig): ModelCapabilities {
  const cfg = config ?? DEFAULT_MODEL_CONFIG;
  const research = getBrand(cfg.team.research);
  const work = getBrand(cfg.team.work);

  return {
    label: `${research.name} + ${work.name}`,
    providerLabel: `${research.providerLabel} · ${work.providerLabel}`,
    research: {
      id: research.id,
      name: research.name,
      provider: research.providerLabel,
    },
    work: {
      id: work.id,
      name: work.name,
      provider: work.providerLabel,
    },
    isUserKey: cfg.type === "user-key",
  };
}