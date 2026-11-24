# Fondations données (modèle Prospects) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les écrans Prospects passent par un hook `useLeads()` qui sert soit les données fictives (store actuel), soit les fonctions serveur + PostgreSQL, selon `VITE_DATA_SOURCE`.

**Architecture:** Types et schémas Zod partagés dans `src/shared/domain/lead.ts`. Côté serveur : colonnes ajoutées à `prospects`, un mapper pur ligne ⇄ `Lead`, quatre fonctions serveur protégées par un helper commun. Côté navigateur : `frontend/lib/api/leads/` expose `useLeads()` ; l'implémentation `mock` adapte le store existant (une seule source de vérité), l'implémentation `server` utilise TanStack Query.

**Tech Stack:** TanStack Start (`createServerFn`, `useServerFn`), TanStack Query 5, Drizzle 0.45 + drizzle-kit 0.31, Zod 4, Vitest, sonner.

**Spec:** `doc/specs/2026-11-24-fondations-donnees-design.md`

## Global Constraints

- Chaque fichier commence par `// <chemin/depuis/la/racine>` ; aucun autre commentaire.
- Code serveur dans des fichiers `*.server.ts` ou `*.functions.ts` sous `src/server/` ; rien de serveur importé depuis `frontend/` sauf les fonctions `createServerFn`.
- Mode par défaut : `mock`. `VITE_DATA_SOURCE=server` active le serveur.
- Toutes les requêtes `prospects` filtrées par `user_id` de l'utilisateur connecté.
- Écritures : vérification d'origine (`isSameOriginRequest`) obligatoire.
- `company` ⇄ colonne existante `company_name` (pas de renommage). Statut d'enrichissement ⇄ colonne existante `status`, défaut `queued`.
- Migration générée par `npx drizzle-kit generate`, jamais écrite à la main. Pas de `drizzle-kit migrate` (Docker indisponible).
- Aucun changement visuel des écrans Prospects.
- Ne pas corriger les erreurs TypeScript existantes (33, hors périmètre) ; ne pas en ajouter : `npx tsc --noEmit -p .` doit rester à 33.

## Review Focus

1. Annuler/rétablir après une suppression en masse (`setLeads(snapshot)`) en mode `server` : les prospects supprimés doivent revenir avec leur même id → test `diffLeads` qui produit des créations avec l'id d'origine (Task 4).
2. Prospect sans email ni entreprise (création rapide) : doit être accepté → test schéma `leadInputSchema` avec seulement `name` (Task 1).
3. Score `null` (pas encore scoré) : doit faire l'aller-retour ligne ⇄ `Lead` sans devenir `0` → test mapper (Task 2).
4. `tags` vide ou absent : pas de `undefined` stocké, tableau vide en base, absent ou vide côté `Lead` → test mapper (Task 2).
5. Patch avec un champ inconnu ou `id`/`userId` : rejeté, jamais écrit en base → test `leadPatchSchema` (Task 1).

---

### Task 1: Vitest + types et schémas partagés

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Create: `vitest.config.ts` (plugin `vite-tsconfig-paths` seulement, `test.include: ["frontend/**/*.test.ts", "src/**/*.test.ts"]`)
- Create: `src/shared/domain/lead.ts`
- Modify: `frontend/lib/data/mock-data.ts` (supprimer les définitions `LeadStatus`/`Lead`, les réexporter depuis `@shared/domain/lead`)
- Test: `src/shared/domain/lead.test.ts`

