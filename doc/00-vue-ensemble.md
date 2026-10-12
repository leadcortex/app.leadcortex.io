# Vue d'ensemble — LeadCortex (app.leadcortex.io)

## Objectif de cette documentation

Cette documentation décrit **l'interface utilisateur (UI/UX)** de LeadCortex telle qu'elle existe actuellement dans le code, fichier par fichier, regroupée par domaine fonctionnel. Elle est écrite pour quelqu'un qui va bientôt attaquer le **backend** et qui a besoin de comprendre :

- à quoi sert chaque fichier,
- comment les fichiers s'articulent entre eux,
- où se trouvent les **points de branchement** avec un futur backend (appels API, données mockées à remplacer, etc.).

Elle est publiée par étapes dans le dossier `doc/`, un fichier Markdown par grand domaine.

## Qu'est-ce que LeadCortex ?

LeadCortex est une plateforme SaaS B2B de prospection commerciale assistée par IA (type CRM de prospection) : gestion d'entreprises et de contacts ("leads"), séquences d'emails/actions, workflows automatisés, rendez-vous, tâches, conversations, etc.

## Stack technique

| Domaine | Techno | Rôle |
|---|---|---|
| Framework app | **TanStack Start** (basé sur React + Vite) | Framework full-stack avec rendu serveur (SSR) et routing par fichiers |
| Routing | **TanStack Router** (`@tanstack/react-router`) | Chaque fichier de `src/routes/` = une page/URL |
| Build | **Vite** | Bundler / serveur de dev |
| UI | **React 19 + TypeScript** | Composants d'interface |
| Style | **Tailwind CSS v4** | Classes utilitaires pour tout le style visuel |
| Composants de base | **Radix UI** (accordéons, dialogs, menus...) habillés par **shadcn/ui** | Composants accessibles bas-niveau dans `src/components/ui/` |
| Données/serveur | **TanStack Query** (`@tanstack/react-query`) | Cache et synchronisation des données (aujourd'hui branché sur des données mockées, prêt pour un vrai backend) |
| Éditeur de workflow | **@xyflow/react** (React Flow) | Le canvas visuel de création de workflows (drag & drop de blocs) |
| Éditeur de code | **CodeMirror** (`@uiw/react-codemirror` + `@codemirror/lang-*`) | Éditeur de code intégré dans les blocs de workflow (JS, Python, SQL, HTML, CSS, JSON) |
| IA | **Vercel AI SDK** (`ai`, `@ai-sdk/*`) + Mistral | Assistant IA conversationnel et génération de code dans les workflows |
| Formulaires | **React Hook Form** + `@hookform/resolvers` | Validation des formulaires |
| Drag & drop | **@hello-pangea/dnd** | Glisser-déposer (ex. tableau des liens de réservation) |

Le projet a été **entièrement réécrit** depuis une base d'origine en JavaScript/HTML/CSS vanilla vers cette stack React/TypeScript actuelle.

## Structure des dossiers (hors `node_modules` et `dist`)

```
src/
├── routes/            → Une page = un fichier. Convention TanStack Router (voir doc dédiée).
├── components/         → Composants React réutilisables, organisés par domaine.
│   └── ui/              → Composants de base (boutons, inputs, dialogs...) issus de shadcn/ui.
├── lib/                → Logique métier, utilitaires, moteur de workflow, store global.
├── hooks/              → Hooks React personnalisés (données, UI, pagination...).
├── api/                → Couche d'appel API (aujourd'hui simulée, à brancher sur le vrai backend).
├── data/               → Données statiques (catalogue des blocs de workflow).
└── styles.css           → Styles globaux Tailwind.
public/                 → Images et assets statiques (logo, stylo/pen nav).
types/                  → Types TypeScript partagés (ex. ai.ts).
doc/                    → Cette documentation.
```

## Comment lire cette documentation

Chaque fichier `doc/XX-nom.md` couvre un **regroupement logique** de fichiers source (une fonctionnalité ou une famille de composants), avec pour chacun :
- son **rôle** en une phrase,
- ses **dépendances** avec les autres fichiers,
- s'il y a lieu, les **points à connecter au backend** (données mockées, appels API prévus).

## Sommaire des documents (au fur et à mesure de leur publication)

1. `00-vue-ensemble.md` — ce document
2. `01-composants-ui-base.md` — composants de base (`src/components/ui/`)
3. `02-layout-navigation.md` — structure de page, sidebar, navigation
4. `03-composants-applicatifs.md` — composants transversaux à logique métier légère (tableaux de données, dialogs, export, recherche globale, primitives "design system" LeadCortex)
5. *(à venir : pages CRM (prospects/entreprises/deals), module séquences & conversations, module workflow, module IA, dashboard/analytics, auth/onboarding, settings/facturation, site public & légal, store global et couche API — un fichier par étape)*

> Cette liste sera complétée à chaque étape avec les fichiers réellement livrés.