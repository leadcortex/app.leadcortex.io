//frontend\lib\workflow\command-book.ts
/**
 * « Livre de commandes » de la console de workflow.
 *
 * C'est la référence unique partagée par l'humain (commande `book`) et par
 * l'agent IA (injectée dans son prompt système) : au lieu de manipuler le
 * canevas bloc par bloc à la souris — coûteux en jetons et source d'erreurs —
 * l'agent écrit un petit script de commandes que la console exécute en lot,
 * puis réorganise automatiquement le graphe.
 *
 * Aucun import runtime : ce module reste une donnée pure, consommable côté
 * client comme côté serveur (prompt système).
 */

export type BookEntry = {
  name: string;
  usage: string;
  summary: string;
  examples?: string[];
};

export type BookSection = {
  key: string;
  title: string;
  intro: string;
  entries: BookEntry[];
};

export const BOOK_CONVENTIONS: string[] = [
  "Une ligne = une commande. Plusieurs commandes se chaînent avec `;` sur la même ligne.",
  "Références de blocs : `node_12` (id complet), `#3` (3ᵉ bloc du canevas), `@dernier` (dernier bloc créé), ou un fragment de titre unique.",
  "Ports : suffixe `:port` sur une référence — `node_4:true`, `node_9:in`. Sans suffixe, la 1ʳᵉ sortie / 1ʳᵉ entrée est utilisée.",
  "Configuration : paires `clé=valeur` libres après la référence (`operator=equals seuil=80`). Les valeurs `true`/`false`/nombres sont typées automatiquement.",
  "Options : `--clé valeur` ou `--clé=valeur`. `--no-layout` désactive la réorganisation automatique pour la commande courante.",
  "Après toute création de bloc ou de connexion, la console relance seule `layout` (réorganisation en arbre) : ne place jamais les blocs à la main sauf besoin explicite.",
  "Tout est en données simulées et 100 % local : aucune commande n'appelle de service externe.",
];

