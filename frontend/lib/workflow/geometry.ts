//frontend\lib\workflow\geometry.ts
import {
  BLOCKS,
  CATEGORIES,
  type BlockDef,
  type CategoryDef,
  type CategoryKey,
} from "@/data/workflow-blocks-catalog";
import type { WComment, WDoc, WEdge, WNode } from "./types";

export const NODE_W = 268;

export const NODE_MIN_W = 220;
export const NODE_MAX_W = 760;
export const HEADER_H = 42;
export const SUB_H = 24;
export const FIELD_H = 30;
export const FIELDS_PAD = 8;
export const PORTS_PAD = 10;
export const PORT_GAP = 26;
export const BOTTOM_PAD = 12;
export const MAX_INLINE_FIELDS = 3;

export const BLOCK_DRAG_MIME = "application/x-leadcortex-block-id";

export const blockMap: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));
export const categoryMap: Record<CategoryKey, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
) as Record<CategoryKey, CategoryDef>;

let idSeq = 0;

export const uid = (p = "n") => `${p}_${++idSeq}`;

/** Hauteur mini/maxi de la zone de texte redimensionnable d'un bloc. */
export const NOTE_MIN_H = 56;
export const NOTE_MAX_H = 420;
export const NOTE_PAD = 10;
/**
 * Espace vertical additionnel réservé au-dessus de la zone de texte
 * redimensionnable, pour que son libellé flottant (positionné en léger
 * débord au-dessus du champ) ne colle jamais au sous-titre du bloc.
 */
export const NOTE_TOP_GAP = 14;
/**
 * Cas particulier des blocs « Script personnalisé » : le libellé du langage
 * et le bouton « Éditer » sont intégrés dans l'en-tête du conteneur de code
 * lui-même (au lieu de flotter au-dessus), donc aucun espace supplémentaire
 * n'est réservé entre le cadre (en-tête + champs) et le conteneur.
 */
export const NOTE_TOP_GAP_CODE = 0;

/**
 * Champ de texte long affiché (et redimensionnable) directement dans le bloc.
 * Défini explicitement par `noteField` dans le catalogue (blocs d'organisation,
 * notes…), ou déduit automatiquement : le premier champ `textarea`/`code` du
 * bloc, qui justifie toujours une zone de saisie multi-lignes plutôt qu'un
 * champ sur une seule ligne. Ce fallback évite qu'un champ long (instructions
 * IA, code, règles de filtrage…) ne se retrouve tronqué dans un simple
 * `<input>` sur la carte faute d'avoir été explicitement déclaré.
 */
export function noteField(n: WNode) {
  if (n.collapsed) return null;
  const block = blockMap[n.blockId];
  if (!block) return null;
  const key =
    block.noteField ??
    block.configFields.find((f) => f.type === "textarea" || f.type === "code")?.key;
  if (!key) return null;
  return block.configFields.find((f) => f.key === key) ?? null;
}

/**
 * Premier champ de type `code` du bloc, s'il existe. Sert à identifier la
 * famille « Script personnalisé » (aperçu de code en lecture seule sur la
 * carte + éditeur de code avancé).
 */
export function codeField(n: WNode) {
  const block = blockMap[n.blockId];
  return block?.configFields.find((f) => f.type === "code") ?? null;
}

/** Vrai si le bloc embarque du code éditable dans l'éditeur avancé. */
export const isCodeNode = (n: WNode) => Boolean(codeField(n));

/** Largeur effective d'un bloc (redimensionnement manuel borné). */
export const nodeWidth = (n: WNode) =>
  Math.round(Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, n.w ?? NODE_W)));

/**
 * Hauteur (px) occupée par la zone des champs de configuration inline d'un
 * bloc. Par défaut calculée à partir du nombre de champs (une ligne de
 * `FIELD_H` chacun). Si un champ `select` affiche une valeur prédéfinie trop
 * longue pour tenir sur une ligne, il passe automatiquement sur plusieurs
 * lignes (voir `NodeSelect`/`NodeCard`) : la hauteur réellement mesurée est
 * alors stockée sur le nœud (`fieldsH`) pour que le reste de la mise en page
 * (zone de code/notes, ports…) s'ajuste en conséquence plutôt que de
 * chevaucher le contenu qui dépasse.
 */
