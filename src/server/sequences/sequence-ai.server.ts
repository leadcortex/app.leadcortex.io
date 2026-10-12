//src\server\sequences\sequence-ai.server.ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";

export const GeneratedSequenceSchema = z.object({
  name: z.string(),
  description: z.string(),
  objective: z.string(),
  audience: z.string(),
  tags: z.array(z.string()),
  steps: z.array(
    z.object({
      type: z.enum(["email", "linkedin", "call"]),
      subject: z.string(),
      content: z.string(),
      delay: z.number(),
    }),
  ),
});

export type GeneratedSequence = z.infer<typeof GeneratedSequenceSchema>;

export function fallbackSequence(prompt: string, audience?: string): GeneratedSequence {
  const cible = (audience?.trim() || prompt.trim() || "prospects industriels").slice(0, 80);
  return {
    name: `Prospection — ${cible}`.slice(0, 60),
    description: `Séquence multicanale générée à partir de : ${prompt.trim().slice(0, 160)}`,
    objective: "Obtenir un premier rendez-vous de qualification",
    audience: cible,
    tags: ["cold-outreach", "multicanal"],
    steps: [
      {
        type: "email",
        subject: `Une idée pour ${cible}`,
        content: `Bonjour {{prenom}},\n\nJe travaille avec des équipes comme ${cible} sur ${prompt.trim().slice(0, 120)}.\n\nSeriez-vous ouvert à 15 minutes cette semaine ?\n\n{{signature}}`,
        delay: 0,
      },
      {
        type: "linkedin",
        subject: "",
        content: `Bonjour {{prenom}}, je vous ai écrit par email au sujet de ${cible}. Ravi d'échanger ici si c'est plus simple.`,
        delay: 2,
      },
      {
        type: "email",
        subject: "Je remonte mon message",
        content:
          "Bonjour {{prenom}},\n\nJe me permets de remonter mon message — un cas client similaire a réduit son cycle de vente de 30%.\n\nJe vous envoie le détail ?\n\n{{signature}}",
        delay: 4,
      },
      {
        type: "call",
        subject: "",
        content: `Appel de relance : rappeler le contexte ${cible}, proposer un créneau de 15 minutes.`,
        delay: 7,
      },
      {
        type: "email",
        subject: "Je clôture le sujet",
        content:
          "Bonjour {{prenom}},\n\nSans retour de votre part, je clôture le sujet. Si le timing change, je reste disponible.\n\n{{signature}}",
        delay: 11,
      },
    ],
  };
}

export async function generateSequenceWithAi(input: {
  prompt: string;
  audience?: string;
  tone?: string;
  stepCount?: number;
}): Promise<{ sequence: GeneratedSequence; source: "ai" | "fallback"; message?: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    return {
      sequence: fallbackSequence(input.prompt, input.audience),
      source: "fallback",
      message: "IA indisponible — trame générée localement.",
    };
  }

  try {
    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": key },
    });

    const result = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      experimental_output: Output.object({ schema: GeneratedSequenceSchema }),
      system:
        "Tu es un expert en prospection B2B. Tu rédiges des séquences multicanales (email, LinkedIn, appel) en français, concises, personnalisées et sans jargon marketing. Utilise les variables {{prenom}}, {{entreprise}} et {{signature}}. Les délais sont en jours, croissants, le premier vaut 0.",
      prompt: [
        `Contexte : ${input.prompt}`,
        input.audience ? `Cible : ${input.audience}` : "",
        input.tone ? `Ton : ${input.tone}` : "",
        `Nombre d'étapes souhaité : ${input.stepCount ?? 5}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const output = result.experimental_output;
    return { sequence: GeneratedSequenceSchema.parse(output), source: "ai" };
  } catch (error) {
    console.error("generateSequenceWithAi", error);
    return {
      sequence: fallbackSequence(input.prompt, input.audience),
      source: "fallback",
      message: error instanceof Error ? error.message : "Erreur IA inconnue",
    };
  }
}
