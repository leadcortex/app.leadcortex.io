# Structure de page et navigation

Ce document couvre les fichiers qui définissent **l'ossature commune** de toutes les pages : la coquille racine, la barre latérale de l'app, la navigation mobile, la nav du site public, et les mises en page partagées (docs, légal).

## 1. La racine de l'application

### `src/router.tsx`
Crée l'objet routeur TanStack (`getRouter`) à partir de l'arbre de routes généré (`routeTree.gen.ts`) et d'un `QueryClient` (React Query) partagé dans tout le contexte de routing. C'est le point d'entrée du système de routing.

### `src/routeTree.gen.ts`
**Fichier auto-généré, à ne jamais éditer à la main.** Régénéré automatiquement (par le plugin TanStack Router de Vite) à chaque fois qu'un fichier est ajouté/modifié dans `src/routes/`. Il liste toutes les routes de l'app et leurs types.

### `src/routes/__root.tsx`
Le **layout racine**, appliqué à absolument toutes les pages. Il gère :
- le `<html>`/`<head>` (titre, meta description, Open Graph, polices Google Fonts "Instrument Serif" + "Inter" + "JetBrains Mono", favicon) ;
- l'enveloppe globale `QueryClientProvider` (React Query) et `AppStoreProvider` (le store applicatif global, voir doc sur `src/lib/store.tsx`) ;
- le composant `<Toaster />` (notifications globales, voir `ui/sonner.tsx`) ;
- la page 404 (`NotFoundComponent`) ;
- la page d'erreur générique (`ErrorComponent`), qui journalise l'erreur via `reportError` (voir `src/lib/error-reporting.ts`).

C'est le fichier à regarder pour tout ce qui est **balises `<head>`, SEO, et gestion d'erreur globale**.

## 2. La coquille applicative (`/app/*`)

### `src/components/app-shell.tsx` (352 lignes)
La coquille de **toutes les pages sous `/app`** (le produit connecté, par opposition au site public). Responsabilités :
- affiche la bonne barre latérale desktop selon la préférence utilisateur (voir §3) ;
- affiche la navigation mobile (`MobilePenNav`) quand l'écran est petit ;
- affiche l'assistant IA (`AssistantSidebar`) ;
- contient la palette de commandes globale (`CommandDialog` de `ui/command.tsx`) déclenchée par un raccourci clavier, avec la liste des sections de l'app (Dashboard, Prospects, Entreprises, Séquences, etc.) ;
- affiche la recherche globale (`GlobalSearch`) et les notifications (icône cloche).

C'est le fichier à ouvrir pour toute modification touchant **l'agencement général de l'app** (où va la sidebar, où va le contenu, marges globales...).

## 3. Trois barres latérales différentes (desktop) — et une règle importante

Point clé à bien comprendre avant de toucher au layout : **il existe trois systèmes de barre latérale desktop indépendants**, sélectionnés par une préférence utilisateur stockée en `localStorage`, gérée par `src/lib/sidebar-preference.tsx` (clé `leadcortex:sidebar-variant`, valeurs possibles `"modern" | "pen-open" | "pen-closed"`, réglable dans les paramètres utilisateur). `app-shell.tsx` lit cette préférence et affiche le composant correspondant.

| Variante | Composant | Description |
|---|---|---|
| `modern` (par défaut) | `src/components/app-sidebar.tsx` | Barre latérale "classique" : navigation groupée par section (Accueil, Prospecter & enrichir, ...), repliable en mode icônes uniquement, état persistant en `localStorage` (`leadcortex:app-sidebar-collapsed`). Basée sur les tokens du design system, pas sur le kit `ui/sidebar.tsx`. |
| `pen-open` / `pen-closed` | `src/components/pen-sidebar.tsx` | La barre latérale **illustrée "stylo + encrier"**, une navigation entièrement custom avec des images (`/pen/pen-open.png`, `/pen/pen-closed.png`) et un positionnement précis des icônes de navigation par-dessus l'image, recalculé en temps réel via `ResizeObserver` pour rester aligné quelle que soit la taille d'écran. Peut être épinglée ouverte (`pen-open`) ou repliée et révélée au survol (`pen-closed`), avec bouton pin/unpin. |

Les deux systèmes utilisent la même liste d'icônes/routes (dupliquée intentionnellement entre les fichiers — à garder en tête si de nouvelles pages sont ajoutées : il faut mettre à jour **les trois** endroits : `app-sidebar.tsx`, `pen-sidebar.tsx`, et la nav mobile ci-dessous).