export function fieldsAreaHeight(n: WNode) {
  const f = inlineFields(n).length;
  if (!f) return 0;
  return n.fieldsH ?? FIELDS_PAD + f * FIELD_H;
}

/** Hauteur courante de la zone de texte du bloc (0 si aucune). */
export function noteAreaHeight(n: WNode) {
  const note = noteField(n);
  if (!note) return 0;
  const h = typeof n.noteH === "number" ? n.noteH : NOTE_MIN_H + 24;
  return Math.min(NOTE_MAX_H, Math.max(NOTE_MIN_H, h)) + NOTE_PAD;
}

/** Champs de configuration affichés directement dans le nœud. */
export function inlineFields(n: WNode) {
  if (n.collapsed) return [];
  const block = blockMap[n.blockId];
  const note = noteField(n);
  return (block?.configFields ?? [])
    .filter((f) => !note || f.key !== note.key)
    .slice(0, block?.inlineLimit ?? MAX_INLINE_FIELDS);
}

/**
 * Calcule le libellé de la prochaine entrée ajoutée dynamiquement sur un
 * bloc, en prolongeant la convention de nommage déjà utilisée par ses
 * entrées existantes plutôt qu'un format générique :
 *  - suffixe numérique (« Données 2 », « Source 2 ») → incrémente le nombre ;
 *  - suffixe alphabétique (« Branche A », « Branche B ») → lettre suivante ;
 *  - sinon, repli générique « Entrée N ».
 */
export function nextDynamicInputLabel(existingLabels: string[]): string {
  const last = existingLabels[existingLabels.length - 1] ?? "";
  const numMatch = last.match(/^(.*?)(\d+)$/);
  if (numMatch) {
    const [, prefix, numStr] = numMatch;
    return `${prefix}${parseInt(numStr, 10) + 1}`;
  }
  const letterMatch = last.match(/^(.*\s)([A-Za-z])$/);
  if (letterMatch) {
    const [, prefix, letter] = letterMatch;
    const isUpper = letter === letter.toUpperCase();
    const nextCode = letter.toUpperCase().charCodeAt(0) + 1;
    if (nextCode <= 90) {
      const nextLetter = String.fromCharCode(nextCode);
      return `${prefix}${isUpper ? nextLetter : nextLetter.toLowerCase()}`;
    }
  }
  return `Entrée ${existingLabels.length + 1}`;
}

export const portRows = (n: WNode) => {
  const extra = !n.collapsed && blockMap[n.blockId]?.dynamicInputs ? 1 : 0;
  return Math.max(n.inputs.length + extra, n.outputs.length, 1);
};

/** Hauteur du bloc header + sous-titre + champs inline + zone de texte. */
export function bodyHeight(n: WNode) {
  const hasNote = Boolean(noteField(n));
  const topGap = isCodeNode(n) ? NOTE_TOP_GAP_CODE : NOTE_TOP_GAP;
  return (
    HEADER_H +
    (n.collapsed ? 0 : SUB_H) +
    fieldsAreaHeight(n) +
    (hasNote ? topGap : 0) +
    noteAreaHeight(n)
  );
}

export const portsTop = (n: WNode) => bodyHeight(n) + PORTS_PAD;

export const nodeHeight = (n: WNode) =>
  n.collapsed ? HEADER_H + 8 : portsTop(n) + portRows(n) * PORT_GAP + BOTTOM_PAD;

/** Ordonnée (centre) de la n-ième rangée de ports, relative au nœud. */
export function portRowY(n: WNode, i: number) {
  if (n.collapsed) return HEADER_H / 2 + 4;
  return portsTop(n) + i * PORT_GAP + PORT_GAP / 2;
}

export const inputPos = (n: WNode, i: number) => ({ x: n.x, y: n.y + portRowY(n, i) });
export const outputPos = (n: WNode, i: number) => ({
  x: n.x + nodeWidth(n),
  y: n.y + portRowY(n, i),
});

export const portAnchor = (n: WNode, portId: string, side: "in" | "out") => {
  const list = side === "in" ? n.inputs : n.outputs;
  const idx = Math.max(
    0,
    list.findIndex((p) => p.id === portId),
  );
  return side === "in" ? inputPos(n, idx) : outputPos(n, idx);
};

