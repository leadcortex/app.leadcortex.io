# Spec Backend — Authentification OAuth 2.0 (LeadCortex)

> Document destiné à l'IA qui m'aide à construire le backend.
> Statut : **BROUILLON v0.1** — les sections marquées `❓ À TRANCHER` doivent être complétées avant de coder.

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
- **Backend** : dossier `backend/` actuellement **vide** (`.gitkeep`) → tout est à créer.
- **Server functions existantes** : `src/server/` (ex. `sequences/sequence-ai.server.ts`). Le backend peut s'appuyer sur les server functions TanStack Start et/ou un service séparé.
- **Données actuellement mockées** : `frontend/lib/store.tsx`, `frontend/lib/mock-data.ts`, `frontend/lib/conversations-mock.ts`, etc.
- **Backend / base de données choisis** : `❓ À TRANCHER` (ex. Supabase, Firebase, Postgres + Prisma, autre).

---

## 2. Objectif général

Créer un **système d'authentification logique et complet** :

1. L'utilisateur se connecte via **OAuth 2.0** (Google, et éventuellement Microsoft / LinkedIn / Apple — voir §4).
2. Pendant la connexion, le backend **récupère les informations du compte** : nom, prénom, e-mail, photo.
3. Le backend **récupère aussi l'accès à sa boîte mail** (lecture de la boîte de réception, envoi) pour alimenter la **page Emails** de l'app.
4. Ces infos deviennent la **source de vérité unique** : partout où l'UI affiche le nom/e-mail de l'utilisateur, on affiche les vraies données (voir §6).

---

## 3. État actuel du front (ce qui existe déjà)

| Élément | Fichier | État actuel |
|---|---|---|
| Page connexion | `frontend/routes/login.tsx` | Boutons Google / LinkedIn / Apple (icônes), formulaire e-mail. Appelle `setUser(email)` du store → **faux login local**. Garde anti-bot : `useFormGuard`, `Honeypot`, `verifyWithServer`. |
| Page inscription | `frontend/routes/signup.tsx` | À brancher. |
| Onboarding | `frontend/routes/onboarding.tsx` | À brancher (affichée après 1ère connexion ?). |
| Store utilisateur | `frontend/lib/store.tsx` | `user: { name: string \| null; email: string \| null }`. `setUser(email)` déduit le nom depuis l'e-mail. **À remplacer par les vraies données du backend.** |
| Page Emails | `frontend/routes/app.emails.tsx` | Comptes mail **mockés** (`acc-1` Gmail, Outlook…). Modal d'ajout de compte avec providers : `gmail, outlook, yahoo, icloud, imap` (champs IMAP host/port). Utilise `LetterAvatar`. |
| Sidebar | `frontend/components/app-sidebar.tsx` | Constante **codée en dur** `USER = { name, email, plan, initials }` (nom, e-mail, plan affichés en bas de sidebar + tooltip). |
| Paramètres → Profil | `frontend/components/settings/settings-panels.tsx` | Champs `Nom complet` et `Email` avec valeurs **en dur** (`"Utilisateur"`, `"Utilisateur@founder.co"`). Bouton "Enregistrer" = simple toast. |
| Paramètres → Intégrations | `settings-panels.tsx` | Carte "Google Workspace — Gmail, Agenda et Drive" avec `connected: true` **en dur**. |
| Assistant IA | `frontend/components/ai-assistant/assistant-sidebar.tsx` | Constante **codée en dur** `CURRENT_USER_NAME = "Utilisateur"`. |
| Avatars | `frontend/components/ui/letter-avatar.tsx` | Avatar à initiales à partir d'un nom. |

> Remarque : l'IA doit **relire ces fichiers** avant de modifier quoi que ce soit, car ce tableau peut être en retard sur le code.

---

## 4. Fournisseurs OAuth 2.0

| Fournisseur | Rôle | Priorité |
|---|---|---|
| **Google** | Connexion + accès Gmail (+ Agenda / Drive plus tard ?) | `❓ À TRANCHER` (probablement P1) |
| Microsoft (Outlook) | Connexion + accès Outlook mail | `❓ À TRANCHER` |
| LinkedIn | Connexion uniquement (pas de mail) | `❓ À TRANCHER` |
| Apple | Connexion uniquement | `❓ À TRANCHER` |
| IMAP (Yahoo, iCloud, autre) | Boîte mail sans OAuth (mot de passe d'application) | `❓ À TRANCHER` |

### Deux niveaux d'accès à bien distinguer
1. **Login** (identité) : scopes `openid`, `email`, `profile` → nom, e-mail, photo.
2. **Accès mail** (données sensibles) : scopes Gmail (ex. `gmail.readonly`, `gmail.send` ou `gmail.modify`) / Microsoft Graph (`Mail.Read`, `Mail.Send`, `offline_access`).
   - Option A : demander **tout d'un coup** à la connexion.
   - Option B : login simple d'abord, **puis** "Connecter ma boîte mail" depuis la page Emails (recommandé en général : meilleur taux d'acceptation, scopes minimaux).
   - **Choix retenu : `❓ À TRANCHER`**

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
   │  2. échanger code → access_token + refresh_token
   │  3. récupérer le profil (nom, prénom, e-mail, photo)
   │  4. créer ou retrouver l'utilisateur en base
   │  5. stocker les tokens CHIFFRÉS
   │  6. ouvrir une session (cookie httpOnly, Secure, SameSite)
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

