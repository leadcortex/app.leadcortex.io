# Aide-mémoire Claude Code

Tout ce qu'il faut retenir, au même endroit. Vérifié sur Claude Code 2.1.331.

> Tu as oublié une commande ? Dans Claude Code, tape `/` : la liste complète s'affiche et tu peux filtrer en tapant le début du nom. `/help` donne aussi l'aide.

---

## 1. Travailler depuis ton téléphone 📱

Il y a deux façons de faire, selon que ton ordinateur est allumé ou non.

### A. Ton PC est allumé : Remote Control

Tu pilotes depuis ton téléphone la session qui tourne sur ton PC. Claude travaille avec tes fichiers, ton projet et tes outils.

**Sur le PC, avant de partir**, dans le terminal, dans le dossier du projet :

```bash
claude remote-control
```

Ou, si une session Claude Code est déjà ouverte, tape dedans :

```
/remote-control
```

**Sur le téléphone** : ouvre l'application Claude (ou claude.ai/code dans le navigateur), section **Code** : ta session apparaît sous le nom de ton ordinateur.

| Variante | À quoi ça sert |
| --- | --- |
| `claude remote-control --name "leadcortex"` | Donner un nom à la session pour la retrouver facilement sur le téléphone |
| `claude remote-control --continue` | Reprendre la dernière session Remote Control de ce dossier (moins de 4 h environ) |
| `claude --remote-control` | Ouvrir une session normale sur le PC, déjà accessible depuis le téléphone |

⚠️ Le PC doit rester **allumé, pas en veille, et connecté à internet**, avec le terminal ouvert. Si le PC s'éteint, la session s'arrête.

Astuce Windows : Paramètres → Système → Alimentation → mettre la mise en veille sur « Jamais » quand le PC est branché.

### B. Ton PC est éteint : session dans le cloud

Claude travaille sur un ordinateur d'Anthropic, à partir de ton code **envoyé sur GitHub**. Ton PC n'est pas nécessaire.

- Depuis le téléphone : application Claude → **Code** → nouvelle session, puis choisir le dépôt GitHub.
- Depuis le PC, pour lancer une tâche qui continue après l'extinction : `claude --cloud "description de la tâche"`

⚠️ Le cloud ne voit que ce qui a été **poussé sur GitHub** (`git push`). Ce qui n'est que sur ton PC, il ne le voit pas.

---

## 2. Démarrer et reprendre une session (dans le terminal)

| Commande | À quoi ça sert |
| --- | --- |
| `claude` | Ouvrir Claude Code dans le dossier actuel |
| `claude -c` | **Reprendre la dernière conversation** de ce dossier |
| `claude -r` | Choisir dans la liste une ancienne conversation à reprendre |
| `claude -n "nom"` | Donner un nom à la session |
| `claude "ta question"` | Ouvrir Claude et lui poser directement la question |
| `claude -p "ta question"` | Obtenir une réponse unique, sans ouvrir de session |
| `claude update` | Mettre Claude Code à jour |
| `claude doctor` | Vérifier que l'installation fonctionne (en cas de problème) |
| `claude --version` | Voir la version installée |

---

## 3. Commandes à taper dans une session (`/…`)

### Les indispensables

| Commande | À quoi ça sert |
| --- | --- |
| `/help` | Aide et liste des commandes |
| `/clear` | **Repartir de zéro** quand tu changes de sujet (économise beaucoup de tokens) |
| `/compact` | Résumer une longue conversation pour continuer sur le même sujet |
| `/resume` | Reprendre une ancienne conversation |
| `/rewind` | Revenir en arrière : annuler les derniers échanges et/ou les modifications de fichiers |
| `/remote-control` | Rendre la session accessible depuis le téléphone |

### Réglages

| Commande | À quoi ça sert |
| --- | --- |
| `/model` | Changer de modèle (Opus = le plus fort, Sonnet = équilibré, Haiku = rapide et économique) |
| `/config` | Ouvrir les réglages |
| `/permissions` | Voir/modifier ce que Claude peut faire sans te demander |
| `/memory` | Voir/modifier ce que Claude retient (CLAUDE.md, mémoire) |
| `/init` | Créer un fichier CLAUDE.md qui décrit le projet |
| `/usage` | Voir ta consommation et tes limites |
| `/context` | Voir ce qui remplit la mémoire de la conversation |
| `/fast` | Activer/désactiver le mode rapide |

### Extensions

| Commande | À quoi ça sert |
| --- | --- |
| `/plugin` | Parcourir, installer ou retirer des plugins (paquets de skills) |
| `/mcp` | Gérer les connexions à des outils externes (serveurs MCP) |
| `/agents` | Gérer les agents spécialisés |

---

## 4. Raccourcis clavier et symboles

