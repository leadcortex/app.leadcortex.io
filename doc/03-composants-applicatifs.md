# Composants applicatifs génériques — `src/components/` (hors `ui/`)

Ce document couvre les fichiers à la racine de `src/components/` qui **ne sont pas** des pages, ni de la navigation (doc 02), ni des briques shadcn (doc 01) : ce sont des composants **transversaux avec un peu de logique**, utilisés par plusieurs modules métier (Prospects, Entreprises, Séquences, Deals, Dashboard...). Contrairement aux briques de `ui/`, certains d'entre eux savent des choses sur LeadCortex (lecture du store global, notion de "lead"/"company"...).

Les composants propres à un seul module (workflow, IA, tâches, conversations, RDV, paiement) sont dans leurs sous-dossiers respectifs et seront couverts dans les prochaines étapes.

## 1. Tableaux de données

### `data-table.tsx` (414 lignes) — **le composant central de la partie "liste" de l'app**
`DataTable<T>` : tableau générique utilisé par toutes les listes de l'app (prospects, entreprises, séquences, deals, tâches...). Gère en interne :
- la **recherche texte** locale (`searchFields`, filtre en mémoire) ;
- le **tri** par colonne (cliquable si `sortable: true`), avec bascule asc/desc et icônes `ArrowUp`/`ArrowDown`/`ArrowUpDown` ;
- la **pagination** locale (`pageSize`, contrôles première/précédente/suivante/dernière page) ;
- la **sélection** de lignes (checkbox par ligne + "tout sélectionner"), pilotée depuis l'extérieur via `selectedIds`/`onSelectRow`/`onSelectAll` (le composant ne détient pas l'état de sélection lui-même) ;
- un **état de chargement** (`isLoading` + `loadingRows`, affiche des lignes squelettes) ;
- un **mode `comfortable`** (lignes plus hautes/aérées) et `hideOnMobile` par colonne pour l'adaptation responsive.

Chaque colonne (`Column<T>`) définit soit une clé directe (`key`), soit une fonction `accessor(row)` pour un rendu personnalisé (badges, avatars, actions...). **Point important pour le backend** : tri, recherche et pagination sont actuellement **100 % côté client** (tout le tableau de données est chargé en mémoire puis filtré/trié/paginé en JS). Quand un vrai backend paginé arrivera, il faudra soit ajouter des props "mode serveur" (page courante contrôlée, callback de tri/recherche remonté au parent), soit accepter la pagination client tant que les volumes restent raisonnables.

## 2. Menus, confirmations et édition

### `action-menu.tsx`
`ActionMenu` : le menu "⋯" (trois petits points) qu'on retrouve sur les lignes de tableau et les fiches (Prospects, Entreprises, Séquences...). Liste d'actions (`ActionMenuItem[]`) avec icône optionnelle, ton `danger` (texte rouge, pour "Supprimer" par ex.) et séparateurs. Gère lui-même l'ouverture/fermeture (clic extérieur, touche Échap). Composant purement présentational : chaque item exécute juste le callback `onSelect` qui lui est passé.

### `confirm-dialog.tsx`
`ConfirmDialog` : petite modale de confirmation générique (bâtie sur `ui/alert-dialog.tsx`), utilisée avant toute action destructive ou importante ("Supprimer ce prospect ?", etc.). Titre/description/libellés des boutons personnalisables, variante `destructive` qui colore le bouton de confirmation en rouge.

### `edit-record-dialog.tsx`
`EditRecordDialog` : modale d'édition **générique et pilotée par configuration**, utilisée par les fiches Prospect / Entreprise / Séquence pour éditer un enregistrement. On lui passe une liste de champs (`EditField[]` : texte, email, nombre, zone de texte ou liste déroulante) et les valeurs actuelles ; elle gère l'état du formulaire en interne et restitue un objet `Record<string, string>` via `onSave`. Ne fait pas d'appel réseau elle-même — c'est à l'appelant (la page/le hook) de persister les données, ce qui en fera un point de branchement backend simple une fois les hooks de mutation en place.

## 3. États vides et chargement

