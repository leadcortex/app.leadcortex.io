# Fondations : la « prise » des données (modèle Prospects)

Date : 24/11/2026. Statut : en attente de validation.

## Pourquoi

Le backend (PostgreSQL + Drizzle, Better Auth, Redis/BullMQ, R2, voir `doc/backend/architecture-db.md`) sera un gros chantier. Aujourd'hui, les écrans lisent leurs données dans un seul fichier, `frontend/lib/state/store.tsx` (près de 1 000 lignes), rempli de données fictives et sauvegardé dans le navigateur. 28 fichiers importent directement `mock-data.ts`. Brancher le backend dans cet état reviendrait à rouvrir chaque écran.

But : poser **un seul point de passage entre les écrans et les données**, puis le prouver sur un domaine complet, les Prospects, de l'écran jusqu'à la base. Ce modèle servira ensuite à recopier les autres domaines (entreprises, séquences, tâches…) pendant le chantier backend.

## Objectifs

1. Les types métier ne vivent plus dans le fichier de données fictives : ils sont partagés entre navigateur et serveur.
2. Les écrans Prospects ne touchent plus au store ni aux données fictives : ils passent par des hooks dédiés (`useLeads`, `useLead`, `useCreateLead`, `useUpdateLead`, `useDeleteLead`).
3. Ces hooks fonctionnent dans deux modes, choisis par une variable d'environnement :
   - `mock` (par défaut) : données fictives, comportement identique à aujourd'hui ;
   - `server` : vraies fonctions serveur, base PostgreSQL.
4. Côté serveur : la table `prospects` stocke tout ce que l'écran affiche, et les fonctions serveur couvrent lister, lire, créer, modifier et supprimer.
5. Les vérifications répétées dans chaque fonction serveur (utilisateur connecté, origine de la requête) passent par un seul helper.
6. Vitest est installé, avec un script `npm test`, et la nouvelle couche est testée.

## Non-objectifs

- Corriger les 33 erreurs TypeScript existantes, ajouter une vérification automatique sur GitHub (refusé : le site n'est pas fini).
- Migrer les autres domaines (entreprises, séquences, tâches, conversations…).
- Redis/BullMQ, R2, le backend Go de l'Academy.
- Toucher au design ou aux textes des écrans.

## Anti-objectifs (échec même si « ça marche »)

- Deux sources de vérité en mode `mock` : si l'écran Prospects et le tableau de bord n'affichent pas les mêmes prospects, c'est raté.
- Un écran Prospects qui change d'apparence ou perd une fonction (favoris, création automatique de l'entreprise, recherche, filtres).
- Du code serveur ou des secrets qui se retrouvent dans le bundle navigateur.

## Contraintes

- Stack existante : TanStack Start (fonctions serveur `createServerFn`), TanStack Query (déjà installé, `QueryClientProvider` dans `frontend/routes/__root.tsx`), Drizzle + `postgres`, Zod, Better Auth.
- Les fichiers serveur gardent le suffixe `.server.ts` : c'est lui qui les exclut du bundle navigateur.
- Docker n'est pas démarré sur la machine : la base locale ne peut pas tourner pendant le développement. Le mode `server` sera vérifié par des tests sans base ; le test sur une vraie base se fera quand vous lancerez Docker (procédure fournie).
- Convention du projet : en-tête `// chemin/du/fichier` et aucun commentaire explicatif.

## Approches envisagées

1. **Filets de sécurité seulement** : zéro erreur, tests, vérification automatique. Écartée par vous : pas utile tant que le site n'est pas fini, et ça ne règle pas le problème des données.
2. **Filets + la prise des données, Prospects de bout en bout** : retenue par vous.
3. **Tout migrer maintenant** : écartée, trop gros, et ça se mélangerait avec le chantier backend.

Pour la forme de la prise, j'ai comparé deux façons :

- **Objets « dépôt » purs** (`leadsRepository.list()`…), avec une version fictive et une version serveur. Problème : la version fictive doit modifier le store React. Hors React, il faudrait copier les données, ce qui crée deux sources de vérité (anti-objectif n°1).
- **Hooks comme point de passage** *(mon choix)* : en mode `mock`, `useLeads()` lit et modifie le store existant ; en mode `server`, il utilise TanStack Query et les fonctions serveur. Une seule source par mode, et les écrans ne savent pas laquelle est active.

## Conception

