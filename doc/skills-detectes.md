# Skills détectés

Généré le 2026-11-24 par `node scripts/lister-skills.mjs`. 70 skills trouvés.

## Plugin mattpocock-skills (v1.3.2)

| Skill | À quoi il sert |
| --- | --- |
| `mattpocock-skills:ask-matt` | Demander quel skill ou quelle méthode convient à ta situation. |
| `mattpocock-skills:chief-of-staff` | Poursuivre un objectif long dans une seule session en coordonnant des sous-agents. |
| `mattpocock-skills:claude-handoff` | Confier la conversation en cours à un nouvel agent en arrière-plan qui reprend le travail tout de suite. |
| `mattpocock-skills:code-review` | Relire les changements depuis un point fixe (commit, branche, tag) sous deux angles : respect des règles de code du projet, et conformité à ce que la demande/spec exigeait. |
| `mattpocock-skills:codebase-design` | Vocabulaire commun pour concevoir des modules « profonds » (interface simple, logique cachée à l'intérieur). |
| `mattpocock-skills:diagnosing-bugs` | Boucle de diagnostic pour les bugs difficiles et les baisses de performance. |
| `mattpocock-skills:domain-modeling` | Construire et affiner le modèle métier du projet (vocabulaire, glossaire, décisions d'architecture). |
| `mattpocock-skills:git-guardrails-claude-code` | Installer des hooks Claude Code qui bloquent les commandes git dangereuses (push, reset --hard, clean, branch -D…) avant leur exécution. |
| `mattpocock-skills:grill-me` | Un interrogatoire serré pour affûter un plan ou une conception. |
| `mattpocock-skills:grill-with-docs` | Même interrogatoire serré, mais qui rédige au passage la documentation (décisions d'architecture et glossaire). |
| `mattpocock-skills:grilling` | Te questionner sans relâche sur un plan, une décision ou une idée. |
| `mattpocock-skills:handoff` | Résumer la conversation en cours dans un document de passation pour qu'un autre agent reprenne. |
| `mattpocock-skills:implement` | Coder un travail à partir d'une spec ou d'une liste de tickets. |
| `mattpocock-skills:implement-spec` | Coder le résultat produit par /to-spec et /to-tickets. |
| `mattpocock-skills:improve-codebase-architecture` | Analyser le code pour trouver des améliorations d'architecture, les présenter dans un rapport HTML visuel, puis creuser celle que tu choisis. |
| `mattpocock-skills:loop-me` | Te questionner pour préciser les specs des automatisations que tu veux construire dans ce projet. |
| `mattpocock-skills:migrate-to-shoehorn` | Remplacer, dans les fichiers de test, les assertions de type `as` par la bibliothèque @total-typescript/shoehorn. |
| `mattpocock-skills:pr` | À utiliser pour rédiger la description d'une pull request. |
| `mattpocock-skills:prototype` | Construire un prototype jetable pour répondre à une question de conception. |
| `mattpocock-skills:research` | Rechercher une question dans des sources fiables et enregistrer les résultats dans un fichier Markdown du projet. |
| `mattpocock-skills:retro` | Faire le bilan (rétrospective) d'une session de code. |
| `mattpocock-skills:scaffold-exercises` | Créer l'arborescence d'exercices (sections, énoncés, solutions, explications) qui passe le lint. |
| `mattpocock-skills:setup-matt-pocock-skills` | Configurer le projet pour ces skills : outil de tickets, étiquettes de tri et emplacement de la doc métier. |
| `mattpocock-skills:setup-pre-commit` | Installer des vérifications avant chaque commit (Husky + lint-staged) : formatage Prettier, vérification des types et tests. |
| `mattpocock-skills:setup-ts-deep-modules` | Brancher dependency-cruiser sur un projet TypeScript pour que chaque dossier n'expose que ses fichiers d'entrée et cache le reste. |
| `mattpocock-skills:software-factory` | Vocabulaire commun pour concevoir une « usine logicielle » : les tâches qu'elle exécute et les services auxquels elle se branche. |
| `mattpocock-skills:tdd` | Développement piloté par les tests (écrire le test avant le code). |
| `mattpocock-skills:teach` | T'apprendre une nouvelle compétence ou notion, directement dans ce projet. |
| `mattpocock-skills:to-questionnaire` | Transformer une décision que tu ne peux pas trancher seul en questionnaire à faire remplir par quelqu'un d'autre. |
| `mattpocock-skills:to-spec` | Transformer la conversation en cours en spec et la publier dans l'outil de tickets, sans interrogatoire, juste en synthétisant ce qui a été dit. |
| `mattpocock-skills:to-tickets` | Découper un plan, une spec ou la conversation en petits tickets (avec leurs dépendances) publiés dans l'outil de tickets. |
| `mattpocock-skills:triage` | Faire avancer les tickets et les pull requests externes dans un circuit de tri : classer, vérifier, questionner si besoin, et rédiger des consignes prêtes pour un agent. |
| `mattpocock-skills:wait-what` | Stop : on s'arrête pour faire le point. |
| `mattpocock-skills:wayfinder` | Planifier un très gros chantier (trop gros pour une seule session) sous forme de carte de tickets de décision, résolus un par un. |
| `mattpocock-skills:wizard` | Générer un assistant interactif en bash qui te guide pas à pas dans les étapes que toi seul peux faire. |
| `mattpocock-skills:writing-beats` | Écriture : organiser la matière brute en une suite d'étapes, en définissant chaque terme avant de s'en servir. |
| `mattpocock-skills:writing-for-agents` | Rédiger des documents destinés aux agents (skills, CLAUDE.md, AGENTS.md). |
| `mattpocock-skills:writing-fragments` | Écriture, phase d'exploration : extraire des idées brutes, sans structure pour l'instant. |
| `mattpocock-skills:writing-shape` | Écriture : mettre en forme la matière brute en article, paragraphe par paragraphe. |

## Plugin superpowers (v7.0.2)

| Skill | À quoi il sert |
| --- | --- |
| `superpowers:brainstorming` | À utiliser OBLIGATOIREMENT avant tout travail créatif : nouvelle fonctionnalité, nouveau composant, changement de comportement, ou tout nouveau projet. |
| `superpowers:diagnosing-superpowers` | Comprendre pourquoi une session superpowers s'est mal passée (travail répété, plan ignoré, skill non déclenché, trop long, trop cher…) ou préparer un rapport de bug. |
| `superpowers:dispatching-parallel-agents` | Face à 2 tâches indépendantes ou plus, les répartir entre plusieurs agents qui travaillent en parallèle. |
| `superpowers:executing-plans` | Exécuter soi-même un plan d'implémentation dans la session en cours (sans sous-agents). |
| `superpowers:finishing-a-development-branch` | Quand le travail est fini et les tests passent : décider comment l'intégrer (merge, pull request…). |
| `superpowers:receiving-code-review` | Quand on reçoit des retours de relecture : les vérifier avec rigueur avant de les appliquer, surtout s'ils semblent flous ou discutables. |
| `superpowers:requesting-code-review` | Demander une relecture du code après une tâche ou une grosse fonctionnalité, avant de fusionner. |
| `superpowers:subagent-driven-development` | Exécuter un plan d'implémentation en confiant ses tâches indépendantes à des sous-agents. |
| `superpowers:systematic-debugging` | Face à un bug, un test qui échoue ou un comportement inattendu : chercher la vraie cause avant de proposer une correction. |
| `superpowers:test-driven-development` | Écrire les tests avant le code, pour toute nouvelle fonctionnalité ou correction de bug. |
| `superpowers:using-git-worktrees` | Créer un espace de travail isolé (git worktree) avant de commencer une fonctionnalité ou d'exécuter un plan. |
| `superpowers:using-superpowers` | Au début de chaque conversation : explique comment trouver et utiliser les skills, à invoquer avant toute réponse. |
| `superpowers:verification-before-completion` | Avant d'annoncer qu'un travail est fini ou corrigé : lancer les vérifications et montrer les résultats. Des preuves avant les affirmations. |
| `superpowers:writing-plans` | Quand on a une spec ou des exigences pour une tâche en plusieurs étapes : rédiger le plan avant de toucher au code. |
| `superpowers:writing-skills` | Créer ou modifier des skills, et vérifier qu'ils fonctionnent avant de les utiliser. |

## Plugin tdd-guard (v1.3.0)

| Skill | À quoi il sert |
| --- | --- |
| `tdd-guard:setup` | Installer ou mettre à jour TDD Guard (garde-fou qui impose d'écrire les tests d'abord) dans le projet. |

## Plugin humanizer (v4.0.0)

| Skill | À quoi il sert |
| --- | --- |
| `humanizer:humanizer` | Réécrire un texte qui « sonne IA » pour qu'il paraisse écrit par une personne, sans changer le fond. |

## Skills synchronisés depuis claude.ai

| Skill | À quoi il sert |
| --- | --- |
| `built-in-browser` | À lire avant d'utiliser le navigateur intégré à l'application de bureau Claude. |
| `chrome-browser` | À lire avant d'utiliser Claude in Chrome, l'extension qui pilote ton vrai navigateur Chrome. |
| `computer-use` | À lire avant de faire quelque chose dans une application de ton ordinateur (Notes, Finder, Réglages…) ou de regarder ton écran. |
| `deep-research` | Faire une recherche approfondie sur plusieurs sources (comparer des options, analyser un marché, une tendance, des études) et en tirer un rapport complet. |
| `docs` | Créer des documents modifiables, partageables et commentables (rapport, proposition, CV, lettre, guide…), exportables en Word, PDF ou Google Docs. |
| `docx` | Créer, lire ou modifier des documents Word (.docx) ou des modèles Word (.dotx). |
| `google-workspace` | À lire avant de créer ou modifier un fichier Google (Drive, Docs, Sheets, Slides). |
| `import-memory` | Importer dans la mémoire de Claude un export de mémoire venant d'un autre assistant IA. |
| `morning` | Afficher ton résumé du matin sous forme de page HTML, ou le programmer chaque jour de semaine. |
| `pdf` | Tout ce qui touche aux fichiers PDF : lire, fusionner, découper, remplir des formulaires, créer… |
| `pptx` | Tout ce qui touche aux présentations PowerPoint (.pptx ou .potx), en entrée comme en sortie. |
| `skill-creator` | Créer de nouveaux skills, améliorer ceux qui existent et mesurer leurs performances. |
| `xlsx` | Tout travail dont le fichier principal est un tableur (Excel, CSV…), en entrée ou en sortie. |

## Skills personnels (~/.claude/skills)

| Skill | À quoi il sert |
| --- | --- |
| `economie-tokens` | Quand tu veux économiser des tokens, éviter d'atteindre les limites d'utilisation ou réduire les coûts, ou que la session devient longue ou lente. |