**Interfaces:**
- Produces:
  - `LEAD_STATUSES = ["enriched","enriching","scored","queued"] as const`, `type LeadStatus`
  - `LEAD_STAGES = ["new","contacted","replied","meeting","won","lost"] as const`, `type LeadStage`
  - `type Lead` (champs identiques à l'actuel `mock-data.ts`, `stage?: LeadStage`)
  - `leadInputSchema` (Zod, `.strict()`) : `id?: uuid`, `name: string 1..200`, `title`, `company`, `industry`, `location`: string ≤ 200, défaut `""` ; `status` défaut `"queued"` ; `score: number 0..10 | null` défaut `null` ; `email?: email`, `phone?`, `signal?`, `stage?`, `saved?`, `avatarUrl?: url`, `companyLogoUrl?: url`, `tags?: string[] ≤ 50`, `notes?: string ≤ 5000`
  - `type LeadInput = z.input<typeof leadInputSchema>`
  - `leadPatchSchema = leadInputSchema.omit({ id: true }).partial().strict()`, `type LeadPatch`

- [ ] **Step 1: Installer Vitest** — `npm install -D vitest`, ajouter le script et `vitest.config.ts`. Vérifier : `npm test` exécute les 4 tests existants de `frontend/lib/__tests__/` (noter le résultat, ne pas les corriger s'ils échouent pour une raison sans rapport).
- [ ] **Step 2: Test qui échoue** — `lead.test.ts` :
  - `accepte un prospect avec seulement un nom` → `leadInputSchema.parse({ name: "Ana" })` donne `status: "queued"`, `score: null`, `company: ""`
  - `refuse un email invalide` → `safeParse({ name: "A", email: "x" }).success === false`
  - `refuse un score hors 0..10` → `score: 11` et `score: -1` refusés
  - `refuse un champ inconnu dans un patch` → `leadPatchSchema.safeParse({ userId: "x" }).success === false` et `{ id: "…" }` refusé aussi
- [ ] **Step 3:** `npx vitest run src/shared/domain/lead.test.ts` → FAIL (module introuvable).
- [ ] **Step 4: Implémenter** `src/shared/domain/lead.ts` et la réexportation dans `mock-data.ts`.
- [ ] **Step 5:** tests PASS ; `npx tsc --noEmit -p . | grep -c "error TS"` → 33.

### Task 2: Base — colonnes `prospects` et mapper

**Files:**
- Modify: `src/server/db/auth-schema.ts` (table `prospects`)
- Create: `drizzle/0003_*.sql` + `drizzle/meta/*` (générés)
- Create: `src/server/prospects/prospects.mapper.ts`
- Test: `src/server/prospects/prospects.mapper.test.ts`

**Interfaces:**
- Consumes: `Lead`, `LeadInput`, `LeadPatch` (Task 1)
- Produces:
  - `type ProspectRow = typeof prospects.$inferSelect`, `type ProspectInsert = typeof prospects.$inferInsert`
  - `rowToLead(row: ProspectRow): Lead`
  - `inputToInsert(input: LeadInput (déjà parsé), userId: string): ProspectInsert`
  - `patchToUpdate(patch: LeadPatch): Partial<ProspectInsert>` (n'émet que les clés présentes, ajoute `updatedAt: new Date()`)

- [ ] **Step 1: Schéma** — dans `prospects` : `email` sans `.notNull()` ; `status` défaut `"queued"` ; ajouter `name` (text, notNull, défaut `""`), `title`, `industry`, `location` (text, notNull, défaut `""`), `score` (`real`, nullable), `stage` (text, nullable), `saved` (boolean, notNull, défaut false), `tags` (`text().array()`, notNull, défaut `[]` via `sql\`'{}'::text[]\``), `notes`, `signal`, `avatarUrl` (`avatar_url`), `companyLogoUrl` (`company_logo_url`) (text, nullable) ; index `prospects_user_created_idx` sur `(user_id, created_at)`.
- [ ] **Step 2:** `npx drizzle-kit generate --name prospects_lead_fields` → un nouveau fichier `drizzle/0003_prospects_lead_fields.sql` contenant des `ALTER TABLE "prospects" ADD COLUMN` et aucun `DROP`. Si drizzle-kit pose une question de renommage, répondre « créer » (aucune colonne n'est renommée).
- [ ] **Step 3: Test qui échoue** — `prospects.mapper.test.ts` :
  - `aller-retour d'un prospect complet` : `rowToLead` d'une ligne remplie donne `company` = `companyName`, `status` = `status`
  - `score null reste null` (Review Focus 3)
  - `tags vides` : `inputToInsert({…sans tags})` donne `tags: []` ; `rowToLead` avec `tags: []` donne `tags: []`
  - `champs texte null deviennent absents` : `email: null` en base → `lead.email === undefined`
  - `patchToUpdate({ saved: true })` ne contient que `saved` et `updatedAt`
- [ ] **Step 4:** FAIL → implémenter → PASS ; tsc toujours 33.

### Task 3: Serveur — garde commune et fonctions Prospects

**Files:**
- Create: `src/server/http/guards.server.ts`
- Modify: `src/server/prospects/prospects.functions.ts` (remplacer `listProspects`/`createProspect`)

**Interfaces:**
- Consumes: `getCurrentUser`, `isSameOriginRequest` (`src/server/auth/auth.server.ts`), mapper (Task 2), schémas (Task 1)
- Produces:
  - `requireUser(): Promise<PublicUser>` — lit `getRequest()`, lève `Error("Authentification requise.")`
  - `requireSameOrigin(): void` — lève `Error("Origine de requête invalide.")`
  - `listLeads` (GET, sans entrée) → `Lead[]` triés `created_at` décroissant, limite 1000
  - `createLead` (POST, `LeadInput`) → `Lead`
  - `updateLead` (POST, `{ id: uuid, patch: LeadPatch }`) → `Lead` ; erreur `"Prospect introuvable."` si 0 ligne
  - `deleteLead` (POST, `{ id: uuid }`) → `{ id: string }`
  - toutes les requêtes avec `where user_id = user.id` (et `id` pour update/delete)

- [ ] **Step 1:** écrire `guards.server.ts` et les quatre fonctions. Pas de test automatique (nécessite une base) : vérifier `npx tsc --noEmit -p .` → 33 et `grep -rn "listProspects\|createProspect" frontend src` → aucun résultat.

### Task 4: Navigateur — `useLeads()` (mock + server)

**Files:**
- Create: `frontend/lib/api/data-source.ts`
- Create: `frontend/lib/api/leads/leads-api.ts` (type `LeadsApi`, `diffLeads`, `createMockLeadsApi`)
- Create: `frontend/lib/api/leads/use-mock-leads.ts`
- Create: `frontend/lib/api/leads/use-server-leads.ts`
- Create: `frontend/lib/api/leads/index.ts`
- Test: `frontend/lib/api/leads/leads-api.test.ts`

**Interfaces:**
- Consumes: store (`useAppStore`: `leads`, `hydrated`, `addLead`, `updateLead`, `deleteLead`, `toggleLeadSaved`, `setLeads`), fonctions serveur (Task 3), `useServerFn`
- Produces:
  - `dataSource: "mock" | "server"` (`import.meta.env.VITE_DATA_SOURCE === "server" ? "server" : "mock"`)
  - `type LeadsApi = { leads: Lead[]; ready: boolean; addLead(input: LeadInput): Promise<Lead>; updateLead(id: string, patch: LeadPatch): Promise<void>; deleteLead(id: string): Promise<void>; toggleLeadSaved(id: string): Promise<void>; setLeads(next: Lead[]): Promise<void> }`
  - `diffLeads(current: Lead[], next: Lead[]): { toCreate: Lead[]; toUpdate: { id: string; patch: LeadPatch }[]; toDelete: string[] }` — `toUpdate` seulement si un champ diffère (comparaison champ par champ, `tags` par contenu)
  - `createMockLeadsApi(store: Pick<AppStore, "leads"|"hydrated"|"addLead"|"updateLead"|"deleteLead"|"toggleLeadSaved"|"setLeads">): LeadsApi` — chaque méthode appelle la méthode du store et renvoie une `Promise` résolue
  - `useLeads(): LeadsApi` (exporté par `index.ts` : `dataSource === "server" ? useServerLeads : useMockLeads`), plus `leadKeys = { all: ["leads"] as const }`
  - mode server : `useQuery({ queryKey: leadKeys.all, queryFn: listLeads })`, mutations qui invalident `leadKeys.all` et affichent `toast.error(message)` (sonner) en cas d'échec ; `setLeads` applique `diffLeads` (créations avec l'id d'origine, puis mises à jour, puis suppressions)

- [ ] **Step 1: Test qui échoue** — `leads-api.test.ts` :
  - `diffLeads recrée un prospect supprimé avec son id` (Review Focus 1) : current `[a]`, next `[a, b]` → `toCreate[0].id === b.id`
  - `diffLeads ne met à jour que les champs changés` : `saved` changé → `toUpdate = [{ id, patch: { saved: true } }]`
  - `diffLeads ignore des tags identiques dans un autre tableau`
  - `diffLeads supprime ce qui a disparu`
  - `createMockLeadsApi délègue au store` : faux store avec `vi.fn()` ; `await api.updateLead("l1", { saved: true })` appelle `store.updateLead("l1", { saved: true })` ; `await api.addLead({ name: "A" })` renvoie la valeur de `store.addLead`
- [ ] **Step 2:** FAIL → implémenter → PASS ; tsc 33.

### Task 5: Brancher les écrans Prospects

**Files:**
- Modify: `frontend/routes/app/people/route.tsx` (l. ~105-106)
- Modify: `frontend/routes/app/people/$id.tsx` (l. ~92-101, ~1490, ~1628)
- Modify: `frontend/routes/app/people/new.tsx` (l. ~335)

**Interfaces:**
- Consumes: `useLeads()` (Task 4). `addActivity`, `companies`, etc. restent lus via `useAppStore()`.

- [ ] **Step 1:** dans chaque écran, prendre `leads`, `toggleLeadSaved`, `updateLead`, `deleteLead`, `setLeads`, `addLead` depuis `useLeads()` ; remplacer `hydrated` par `ready`. Dans `new.tsx`, `await addLead(...)` avant d'utiliser le prospect renvoyé.
- [ ] **Step 2:** vérifier `grep -nE "\b(leads|addLead|updateLead|deleteLead|toggleLeadSaved|setLeads)\b" frontend/routes/app/people/*.tsx` : plus aucune lecture de ces clés depuis `useAppStore()`.
- [ ] **Step 3:** `npm test` vert, `npx tsc --noEmit -p .` → 33, `npx vite build` OK. Lancer `npm run dev` et charger `/app/people` (réponse 200, pas d'erreur serveur dans le terminal).

### Task 6: Guide pour recopier le modèle

**Files:**
- Create: `doc/backend/modele-domaine.md`

- [ ] **Step 1:** rédiger : les 7 étapes (types partagés → colonnes + `drizzle-kit generate` → mapper + tests → fonctions serveur avec `requireUser`/`requireSameOrigin` → hooks `use<Domaine>()` mock/server → écrans → tests), chaque étape pointant le fichier Prospects correspondant ; la limite connue (autres lecteurs encore sur le store) ; la procédure Docker (`docker compose up -d`, `.env` avec `DATABASE_URL` vers `127.0.0.1:5433`, `npm run db:migrate`, insertion de l'utilisateur de développement `00000000-0000-4000-8000-000000000001` / `developer@localhost.invalid` dans `users`, `VITE_DATA_SOURCE=server npm run dev`, connexion via `/auth/dev-login`, créer/modifier/supprimer un prospect).