### `empty-state.tsx`
`EmptyState` : bloc "aucune donnée" standard (icône + titre + description + bouton d'action optionnel), en 3 tailles (`sm`/`md`/`lg`). Affiché quand une liste est vide (aucun prospect, aucune séquence créée, résultat de recherche vide...).

### `loading.tsx`
`Loading` : spinner rond générique, 4 tailles, avec libellé optionnel et mode `fullScreen` (overlay plein écran avec fond flouté) pour les chargements bloquants de page entière.

### `skeletons/` (dossier)
Bibliothèque de squelettes de chargement, découpée par grand contexte plutôt qu'un seul gros fichier :
| Fichier | Rôle |
|---|---|
| `layout-skeletons.tsx` | Briques de base réutilisables (en-tête de page, barre d'outils, ligne de KPI...), construites sur `ui/skeleton.tsx`. |
| `dashboard-skeleton.tsx` | Squelette complet du tableau de bord (cartes KPI + graphiques). |
| `workspace-skeletons.tsx` | Squelettes des écrans "espace de travail" (listes avec en-tête/toolbar/KPI), composés à partir des briques de `layout-skeletons.tsx`. |
| `auth-skeletons.tsx` | Squelette des écrans `/login` et `/signup`. |
| `marketing-skeletons.tsx` | Squelette de la nav publique (miroir de `SiteNav`) et des pages du site vitrine. |
| `hydration-gate.tsx` | `HydrationGate` : composant utilitaire qui affiche un `fallback` (un des squelettes ci-dessus) tant que le store global (`useAppStore`, voir doc sur `src/lib/store.tsx`) n'est pas encore hydraté côté client — évite un flash de contenu vide/incorrect au premier rendu. |

Tous ces squelettes sont **statiques** (pas de données réelles) : ils ne font qu'imiter visuellement la mise en page finale pendant l'attente.

## 4. Export de données

### `export-modal.tsx` (249 lignes)
`ExportModal` : modale d'export utilisée sur les listes (Prospects, Entreprises, Séquences, Deals — voir le type `entityType`). Propose :
- le **format** (CSV ou Excel) ;
- le **périmètre** ("résultats filtrés" avec le compte affiché, ou "tous les éléments") ;
- la **sélection des colonnes** à inclure (`availableColumns`, cases à cocher).

Le déclenchement effectif est délégué à la prop `onExport(options)` (async), fournie par la page appelante — **aujourd'hui simulé** (pas de génération réelle de fichier ni d'appel réseau dans ce composant). C'est le point à connecter à un vrai endpoint d'export backend (génération du fichier côté serveur, ou génération côté client à partir des données déjà chargées).

## 5. Recherche globale

### `global-search.tsx` (381 lignes)
`GlobalSearch` : la palette de recherche globale déclenchée depuis la coquille applicative (`app-shell.tsx`, voir doc 02), construite sur `ui/command.tsx` (`CommandDialog`). Recherche simultanément parmi les prospects, entreprises, séquences et deals **déjà présents dans le store global** (`useAppStore`, aucun appel réseau dédié à la recherche pour l'instant), avec debounce de la saisie (`useDebounce`). Affiche les résultats groupés par catégorie avec icône dédiée, distingue les éléments "enregistrés/favoris" (`saved`), et propose une navigation clavier vers la fiche correspondante. **Point d'attention backend** : la recherche est donc limitée aux données déjà chargées en mémoire côté client — une vraie recherche full-text côté serveur (utile dès que le volume de données grandit) remplacerait la logique de filtrage actuelle sans changer l'interface.

## 6. Primitives de mise en page ("design system" applicatif)

### `ui-primitives.tsx` (255 lignes)
Petit kit de briques visuelles **propres à LeadCortex** (par opposition à `ui/` qui est générique shadcn) : `PageHeader` (bandeau de titre de page, avec eyebrow/titre/description/actions — utilisé en haut de quasiment toutes les pages `/app`), `Kpi` (carte de métrique chiffrée avec variation delta ↑/↓), `Badge` (variante maison, à ne pas confondre avec `ui/badge.tsx`), `Toolbar`, `TableCard` (conteneur de tableau), `EmptyHint`, `Switch`, `Field` (wrapper de champ de formulaire), et **une seconde version de `CustomSelect`** distincte de `src/components/custom-select.tsx` du §1 ci-dessus.

> ⚠️ **Point d'attention pour la suite** : il existe donc **deux composants nommés `CustomSelect`** dans le projet (`src/components/custom-select.tsx` et `src/components/ui-primitives.tsx`), avec des implémentations différentes. Selon le fichier qui les importe, l'un ou l'autre est utilisé. À clarifier/unifier avant d'aller plus loin dans la connexion backend pour éviter toute confusion lors de futures modifications.

### `charts.tsx` (195 lignes)
Primitives de data-visualisation partagées par le Dashboard et la page Analytics, au-dessus de **Recharts** et du wrapper `ui/chart.tsx` (voir doc 01). Règles imposées par ce fichier : aucune couleur codée en dur (uniquement les tokens `var(--chart-1)` à `var(--chart-6)` du design system), rendu des graphiques uniquement après montage côté client (`ClientChart`, avec placeholder de même hauteur côté serveur pour éviter un saut de mise en page), et un conteneur à défilement horizontal (`ScrollFrame`, non compressé) pour les graphiques denses sur mobile.

### `index.ts`
Barrel de ré-export partiel : ne réexporte que `data-table`, `empty-state`, `loading` et `confirm-dialog`. Les autres composants de ce document s'importent directement depuis leur fichier (`@/components/action-menu`, etc.) — pas de règle stricte d'import dans ce dossier, à garder en tête en cas de refactor.

## Points d'attention pour le backend

- **Aucun de ces composants n'appelle une API lui-même.** Ils reçoivent des données et des callbacks en props ; la donnée vient aujourd'hui du store global ou de données mockées (voir doc à venir sur `src/lib/store.tsx` et `src/lib/mock-data.ts`).
- `DataTable` fait tri/recherche/pagination **côté client** : à surveiller si les volumes de données augmentent une fois le backend branché.
- `ExportModal` ne génère aucun fichier réel : `onExport` est le point de branchement à un futur endpoint d'export.
- `GlobalSearch` cherche uniquement dans les données déjà en mémoire : à remplacer par une recherche serveur si besoin de rechercher au-delà des données chargées.
- Doublon `CustomSelect` (§6) à surveiller/nettoyer.