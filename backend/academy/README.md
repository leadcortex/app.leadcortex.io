# LeadCortex Academy — Backend

Moteur d'apprentissage pédagogique pour LeadCortex : programmes, leçons, missions in-app,
spaced repetition et gamification. Écrit en Go, alimenté par des programmes YAML.

## Objectif

Transformer l'app LeadCortex en terrain d'entraînement vivant : chaque leçon se termine
par une **mission in-app** — l'utilisateur doit réellement exécuter ce qu'il a appris
dans l'interface (créer un prospect, rédiger un email, lancer une séquence…).

## Architecture

```
cmd/                 → points d'entrée (serveur HTTP + CLI dev)
internal/
  version/           → métadonnées de build (version, commit, date)
  config/            → configuration (fichier + env + flags)
  logger/            → logging structuré (zerolog)
  domain/            → types métier (Learner, Program, Lesson…)       [Partie 2]
  curriculum/        → chargement + validation des programmes YAML    [Partie 3]
  progress/          → moteur de progression (FSM)                    [Partie 4]
  assessment/        → moteur d'évaluation des exercices              [Partie 5]
  srs/               → spaced repetition (SM-2)                       [Partie 6]
  gamification/      → XP, streaks, badges, quêtes                    [Partie 7]
  avatars/           → système d'avatars débloquables                 [Partie 8]
  missions/          → orchestrateur de missions in-app               [Partie 9]
  adaptivity/        → personnalisation et recommandations           [Partie 10]
  repository/        → interface de persistance (dev: in-memory)      [Partie 16]
  api/               → serveur HTTP (REST + SSE)                      [Partie 16]
content/
  programs/          → programmes pédagogiques en YAML                [Parties 11-15]
  schemas/           → schémas JSON de validation
```

## Démarrage rapide

```bash
# Compiler
make build

# Lancer le serveur en mode dev
make run

# Valider les programmes YAML
make validate-content

# Tests
make test
```

## Configuration

Variables d'environnement (toutes optionnelles en dev) :

| Variable | Défaut | Description |
|---|---|---|
| `ACADEMY_ENV` | `development` | `development` / `staging` / `production` |
| `ACADEMY_HTTP_ADDR` | `:8080` | Adresse d'écoute du serveur |
| `ACADEMY_CONTENT_DIR` | `./content` | Chemin vers les YAML de contenu |
| `ACADEMY_LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `ACADEMY_LOG_FORMAT` | `json` | `json` / `console` |

Un fichier `academy.yaml` à la racine est aussi lu (voir `config.example.yaml`).

## État du projet

- [x] Partie 1 — Fondations (structure, config, logger)
- [ ] Partie 2 — Domaine métier
- [ ] Partie 3 — Moteur de curriculum
- [ ] … (voir le plan global dans la documentation interne)