### 1. Types partagés : `src/shared/domain/lead.ts`

- `Lead`, `LeadStatus`, `LeadStage` sortent de `mock-data.ts`. `mock-data.ts` les réimporte pour ne rien casser chez les autres fichiers.
- Schémas Zod `leadInputSchema` (création) et `leadPatchSchema` (modification), utilisés par le serveur pour valider et par les tests.
- Nom du domaine : `Lead` dans le code (déjà utilisé par ~19 fichiers ; le renommer serait un chantier à part), table `prospects` en base, « Prospects » à l'écran. Un `Lead` correspond à une ligne de `prospects`.

### 2. Base : migration de `prospects`

Colonnes ajoutées pour couvrir `Lead` : `name`, `title`, `industry`, `location`, `score` (réel), `stage`, `saved`, `tags` (tableau de texte), `notes`, `signal`, `avatar_url`, `company_logo_url`. `email` devient facultatif, comme dans l'écran. Index ajouté sur `(user_id, created_at)` pour la liste. Migration générée par `drizzle-kit generate`, jamais écrite à la main.

Choix du constructeur, à vérifier à la lecture :
- `company` est stocké dans la colonne existante `company_name`, sans la renommer : un renommage oblige Drizzle à poser une question interactive et n'apporte rien.
- Le statut d'enrichissement (`enriched`, `enriching`, `scored`, `queued`) réutilise la colonne existante `status`, avec `queued` comme nouvelle valeur par défaut à la place de `raw`.
- Les anciennes fonctions `listProspects` et `createProspect`, qu'aucun écran n'utilise, sont remplacées par les nouvelles.

### 3. Serveur : `src/server/`

- `http/guards.server.ts` : `requireUser()` (renvoie l'utilisateur ou lève « Authentification requise ») et `requireSameOrigin()` pour les écritures.
- `prospects/prospects.mapper.ts` : conversion ligne de base ⇄ `Lead`, fonction pure et testée.
- `prospects/prospects.functions.ts` : `listLeads`, `getLead`, `createLead`, `updateLead`, `deleteLead`. Toujours filtrées par `user_id` : un utilisateur ne voit jamais les prospects d'un autre.
- La création automatique d'une entreprise à partir d'un prospect, qui existe aujourd'hui dans le store, reste côté store pour le mode `mock`. En mode `server`, elle viendra avec le domaine Entreprises (noté comme suite).

### 4. Navigateur : `frontend/lib/api/`

- `data-source.ts` : lit `VITE_DATA_SOURCE` (`mock` par défaut, `server` sinon).
- `leads/` : les cinq hooks et les clés de cache TanStack Query (`leadKeys`).
- En mode `server`, les modifications invalident le cache, ce qui recharge la liste.

### 5. Écrans branchés

`frontend/routes/app/people/route.tsx`, `people/$id.tsx`, `people/new.tsx`, plus les composants qu'ils utilisent pour lire et modifier les prospects. Les autres lecteurs de prospects (tableau de bord, recherche globale, statistiques, séquences…) restent sur le store pour l'instant. En mode `mock`, ils voient donc les mêmes données. En mode `server`, ils verront encore les données fictives : c'est la limite connue tant que ces écrans ne sont pas migrés.

### 6. Tests (Vitest)

- Conversion ligne ⇄ `Lead` (aller-retour, champs vides).
- Validation : refus d'un email invalide, d'un score hors bornes, d'un champ inconnu.
- Hooks en mode `mock` : création, modification et suppression passent bien par le store.
- Les tests existants de `frontend/lib/__tests__/` tournent à nouveau.

### 7. Guide pour recopier le modèle

`doc/backend/modele-domaine.md` : les étapes pour brancher un domaine (types partagés → migration → mapper → fonctions serveur → hooks → écrans → tests), avec Prospects en exemple, plus la procédure Docker pour tester le mode `server` sur une vraie base. Cette procédure inclut la création de l'utilisateur de développement en base : sans lui, la connexion de développement (`/auth/dev-login`) ne peut rien enregistrer, puisque chaque prospect doit appartenir à un utilisateur existant.

## Laissé au constructeur

Noms internes, découpage fin des fichiers de hooks, valeurs par défaut des colonnes, détail des messages d'erreur.

## Suite (hors de ce chantier)

Migrer les autres lecteurs de prospects, puis domaine par domaine. Création automatique de l'entreprise en mode `server` avec le domaine Entreprises.