export const BOOK_SECTIONS: BookSection[] = [
  {
    key: "flux",
    title: "Construire un flux (l'essentiel)",
    intro:
      "Les trois commandes qui remplacent le glisser-déposer. Elles créent, configurent et relient en un seul appel.",
    entries: [
      {
        name: "flow",
        usage: "flow <blockId|@ref>[:port] > <blockId|@ref> > … [--from <bloc>] [--no-layout]",
        summary:
          "Crée toute une chaîne de blocs et leurs connexions en une commande. `@ref` réutilise un bloc existant au lieu d'en créer un.",
        examples: [
          "flow trig-webhook > enr-company > ai-summary > act-email",
          "flow @node_3 > log-condition > act-crm-update",
          "flow log-condition:true > act-email",
        ],
      },
      {
        name: "mk",
        usage: "mk <blockId ...> [--chain] [--from <bloc>] [clé=valeur ...] [--no-layout]",
        summary:
          "Crée plusieurs blocs d'un coup. Sans `--chain`, ils restent indépendants : on les relie ensuite avec `link` / `chain`.",
        examples: ["mk trig-webhook enr-company act-email", "mk enr-email enr-phone --chain"],
      },
      {
        name: "chain",
        usage: "chain <bloc>[:port] <bloc>[:port] … [--no-layout]",
        summary: "Relie en série des blocs DÉJÀ créés (mode « tous les blocs puis les liaisons »).",
        examples: ["chain #1 #2 #3", "chain node_1 node_2:in"],
      },
    ],
  },
  {
    key: "blocs",
    title: "Blocs & connexions",
    intro: "Création unitaire, configuration, câblage fin des entrées/sorties.",
    entries: [
      {
        name: "add",
        usage: "add <blockId> [clé=valeur ...] [--title t] [--after <bloc>] [--x n --y n]",
        summary: "Crée un bloc, le configure et le connecte derrière un bloc existant.",
        examples: ["add log-condition operator=equals --after node_1"],
      },
      {
        name: "link",
        usage: "link <source[:port]> <cible[:port]>",
        summary: "Connecte deux blocs en choisissant précisément les ports.",
        examples: ["link node_2:true node_5:in"],
      },
      { name: "unlink", usage: "unlink <bloc|edgeId>", summary: "Supprime une ou des connexions." },
      {
        name: "set",
        usage: "set <bloc> <clé=valeur ...> [--title t] [--mute true|false]",
        summary: "Modifie la configuration d'un bloc existant.",
      },
      {
        name: "rename",
        usage: "rename <bloc> <nouveau titre>",
        summary: "Renomme un bloc (titre affiché sur le canevas).",
      },
      {
        name: "mute",
        usage: "mute <bloc ...> [--off]",
        summary: "Désactive (ou réactive avec `--off`) des blocs sans les supprimer.",
      },
      {
        name: "dup",
        usage: "dup <bloc> [--times n]",
        summary: "Duplique un bloc avec sa configuration.",
      },
      { name: "rm", usage: "rm <bloc ...> | rm --selected | rm --all", summary: "Supprime." },
      {
        name: "note",
        usage: 'note "<texte>" [--on <bloc>]',
        summary: "Ajoute une note/annotation sur le canevas.",
      },
    ],
  },
  {
    key: "inspection",
    title: "Inspection & catalogue",
    intro: "Se repérer sans lire le canevas : c'est ce qui économise le plus de jetons.",
    entries: [
      { name: "ls", usage: "ls [nodes|edges|notes] [--filter t]", summary: "Liste le canevas." },
      { name: "tree", usage: "tree", summary: "Affiche le graphe sous forme d'arbre indenté." },
      { name: "cat", usage: "cat <bloc>", summary: "Détail d'un bloc : ports, config, voisins." },
      {
        name: "ports",
        usage: "ports <bloc|blockId>",
        summary: "Entrées et sorties disponibles (indispensable avant `link`).",
      },
      {
        name: "defaults",
        usage: "defaults <blockId>",
        summary: "Champs de configuration du catalogue et valeurs par défaut.",
      },
      {
        name: "find",
        usage: "find <texte> [--cat catégorie]",
        summary: "Cherche un type de bloc.",
      },
      { name: "stats", usage: "stats", summary: "Statistiques du canevas (dont blocs orphelins)." },
    ],
  },
  {
    key: "qualite",
    title: "Qualité, exécution & vue",
    intro: "Vérifier avant de livrer, puis remettre le canevas au propre.",
    entries: [
      {
        name: "validate",
        usage: "validate",
        summary: "Valide le graphe (déclencheur, cycles, ports) et alimente l'onglet Erreurs.",
      },
      { name: "compile", usage: "compile", summary: "Compile en plan exécutable + coût estimé." },
      {
        name: "run",
        usage: "run [--dry]",
        summary: "Exécution simulée pas à pas du plan compilé (données simulées).",
      },
      {
        name: "layout",
        usage: "layout [--auto on|off]",
        summary:
          "Réorganise le canevas en arbre. `--auto off` suspend la réorganisation automatique.",
      },
      { name: "fit", usage: "fit", summary: "Ajuste la vue à l'ensemble du workflow." },
      { name: "focus", usage: "focus <bloc>", summary: "Centre la vue sur un bloc." },
      { name: "undo / redo", usage: "undo | redo", summary: "Annule / rétablit." },
    ],
  },
  {
    key: "session",
    title: "Session & données",
    intro: "Piloter la console elle-même.",
    entries: [
      { name: "help", usage: "help [commande]", summary: "Liste ou détaille les commandes." },
      { name: "book", usage: "book [section]", summary: "Ouvre ce livre de commandes." },
      { name: "man", usage: "man <commande>", summary: "Fiche complète d'une commande." },
      { name: "history", usage: "history [--clear]", summary: "Historique des commandes du flux." },
      { name: "echo", usage: "echo <texte>", summary: "Écrit une ligne dans le flux courant." },
      { name: "export", usage: "export [--pretty]", summary: "Exporte le workflow en JSON." },
      { name: "import", usage: "import <json>", summary: "Remplace le canevas par un JSON." },
      { name: "clear", usage: "clear", summary: "Efface le flux affiché." },
    ],
  },
];

export const BOOK_RECIPES: { title: string; script: string[] }[] = [
  {
    title: "Créer et relier en même temps (le plus économique)",
    script: ["flow trig-webhook > enr-company > qual-score > log-condition", "validate"],
  },
  {
    title: "Créer d'abord, relier ensuite (contrôle fin des ports)",
    script: [
      "mk trig-schedule srch-leads enr-email act-email",
      "chain #1 #2 #3",
      "link #3 #4:in",
      "validate",
    ],
  },
  {
    title: "Brancher les deux sorties d'une condition",
    script: ["ports node_4", "link node_4:true node_7", "link node_4:false node_9"],
  },
];

export function commandBookText(): string {
  const sections = BOOK_SECTIONS.map((s) => {
    const entries = s.entries
      .map(
        (e) =>
          `  ${e.usage}\n      ${e.summary}${e.examples?.length ? `\n      ex: ${e.examples.join(" | ")}` : ""}`,
      )
      .join("\n");
    return `## ${s.title}\n${entries}`;
  }).join("\n");

  const recipes = BOOK_RECIPES.map((r) => `- ${r.title}\n    ${r.script.join("\n    ")}`).join(
    "\n",
  );

  return [
    "# Livre de commandes de la console de workflow",
    "",
    "## Conventions",
    ...BOOK_CONVENTIONS.map((c) => `- ${c}`),
    "",
    sections,
    "",
    "## Recettes",
    recipes,
  ].join("\n");
}
