# Composants UI de base — `src/components/ui/`

## Rôle général

Ce dossier contient les **briques visuelles de base** de toute l'application : boutons, champs de formulaire, menus, dialogs, tableaux... Ce sont des composants **génériques, sans logique métier** — ils ne savent rien de LeadCortex, des leads, des workflows, etc. Ils sont basés sur la bibliothèque **shadcn/ui** (des composants Radix UI habillés avec des classes Tailwind), copiés dans le projet plutôt qu'installés en dépendance — c'est la convention shadcn : le code vous appartient et peut être modifié librement.

Tous les autres composants métier de l'application (formulaires de lead, tableaux de bord, éditeur de workflow...) sont construits **au-dessus** de ces briques.

**Aucun de ces fichiers ne fait d'appel réseau.** Ils reçoivent des données et des fonctions (callbacks) en `props` et affichent l'interface — rien à connecter au backend ici directement.

## Regroupement par usage

### Actions et saisie
| Fichier | Rôle |
|---|---|
| `button.tsx` | Le bouton standard de toute l'app. 6 styles (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) et 4 tailles (`default`, `sm`, `lg`, `icon`). Tous les boutons de l'app utilisent une de ces variantes. |
| `input.tsx` | Champ texte simple. |
| `textarea.tsx` | Zone de texte multi-lignes. |
| `checkbox.tsx` | Case à cocher. |
| `radio-group.tsx` | Boutons radio (choix unique parmi plusieurs). |
| `switch.tsx` | Interrupteur on/off. |
| `slider.tsx` | Curseur de sélection de valeur. |
| `toggle.tsx` / `toggle-group.tsx` | Bouton à bascule / groupe de boutons à bascule (ex. barre d'outils). |
| `select.tsx` | Liste déroulante native Radix (voir aussi `custom-select.tsx` dans `src/components/`, une version maison — détaillée dans la doc "composants applicatifs"). |
| `input-otp.tsx` | Champ de saisie de code à usage unique (OTP), style "cases séparées". |
| `label.tsx` | Étiquette de champ de formulaire, liée à l'accessibilité. |
| `form.tsx` | Ensemble de composants (`FormField`, `FormItem`, `FormLabel`, `FormMessage`...) qui connectent **React Hook Form** aux champs ci-dessus, avec affichage automatique des erreurs de validation. C'est la brique utilisée par tous les formulaires de l'app pour la validation. |

### Affichage de contenu
| Fichier | Rôle |
|---|---|
| `card.tsx` | Conteneur "carte" avec en-tête/contenu/pied de page — la brique la plus utilisée pour structurer une page. |
| `badge.tsx` | Petite étiquette colorée (statut, tag...). |
| `avatar.tsx` | Photo/initiales d'un utilisateur ou contact. |
| `table.tsx` | Élements HTML de tableau stylés (à ne pas confondre avec `data-table.tsx` dans `src/components/`, qui est le vrai composant de tableau de données avec tri/filtre — voir doc applicative). |
| `separator.tsx` | Ligne de séparation horizontale/verticale. |
| `skeleton.tsx` | Rectangle animé "chargement en cours" (placeholder pendant le chargement des données). |
| `progress.tsx` | Barre de progression. |
| `aspect-ratio.tsx` | Conteneur qui garde un ratio largeur/hauteur fixe (ex. pour les images). |
| `chart.tsx` | Wrapper autour de **Recharts** : fournit un système de thème (couleurs par série, mode clair/sombre) et un tooltip stylé cohérent avec le design de l'app. Utilisé par `src/components/charts.tsx` (graphiques du dashboard). |
| `calendar.tsx` | Calendrier de sélection de date (mois, jours). |

### Superposition / fenêtres
| Fichier | Rôle |
|---|---|
| `dialog.tsx` | Fenêtre modale centrée classique. |
| `alert-dialog.tsx` | Variante de modale pour les confirmations critiques (ex. suppression) — bloque tant que l'utilisateur n'a pas choisi. |
| `sheet.tsx` | Panneau qui glisse depuis un bord de l'écran (gauche/droite/haut/bas) — utilisé notamment pour les menus mobiles. |
| `drawer.tsx` | Panneau qui glisse depuis le bas, optimisé mobile (glissement tactile). |
| `popover.tsx` | Petite bulle de contenu ancrée à un élément, apparaît au clic. |
| `hover-card.tsx` | Comme `popover.tsx`, mais apparaît au survol (hover) plutôt qu'au clic. |
| `tooltip.tsx` | Info-bulle courte au survol. |
| `context-menu.tsx` | Menu contextuel (clic droit). |
| `dropdown-menu.tsx` | Menu déroulant classique (clic sur un bouton). |
| `menubar.tsx` | Barre de menu façon application desktop (menus horizontaux avec sous-menus). |
| `command.tsx` | Palette de commandes façon "Cmd+K" (recherche + liste filtrable au clavier). Utilisée par exemple dans l'éditeur de workflow. |

### Navigation
| Fichier | Rôle |
|---|---|
| `tabs.tsx` | Système d'onglets. |
| `breadcrumb.tsx` | Fil d'Ariane (chemin de navigation). |
| `pagination.tsx` | Contrôles de pagination (page précédente/suivante, numéros). |
| `navigation-menu.tsx` | Menu de navigation principal avec sous-menus (plutôt pour un site vitrine). |
| `accordion.tsx` | Sections repliables/dépliables. |
| `collapsible.tsx` | Bloc unique repliable/dépliable (version simple de l'accordéon). |
| `carousel.tsx` | Défilement horizontal d'éléments (slider d'images/cartes). |
| `resizable.tsx` | Panneaux redimensionnables par glissement (ex. séparation entre deux zones de l'écran). |
| `scroll-area.tsx` | Zone de défilement avec scrollbar stylée personnalisée. |

### Système / feedback
| Fichier | Rôle |
|---|---|
| `sonner.tsx` | Système de notifications "toast" (messages temporaires en bas/haut d'écran) — bibliothèque Sonner intégrée au thème de l'app. |
| `sidebar.tsx` | **Le plus gros fichier du dossier (~740 lignes).** Kit complet shadcn pour construire une barre latérale : gestion de l'état ouvert/fermé/replié, persistance dans un cookie, version mobile automatique (bascule en panneau `Sheet`), raccourci clavier (Cmd/Ctrl+B), sous-composants (`SidebarMenu`, `SidebarGroup`, `SidebarTrigger`...). C'est la fondation technique utilisée par `app-sidebar.tsx` (voir doc "layout et navigation") — mais le "pen sidebar" custom mobile (`pen-sidebar.tsx`, `mobile-pen-nav.tsx`) est un système entièrement différent et fait main, décrit séparément. |

## Point d'attention pour la suite du projet

Ces composants sont **stables et génériques** : il n'y a normalement rien à modifier ici lors du branchement du backend. Le travail de connexion aux API se fera dans les composants "applicatifs" (dossier `src/components/` hors `ui/`) et dans les hooks (`src/hooks/`), qui sont couverts dans les prochaines étapes de cette documentation.