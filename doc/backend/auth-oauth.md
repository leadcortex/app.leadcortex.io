# Spec Backend — Authentification OAuth 2.0 (LeadCortex)

> Document destiné à l'IA qui m'aide à construire le backend.
> Statut : **Login Google et lecture Gmail validés en développement.**
> La connexion, la session persistante, la déconnexion et la lecture réelle de messages Gmail ont été testées. La lisibilité des URL de suivi vient d'être améliorée ; les tests de renouvellement et de révocation restent à faire.
> Transition Better Auth : dépendances, schéma Drizzle, endpoint `/api/auth/*` et interface de connexion préparés. Le flux reste désactivé tant que `BETTER_AUTH_ENABLED` et `VITE_BETTER_AUTH_ENABLED` ne sont pas activés ; la migration `drizzle/0001_regular_may_parker.sql` et le secret Better Auth sont également requis. Le flux Google et Gmail existant reste disponible pendant la transition.

---

## 0. Règles de collaboration (à respecter impérativement)

1. **Je fais moi-même toutes les étapes manuelles** (console Google Cloud, Azure, variables d'environnement, DNS, etc.). L'IA ne peut pas les faire à ma place.
2. **Pour chaque étape manuelle, l'IA m'explique, dans l'ordre :**
   - où cliquer (URL exacte de la console, nom exact des menus),
   - quoi saisir (valeurs exactes à copier-coller : URI de redirection, scopes, noms),
   - ce que je dois récupérer en retour (Client ID, Client Secret…) et dans quelle variable d'environnement le mettre,
   - comment vérifier que l'étape a marché.
3. **Une étape à la fois.** L'IA attend ma confirmation ("c'est fait") avant de passer à la suivante.
4. **Ne jamais mettre de secret dans le code front.** Les secrets restent côté serveur (`.env`, jamais commité).
5. **Ne pas casser l'UI existante.** Le front est déjà fait ; on branche le backend dessus, on ne le redessine pas.
6. Réponses en **français**, ton simple, pas de jargon sans explication.

---

## 1. Contexte du projet

- **App** : LeadCortex (`app.leadcortex.io`) — SaaS B2B de prospection commerciale assistée par IA.
- **Stack** : TanStack Start + TanStack Router (React 19, Vite, TypeScript), Tailwind v4, shadcn/ui, TanStack Query, gestionnaire de paquets **bun**.
- **Backend** : les routes serveur TanStack Start sont utilisées ; `backend/` reste réservé au service Academy.
- **Server functions existantes** : `src/server/` (ex. `sequences/sequence-ai.server.ts`). Le backend peut s'appuyer sur les server functions TanStack Start et/ou un service séparé.
- **Données actuellement mockées** : `frontend/lib/store.tsx`, `frontend/lib/mock-data.ts`, `frontend/lib/conversations-mock.ts`, etc.
- **Base de données** : PostgreSQL hébergé par Supabase, accès côté serveur uniquement, sans Supabase Auth.
- **ORM / migrations** : Drizzle ORM et Drizzle Kit ; le schéma est dans `src/server/db/auth-schema.ts` et les migrations dans `drizzle/`.

---

## 2. Objectif général

Créer un **système d'authentification logique et complet** :

1. L'utilisateur se connecte via **OAuth 2.0** (Google, et éventuellement Microsoft / LinkedIn / Apple — voir §4).
2. Pendant la connexion, le backend **récupère les informations du compte** : nom, prénom, e-mail, photo.
3. Après le login, l'utilisateur pourra autoriser séparément l'accès à sa boîte mail pour alimenter la **page Emails** de l'app.
4. Ces infos deviennent la **source de vérité unique** : partout où l'UI affiche le nom/e-mail de l'utilisateur, on affiche les vraies données (voir §6).

---

## 3. État actuel du front (ce qui existe déjà)

| Élément                   | Fichier                                                    | État actuel                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Page connexion            | `frontend/routes/login.tsx`                                | Google démarre `/auth/google`. Le formulaire e-mail et les autres fournisseurs ne sont pas encore disponibles.                                 |
| Page inscription          | `frontend/routes/signup.tsx`                               | Google démarre le même flux ; la création de compte par e-mail reste désactivée.                                                               |
| Onboarding                | `frontend/routes/onboarding.tsx`                           | Destination après la première connexion Google.                                                                                                |
| Store utilisateur         | `frontend/lib/store.tsx`                                   | Les données de session viennent de `/api/me` et ne sont pas persistées dans `localStorage`.                                                    |
| Page Emails               | `frontend/routes/app.emails.tsx`                           | Gmail connecté : boîte réelle en lecture seule, récupérée à la demande ; sinon, écran de connexion avec données de démonstration optionnelles. |
| Sidebar                   | `frontend/components/app-sidebar.tsx`                      | `useCurrentUser()` affiche le profil API, l'e-mail, le plan et la photo/initiale ; la déconnexion révoque la session.                          |
| Paramètres → Profil       | `frontend/components/settings/panels/AccountPanel.tsx`     | Prénom/nom via `/api/me`, e-mail Google en lecture seule ; les autres champs ne sont pas encore persistés.                                     |
| Paramètres → Intégrations | `frontend/components/settings/panels/ConnectionsBlock.tsx` | L'identité Google vient de la session ; l'accès Gmail est indiqué comme non connecté.                                                          |
| Assistant IA              | `frontend/components/ai-assistant/assistant-sidebar.tsx`   | Prénom via `useCurrentUser()`.                                                                                                                 |
| Avatars                   | `frontend/components/ui/letter-avatar.tsx`                 | Avatar à initiales à partir d'un nom.                                                                                                          |

> Remarque : l'IA doit **relire ces fichiers** avant de modifier quoi que ce soit, car ce tableau peut être en retard sur le code.

---

## 4. Fournisseurs OAuth 2.0

| Fournisseur                 | Rôle                                               | Priorité                          |
| --------------------------- | -------------------------------------------------- | --------------------------------- |
| **Google**                  | Connexion (P1), puis accès Gmail séparé            | Confirmé pour la première version |
| Microsoft (Outlook)         | Connexion + accès Outlook mail                     | `❓ À TRANCHER`                   |
| LinkedIn                    | Connexion uniquement (pas de mail)                 | `❓ À TRANCHER`                   |
| Apple                       | Connexion uniquement                               | `❓ À TRANCHER`                   |
| IMAP (Yahoo, iCloud, autre) | Boîte mail sans OAuth (mot de passe d'application) | `❓ À TRANCHER`                   |

### Deux niveaux d'accès à bien distinguer

1. **Login** (identité) : scopes `openid`, `email`, `profile` → nom, e-mail, photo.
2. **Accès mail** (données sensibles) : scopes Gmail (ex. `gmail.readonly`, `gmail.send` ou `gmail.modify`) / Microsoft Graph (`Mail.Read`, `Mail.Send`, `offline_access`).
   - Option A : demander **tout d'un coup** à la connexion.
   - Option B : login simple d'abord, **puis** "Connecter ma boîte mail" depuis la page Emails (recommandé en général : meilleur taux d'acceptation, scopes minimaux).
   - **Choix retenu :** option B — connexion Google simple d'abord, puis autorisation Gmail séparée depuis les intégrations.
     Le login demande uniquement `openid email profile` et ne stocke pas de jeton Google.

> ⚠️ Les scopes Gmail sont "sensibles/restreints" chez Google : en production, ils exigent la **vérification de l'application** (écran de consentement, politique de confidentialité, parfois audit de sécurité). En mode "Test", limité à 100 utilisateurs de test. L'IA doit m'expliquer ce processus et ses délais.

---

## 5. Flux d'authentification attendu

```
[Page /login]
   │  clic "Continuer avec Google"
   ▼
[Backend] GET /auth/google  → redirection vers Google (state + PKCE)
   ▼
[Google] écran de consentement
   ▼
[Backend] GET /auth/google/callback?code=...&state=...
   │  1. vérifier state / PKCE
   │  2. échanger le code (PKCE) → access_token
   │  3. récupérer le profil (nom, prénom, e-mail, photo)
   │  4. créer ou retrouver l'utilisateur en base
   │  5. créer une session en base (empreinte HMAC du secret, jamais le cookie)
   │  6. ouvrir une session (cookie httpOnly, Secure en HTTPS, SameSite=Lax)
   ▼
[Redirection]  nouvel utilisateur → /onboarding   |   existant → /app
   ▼
[Front] GET /api/me → remplit le store (nom, e-mail, photo, plan)
   ▼
[Page /app/emails] GET /api/mail/accounts + /api/mail/messages
```

Points à respecter :

- Cookie de session **httpOnly**, jamais de token dans `localStorage`.
- **Refresh token** : stocké chiffré côté serveur, renouvellement automatique de l'access token.
- **Déconnexion** : détruit la session ; option "Révoquer l'accès Google" dans les paramètres.
- **Protection des routes** `/app/*` : redirection vers `/login` si pas de session.
- Compatibilité avec les protections existantes (`useFormGuard`, `Honeypot`, `verifyWithServer` dans `lib/security/`).

---

## 6. Où afficher les données utilisateur

Remplacer **toutes** les valeurs en dur par les données réelles (via un hook unique, ex. `useCurrentUser()`, branché sur `GET /api/me`) :

| Endroit                                        | Fichier                                       | Donnée à afficher                                                                       |
| ---------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Bas de sidebar (nom, e-mail, plan, avatar)     | `app-sidebar.tsx` (`USER`)                    | nom complet, e-mail, plan, photo ou initiales                                           |
| Assistant IA (salutation, message utilisateur) | `assistant-sidebar.tsx` (`CURRENT_USER_NAME`) | prénom / nom                                                                            |
| Paramètres → Profil                            | `settings-panels.tsx`                         | nom complet, e-mail (modifiables + sauvegarde réelle)                                   |
| Paramètres → Intégrations                      | `settings-panels.tsx`                         | état réel des connexions (Google connecté ? quel compte ?)                              |
| Page Emails — liste des comptes                | `app.emails.tsx`                              | comptes mail réellement connectés (adresse, provider, non-lus)                          |
| Page Emails — expéditeur par défaut            | `app.emails.tsx`                              | adresse de l'utilisateur                                                                |
| Dashboard / accueil                            | `app.index.tsx`                               | message de bienvenue avec prénom (si prévu)                                             |
| Autres endroits                                | —                                             | `❓ À TRANCHER` (l'IA doit grep `Utilisateur`, `USER`, `user.name` pour tout retrouver) |

**Règle de repli** (si le nom est absent) : prénom → nom complet → partie locale de l'e-mail → "Utilisateur".

---

## 7. Intégration de la boîte mail dans la page Emails

Données à fournir à `app.emails.tsx` :

- **Comptes** : liste des boîtes connectées (adresse, provider, nombre de non-lus).
- **Messages** : expéditeur, objet, extrait, date, lu/non-lu, pièces jointes, fil de discussion.
- **Dossiers** : réception, envoyés, brouillons, corbeille, etc.
- **Actions** : lire, marquer lu/non-lu, archiver, supprimer, répondre, envoyer.

À définir :

- Synchronisation : à la demande / périodique / **temps réel** (webhooks Gmail Pub/Sub, Microsoft Graph subscriptions) → `❓ À TRANCHER`
- Quantité d'historique importé (30 jours ? tout ?) → `❓ À TRANCHER`
- Stockage : on **copie** les mails en base, ou on les lit **à la volée** via l'API du fournisseur ? → `❓ À TRANCHER`
- Lien avec les **séquences d'e-mails** de prospection : l'envoi se fait **depuis la boîte de l'utilisateur** ? Détection des réponses ? → `❓ À TRANCHER`

---

## 8. Modèle de données

Le schéma Drizzle initial comprend `users`, `auth_identities`, `sessions` et `mail_accounts`.
Les colonnes de jetons chiffrés sont réservées à la connexion Gmail séparée ; le login Google n'enregistre pas de jeton.

```
users            id, email (unique), first_name, last_name, full_name, avatar_url,
                 plan, locale, created_at, last_login_at
auth_identities  id, user_id, provider (google|microsoft|linkedin|apple),
                 provider_user_id, email, created_at
mail_accounts    id, user_id, provider (gmail|outlook|yahoo|icloud|imap), address,
                 access_token_enc, refresh_token_enc, expires_at, scopes,
                 imap_host, imap_port, status, connected_at
sessions         id, user_id, expires_at, user_agent, ip
```

Tokens **chiffrés au repos** (clé dans une variable d'environnement dédiée).

---

## 9. Endpoints attendus (proposition)

| Méthode | Route                        | Rôle                                                |
| ------- | ---------------------------- | --------------------------------------------------- |
| GET     | `/auth/google`               | Démarre le flux OAuth Google avec state + PKCE      |
| GET     | `/auth/google/callback`      | Reçoit le code, valide le profil et crée la session |
| POST    | `/auth/logout`               | Ferme la session                                    |
| GET     | `/api/me`                    | Utilisateur courant                                 |
| PATCH   | `/api/me`                    | Met à jour le profil (nom, etc.)                    |
| GET     | `/api/mail/accounts`         | Boîtes connectées — à implémenter                   |
| POST    | `/api/mail/accounts/connect` | Connecte une boîte (OAuth ou IMAP)                  |
| DELETE  | `/api/mail/accounts/:id`     | Déconnecte / révoque                                |
| GET     | `/api/mail/messages`         | Liste des messages                                  |
| POST    | `/api/mail/send`             | Envoie un e-mail                                    |

---

## 10. Étapes manuelles que je devrai faire (l'IA doit me guider pour chacune)

- [x] Créer le projet dans **Google Cloud Console**
- [x] Configurer l'**écran de consentement OAuth** (nom de l'app, logo, domaines, liens CGU / confidentialité — ces pages existent déjà : `/legal/cgu`, `/legal/confidentialite`)
- [x] Activer **Gmail API** (Calendar / Drive ne sont pas dans le périmètre actuel)
- [x] Créer les **identifiants OAuth 2.0** (type "Application Web") et configurer l'origine locale ainsi que les deux URI de redirection locales.
- [x] Ajouter les **scopes** nécessaires et le compte aux **utilisateurs de test**
- [x] Configurer `Client ID` / `Client Secret` dans les variables d'environnement locales (sans les commiter)
- [ ] (Si Microsoft) Enregistrer l'app dans **Azure / Entra ID**
- [ ] (Si LinkedIn / Apple) Créer les apps développeur correspondantes
- [x] Créer la base de données de développement et récupérer les paramètres de connexion
- [x] Configurer les variables d'environnement en **local** (`.env`, ignoré par Git)
- [ ] Configurer les variables d'environnement en production
- [ ] Soumettre l'app à la **vérification Google** avant le passage en production
- [x] Tester le login Google et la lecture réelle de messages Gmail
- [ ] Tester le renouvellement du jeton Gmail et sa révocation depuis les intégrations

### PostgreSQL local avec Docker

Compose ne charge pas automatiquement `.env.docker.local`. Pour démarrer la base locale depuis la racine du projet :

```powershell
docker compose --env-file .env.docker.local up -d postgres
```

`DATABASE_URL` dans `.env` doit utiliser le même utilisateur, mot de passe et nom de base que `.env.docker.local`, avec `localhost:5433`. Drizzle privilégie `DIRECT_URL` lorsqu'il est défini : avant une migration locale, vérifier qu'elle cible bien PostgreSQL local et non la base Supabase.

Configuration Gmail à faire après le login Google :

- [x] Activer **Gmail API** dans le projet Google Cloud.
- [x] Ajouter les deux URI locales au même client OAuth Web : `http://localhost:3000/auth/google/callback` et `http://localhost:3000/auth/gmail/callback`.
- [x] Ajouter le compte Google aux utilisateurs de test et accorder le scope `gmail.readonly`.
- [x] Tester l'autorisation séparée, l'affichage de la boîte et l'ouverture de messages.
- [ ] Tester l'actualisation du jeton et la révocation depuis les intégrations.

Variables d'environnement prévues (noms indicatifs) :

```
APP_URL=
SESSION_SECRET=
TOKEN_ENCRYPTION_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
DATABASE_URL=
```

---

## 11. Plan de travail (ordre)

1. ✅ Confirmer Supabase PostgreSQL sans Supabase Auth, Drizzle et la séparation login/Gmail.
2. ✅ Ajouter le schéma initial, la configuration serveur, Google OAuth avec state + PKCE, les sessions et `/api/me`.
3. ✅ Tester en local la connexion Google, le chargement du profil, la persistance de session après actualisation, la déconnexion et la protection de `/app`.
4. 🔄 Phase 2 — Connexion Gmail séparée, jetons chiffrés et lecture à la demande implémentées et testées en local ; valider le renouvellement des jetons et la révocation.
5. ⏸️ L'envoi et la réponse Gmail ne font pas partie de la première version (scope lecture seule).
6. ⏳ Phase 3 — Autres fournisseurs (Microsoft, LinkedIn, Apple, IMAP), selon le besoin.
7. ⏳ Phase 4 — limitation de débit, revue sécurité, tests d'isolation, procédures RGPD/sauvegarde et mise en production.

---

## 12. Sécurité & conformité (non négociable)

- OAuth avec **state + PKCE**.
- Scopes **minimaux** nécessaires.
- Tokens chiffrés, jamais loggés, jamais exposés au front.
- Cookies `httpOnly` + `Secure` + `SameSite`.
- Limitation de débit sur les routes d'auth.
- **RGPD** : consentement clair, suppression du compte = suppression des tokens et des mails copiés, droit à l'export. (Cohérent avec `/legal/dpa` et `/legal/confidentialite`.)
- Les pages légales existantes devront mentionner l'accès aux données Gmail (exigence Google).

---

## 13. Critères de réussite

- [x] Je clique sur "Continuer avec Google" et j'arrive dans `/app` connecté (test local réussi).
- [ ] Mon vrai nom et mon e-mail apparaissent dans la sidebar, l'assistant IA et les paramètres.
- [x] Après autorisation Gmail, la page Emails affiche **ma vraie boîte** en lecture seule (les messages sont chargés à la demande, sans être stockés dans Supabase).
- [x] Rafraîchir la page ne me déconnecte pas ; me déconnecter vide tout (test local réussi, `/app` est ensuite protégé).
- [ ] Aucun secret n'apparaît dans le code front ni dans Git.
- [ ] Chaque étape manuelle m'a été expliquée clairement et je l'ai réussie sans être bloqué.
