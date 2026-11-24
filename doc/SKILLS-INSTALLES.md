# Skills installés

Mis à jour le 24/11/2026. La liste complète et à jour se trouve dans [skills-detectes.md](skills-detectes.md).

Pour la régénérer à tout moment :

```bash
node scripts/lister-skills.mjs doc/skills-detectes.md
```

Sans argument, le script affiche la liste dans le terminal.

## Pas de skill « Apple design »

Aucun skill de ce nom n'est installé, ni dans les plugins, ni dans `~/.claude/skills`, ni dans le projet. Pour le site, j'ai appliqué à la main les principes de design d'Apple : une idée par section, un titre court, une ligne de texte au plus, l'image qui porte le message.

Pour en avoir un vrai : `/plugin` dans Claude Code pour parcourir les marketplaces, ou le skill `skill-creator` pour en écrire un.

## En bref, ce qui est installé

| Source | Ce que ça apporte | Skills utiles au quotidien |
| --- | --- | --- |
| **superpowers** (plugin) | Méthode de travail : réfléchir, planifier, tester, vérifier | `brainstorming`, `writing-plans`, `systematic-debugging`, `verification-before-completion` |
| **mattpocock-skills** (plugin) | Ingénierie : revue de code, architecture, TDD, specs, tickets | `code-review`, `tdd`, `prototype`, `to-spec`, `grilling` |
| **humanizer** (plugin) | Réécrit un texte qui « sonne IA » | `humanizer` |
| **tdd-guard** (plugin) | Bloque le code écrit sans test d'abord | `setup` |
| **claude.ai** (synchronisés) | Documents et outils : Word, PDF, Excel, PowerPoint, navigateur, recherche | `docx`, `pdf`, `xlsx`, `pptx`, `deep-research`, `skill-creator` |

## Commandes intégrées à Claude Code

Elles existent sans fichier, donc le script ne les voit pas :

| Commande | Rôle |
| --- | --- |
| `/code-review` | Chercher les bugs dans les modifications en cours |
| `/simplify` | Nettoyer et simplifier le code modifié |
| `/security-review` | Revue de sécurité des modifications |
| `/init` | Créer un fichier CLAUDE.md pour le projet |
| `/loop` | Relancer une tâche à intervalle régulier |
| `/schedule` | Programmer un agent dans le cloud |
| `/run` | Lancer l'application pour voir un changement |
| `/fewer-permission-prompts` | Réduire les demandes d'autorisation répétées |
| `/dataviz` | Règles pour faire des graphiques propres |

## Recommandés pour LeadCortex (à installer depuis votre PC)

Installer peu de plugins : chaque skill installé ajoute sa description à chaque conversation, donc consomme des tokens. Commande d'installation dans Claude Code : `/plugin install <nom>@claude-plugins-official`.

### À installer maintenant

| Plugin | Pourquoi pour ce projet |
| --- | --- |
| `context7` | Documentation à jour de TanStack Start, Drizzle et Better Auth. Ces outils changent vite : sans ça, Claude risque d'écrire du code basé sur une ancienne version. |
| `typescript-lsp` | Claude « comprend » le code TypeScript (où une fonction est utilisée, les erreurs de type) sans relire des fichiers entiers. Plus juste, et moins de tokens. |
| `security-guidance` | Le backend va manipuler des comptes, des jetons Gmail et des données de prospects : il signale les failles classiques pendant que Claude écrit. |

### À installer quand le moment viendra

| Plugin | Quand |
| --- | --- |
| `redis-development` | Quand vous attaquez Redis/BullMQ (tâches de fond). |
| `cloudflare` | Quand vous branchez R2 (exports CSV, avatars). |
| `resend` | Si vous envoyez des emails transactionnels (confirmation, réinitialisation). |
| `stripe` | Quand vous branchez le paiement des plans. |
| `sentry` | Une fois le site en ligne, pour voir les erreurs des vrais utilisateurs. |

### À éviter

Des plugins qui font doublon avec ce que vous avez déjà : `code-review`, `pr-review-toolkit`, `feature-dev`, `code-simplifier`. Superpowers et mattpocock-skills couvrent déjà ces usages.

## Connecteurs (claude.ai → Paramètres → Connecteurs)

- **GitHub** : utile si votre code est sur GitHub (suivi des pull requests, issues). Sinon, rien à ajouter pour l'instant.
- Pas besoin d'autres connecteurs tant que vous ne travaillez pas avec un outil externe (Notion, Linear…).

## Économiser les tokens

Skill personnel installé : `economie-tokens` (dans `~/.claude/skills/`). Il s'active quand vous parlez de limite ou d'économie, ou en tapant `/economie-tokens`.

Les trois réflexes qui comptent le plus :
1. `/clear` quand vous changez de sujet.
2. `/compact` quand une conversation devient longue sur le même sujet.
3. Un fichier `CLAUDE.md` court dans le projet, pour ne pas réexpliquer le projet à chaque session (`/init` pour le créer).
