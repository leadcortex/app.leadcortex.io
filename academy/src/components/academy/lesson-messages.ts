// academy/src/components/academy/lesson-messages.ts

export type FeedbackMessage = {
  title: string;
  subtitle?: string;
};

export type ProgressiveHint = {
  level: 1 | 2 | 3;
  text: string;
};

const CORRECT_SHORT = [
  "Exactement.",
  "C'est ça.",
  "Bien vu.",
  "Parfait.",
  "Nickel.",
  "Excellent.",
  "Tu progresses.",
  "Impeccable.",
];

export function pickCorrectMessage(ctx: {
  streak: number;
  perfect: boolean;
  isFinal: boolean;
  index: number;
}): FeedbackMessage {
  const { streak, perfect, isFinal, index } = ctx;

  if (isFinal && perfect) {
    return {
      title: "Sans faute, du premier coup.",
      subtitle: "Ce contenu est solide dans ta tête.",
    };
  }
  if (isFinal) {
    return {
      title: "Leçon bouclée.",
      subtitle: "Chaque petite erreur t'a fait progresser.",
    };
  }
  if (streak >= 5) {
    return { title: `${streak} d'affilée.`, subtitle: "Ne casse pas la série." };
  }
  if (streak >= 3) {
    return { title: "Trois en ligne.", subtitle: "Tu chauffes." };
  }
  const msg = CORRECT_SHORT[index % CORRECT_SHORT.length] ?? "Exactement.";
  return { title: msg };
}

export function pickIncorrectMessage(ctx: {
  kind: string;
  failCount: number;
  exhausted: boolean;
  isFinal: boolean;
}): FeedbackMessage {
  const { kind, failCount, exhausted, isFinal } = ctx;

  if (exhausted) {
    return {
      title: "Pas de souci.",
      subtitle: "Voici la solution complète, étape par étape.",
    };
  }
  if (failCount >= 2) {
    return isFinal
      ? {
          title: "Encore raté.",
          subtitle: "Regarde bien l'indice ci-dessous.",
        }
      : {
          title: "Toujours pas.",
          subtitle: "Voici un indice plus précis.",
        };
  }
  switch (kind) {
    case "mcq":
      return {
        title: "Pas tout à fait.",
        subtitle: "Relis la question, une seule réponse est juste.",
      };
    case "multi_select":
      return {
        title: "Il manque (ou il y a en trop).",
        subtitle: "Reprends chaque option une par une.",
      };
    case "fill_blank":
      return {
        title: "Un mot n'est pas à sa place.",
        subtitle: "Relis la phrase complète à voix haute.",
      };
    case "order_steps":
      return {
        title: "L'ordre ne colle pas.",
        subtitle: "Vois si une étape doit venir avant les autres.",
      };
    case "match_pairs":
      return {
        title: "Une association ne va pas.",
        subtitle: "Concentre-toi sur les paires les plus évidentes.",
      };
    case "free_text":
      return {
        title: "Ça mérite d'être étoffé.",
        subtitle: "Vérifie les critères d'auto-évaluation.",
      };
    case "scenario":
      return {
        title: "Ce choix n'est pas optimal.",
        subtitle: "Rejoue le scénario mentalement.",
      };
    default:
      return { title: "Pas tout à fait." };
  }
}

export function pickProgressiveHint(ctx: {
  exercise: {
    kind: string;
    payload: {
      correct?: number | number[];
      blanks?: unknown[];
      options?: unknown[];
      pairs?: unknown[];
      steps?: unknown[];
    };
  };
  failCount: number;
}): ProgressiveHint {
  const { exercise, failCount } = ctx;

  if (failCount >= 3) {
    return { level: 3, text: "" };
  }

  if (failCount === 2) {
    return { level: 2, text: level2Hint(exercise) };
  }

  return { level: 1, text: level1Hint(exercise) };
}

function level1Hint(ex: {
  kind: string;
  payload: {
    correct?: number | number[];
    blanks?: unknown[];
    options?: unknown[];
    pairs?: unknown[];
    steps?: unknown[];
  };
}): string {
  switch (ex.kind) {
    case "mcq":
      return "Prends 10 secondes pour relire la question en entier. Que te demande-t-elle précisément ?";
    case "multi_select": {
      const n = Array.isArray(ex.payload.correct) ? ex.payload.correct.length : 1;
      return `Il faut sélectionner exactement ${n} réponse${n > 1 ? "s" : ""}. Cherche celles qui sont directement liées au sujet.`;
    }
    case "fill_blank":
      return "Relis la phrase complète en entier. Certains mots se devinent au sens général.";
    case "order_steps":
      return "Repère d'abord l'étape qui doit logiquement venir en premier.";
    case "match_pairs":
      return "Commence par les paires qui te semblent évidentes. Le reste se déduit.";
    case "free_text":
      return "Prends 30 secondes pour lister dans ta tête les idées clés attendues.";
    case "scenario":
      return "À chaque étape, demande-toi ce que ferait un bon commercial dans cette situation.";
    default:
      return "Relis la question avec attention.";
  }
}

function level2Hint(ex: {
  kind: string;
  payload: {
    correct?: number | number[];
    blanks?: unknown[];
    options?: unknown[];
    pairs?: unknown[];
    steps?: unknown[];
  };
}): string {
  switch (ex.kind) {
    case "mcq": {
      const n = ex.payload.options?.length ?? 0;
      return `Sur les ${n} options, élimine celles qui ne répondent pas à la question. Il doit en rester une seule.`;
    }
    case "multi_select": {
      const n = Array.isArray(ex.payload.correct) ? ex.payload.correct.length : 1;
      return `Relis chaque option et coche-la seulement si elle correspond au sujet exact. Au final, tu dois avoir ${n} réponse${n > 1 ? "s" : ""} cochée${n > 1 ? "s" : ""}.`;
    }
    case "fill_blank": {
      const n = ex.payload.blanks?.length ?? 0;
      return `Il y a ${n} mots à placer pour ${n} trous. Élimine d'abord ceux qui ne collent ni au sens ni à la grammaire.`;
    }
    case "order_steps":
      return "Concentre-toi sur la première et la dernière étape. Elles sont les plus faciles à reconnaître.";
    case "match_pairs":
      return "Élimine d'abord les paires déjà résolues, puis associe les restantes une par une.";
    default:
      return "Essaie de procéder par élimination.";
  }
}

export function pickReviewMessage(): FeedbackMessage {
  return {
    title: "À toi de juger.",
    subtitle: "Compare ta réponse aux critères ci-dessous.",
  };
}
