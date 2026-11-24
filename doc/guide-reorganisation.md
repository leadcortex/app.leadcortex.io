# Guide de réorganisation : LeadCortex (arborescence pro)

> Ce guide dit **quoi** changer et **où**, pas comment le faire fichier par fichier.
> Il a été rédigé uniquement à partir des noms de fichiers + `package.json`, `tsconfig.json`, `vite.config.ts`, `drizzle.config.ts`, `.gitignore`.
> Chaque point marqué ⚠️ est à **vérifier** avant de supprimer (je n'ai pas lu le contenu).

---

## 1. Diagnostic : ce qui ne va pas aujourd'hui

| # | Problème | Où |
|---|----------|----|
| 1 | Le code est coupé en deux sans raison : `frontend/` (le vrai code) et `src/` (5 fichiers : router, start, server, routeTree, 1 fichier serveur) | racine |
| 2 | Base de données + serveur mélangés au front : `database.server.ts`, `auth-schema.ts`, `auth.server.ts`, `gmail.server.ts`, `token-crypto.server.ts`, `rate-limit.ts` sont dans `frontend/lib/` ; les routes `api.*` et `auth.*` sont dans `frontend/routes/` ; `drizzle/` est à la racine et `drizzle.config.ts` pointe sur `frontend/lib/auth-schema.ts` | `frontend/lib`, `frontend/routes`, racine |
| 3 | Mobile et desktop **mélangés** : ~24 composants testent `isMobile` en interne ; des fichiers `mobile-*` traînent partout (`components/mobile/`, `mobile-bottom-nav.tsx`, `mobile-nav-menu.tsx`, `settings/mobile-settings-sheet.tsx`, `workflow/Mobile*.tsx`, `ui/mobile-sheet.tsx`, `lib/mobile-nav-tree.ts`, `lib/mobile-search-index.ts`…) | `frontend/components`, `frontend/lib` |
| 4 | `frontend/components/` a ~245 fichiers dont ~55 en vrac à la racine (sans sous-dossier) | `frontend/components/*.tsx` |
| 5 | `frontend/lib/` est un fourre-tout : utilitaires, mocks, stores, serveur, métier, tests | `frontend/lib` |
| 6 | Doublons : `academy/src/components/ui/*` ≈ `frontend/components/ui/*` ; `error-capture.ts`, `error-page.ts`, `use-mobile.tsx`, `utils.ts`, `routeTree.gen.ts`, `router.tsx`, `start.ts`, `server.ts` existent en double (front + academy) | `academy/`, `frontend/` |
| 7 | Deux routes Academy : `frontend/routes/app.academy.*` **et** `academy/src/routes/*` (profil / recompenses / revision vs profile / rewards / review) ⚠️ | routes |
| 8 | Deux lockfiles (`bun.lock` + `package-lock.json`) | racine |
| 9 | Fichiers hors-sujet à la racine : `model.ts` (n'est importé que par `lesson-player.tsx`), `AUTH-OAUTH-BACKEND.md`, `SUPABASE-DATABASE.md`, `prompt-reutilisable/`, `command/` (dont un fichier mal nommé `m_mo_des_commandes_utiles.md`) | racine |
| 10 | Fichiers générés / binaires qui ne doivent pas être dans le dépôt : `.tanstack/tmp/`, `dist/`, `.git/cursor/`, `backend/academy/bin/*` (binaires Go), `public/videos/*.mov` (en plus du `.webm`) | divers |
| 11 | Routes incohérentes : convention à points (`app.people.$id.tsx`) **et** dossiers (`app/sequences/…`) | `frontend/routes` |
| 12 | CSS monolithiques : `frontend/styles.css` (~2 500 lignes) et `academy.css` (~5 500 lignes) | styles |
| 13 | Fichiers énormes à découper : `app.emails.tsx` (~2 200 l.), `workflow-blocks-catalog.tsx` (~2 800 l.), `routes/index.tsx` (~1 600 l.), `onboarding.tsx` (~1 500 l.), `terminal-commands.ts` (~1 500 l.), `assistant-sidebar.tsx` (~1 400 l.), `Canvas.tsx` (~1 300 l.) | divers |
| 14 | Données factices mélangées au vrai code : `mock-data.ts`, `booking-mock.ts`, `conversations-mock.ts`, `enrichment-mock.ts`, `message-demo.ts` | `frontend/lib` |

> 🔐 **Sécurité** : le zip contenait un `.env`. S'il contenait de vraies clés (base de données, Google OAuth, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`), **régénère-les** et ne partage plus jamais ce fichier. `.env.example` suffit.

---

## 2. Arborescence cible (principe)

Un seul dépôt, **une seule app**, mais **deux arbres UI totalement séparés** (mobile / desktop) qui partagent uniquement de la logique sans interface.

```
leadcortex/
├─ .env.example
├─ package.json  tsconfig.json  vite.config.ts  eslint.config.js  prettier…
├─ docs/                      ← doc/, AUTH-OAUTH-BACKEND.md, SUPABASE-DATABASE.md, prompts, mémo des commandes
├─ scripts/                   ← command/*.sh (ceux qui servent vraiment)
├─ public/
│   ├─ images/   (par page : landing/, app/, auth/)
│   └─ videos/
├─ database/                  ← drizzle.config.ts, migrations (drizzle/), schéma
├─ services/
│   └─ academy-api/           ← l'actuel backend/academy (Go) sans bin/
├─ apps/
│   └─ academy/               ← l'actuel dossier academy/ (voir §6)
└─ src/
    ├─ app/                   ← router.tsx, start.ts, server.ts, routeTree.gen.ts, providers
    ├─ routes/                ← fichiers FINS : ils choisissent mobile OU desktop, rien d'autre
    ├─ desktop/               ← 100 % desktop
    │   ├─ pages/             (une sous-dossier par page : people/, companies/, emails/, workflows/…)
    │   ├─ features/          (ai-assistant/, workflow/, mail/, enrichment/, settings/…)
    │   ├─ layout/            (shell, sidebar, tabs…)
    │   ├─ ui/                (composants de base desktop)
    │   ├─ hooks/
    │   └─ styles/
    ├─ mobile/                ← 100 % mobile (même squelette que desktop/)
    │   ├─ pages/  features/  layout/  ui/  hooks/  styles/
    │   └─ navigation/        (bottom-nav, nav-tree, search-index mobile)
    ├─ shared/                ← logique SANS interface visuelle
    │   ├─ types/
    │   ├─ stores/
    │   ├─ engines/           (workflow-engine, assistant-engine, constraints…)
    │   ├─ api-client/        (appels HTTP côté navigateur)
    │   ├─ utils/
    │   ├─ i18n/ + constants/
    │   └─ mocks/             (tous les *-mock.ts, mock-data.ts, message-demo.ts)
    ├─ marketing/             ← site public : landing, pricing, product, docs, legal, support (desktop + mobile gérés en CSS responsive, c'est du contenu)
    └─ server/                ← TOUT ce qui touche base de données, secrets, OAuth, Gmail
        ├─ db/                (connexion, schéma, accès)
        ├─ auth/
        ├─ mail/              (gmail, chiffrement des tokens)
        ├─ security/          (rate-limit, garde)
        ├─ ai/                (sequence-ai.server.ts)
        └─ http/              (handlers des routes api.* et auth.*)
```

---

## 3. Règles d'or (à imposer, idéalement via ESLint)

1. **`desktop/` n'importe jamais `mobile/`, et inversement.** Règle `no-restricted-imports` dans `eslint.config.js`.
2. **`shared/` n'importe ni `desktop/` ni `mobile/`**, et ne contient aucun JSX de mise en page.
3. **`server/` n'est importé que par `routes/` (handlers) et par lui-même.** Jamais par `desktop/`, `mobile/`, `shared/`. Le navigateur n'appelle le serveur que via `shared/api-client/`.
4. **Un composant = un seul rôle.** Plus aucun `if (isMobile)` à l'intérieur d'un composant. Le choix mobile/desktop se fait **une seule fois**, dans `routes/`.
5. **Le dossier `routes/` reste fin.** Un fichier de route = quelques lignes : il charge la page desktop ou mobile. Charger les deux versions en **lazy** pour que le mobile ne télécharge jamais le code desktop (et inversement).
6. **Un fichier = un sujet**, pas de fichier > ~300 lignes sans bonne raison.
7. **Un dossier de plus vaut mieux qu'un fichier fourre-tout** : dès qu'un dossier dépasse ~10 fichiers, on le découpe par fonctionnalité.
8. **Plus de fichiers à la racine d'un dossier de composants** : tout est rangé dans un sous-dossier métier (`data-table`, `empty-state`, `confirm-dialog`… vont dans `ui/` ou dans la feature qui les utilise).

---

## 4. Séparation mobile / desktop : le plan

### 4.1 Principe
- **Même URL, deux interfaces.** La route décide laquelle afficher.
- Chaque page existe en **deux versions** : `desktop/pages/<page>/` et `mobile/pages/<page>/`. Tu peux les personnaliser séparément sans jamais risquer de casser l'autre.
- Le mobile devient « une deuxième app dans l'app » : ses propres composants UI, ses propres hooks (clavier virtuel, appui long, drag tactile), son propre CSS.

### 4.2 Où partent les fichiers actuels (catégories, pas liste exhaustive)

| Actuellement | Va vers |
|---|---|
| `components/mobile/*`, `mobile-bottom-nav`, `mobile-nav-menu` | `mobile/ui/` et `mobile/navigation/` |
| `settings/mobile-settings-sheet`, `ui/mobile-sheet`, `ui/drawer`-usage mobile | `mobile/features/settings/`, `mobile/ui/` |
| `workflow/Mobile*.tsx` (ChatDock, GearMenu, TopBar, WorkflowDrawer) | `mobile/features/workflow/` |
| `lib/mobile-nav-tree.ts`, `lib/mobile-search-index.ts` | `mobile/navigation/` |
| `hooks/use-virtual-keyboard`, `use-long-press`, `lib/workflow/block-touch-drag.ts`, `scroll-field-into-view.ts` | `mobile/hooks/` |
| `hooks/use-mobile.tsx` | `app/` (c'est le **seul** endroit qui détecte l'appareil) |
| Les ~24 composants qui contiennent `isMobile` | **à scinder en 2** : version desktop + version mobile |
| `academy-mobile-sheet.tsx` | `apps/academy/src/mobile/` |

### 4.3 Comment scinder un composant « mixte »
1. Identifier le bloc `isMobile ? A : B`.
2. Créer `desktop/…/Composant.tsx` (garde B) et `mobile/…/Composant.tsx` (garde A).
3. Supprimer le test `isMobile` et le composant d'origine.
4. Sortir la logique commune (calculs, état) vers un hook dans `shared/`, **pas** le JSX.

Ordre conseillé : commencer par les pages les plus simples (`tasks`, `saved`, `lists`) avant les gros morceaux (`emails`, `workflows`, `people`).

### 4.4 Détection de l'appareil
- Un seul mécanisme, centralisé dans `app/`.
- ⚠️ Prévoir le rendu serveur (SSR) : si la détection se fait uniquement côté navigateur, on risque un « flash » desktop → mobile au chargement. Piste : détecter côté serveur (en-tête de la requête) ou ne basculer qu'après hydratation avec un squelette neutre (tu as déjà `skeletons/hydration-gate.tsx`).

---

## 5. Base de données et serveur : où les mettre

Objectif : **rien de sensible dans le dossier front**, et un chemin clair front → `api-client` → handler → base.

- Déplacer vers `src/server/db/` : `database.server.ts`, `auth-schema.ts`.
- Déplacer vers `src/server/auth/` : `auth.server.ts`, `auth.functions.ts`, routes `auth.*`.
- Déplacer vers `src/server/mail/` : `gmail.server.ts`, `token-crypto.server.ts`, routes `api.mail.*`.
- Déplacer vers `src/server/security/` : `rate-limit.ts`. ⚠️ `client-api.ts` et `client-guard.tsx` sont côté navigateur → `shared/api-client/` et `shared/guards/`.
- `drizzle.config.ts` + `drizzle/` → `database/`, et **mettre à jour le chemin du schéma** dans la config.
- Les routes `api.*` / `auth.*` restent des fichiers fins dans `src/routes/` qui appellent un handler dans `server/http/`.
- Suffixe `.server.ts` à conserver : c'est ce qui empêche l'embarquement dans le bundle navigateur.
- ⚠️ Vérifier si `src/server/sequences/sequence-ai.server.ts` et `lib/sequence-ai.functions.ts` sont encore utilisés.
- Les variables d'environnement lues côté serveur uniquement (jamais préfixées `VITE_`) : c'est déjà le cas dans `.env.example`, garde-le.

---

## 6. Dossier `academy/` et `backend/academy` (Go)

Deux décisions à prendre **avant** de bouger quoi que ce soit :

1. **Academy reste une app séparée ?**
   - Oui → la déplacer dans `apps/academy/` et la traiter comme son propre mini-projet (même règles mobile/desktop).
   - Non → la fusionner dans `src/` sous `desktop/features/academy/` + `mobile/features/academy/`, et supprimer ses doublons (`ui/`, `routeTree`, `router`, `start`, `server`, `error-*`, `use-mobile`, `utils`).
   - Dans tous les cas, **une seule série de routes Academy** (supprimer celle qui est morte, voir ⚠️ §1 point 7).
2. **Le backend Go sert-il encore ?** Le `vite.config.ts` proxifie `/api/v1` vers `localhost:8080`, donc oui pour Academy. Si tu veux un site « frontend only », c'est cette décision qui le permet.
   - Le garder → `services/academy-api/`, supprimer `bin/` (binaires), fusionner `content/programs/*.json` avec les JSON de `academy/src/data/curriculum/` (même contenu en double ⚠️ — garder **une seule source**).
   - `model.ts` (racine) → à ranger avec le code Academy qui l'utilise.

---

## 7. Fichiers morts et inutiles à supprimer (catégories)

Supprimer / ne plus versionner :
- `.tanstack/`, `dist/`, `.git/cursor/`, `.vscode/settings.json` (perso), `.env` (déjà ignoré, ne jamais l'exporter)
- `backend/.gitkeep`, `backend/academy/bin/*`
- Un des deux lockfiles (garde celui du gestionnaire que tu utilises vraiment : `bun.lock` ou `package-lock.json`)
- `public/videos/otp-tutorial.mov` si le `.webm` suffit ⚠️ (compatibilité Safari)
- Les doublons de `ui/` dans Academy
- Les scripts perso sans lien avec le produit (`Qwen2.5.sh`, `code-aleatoire.sh`…) → hors dépôt
- `prompt-reutilisable/` → `docs/` ou hors dépôt
- `index.html` ⚠️ (TanStack Start génère souvent le HTML lui-même ; tester le build sans)
- Tout composant `ui/` shadcn **jamais importé** (tu en as ~50 : beaucoup ne servent sûrement pas)

À **détecter automatiquement** plutôt qu'à la main (outils dédiés) :
- fichiers jamais importés → `knip` (ou `ts-prune`)
- dépendances inutilisées dans `package.json` → `knip` / `depcheck`
- imports circulaires → `madge --circular`

Faire d'abord un **commit propre**, puis supprimer par petits lots avec `tsc --noEmit` + `eslint` entre chaque lot.

---

## 8. Commentaires et en-têtes de chemin

Ton souhait : retirer tous les commentaires `//` explicatifs, ne garder que le chemin exact en première ligne.

- Format unique recommandé (à décider une fois) : `// src/desktop/pages/people/PeoplePage.tsx` (slashs `/`, pas `\`, chemin depuis la racine).
- ⚠️ Après la réorganisation, **tous les chemins actuels seront faux** → ne pas les corriger à la main : écrire un petit script qui, pour chaque fichier `.ts/.tsx`, supprime l'ancien en-tête de chemin et réécrit le bon à partir de l'emplacement réel.
- ⚠️ Pièges du nettoyage automatique des `//` :
  - `https://…` dans les chaînes de caractères
  - regex et chaînes contenant `//`
  - à **conserver** : `// @ts-expect-error`, `// eslint-disable…`, `/// <reference …>`, `// prettier-ignore`
  - blocs JSX `{/* … */}` et `/** … */` (à traiter à part si tu les veux supprimés aussi)
- Fichiers non-code (`.json`, `.css`, `.sql`) : soit un en-tête adapté (`/* … */` en CSS), soit rien. JSON n'accepte pas les commentaires.
- Fichiers Go : garder les `doc.go` s'ils servent, sinon pareil.

---

## 9. CSS : cohérent avec la séparation

- `styles.css` (2 500 l.) → découper : `app/styles/` (tokens, thème, reset) + un fichier de style **à côté de chaque composant ou de chaque feature**.
- Un dossier `styles/` dans `desktop/` et dans `mobile/` : plus de media queries qui font cohabiter les deux mondes.
- `academy.css` (5 500 l.) → même découpage (par leçon, exercice, dictionnaire…).
- Garder les corrections **ciblées sur le composant**, pas des surcharges globales.

---

## 10. Routes : une seule convention

- Choisir **les dossiers** (déjà utilisé pour `sequences/`) : `routes/app/people/index.tsx`, `routes/app/people/$id.tsx`, `routes/app/people/new.tsx`…
- Grouper : `routes/app/`, `routes/marketing/` (landing, pricing, product, security, support, docs, legal), `routes/auth/`, `routes/api/`.
- ⚠️ `vite.config.ts` contient `routesDirectory: "../frontend/routes"` → à mettre à jour, et vérifier que `routeTree.gen.ts` se régénère au bon endroit.

---

## 11. Les 3 réglages techniques à ne pas oublier

1. **Alias `@/`** : `tsconfig.json` (`@/* → ./frontend/*`) et `components.json` (shadcn) doivent suivre le nouveau dossier. Prévoir des alias par zone : `@desktop/`, `@mobile/`, `@shared/`, `@server/`.
2. **`include` de `tsconfig.json`** et `eslint.config.js` : pointer sur `src/**`.
3. **`drizzle.config.ts`** : chemin du schéma + dossier de migrations.

---

## 12. Optimisation (« à 100 »)

Dans l'ordre d'impact, sans tout détailler :

1. **Séparation lazy mobile / desktop** (§3 règle 5) : c'est le plus gros gain de poids initial.
2. **Découper les routes en chunks** : chaque page chargée à la demande.
3. **Charger à la demande** les modules lourds : éditeur de code (CodeMirror), canvas du workflow, graphiques, éditeur d'e-mails, Academy.
4. **Découper les fichiers géants** (§1, point 13) : meilleur cache, meilleur rechargement à chaud.
5. **Dépendances** : supprimer les inutilisées, remplacer les très lourdes si une version légère existe.
6. **Images / vidéos** : WebP déjà bien ; tailles responsives, `loading="lazy"`, vidéo seulement au clic.
7. **CSS** : découpé par zone (§9), supprimer le CSS mort.
8. **Polices** : sous-ensemble, `font-display: swap`, préchargement des seules polices critiques.
9. **Mesurer** : Lighthouse (mobile **et** desktop séparément) avant / après + analyseur de bundle (`vite-bundle-visualizer`). Objectif : Performance, Accessibilité, Bonnes pratiques, SEO.
10. **Accessibilité / SEO** : `title`/`description` par route, balises sémantiques, contrastes, focus visible, `alt` sur les images.

---

## 13. Ordre de travail conseillé

1. Commit propre + branche `refacto/arborescence`.
2. Lancer `knip` / `madge` pour avoir la liste réelle des fichiers morts et des cycles.
3. Supprimer les fichiers morts évidents (§7).
4. Créer le squelette de dossiers vide (§2).
5. Déplacer **`server/`** d'abord (§5), tester login + mail.
6. Déplacer **`shared/`** (logique pure), tester.
7. Mettre en place `routes/` fins + détection appareil (§4.4) avec **une seule page** pilote (ex. `tasks`).
8. Scinder page par page : desktop d'abord (copie à l'identique), puis mobile.
9. Découper le CSS au fil de l'eau (§9).
10. Lancer le script d'en-têtes de chemin + nettoyage des `//` (§8) **en dernier**.
11. Réglages techniques (§11) à chaque étape, pas à la fin.
12. Optimisation + Lighthouse (§12).

> ✅ Après **chaque** étape : `tsc --noEmit`, `eslint .`, `vite build`, ouvrir l'app en desktop et en mobile.
