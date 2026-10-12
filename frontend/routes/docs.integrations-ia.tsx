//frontend\routes\docs.integrations-ia.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout, DocCallout } from "@/components/docs-layout";

export const Route = createFileRoute("/docs/integrations-ia")({
  head: () => ({
    meta: [
      { title: "Modèles IA & BYOK — Documentation" },
      {
        name: "description",
        content:
          "Utiliser les modèles inclus par défaut, ou brancher vos propres clés Anthropic, OpenAI, Google, Groq, DeepSeek et Mistral pour composer votre équipe d'agents IA.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsLayout
      eyebrow="Automatisation"
      title="Modèles IA & BYOK"
      description="Modèles inclus par défaut, ou vos propres clés pour un contrôle total."
      currentHref="/docs/integrations-ia"
      readingTime="5 min"
    >
      <p>
        LeadCortex utilise une <strong>équipe de deux IA</strong> qui collaborent sur chaque tâche :
        une <strong>IA de recherche</strong> (collecte, vérifie, synthétise) et une{" "}
        <strong>IA de travail</strong> (analyse, rédige, structure). Vous composez cette équipe en
        choisissant, pour chaque rôle, la marque d'IA à utiliser.
      </p>
      <p>
        Deux modes sont disponibles, et vous pouvez passer de l'un à l'autre à tout moment depuis{" "}
        <em>Réglages → Capacités</em> :
      </p>
      <ul>
        <li>
          <strong>Modèles inclus</strong> — utilisables immédiatement, sans configuration ni clé
          API. Idéal pour démarrer ou pour un usage léger.
        </li>
        <li>
          <strong>BYOK (bring your own key)</strong> — vous branchez vos propres clés. Aucune marge
          sur les tokens : vous payez votre fournisseur au prix réel.
        </li>
      </ul>

      <h2 id="pourquoi">Pourquoi le BYOK</h2>
      <p>
        Les plateformes qui revendent l'accès à un modèle IA appliquent en général une marge
        importante sur chaque token consommé, souvent invisible dans le prix affiché. Le BYOK rend
        ce coût transparent : vous payez le fournisseur au prix réel, et LeadCortex facture
        uniquement le logiciel.
      </p>
      <p>
        Bonus BYOK : <strong>le chat avec les agents devient illimité</strong>. Vous n'êtes plus
        contraint par un quota de messages — vous payez simplement votre fournisseur au token.
      </p>

      <h2 id="marques">Marques compatibles</h2>
      <p>Selon le mode choisi, chaque rôle peut être attribué à l'une des marques suivantes :</p>
      <ul>
        <li>
          <strong>Claude (Anthropic)</strong> — excellente rédaction, raisonnement nuancé. Inclus.
        </li>
        <li>
          <strong>Gemini (Google)</strong> — polyvalent, grande fenêtre de contexte. Inclus.
        </li>
        <li>
          <strong>ChatGPT (OpenAI)</strong> — référence généraliste, robuste sur tous les sujets.
          Inclus.
        </li>
        <li>
          <strong>Perplexity</strong> — recherche web augmentée avec citations. Inclus, mais
          uniquement disponible pour le rôle « recherche ».
        </li>
        <li>
          <strong>DeepSeek</strong> — raisonnement structuré et analytique. Via clé API.
        </li>
        <li>
          <strong>Mistral</strong> — modèles européens rapides et efficaces. Via clé API.
        </li>
        <li>
          <strong>Groq</strong> — inférence ultra-rapide pour les tâches courtes. Via clé API.
        </li>
      </ul>

      <h2 id="configuration">Composer votre équipe</h2>
      <p>
        Dans <em>Réglages → Capacités</em> :
      </p>
      <ol>
        <li>
          Choisissez la source : <em>Modèles inclus</em> ou <em>Mes clés API</em>.
        </li>
        <li>Attribuez une marque à chaque rôle : une IA de recherche, une IA de travail.</li>
        <li>
          Optionnel — définissez des <strong>instructions permanentes</strong> (system prompt) que
          l'équipe suivra dans toutes ses réponses.
        </li>
      </ol>
      <p>
        Vous pouvez panacher : par exemple, une IA de recherche sur un modèle inclus et une IA de
        travail sur votre clé Anthropic.
      </p>

      <h2 id="ajouter-cle">Ajouter une clé API</h2>
      <p>
        Si vous choisissez le mode « Mes clés API », ajoutez une clé par fournisseur depuis{" "}
        <em>Réglages → Capacités → Vos clés API</em>. Une fois au moins une clé ajoutée, vous pouvez
        l'utiliser dans le sélecteur d'équipe. Le même sélecteur est accessible directement depuis
        l'assistant IA, dans le panneau latéral.
      </p>
      <DocCallout tone="warning" title="Sécurité de la clé">
        <p>
          La clé est stockée localement dans votre navigateur et n'est jamais renvoyée en clair.
          Elle peut être supprimée à tout moment depuis les réglages.
        </p>
      </DocCallout>

      <h2 id="cout">Estimer le coût</h2>
      <p>
        En mode BYOK, le coût réel dépend du fournisseur, du modèle choisi et du volume de prospects
        traités. Faites attention à la fenêtre de contexte : les IA de recherche consomment
        généralement plus de tokens que les IA de travail.
      </p>
      <p>
        Pour brancher ces modèles dans un pipeline automatisé, voir{" "}
        <Link to="/docs/workflows">L'éditeur de workflows</Link>.
      </p>
    </DocsLayout>
  );
}