| Endroit | Fichier | Donnée à afficher |
|---|---|---|
| Bas de sidebar (nom, e-mail, plan, avatar) | `app-sidebar.tsx` (`USER`) | nom complet, e-mail, plan, photo ou initiales |
| Assistant IA (salutation, message utilisateur) | `assistant-sidebar.tsx` (`CURRENT_USER_NAME`) | prénom / nom |
| Paramètres → Profil | `settings-panels.tsx` | nom complet, e-mail (modifiables + sauvegarde réelle) |
| Paramètres → Intégrations | `settings-panels.tsx` | état réel des connexions (Google connecté ? quel compte ?) |
| Page Emails — liste des comptes | `app.emails.tsx` | comptes mail réellement connectés (adresse, provider, non-lus) |
| Page Emails — expéditeur par défaut | `app.emails.tsx` | adresse de l'utilisateur |
| Dashboard / accueil | `app.index.tsx` | message de bienvenue avec prénom (si prévu) |
| Autres endroits | — | `❓ À TRANCHER` (l'IA doit grep `Utilisateur`, `USER`, `user.name` pour tout retrouver) |

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

## 8. Modèle de données (proposition, à valider)

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

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/auth/:provider` | Démarre le flux OAuth |
| GET | `/auth/:provider/callback` | Reçoit le code, crée la session |
| POST | `/auth/logout` | Ferme la session |
| GET | `/api/me` | Utilisateur courant |
| PATCH | `/api/me` | Met à jour le profil (nom, etc.) |
| GET | `/api/mail/accounts` | Boîtes connectées |
| POST | `/api/mail/accounts/connect` | Connecte une boîte (OAuth ou IMAP) |
| DELETE | `/api/mail/accounts/:id` | Déconnecte / révoque |
| GET | `/api/mail/messages` | Liste des messages |
| POST | `/api/mail/send` | Envoie un e-mail |

---

## 10. Étapes manuelles que je devrai faire (l'IA doit me guider pour chacune)

- [ ] Créer le projet dans **Google Cloud Console**
- [ ] Configurer l'**écran de consentement OAuth** (nom de l'app, logo, domaines, liens CGU / confidentialité — ces pages existent déjà : `/legal/cgu`, `/legal/confidentialite`)
- [ ] Activer les **API** nécessaires (Gmail API, éventuellement Calendar / Drive)
- [ ] Créer les **identifiants OAuth 2.0** (type "Application Web") : origines autorisées + **URI de redirection** (dev **et** prod)
- [ ] Ajouter les **scopes** et les **utilisateurs de test**
- [ ] Récupérer `Client ID` / `Client Secret` → variables d'environnement
- [ ] (Si Microsoft) Enregistrer l'app dans **Azure / Entra ID**
- [ ] (Si LinkedIn / Apple) Créer les apps développeur correspondantes
- [ ] Créer la base de données et récupérer les clés
- [ ] Configurer les variables d'environnement en **local** et en **production**
- [ ] Soumettre l'app à la **vérification Google** avant le passage en production
- [ ] Tester le flux complet (connexion, lecture mail, déconnexion, révocation)

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

## 11. Plan de travail demandé à l'IA (ordre)

1. Lire le code existant (§3) et confirmer sa compréhension.
2. Me poser les questions restantes marquées `❓ À TRANCHER`.
3. Me proposer un **plan d'implémentation en phases** et attendre mon accord.
4. Phase 1 — **Login Google seul** + `/api/me` + remplacement des noms en dur (§6).
5. Phase 2 — **Connexion boîte Gmail** + affichage dans la page Emails.
6. Phase 3 — Envoi d'e-mails, synchronisation, déconnexion / révocation.
7. Phase 4 — Autres fournisseurs (Microsoft, LinkedIn, Apple, IMAP).
8. Phase 5 — Sécurité, tests, passage en production (vérification Google).

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

- [ ] Je clique sur "Continuer avec Google" et j'arrive dans `/app` connecté.
- [ ] Mon vrai nom et mon e-mail apparaissent dans la sidebar, l'assistant IA et les paramètres.
- [ ] La page Emails affiche **ma vraie boîte** (pas de mock).
- [ ] Rafraîchir la page ne me déconnecte pas ; me déconnecter vide tout.
- [ ] Aucun secret n'apparaît dans le code front ni dans Git.
- [ ] Chaque étape manuelle m'a été expliquée clairement et je l'ai réussie sans être bloqué.
