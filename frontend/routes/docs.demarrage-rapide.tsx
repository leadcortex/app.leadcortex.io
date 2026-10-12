//frontend\routes\docs.demarrage-rapide.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout, DocCallout } from "@/components/docs-layout";

export const Route = createFileRoute("/docs/demarrage-rapide")({
  head: () => ({
    meta: [
      { title: "Bien démarrer sur LeadCortex — Documentation" },
      {
        name: "description",
        content:
          "Créer un workspace, composer votre équipe d'agents IA et lancer votre première recherche de prospects sur LeadCortex.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <DocsLayout
      eyebrow="Démarrage"
      title="Bien démarrer sur LeadCortex"
      description="De la création du compte à votre première liste de prospects."
      currentHref="/docs/demarrage-rapide"
      readingTime="5 min"
    >
      <p>
        LeadCortex est pensé pour être opérationnel en moins de dix minutes. Il n'y a pas
        d'implémentation, pas d'appel avec un CSM, pas de configuration à trois niveaux : vous créez
        un compte, vous composez votre équipe d'agents IA, et vous lancez votre première recherche.
      </p>

      <h2 id="workspace">1. Créer votre workspace</h2>
      <p>
        Un workspace regroupe vos prospects, vos listes, vos séquences, vos workflows et — sur les
        plans qui le permettent — les personnes avec qui vous travaillez. Chaque compte démarre avec
        un workspace personnel ; vous pouvez en créer plusieurs pour séparer, par exemple, un
        produit et une activité de conseil, ou pour cloisonner plusieurs équipes.
      </p>
      <p>
        À la création, on vous demande votre secteur cible et votre ICP (profil client idéal) en une
        phrase. Ce n'est pas un formulaire obligatoire — l'IA de recherche s'en sert simplement pour
        pré-remplir vos premiers filtres, vous pourrez tout modifier ensuite.
      </p>

      <h2 id="equipe-ia">2. Composer votre équipe d'agents IA</h2>
      <p>
        LeadCortex n'est pas un agent unique : c'est une <strong>équipe de deux IA</strong> qui
        collaborent.
      </p>
      <ul>
        <li>
          <strong>L'IA de recherche</strong> — collecte, vérifie et synthétise. Elle scanne les
          bases, croise les sources, score les leads et détecte les signaux d'achat.
        </li>
        <li>
          <strong>L'IA de travail</strong> — analyse, rédige et structure. Elle transforme les
          données brutes en emails, notes de meeting et plans d'action.
        </li>
      </ul>
      <p>
        Deux modes sont disponibles : <strong>« Modèles inclus »</strong> (utilisables
        immédiatement, sans configuration) et <strong>« Mes clés API »</strong> (BYOK — vous
        branchez vos propres clés Anthropic, OpenAI, Google, Groq, DeepSeek ou Mistral). Vous pouvez
        même panacher : une clé différente par rôle, ou un rôle en modèles inclus et l'autre en
        BYOK. Rendez-vous dans <em>Réglages → Capacités</em>.
      </p>
      <DocCallout tone="info" title="Pas envie de gérer des clés ?">
        <p>
          Commencez avec les modèles inclus — rien à configurer. Vous pourrez basculer sur BYOK plus
          tard si vous voulez un contrôle total sur les coûts et le choix des modèles. Le guide
          détaillé se trouve dans <Link to="/docs/integrations-ia">Modèles IA & BYOK</Link>.
        </p>
      </DocCallout>

      <h2 id="recherche">3. Lancer votre première recherche</h2>
      <p>
        Depuis <em>Prospection</em>, décrivez votre cible en langage naturel — par exemple «
        fondateurs de studios SaaS B2B de moins de 20 personnes en France » — puis affinez avec les
        filtres firmographiques (taille d'équipe, secteur, stack technique, levées de fonds
        récentes). L'IA de recherche traduit votre requête en critères structurés et vous propose
        une première liste triée.
      </p>
      <p>
        Chaque résultat affiche un score de correspondance avec votre ICP. Vous pouvez ajuster ce
        scoring à tout moment : plus vous validez ou écartez des profils, plus les recherches
        suivantes se resserrent.
      </p>

      <h2 id="enrichir">4. Enrichir puis contacter</h2>
      <p>
        Sélectionnez les prospects pertinents et lancez l'enrichissement : emails vérifiés,
        téléphones directs quand disponibles, et données firmographiques complémentaires. Chaque
        enrichissement consomme des crédits — le détail est expliqué dans{" "}
        <Link to="/docs/enrichissement">Comprendre les crédits d'enrichissement</Link>.
      </p>
      <p>
        Une fois vos contacts enrichis, créez une séquence ou ajoutez-les à une séquence existante.
        C'est là que l'IA de travail prend le relais pour personnaliser et planifier l'outreach —
        voir <Link to="/docs/sequences">Séquences & outreach</Link>.
      </p>

      <h2 id="equipe">5. Travailler à plusieurs</h2>
      <p>
        Sur les plans qui incluent des sièges supplémentaires, vous pouvez inviter des collègues
        dans votre workspace. Chacun partage les mêmes prospects, listes, séquences et workflows,
        avec des rôles différenciés (édition, lecture seule). Les projets communs — campagnes,
        comptes stratégiques, workflows — se pilotent à plusieurs sans dupliquer les données.
      </p>

      <h2 id="suite">Et ensuite ?</h2>
      <p>
        Si votre besoin dépasse une simple recherche ponctuelle — par exemple automatiser un
        pipeline complet de la détection de signal jusqu'à l'envoi du premier email — direction
        l'éditeur de workflows, décrit dans <Link to="/docs/workflows">L'éditeur de workflows</Link>
        .
      </p>
    </DocsLayout>
  );
}