export function bezier(a: { x: number; y: number }, b: { x: number; y: number }) {
  const d = Math.min(200, Math.max(56, Math.abs(b.x - a.x) * 0.55));
  return `M ${a.x} ${a.y} C ${a.x + d} ${a.y}, ${b.x - d} ${b.y}, ${b.x} ${b.y}`;
}

/** Rectangle englobant (coin haut-gauche + largeur/hauteur) utilisé comme obstacle pour le routage des câbles. */
export type Rect = { id: string; x: number; y: number; w: number; h: number };
type Pt = { x: number; y: number };

/** Marge de dégagement conservée entre un câble et le contour d'un bloc. */
const CABLE_CLEARANCE = 20;
/** Espacement latéral entre deux câbles qui quittent le même port. */
const CABLE_FAN_SPREAD = 13;

function cubicPoint(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

/**
 * Échantillonne la courbe et calcule le décalage vertical minimal
 * ("bulge") à appliquer aux poignées pour que le tracé passe au-dessus ou
 * en dessous des obstacles qu'il traverserait sinon — jamais derrière ou
 * en dessous d'un bloc. On choisit systématiquement le côté (haut/bas) le
 * plus proche pour garder une courbe naturelle.
 */
function requiredBulge(a: Pt, c1: Pt, c2: Pt, b: Pt, obstacles: Rect[]): number {
  if (!obstacles.length) return 0;
  let push = 0;
  const samples = 14;
  for (let i = 1; i < samples; i++) {
    const p = cubicPoint(a, c1, c2, b, i / samples);
    for (const r of obstacles) {
      const left = r.x - CABLE_CLEARANCE;
      const right = r.x + r.w + CABLE_CLEARANCE;
      const top = r.y - CABLE_CLEARANCE;
      const bottom = r.y + r.h + CABLE_CLEARANCE;
      if (p.x <= left || p.x >= right || p.y <= top || p.y >= bottom) continue;
      const pushUp = top - p.y; // négatif : remonter la poignée
      const pushDown = bottom - p.y; // positif : descendre la poignée
      const candidate = Math.abs(pushUp) < Math.abs(pushDown) ? pushUp : pushDown;
      if (Math.abs(candidate) > Math.abs(push)) push = candidate;
    }
  }
  return push;
}

/** Choisit, pour une boucle de retour, le côté (haut/bas) le moins encombré par les obstacles connus. */
function pickLoopSide(a: Pt, b: Pt, obstacles: Rect[]): 1 | -1 {
  const midY = (a.y + b.y) / 2;
  let above = 0;
  let below = 0;
  for (const r of obstacles) {
    const cy = r.y + r.h / 2;
    if (cy < midY) above++;
    else below++;
  }
  return below <= above ? 1 : -1; // 1 = boucle vers le bas, -1 = vers le haut
}

/** Un segment de courbe cubique du câble. */
export type Cubic = { a: Pt; c1: Pt; c2: Pt; b: Pt };

export type EdgePathOpts = {
  obstacles?: Rect[];
  fanIndex?: number;
  fanCount?: number;
  /**
   * Désactive temporairement l'évitement d'obstacles pour ce câble précis.
   * Utilisé pendant qu'un bloc est glissé au-dessus du câble : le tracé doit
   * rester « aimanté » sous le bloc pour permettre l'insertion, au lieu de le
   * fuir.
   */
  ignoreObstacles?: boolean;
};

/**
 * Calcule les segments de courbe d'un câble entre deux ports, en tenant
 * compte des blocs environnants (jamais de tracé qui passe derrière/sous un
 * nœud), de la distance/position relative des extrémités (tension
 * adaptative), et du rang du câble parmi ses "frères" quittant le même port
 * (pour que plusieurs câbles issus d'un même point de départ ne se
 * chevauchent pas).
 */
export function edgeSegments(a: Pt, b: Pt, opts: EdgePathOpts = {}): Cubic[] {
  const { fanIndex = 0, fanCount = 1, ignoreObstacles = false } = opts;
  const obstacles = ignoreObstacles ? [] : (opts.obstacles ?? []);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;

  // Léger éventail au départ : chaque câble d'un même port reçoit un angle
  // de sortie un peu différent plutôt que de partir exactement superposé.
  const fanOffset = fanCount > 1 ? (fanIndex - (fanCount - 1) / 2) * CABLE_FAN_SPREAD : 0;
  const start = { x: a.x, y: a.y + fanOffset * 0.4 };

  // Tension adaptative : les câbles majoritairement horizontaux s'étirent
  // plus (courbe douce et large), les câbles majoritairement verticaux
  // gardent des poignées courtes pour suivre la pente sans s'évaser.
  const horizWeight = Math.min(1, Math.abs(dx) / (Math.abs(dx) + Math.abs(dy) + 1) + 0.3);
  const tension = Math.min(220, Math.max(48, dist * 0.42 * horizWeight));

  const isBackward = dx < NODE_W * 0.35;

  if (!isBackward) {
    let c1 = { x: start.x + tension, y: start.y };
    let c2 = { x: b.x - tension, y: b.y };
    const relevant = obstacles.filter(
      (r) => r.x + r.w >= Math.min(start.x, b.x) - 4 && r.x <= Math.max(start.x, b.x) + 4,
    );
    const bulge = requiredBulge(start, c1, c2, b, relevant);
    if (bulge) {
      c1 = { x: c1.x, y: c1.y + bulge };
      c2 = { x: c2.x, y: c2.y + bulge };
    }
    return [{ a: start, c1, c2, b }];
  }

  // Câble "de retour" (la cible n'est pas franchement à droite de la
  // source, typiquement une boucle ou un nœud replacé en arrière) : on
  // sort nettement à droite du bloc source puis on boucle par le haut ou
  // le bas — jamais tout droit à travers les blocs intermédiaires — avant
  // de rentrer par la gauche dans le bloc cible.
  const side = pickLoopSide(start, b, obstacles);
  const reach = Math.max(64, tension * 0.75);
  const spread = 44 + Math.abs(fanOffset);
  const loopY = side === 1 ? Math.max(start.y, b.y) + spread : Math.min(start.y, b.y) - spread;

  const p1 = { x: start.x + reach, y: start.y };
  const p2 = { x: start.x + reach, y: loopY };
  const mid = { x: (start.x + b.x) / 2, y: loopY };
  const p3 = { x: b.x - reach, y: loopY };
  const p4 = { x: b.x - reach, y: b.y };

  return [
    { a: start, c1: p1, c2: p2, b: mid },
    { a: mid, c1: p3, c2: p4, b },
  ];
}

/** Tracé SVG d'un câble (voir `edgeSegments`). */
export function edgePath(a: Pt, b: Pt, opts: EdgePathOpts = {}): string {
  const segs = edgeSegments(a, b, opts);
  const first = segs[0]!;
  return [
    `M ${first.a.x} ${first.a.y}`,
    ...segs.map((s) => `C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.b.x} ${s.b.y}`),
  ].join(" ");
}

/** Échantillonne un câble en points (coordonnées monde) pour les tests de survol. */
export function samplePath(segs: Cubic[], perSegment = 22): Pt[] {
  const pts: Pt[] = [];
  for (const s of segs)
    for (let i = 0; i <= perSegment; i++)
      pts.push(cubicPoint(s.a, s.c1, s.c2, s.b, i / perSegment));
  return pts;
}

/**
 * Point du câble le plus proche du centre d'un rectangle, et distance
 * associée. Renvoie `null` si le câble ne croise jamais le rectangle
 * (élargi de `tolerance`).
 */
export function edgeHitTest(
  segs: Cubic[],
  rect: { x: number; y: number; w: number; h: number },
  tolerance = 0,
): { point: Pt; distance: number } | null {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  let best: { point: Pt; distance: number } | null = null;
  for (const p of samplePath(segs)) {
    const inside =
      p.x >= rect.x - tolerance &&
      p.x <= rect.x + rect.w + tolerance &&
      p.y >= rect.y - tolerance &&
      p.y <= rect.y + rect.h + tolerance;
    if (!inside) continue;
    const distance = Math.hypot(p.x - cx, p.y - cy);
    if (!best || distance < best.distance) best = { point: p, distance };
  }
  return best;
}

export function makeNode(blockId: string, x: number, y: number): WNode {
  const block = blockMap[blockId] ?? BLOCKS[0]!;
  const config: Record<string, string | number | boolean> = {};
  for (const f of block.configFields)
    if (f.defaultValue !== undefined) config[f.key] = f.defaultValue;
  const outputs =
    block.branches && block.branches.length
      ? block.branches.map((b) => ({ id: b.id, label: b.label }))
      : [{ id: "out", label: "Sortie" }];
  return {
    id: uid("node"),
    blockId: block.id,
    category: block.category,
    title: block.title,
    subtitle: block.subtitle,
    x: Math.round(x),
    y: Math.round(y),
    inputs:
      block.category === "trigger" || block.category === "organisation"
        ? []
        : block.inputs && block.inputs.length
          ? block.inputs.map((p) => ({ id: p.id, label: p.label }))
          : [{ id: "in", label: "Entrée" }],

    outputs: block.category === "organisation" || block.terminal ? [] : outputs,
    config,
  };
}

export function makeComment(x: number, y: number, targetId: string | null = null): WComment {
  return {
    id: uid("cmt"),
    x: Math.round(x),
    y: Math.round(y),
    w: 260,
    h: 150,
    text: "## Note\nDécris ici **l'intention** de cette branche.\n\n- point clé\n- `variable`",
    targetId,
    pointer: true,
  };
}

export function connect(doc: WDoc, e: Omit<WEdge, "id">): WDoc {
  if (e.source === e.target) return doc;
  const exists = doc.edges.some(
    (x) =>
      x.source === e.source &&
      x.sourcePort === e.sourcePort &&
      x.target === e.target &&
      x.targetPort === e.targetPort,
  );
  if (exists) return doc;
  const edges = doc.edges.filter((x) => !(x.target === e.target && x.targetPort === e.targetPort));
  return { ...doc, edges: [...edges, { ...e, id: uid("edge") }] };
}

/**
 * Vrai si `nodeId` peut être inséré au milieu du câble `edge` :
 * le bloc doit posséder une entrée et une sortie, ne pas être déjà une des
 * deux extrémités, et l'insertion ne doit pas créer de cycle immédiat.
 */
export function canInsertOnEdge(doc: WDoc, edge: WEdge, nodeId: string): boolean {
  if (edge.source === nodeId || edge.target === nodeId) return false;
  const n = doc.nodes.find((x) => x.id === nodeId);
  if (!n || !n.inputs.length || !n.outputs.length) return false;
  // Le bloc ne doit pas déjà être branché sur ce même segment.
  const already = doc.edges.some(
    (e) =>
      (e.source === edge.source && e.target === nodeId) ||
      (e.source === nodeId && e.target === edge.target),
  );
  return !already;
}

/**
 * Insère un bloc au milieu d'un câble existant :
 * `A ➔ B` devient `A ➔ N ➔ B`. Le câble d'origine est supprimé et deux
 * nouveaux câbles sont créés, sans intervention manuelle.
 */
export function insertNodeOnEdge(doc: WDoc, edgeId: string, nodeId: string): WDoc {
  const edge = doc.edges.find((e) => e.id === edgeId);
  if (!edge || !canInsertOnEdge(doc, edge, nodeId)) return doc;
  const node = doc.nodes.find((n) => n.id === nodeId)!;
  const inPort = node.inputs[0]!.id;
  const outPort = node.outputs[0]!.id;

  // On retire le câble d'origine, ainsi que tout câble arrivant déjà sur
  // l'entrée du bloc inséré ou sur l'entrée cible (une entrée = un câble).
  const kept = doc.edges.filter(
    (e) =>
      e.id !== edgeId &&
      !(e.target === nodeId && e.targetPort === inPort) &&
      !(e.target === edge.target && e.targetPort === edge.targetPort),
  );

  return {
    ...doc,
    edges: [
      ...kept,
      {
        id: uid("edge"),
        source: edge.source,
        sourcePort: edge.sourcePort,
        target: nodeId,
        targetPort: inPort,
      },
      {
        id: uid("edge"),
        source: nodeId,
        sourcePort: outPort,
        target: edge.target,
        targetPort: edge.targetPort,
      },
    ],
  };
}

/** Espacement horizontal entre deux colonnes (au-delà de la largeur du bloc). */
const LAYOUT_COL_GAP = 120;
/** Espacement vertical de base entre deux blocs voisins dans une même colonne. */
const LAYOUT_ROW_GAP = 56;
/** Marge appliquée après recentrage du résultat. */
const LAYOUT_MARGIN = 80;
/** Espace supplémentaire inséré entre deux sous-branches distinctes (parents différents) d'une même colonne. */
const LAYOUT_BRANCH_GAP = 34;
/** Amplitude max du décalage vertical organique appliqué à chaque nœud (px). */
const LAYOUT_Y_JITTER = 16;
/** Amplitude max du décalage horizontal organique appliqué à chaque nœud (px). */
const LAYOUT_X_JITTER = 12;
/** Variation aléatoire additionnelle de l'espacement vertical entre deux blocs consécutifs (px). */
const LAYOUT_GAP_JITTER = 18;

/**
 * Petit générateur pseudo-aléatoire déterministe (FNV-1a) basé sur une
 * chaîne : permet d'obtenir des décalages "organiques" stables (même
 * disposition d'un clic à l'autre pour un même document) plutôt qu'un
 * `Math.random()` qui ferait sauter le layout à chaque appel.
 */
function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return ((h >>> 0) % 10000) / 10000; // [0, 1)
}
/** Variante centrée sur 0, dans [-1, 1]. */
const seededSigned = (seed: string) => seededRandom(seed) * 2 - 1;