| Touche / symbole | À quoi ça sert |
| --- | --- |
| `Échap` | **Arrêter Claude** pendant qu'il travaille (sans perdre la conversation) |
| `Échap` `Échap` | Revenir à un message précédent pour le modifier |
| `Maj + Tab` | Changer de mode : normal → accepter les modifications → plan (Claude réfléchit sans rien modifier) |
| `↑` | Rappeler ton message précédent |
| `@fichier` | Désigner un fichier précis (ex. `@src/App.tsx`) |
| `! commande` | Lancer une commande du terminal sans quitter Claude (ex. `! git status`) |
| `Ctrl + C` deux fois | Quitter Claude Code |

---

## 5. Bibliothèque de skills : « je veux… → je tape… »

Un skill est une méthode toute prête. Claude les déclenche souvent tout seul, mais tu peux le forcer en tapant son nom avec `/`. La liste complète (70 skills, en français) est dans [skills-detectes.md](skills-detectes.md).

### Avant de coder

| Je veux… | Je tape… |
| --- | --- |
| Réfléchir à une nouvelle fonctionnalité avant de la coder | `/superpowers:brainstorming` |
| Me faire challenger sur mon idée ou mon plan | `/mattpocock-skills:grilling` |
| Transformer une idée en plan étape par étape | `/superpowers:writing-plans` |
| Tester une idée vite avec un prototype jetable | `/mattpocock-skills:prototype` |
| Découper un gros travail en tickets | `/mattpocock-skills:to-tickets` |

### Pendant que je code

| Je veux… | Je tape… |
| --- | --- |
| Réparer un bug | `/superpowers:systematic-debugging` |
| Un bug très difficile ou une lenteur | `/mattpocock-skills:diagnosing-bugs` |
| Écrire les tests d'abord | `/superpowers:test-driven-development` |
| Exécuter un plan déjà écrit | `/superpowers:executing-plans` |
| Faire plusieurs tâches indépendantes en parallèle | `/superpowers:dispatching-parallel-agents` |

### Après avoir codé

| Je veux… | Je tape… |
| --- | --- |
| Chercher les bugs dans mes modifications | `/code-review` |
| Nettoyer et simplifier le code modifié | `/simplify` |
| Vérifier la sécurité | `/security-review` |
| Vérifier que tout marche vraiment avant de dire « fini » | `/superpowers:verification-before-completion` |
| Lancer l'appli pour voir le résultat | `/run` |
| Rédiger la description d'une pull request | `/mattpocock-skills:pr` |

### Documents et fichiers

| Je veux… | Je tape… |
| --- | --- |
| Un document Word | `/docx` |
| Lire ou créer un PDF | `/pdf` |
| Un tableur Excel ou CSV | `/xlsx` |
| Une présentation PowerPoint | `/pptx` |
| Une recherche approfondie sur internet avec rapport | `/deep-research` |
| Un graphique propre | `/dataviz` |
| Rendre un texte moins « robot » | `/humanizer:humanizer` |

### Gérer Claude lui-même

| Je veux… | Je tape… |
| --- | --- |
| Économiser des tokens | `/economie-tokens` |
| Moins de demandes d'autorisation | `/fewer-permission-prompts` |
| Créer mon propre skill | `/skill-creator` |
| Répéter une tâche régulièrement (ex. toutes les 10 min) | `/loop` |
| Programmer une tâche dans le cloud (ex. tous les matins) | `/schedule` |
| Changer un réglage (« à chaque fois que… ») | `/update-config` |

---

## 6. Plugins complémentaires à connaître

À installer avec `/plugin install <nom>@claude-plugins-official`. Les détails et le « pourquoi » sont dans [SKILLS-INSTALLES.md](SKILLS-INSTALLES.md).

| Plugin | Quand l'installer |
| --- | --- |
| `context7` | Maintenant : documentation à jour des bibliothèques (TanStack, Drizzle, Better Auth…) |
| `typescript-lsp` | Maintenant : Claude comprend mieux le code TypeScript |
| `security-guidance` | Maintenant : signale les failles de sécurité pendant l'écriture |
| `redis-development` | Quand tu attaques Redis / BullMQ |
| `cloudflare` | Quand tu branches R2 (stockage de fichiers) |
| `stripe` | Quand tu branches le paiement |
| `sentry` | Une fois le site en ligne, pour suivre les erreurs |

N'installe pas trop de plugins : chacun ajoute du texte à chaque conversation et consomme des tokens.

---

## 7. Les 5 réflexes à garder

1. **Changement de sujet → `/clear`.**
2. **Je pars de mon PC → `claude remote-control`** (et le PC reste allumé).
3. **Je reviens sur mon PC → `claude -c`** pour reprendre là où j'en étais.
4. **Claude part dans la mauvaise direction → `Échap`**, puis je corrige.
5. **J'ai oublié une commande → `/`** et je lis la liste.