**Important : sur mobile, aucune des deux barres latérales desktop n'est jamais affichée**, quelle que soit la préférence choisie. C'est la navigation mobile dédiée qui prend le relais (voir §4).

## 4. Navigation mobile

### `src/components/mobile-pen-nav.tsx` (175 lignes)
La navigation mobile officielle et unique, surnommée "**Stylo-bottom-bar**" (du nom de l'asset `public/pen/Stylo-bottom-bar.png`) : une barre de navigation en bas d'écran avec les icônes des sections principales. Toujours affichée sur petit écran, indépendamment de la préférence de sidebar desktop.

### `src/hooks/use-mobile.tsx`
Hook `useIsMobile()` : détecte si la largeur d'écran est sous 768px (via `matchMedia`), avec mise à jour réactive au redimensionnement. C'est ce hook qui pilote la bascule desktop/mobile dans `app-shell.tsx` et ailleurs.

### `src/hooks/use-virtual-keyboard.ts`
Détecte l'ouverture/fermeture du **clavier virtuel mobile** en surveillant les variations de `visualViewport`, avec un seuil de 150px pour ne pas confondre l'ouverture du clavier avec la simple rétractation de la barre d'adresse Safari. Utilisé pour ajuster l'interface (éviter qu'un champ de saisie reste caché sous le clavier) — notamment dans l'éditeur de workflow mobile (voir doc dédiée).

### `src/hooks/use-resizable-panel.ts`
Hook générique pour rendre un panneau redimensionnable par glissement (utilisé notamment pour le tiroir de l'assistant IA et certains panneaux du workflow).

## 5. Marque et identité visuelle

### `src/components/brand-logo.tsx` + `src/components/brand-logo-mark.tsx`
`BrandLogo` affiche le composant SVG vectoriel `BrandLogoMark` accompagné du nom "LeadCortex". Le tracé officiel est intégré directement au rendu React pour rester net à toute taille et éviter une requête d’image supplémentaire.

**Lisibilité** : le tracé d'origine (repère 1254 × 1254) est enrichi à l'affichage — anneau épaissi (`RING_STROKE`), contour du loup épaissi (`WOLF_STROKE`) et `viewBox` recadrée au plus près du cercle. Le logo remplit ainsi toute la surface définie par `size` (plus de marge vide interne). Tailles de référence : `BrandLogo` 36 px par défaut, sidebar 32 px, barre du haut 32 px (mobile) / 36 px (≥ `sm`). Ne pas rajouter de `padding` sur le SVG : il réduirait à nouveau le logo. `public/favicon.svg` reprend la même géométrie.

## 6. Pages publiques : nav, footer, mises en page partagées

### `src/components/site-nav.tsx`
Exporte `SiteNav` (en-tête du site public : logo + liens Connexion/Essayer gratuitement, avec effet de flou "glassmorphism" sur le fond) et `SiteFooter` (pied de page du site public). Utilisé par toutes les pages **hors** `/app` (accueil, pricing, produit, docs, pages légales...).

### `src/components/docs-layout.tsx`
Mise en page partagée par toutes les pages de documentation publique (`src/routes/docs.*.tsx`). Affiche `SiteNav`/`SiteFooter`, un fil de navigation précédent/suivant entre articles (`findAdjacentDocs`) et le sommaire, à partir des données centralisées dans `src/lib/docs-content.ts`.

### `src/components/legal-layout.tsx`
Mise en page partagée par toutes les pages légales (CGU, CGV, confidentialité, cookies, DPA, mentions légales — `src/routes/legal.*.tsx`) : en-tête avec date de dernière mise à jour, sommaire de sections ancré (`sections`), liens vers les autres documents légaux via `legalLinks` (aussi dans `src/lib/docs-content.ts`).

## Points d'attention pour le backend

- Aucun de ces fichiers de layout/navigation n'appelle d'API — ce sont des éléments purement visuels et de routing.
- `src/lib/error-reporting.ts` (appelé depuis `__root.tsx`) est le point d'entrée pour un futur envoi des erreurs front vers un service de monitoring backend — actuellement à vérifier s'il journalise seulement en local (à voir en détail dans une étape "lib" dédiée).
- La navigation (listes de routes) est **codée en dur** dans 3 fichiers (`app-sidebar.tsx`, `pen-sidebar.tsx`, `mobile-pen-nav.tsx`) : ce n'est pas dynamique/piloté par une donnée backend (ex. pas de gestion de permissions par rôle pour l'instant).