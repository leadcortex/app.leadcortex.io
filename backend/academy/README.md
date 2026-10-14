## État du projet

## Lancement local

Depuis deux terminaux à la racine du dépôt :

1. Démarrer l'API Academy :

   ```powershell
   Set-Location backend\academy
   go run ./cmd/academy-server -env development -addr :8080 -content content
   ```

2. Démarrer le frontend :

   ```powershell
   npm run dev
   ```

Le frontend est disponible sur `http://localhost:3000`. Vite relaie `/api/v1`
vers `http://localhost:8080`; le mode développement utilise l'apprenant
`default`. `VITE_API_BASE_URL` permet de remplacer cette URL si nécessaire.

### Phase 1 — Fondations moteur (backend Go) ✅
- [x] Partie 1 — Fondations : module, config, logger, serveur HTTP, CLI
- [x] Partie 2 — Domaine métier (Learner, Program, Lesson, Exercise…)
- [x] Partie 3 — Curriculum : loader YAML, DSL polymorphe, validator
- [x] Partie 4 — Progression : FSM, gates, Engine.Apply, Snapshot
- [x] Partie 5 — Évaluation : 7 scorers, normalisation, feedback
- [x] Partie 6 — SRS : SM-2 adapté, instantiator, queue, forecast

### Phase 2 — Expérience apprenant ✅
- [x] Partie 7 — Gamification : XP, streak, hearts, badges, quêtes
- [x] Partie 8 — Avatars : 12 mascottes, déblocage, SVG pipeline
- [x] Partie 9 — Missions in-app : EventBus, Validator, Orchestrator
- [x] Partie 10 — Adaptivité : signaux, profil, difficulté, recommandation

### Phase 3 — Contenu pédagogique ✅
- [x] Parties 11-15 — 5 programmes, 20 modules, 40 leçons, 40 missions
- [x] Fichiers compagnons : 12 avatars, 19 badges

### Phase 4 — API & Frontend (en cours)
- [x] Partie 16 — API HTTP Go (REST + SSE)
- [x] Partie 17 — UI React Desktop
- [ ] Partie 18 — UI React Mobile
- [ ] Partie 19 — Intégration finale

## Endpoints API

Une fois l'API démarrée comme indiqué dans « Lancement local », elle est
disponible sur `http://localhost:8080`.

**Santé**
- `GET /healthz` — liveness
- `GET /readyz` — readiness
- `GET /version` — métadonnées de build

**Profil** (`/api/v1`)
- `GET /me`
- `GET /me/snapshot`
- `PATCH /me/equip-avatar`
- `GET /me/recommendation`
- `POST /me/plan`

**Curriculum**
- `GET /programs`
- `GET /programs/{id}`
- `GET /lessons/{id}`
- `POST /lessons/{id}/start`
- `POST /lessons/{id}/blocks/{i}/view`
- `POST /lessons/{id}/exercises/{eid}/answer`

**Missions & Events**
- `GET /missions`
- `POST /missions/{id}/attempt`
- `POST /events`
- `GET /events/stream` (SSE)

**SRS**
- `GET /srs/queue`
- `POST /srs/cards/{id}/review`
- `GET /srs/stats`
- `GET /srs/forecast`

**Avatars**
- `GET /avatars`
- `POST /avatars/equip`

**Quêtes**
- `GET /quests`
- `POST /quests/{id}/claim`

## Authentification (V1)

Aucune auth 2.0. Les routes `/api/v1/*` exigent l'en-tête `X-Learner-ID`.

En développement (`ACADEMY_ENV=development`), l'absence de cet en-tête
utilise automatiquement l'identifiant `"default"`. En production, un
en-tête manquant renvoie 401.

## Notes d'implémentation

- **Cartes SRS** : instanciées paresseusement à chaque appel SRS depuis
  les `SrsTemplates` des leçons complétées (voir `syncSrsCards` dans
  `internal/api/handlers_srs.go`).
- **Quêtes quotidiennes** : générées à la volée au premier appel du jour,
  progression automatique branchée dans les handlers d'exercices, de
  missions et d'événements.
- **SSE** : le hub diffuse les événements publiés sur le bus. En V1, il
  n'y a pas de boucle d'écoute asynchrone — les événements arrivent via
  `POST /events` puis sont publiés sur le bus.