# Barre mobile personnalisable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre de choisir 4–5 sections de la barre mobile et leur ordre, depuis une sous-page de Paramètres › Affichage avec aperçu modifiable.

**Architecture:** Un module pur `nav-layout.ts` (catalogue de pages + règles 4/5, bulle, calcul de la barre et de « Autre ») ; une préférence locale dans `layout-prefs.ts` ; la vraie barre et l'éditeur partagent le même composant visuel `MobileNavBarView`. Glisser-déposer via `@hello-pangea/dnd` (déjà installé).

**Tech Stack:** React 19, TanStack Router, Tailwind, `@hello-pangea/dnd`, tests Vitest (fichiers `frontend/lib/__tests__/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-11-24-barre-mobile-personnalisable-design.md`

## Global Constraints
- Sections choisies : **minimum 4, maximum 5** ; « Autre » toujours en dernier, non déplaçable, non retirable.
- Bulle : `keys.length === 5 && (keys[0] === "academy" || forceBubble)`. Jamais de bulle avec 4.
- Défaut : `["academy", "people", "companies", "home", "hub"]`, `forceBubble: false` (= barre actuelle).
- Pages hors barre → listées dans « Autre », sous leur groupe d'origine (Engager, Gagner…) ; les pages par défaut retirées (Academy, Prospects, Entreprises, Accueil, Hub) vont dans un groupe « Principales » affiché en premier.
- Clé de stockage : `lc.layout.mobileNav` ; événement `lc:layout-mobile-nav`. Ancien réglage `lc.layout.hideAcademyMobile === "1"` sans layout stocké ⇒ layout initial = défaut sans `academy`.
- Sous-page visible uniquement quand `useIsMobile()` est vrai. Textes en français.

## Review Focus
- localStorage corrompu / clés inconnues / doublons / plus de 5 clés → `normalizeLayout` répare (test Task 1).
- Page courante retirée de la barre → l'onglet « Autre » doit s'afficher actif (test `isSectionActive` sur la section « other » générée, Task 1).
- Retirer la 1ʳᵉ section quand la bulle est forcée puis repasser à 4 → aucune bulle (test Task 1).
- Deux onglets ouverts : un changement dans l'un met à jour l'autre (événement `storage`, Task 2, vérif manuelle).
- Glisser sur écran tactile dans une feuille qui défile : la page ne doit pas défiler pendant le glisser (vérif manuelle Task 4).

---

### Task 1: Module pur `nav-layout.ts`

**Files:**
- Create: `frontend/lib/mobile/nav-layout.ts`
- Modify: `frontend/lib/mobile/nav-tree.ts` (garder types + `isSectionActive`/`isLinkActive` ; `MOBILE_NAV_SECTIONS` est remplacé par le catalogue)
- Test: `frontend/lib/__tests__/nav-layout.test.ts`

**Interfaces — Produces:**
```ts
export type NavPage = { key: string; label: string; icon: typeof Users; to: string; matches: string[]; exact?: boolean; group: string };
export const NAV_CATALOG: NavPage[];            // academy, people, companies, home, hub (group "Principales") + toutes les pages de l'ancien « Autre » avec leur groupe
export type MobileNavLayout = { keys: string[]; forceBubble: boolean };
export const NAV_MIN = 4, NAV_MAX = 5;
export const DEFAULT_NAV_LAYOUT: MobileNavLayout;
export function normalizeLayout(raw: unknown): MobileNavLayout;
export function hasBubble(l: MobileNavLayout): boolean;
export function addKey(l: MobileNavLayout, key: string): MobileNavLayout;    // no-op si déjà là ou si 5
export function removeKey(l: MobileNavLayout, key: string): MobileNavLayout; // no-op si 4
export function moveKey(l: MobileNavLayout, from: number, to: number): MobileNavLayout;
export function buildBar(l: MobileNavLayout): { bubble: MobileNavSection | null; main: MobileNavSection[] }; // main se termine par la section "other" (opensSheet, groups = pages hors barre)
```

- [ ] **Step 1: Write the failing tests** — `nav-layout.test.ts` :
  - `normalizeLayout(null)` → `DEFAULT_NAV_LAYOUT`
  - `normalizeLayout({keys:["people","x","people","emails","home","hub","tasks","calls"],forceBubble:"yes"})` → `{keys:["people","emails","home","hub","tasks"], forceBubble:false}`
  - `normalizeLayout({keys:["people"]})` → complété à 4 avec des clés du défaut absentes, dans l'ordre du défaut.
  - `hasBubble(DEFAULT_NAV_LAYOUT) === true` ; `hasBubble({keys:["emails","people","companies","home","hub"],forceBubble:false}) === false` ; même avec `forceBubble:true` → `true` ; 4 clés + `forceBubble:true` → `false`.
  - `removeKey` sur 4 clés renvoie l'objet inchangé ; `addKey` sur 5 clés idem.
  - `moveKey(DEFAULT, 0, 4).keys` → `["people","companies","home","hub","academy"]`.
  - `buildBar(DEFAULT)` : `bubble.key === "academy"`, `main.map(s=>s.key)` → `["people","companies","home","hub","other"]`, et « other » ne contient ni `/app/people` ni `/app/academy`.
  - `buildBar({keys:["emails","people","home","hub"],forceBubble:false})` : `bubble === null`, « other » contient un groupe « Principales » avec Academy et Entreprises en premier, et ne contient plus Emails ; `isSectionActive(other, "/app/companies") === true`.
- [ ] **Step 2: Run** `npx vitest run frontend/lib/__tests__/nav-layout.test.ts` — Expected: FAIL (module absent). *Vitest n'est pas installé : `npm i -D vitest` d'abord (seule dépendance ajoutée).*
- [ ] **Step 3: Implement** `nav-layout.ts`. `buildBar` convertit chaque `NavPage` en `MobileNavSection` `{key,label,icon,matches,items:[{to,label,icon,exact}]}` ; « other » = `{key:"other",label:"Autre",icon:MoreHorizontal,opensSheet:true,items:[],matches: toutes les matches des pages hors barre,groups}` en conservant l'ordre des groupes du catalogue. `isSectionActive` : remplacer le cas spécial `key === "home"` par `section.matches.includes("/app")` → égalité stricte.
- [ ] **Step 4: Run** les tests — Expected: PASS. `npx tsc --noEmit -p .` sans nouvelle erreur dans ces fichiers.
- [ ] **Step 5: Commit** `feat(mobile): modèle de barre de navigation personnalisable`

### Task 2: Préférence stockée + vraie barre

**Files:**
- Modify: `frontend/lib/core/layout-prefs.ts` (ajouter ; supprimer `HIDE_ACADEMY_*`, `read/write/useHideAcademyFromMobile` une fois Task 3 faite — ici on les garde)
- Create: `frontend/components/layout/mobile-nav-bar-view.tsx`
- Modify: `frontend/components/layout/mobile-bottom-nav.tsx`

**Interfaces — Consumes:** Task 1. **Produces:**
```ts
export function readMobileNavLayout(): MobileNavLayout;
export function writeMobileNavLayout(l: MobileNavLayout): void; // localStorage + CustomEvent
export function useMobileNavLayout(): MobileNavLayout;          // écoute l'événement + "storage"
// mobile-nav-bar-view.tsx
export function MobileNavBarView(props: {
  bubble: ReactNode | null;                 // contenu de la bulle (null = pas de bulle)
  items: ReactNode[];                       // cellules de la barre, « Autre » inclus
  barRef?: Ref<HTMLElement>; barProps?: HTMLAttributes<HTMLElement>; // pour le Droppable de l'éditeur
}): JSX.Element;
export const NAV_ICON_STYLE: CSSProperties; // clamp(20px,5.5vw,26px)
```
- [ ] **Step 1:** `readMobileNavLayout` = `normalizeLayout(JSON.parse(stored))`, ou, sans valeur stockée, défaut sans `academy` si l'ancienne clé vaut `"1"`.
- [ ] **Step 2:** Extraire de `mobile-bottom-nav.tsx` le rendu bulle + `<nav>` grille (mêmes classes exactes) dans `MobileNavBarView`. `MobileBottomNav` utilise `buildBar(useMobileNavLayout())` et rend `MobileNavSectionButton` dans les cellules ; badges calculés sur `[bubble, ...main]`. Dépendance du `useEffect` de hauteur : `[side, layout]`.
- [ ] **Step 3: Verify** `npx tsc --noEmit -p .` ; en mobile, la barre par défaut est identique à avant (bulle Academy + 4 + Autre) ; « Autre » liste les mêmes pages qu'avant.
- [ ] **Step 4: Commit** `feat(mobile): barre du bas pilotée par la préférence`

### Task 3: Éditeur dans Paramètres › Affichage

**Files:**
- Create: `frontend/components/settings/panels/mobile-nav-editor.tsx`
- Modify: `frontend/components/settings/panels/DisplayPanel.tsx`, `frontend/lib/core/layout-prefs.ts` (retirer l'ancien hide-academy)

**Interfaces — Consumes:** Tasks 1–2. **Produces:** `export function MobileNavEditor(): JSX.Element`.

- [ ] **Step 1: DisplayPanel** — état `active: SectionDisplayKey | "mobile-nav" | null`. Dans le groupe « Mobile », remplacer la carte « Academy dans la barre » par une `SectionCard` « Barre de navigation » (icône `Smartphone`, résumé = libellés des sections, ex. « Academy · Prospects · Entreprises · Accueil · Hub »). Clic → vue détaillée avec le même en-tête retour que `DrilldownView` puis `<MobileNavEditor />`. Supprimer `AcademyMobilePreview` et les imports morts.
- [ ] **Step 2: MobileNavEditor**, de haut en bas :
  1. **Aperçu** : `MobileNavBarView` avec un `DragDropContext` + `Droppable direction="horizontal"` ; chaque clé est un `Draggable` (icône + libellé court + petit ✕ en coin, ✕ désactivé si 4). La bulle (si `hasBubble`) est rendue comme 1ʳᵉ cellule ronde du même Droppable. « Autre » affiché en dernier, non draggable, grisé avec un cadenas. Aucun lien.
  2. Texte d'aide : « Maintenez et glissez pour réordonner · 4 à 5 sections ».
  3. **Ajouter une section** : puces `+ Libellé` des pages du catalogue absentes de la barre, regroupées par groupe ; désactivées à 5 avec la mention « Barre complète (5 max) ».
  4. **Interrupteur** « Mettre la 1ʳᵉ section dans une bulle ronde » (`Switch`), visible seulement avec 5 sections ; activé d'office et désactivé (non modifiable) quand la 1ʳᵉ est Academy.
  5. Bouton **Rétablir la barre par défaut** (désactivé si déjà par défaut).
  Chaque action appelle `writeMobileNavLayout` immédiatement ; `onDragEnd` → `moveKey`.
- [ ] **Step 3:** Supprimer `HIDE_ACADEMY_*` / `useHideAcademyFromMobile` de `layout-prefs.ts` (lecture de l'ancienne clé conservée en interne dans `readMobileNavLayout`).
- [ ] **Step 4: Verify** `npx tsc --noEmit -p .` sans nouvelle erreur ; manuel en largeur mobile : ajouter/retirer/réordonner met à jour la vraie barre derrière la feuille instantanément ; mettre Emails en 1ʳᵉ position avec 5 sections → barre pleine sans bulle ; interrupteur → bulle Emails ; 4 sections → ✕ désactivés.
- [ ] **Step 5: Commit** `feat(settings): éditeur de la barre de navigation mobile`

### Task 4: Fluidité tactile

**Files:** Modify `frontend/components/settings/panels/mobile-nav-editor.tsx`

- [ ] **Step 1:** Vérifier le glisser au doigt dans la feuille `MobileSheet` (conteneur `overflow-y-auto`) : la feuille ne doit pas défiler pendant le glisser ; sinon ajouter `touch-action: none` sur les poignées et `isDragDisabled` sur « Autre ». Retour haptique `navigator.vibrate?.(10)` au début du glisser.
- [ ] **Step 2: Verify** manuel (Playwright en 390×844 ou téléphone) : réordonner 3 fois de suite sans saut visuel.
- [ ] **Step 3: Commit** `fix(settings): glisser-déposer tactile de la barre mobile`