/**
 * Calcule une disposition en arbre organique (colonnes = profondeur depuis
 * les déclencheurs, lignes = frères/soeurs) pour l'auto-réorganisation du
 * canevas. Les nœuds sans arête entrante démarrent la colonne 0 ; chaque
 * nœud suivant est placé dans la colonne juste après son parent le plus
 * profond (tri topologique par plus long chemin), puis ordonné dans sa
 * colonne selon la position moyenne (barycentre) de ses parents déjà
 * placés afin de limiter les croisements de câbles.
 *
 * Pour éviter un rendu robotique et parfaitement grillagé, la disposition :
 *  - regroupe les nœuds par branche (même parent principal) et insère un
 *    espace supplémentaire entre deux sous-branches distinctes ;
 *  - applique un léger décalage vertical et horizontal déterministe
 *    (seedé sur l'id du nœud) à chaque bloc, pour une allure plus fluide
 *    et "dessinée à la main" plutôt qu'un alignement millimétré ;
 *  - fait légèrement varier l'espacement vertical entre deux blocs voisins.
 *
 * Renvoie `null` si la disposition ne peut pas être améliorée (0 ou 1
 * nœud), sinon une map id -> position (coin haut-gauche) prête à être
 * appliquée aux nœuds.
 */
export function computeTreeLayout(doc: WDoc): Map<string, { x: number; y: number }> | null {
  const { nodes, edges } = doc;
  if (nodes.length < 2) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const n of nodes) {
    outgoing.set(n.id, []);
    inDegree.set(n.id, 0);
  }
  for (const e of edges) {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target) || e.source === e.target) continue;
    outgoing.get(e.source)!.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  // Tri topologique (Kahn) qui propage la profondeur = plus long chemin
  // depuis une racine, afin qu'un nœud à parents multiples se place
  // toujours après le plus profond de ses parents.
  const depth = new Map<string, number>();
  const remaining = new Map(inDegree);
  const queue: string[] = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  for (const id of queue) depth.set(id, 0);
  let cursor = 0;
  while (cursor < queue.length) {
    const id = queue[cursor++]!;
    for (const t of outgoing.get(id) ?? []) {
      depth.set(t, Math.max(depth.get(t) ?? 0, (depth.get(id) ?? 0) + 1));
      const left = (remaining.get(t) ?? 0) - 1;
      remaining.set(t, left);
      if (left === 0) queue.push(t);
    }
  }
  // Nœuds restants (boucles éventuelles) : profondeur 0 par défaut, pour
  // qu'ils restent visibles plutôt que de disparaître de la disposition.
  for (const n of nodes) if (!depth.has(n.id)) depth.set(n.id, 0);

  const columns = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(n.id);
  }
  const maxDepth = Math.max(...columns.keys());

  // Parent "principal" de chaque nœud (première arête entrante rencontrée) :
  // sert à détecter les changements de sous-branche au sein d'une colonne
  // pour y insérer un espacement supplémentaire (LAYOUT_BRANCH_GAP).
  const primaryParent = new Map<string, string | undefined>();
  for (const n of nodes) {
    const parents = edges.filter((e) => e.target === n.id).map((e) => e.source);
    primaryParent.set(n.id, parents[0]);
  }

  const yCenter = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number }>();
  const xOf = (d: number) => d * (NODE_W + LAYOUT_COL_GAP);

  const placeColumn = (ids: string[], d: number) => {
    let cursorY = 0;
    let prevParent: string | undefined | null = null;
    for (const id of ids) {
      const n = nodeMap.get(id)!;
      const h = nodeHeight(n);
      const parent = primaryParent.get(id);

      // Nouvelle sous-branche détectée (parent principal différent du
      // précédent) : on aère la disposition avec un espace additionnel,
      // lui-même légèrement variable pour ne pas paraître calibré au pixel.
      if (prevParent !== null && parent !== prevParent) {
        cursorY += LAYOUT_BRANCH_GAP + seededRandom(`${id}:branch`) * (LAYOUT_BRANCH_GAP / 2);
      }

      const yJitter = seededSigned(`${id}:y`) * LAYOUT_Y_JITTER;
      const xJitter = seededSigned(`${id}:x`) * LAYOUT_X_JITTER;
      const y = cursorY + yJitter;

      positions.set(id, { x: xOf(d) + xJitter, y });
      yCenter.set(id, y + h / 2);

      const gapJitter = seededRandom(`${id}:gap`) * LAYOUT_GAP_JITTER;
      cursorY += h + LAYOUT_ROW_GAP + gapJitter;
      prevParent = parent ?? undefined;
    }
  };

  // Colonne 0 : on garde l'ordre naturel du document pour une disposition
  // stable et prévisible d'un clic à l'autre (le léger jitter organique
  // reste appliqué pour éviter un alignement trop rigide).
  const col0 = nodes.filter((n) => depth.get(n.id) === 0).map((n) => n.id);
  placeColumn(col0, 0);

  for (let d = 1; d <= maxDepth; d++) {
    const ids = columns.get(d) ?? [];
    // Tri par barycentre des parents déjà positionnés : limite les
    // croisements de câbles et regroupe naturellement les sous-branches.
    // À barycentre égal, on regroupe par parent principal afin que les
    // enfants d'un même bloc restent contigus (branches lisibles).
    const parentY = new Map<string, number>();
    for (const id of ids) {
      const parents = edges.filter((e) => e.target === id).map((e) => e.source);
      const ys = parents.map((p) => yCenter.get(p)).filter((v): v is number => v !== undefined);
      parentY.set(
        id,
        ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : Number.MAX_SAFE_INTEGER,
      );
    }
    const sorted = [...ids].sort((a, b) => {
      const dy = (parentY.get(a) ?? 0) - (parentY.get(b) ?? 0);
      if (Math.abs(dy) > 0.5) return dy;
      return (primaryParent.get(a) ?? "").localeCompare(primaryParent.get(b) ?? "");
    });
    placeColumn(sorted, d);
  }

  // Recentrage global pour repartir d'une marge propre en haut à gauche.
  const all = [...positions.values()];
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const offsetX = LAYOUT_MARGIN - minX;
  const offsetY = LAYOUT_MARGIN - minY;
  for (const [id, p] of positions)
    positions.set(id, { x: Math.round(p.x + offsetX), y: Math.round(p.y + offsetY) });

  return positions;
}

export function docBounds(doc: WDoc) {
  const pts: { x: number; y: number; w: number; h: number }[] = [
    ...doc.nodes.map((n) => ({ x: n.x, y: n.y, w: nodeWidth(n), h: nodeHeight(n) })),
    ...doc.comments.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })),
  ];
  if (!pts.length) return { minX: 0, minY: 0, maxX: 1200, maxY: 800 };
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x + p.w)),
    maxY: Math.max(...pts.map((p) => p.y + p.h)),
  };
}
