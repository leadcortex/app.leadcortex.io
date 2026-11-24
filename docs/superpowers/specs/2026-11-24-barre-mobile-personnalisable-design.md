# Barre de navigation mobile personnalisable — design (court)

## Intention
L'utilisateur peut ne pas aimer la barre du bas par défaut. Il doit pouvoir choisir
les sections visibles et leur ordre, simplement, avec un aperçu direct.

## Objectifs
- Sous-page « Barre de navigation » dans Paramètres › Affichage, visible **uniquement en mobile**.
- 4 à 5 sections choisies + « Autre » toujours fixé en dernier (6ᵉ).
- Aperçu = copie de la vraie barre (même rendu), sans liens, modifiable :
  glisser pour réordonner, ✕ pour retirer, puces « + » pour ajouter.
- Bulle ronde : avec 5 sections, la 1ʳᵉ va dans la bulle si c'est Academy (défaut).
  Si une autre section prend sa place, la barre est pleine largeur (pas de bulle),
  sauf si l'interrupteur « Mettre la 1ʳᵉ section dans une bulle ronde » est activé.
  Avec 4 sections : jamais de bulle.
- Toute page retirée de la barre apparaît automatiquement dans « Autre » ;
  une page ajoutée à la barre disparaît de « Autre ».
- Bouton « Rétablir la barre par défaut ». Application et sauvegarde immédiates (localStorage).

## Non-objectifs
- Pas de synchronisation serveur. Pas de modification sur desktop.

## Approches
1. **Retenue** — préférences locales (layout-prefs) + catalogue unique de pages dans
   `nav-tree.ts`, barre et feuille « Autre » calculées à partir de la préférence ;
   éditeur avec `@hello-pangea/dnd` (déjà installé).
2. Écarté — garder `MOBILE_NAV_SECTIONS` figé et masquer/afficher : ne permet pas
   l'ajout de pages venant de « Autre » ni l'ordre libre.

## Décisions
- L'ancien réglage « masquer Academy en mobile » est remplacé (retirer Academy = même effet) ;
  s'il était activé, la préférence initiale part sans Academy.
- Règle de la bulle : `bulle = (5 sections) && (1ʳᵉ = Academy || forceBubble)`.
  L'interrupteur `forceBubble` n'est visible/actif qu'avec 5 sections.

## Laissé au constructeur
- Détails visuels de l'éditeur, gestion tactile du glisser-déposer.
