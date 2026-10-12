//frontend\components\onboarding\step-illustrations.tsx
/**
 * Illustrations des 4 étapes d'onboarding (hero + cartes).
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Principe
 * ─────────────────────────────────────────────────────────────────────────
 *  Chaque scène est UN SEUL <svg> (viewBox 240 × 180) qui contient :
 *    1. une tache beige douce (optionnelle),
 *    2. la vraie mascotte — tracés exacts de la planche, via <LeadMascot />,
 *    3. un accessoire propre à l'étape (loupe, laptop, enveloppe, graphique).
 *
 *  Tout est dans le même repère : la scène se met à l'échelle d'un bloc
 *  (`w-full h-auto`), sans jamais décaler la mascotte par rapport à son
 *  accessoire, quelle que soit la taille d'affichage. Aucun texte dans le
 *  SVG, donc rien qui puisse déborder.
 *
 *  Les couleurs passent par les tokens du design system (`fill-primary/10`,
 *  `fill-background`…) : la scène suit le thème clair/sombre. Seuls les
 *  bruns de la mascotte (loupe, laptop) sont figés pour rester cohérents
 *  avec elle.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { LeadMascot, type MascotPose } from "@/components/ui/lead-mascot";
import type { OnboardingStepKind } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

export type StepIllustrationKind = OnboardingStepKind;

export const STEP_POSE: Record<StepIllustrationKind, MascotPose> = {
  add: "curious",
  enrich: "neutral",
  sequence: "serene",
  track: "happy",
};

const BROWN = "#8B3E23";
const GOLD = "#CC9B5C";

function Blob() {
  return (
    <path
      className="fill-primary/[0.09]"
      d="M22 112C14 66 50 24 106 20c58-4 110 22 116 78 6 52-44 70-104 68-52-2-88-12-96-54Z"
    />
  );
}

function Sparkle({ cx, cy, r = 10 }: { cx: number; cy: number; r?: number }) {
  const k = r * 0.26;
  return (
    <path
      fill={GOLD}
      transform={`translate(${cx} ${cy})`}
      d={`M0 ${-r}L${k} ${-k}L${r} 0L${k} ${k}L0 ${r}L${-k} ${k}L${-r} 0L${-k} ${-k}Z`}
    />
  );
}

/** Mini-fiche contact : avatar + deux lignes de texte (sans texte réel). */
function ContactCard({ x, y, w = 62, h = 24 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={w}
        height={h}
        rx={7}
        className="fill-background stroke-primary/20"
        strokeWidth={1}
      />
      <circle cx={13} cy={h / 2} r={6} className="fill-primary/25" />
      <rect
        x={25}
        y={h / 2 - 6}
        width={w - 37}
        height={3.5}
        rx={1.75}
        className="fill-primary/30"
      />
      <rect
        x={25}
        y={h / 2 + 2}
        width={(w - 37) * 0.65}
        height={3.5}
        rx={1.75}
        className="fill-primary/15"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Étape 1 — Ajouter des prospects : loupe + liste de contacts               */
/* -------------------------------------------------------------------------- */

function AddProps() {
  return (
    <g>
      <ContactCard x={140} y={44} w={74} h={26} />
      <ContactCard x={140} y={76} w={74} h={26} />
      <ContactCard x={140} y={108} w={74} h={26} />

      <line
        x1={102}
        y1={120}
        x2={86}
        y2={140}
        stroke={BROWN}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle cx={116} cy={102} r={21} className="fill-background/60" />
      <circle cx={116} cy={102} r={21} fill="none" stroke={BROWN} strokeWidth={5} />
      <path
        d="M104 96a14 14 0 0 1 9-8"
        fill="none"
        stroke="#fff"
        strokeOpacity={0.85}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Étape 2 — Enrichir : laptop + fiches de données                           */
/* -------------------------------------------------------------------------- */

function EnrichProps() {
  return (
    <g>
      <Sparkle cx={138} cy={30} r={9} />

      <ContactCard x={146} y={42} w={66} h={26} />
      <ContactCard x={160} y={76} w={66} h={26} />

      <rect x={60} y={108} width={92} height={46} rx={6} fill="#A98466" />
      <rect
        x={60}
        y={108}
        width={92}
        height={46}
        rx={6}
        fill="none"
        stroke="#7E5C43"
        strokeWidth={1.5}
      />
      <circle cx={106} cy={131} r={5} fill="#F3E7D6" fillOpacity={0.85} />
      <path d="M50 156h112l-8 9H58Z" fill="#7E5C43" />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Étape 3 — Séquence : enveloppe + avion en papier                          */
/* -------------------------------------------------------------------------- */

function SequenceProps() {
  return (
    <g>
      <path
        d="M150 112C162 104 166 90 174 78"
        fill="none"
        className="stroke-primary/45"
        strokeWidth={2}
        strokeDasharray="3 5"
        strokeLinecap="round"
      />

      <path d="M176 76 214 46 196 90 188 80Z" className="fill-primary" />
      <path
        d="M188 80 214 46"
        stroke="#fff"
        strokeOpacity={0.75}
        strokeWidth={1.6}
        strokeLinecap="round"
      />

      <rect
        x={86}
        y={112}
        width={72}
        height={46}
        rx={7}
        fill="#F7E6CB"
        stroke="#CFA46A"
        strokeWidth={1.5}
      />
      <path
        d="M88 117 122 140 156 117"
        fill="none"
        stroke="#CFA46A"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  Étape 4 — Résultats : barres ascendantes + flèche de tendance             */
/* -------------------------------------------------------------------------- */

function TrackProps() {
  const bars = [
    { x: 140, h: 22, o: 0.45 },
    { x: 160, h: 38, o: 0.62 },
    { x: 180, h: 56, o: 0.8 },
    { x: 200, h: 76, o: 1 },
  ];
  const base = 150;
  return (
    <g>
      {bars.map((b) => (
        <rect
          key={b.x}
          x={b.x}
          y={base - b.h}
          width={15}
          height={b.h}
          rx={3.5}
          className="fill-primary"
          fillOpacity={b.o}
        />
      ))}

      <path
        d="M134 104 160 86 176 94 208 56"
        fill="none"
        stroke={BROWN}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M194 54H210V70"
        fill="none"
        stroke={BROWN}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

const PROPS: Record<StepIllustrationKind, () => React.JSX.Element> = {
  add: AddProps,
  enrich: EnrichProps,
  sequence: SequenceProps,
  track: TrackProps,
};

/* -------------------------------------------------------------------------- */
/*  Composant public                                                          */
/* -------------------------------------------------------------------------- */

type StepIllustrationProps = {
  kind: StepIllustrationKind;
  /** Affiche la tache beige derrière la scène (désactivée dans les cartes, qui ont leur propre fond). */
  blob?: boolean;
  className?: string;
};

export function StepIllustration({ kind, blob = true, className }: StepIllustrationProps) {
  const Props = PROPS[kind];

  return (
    <svg
      viewBox="0 0 240 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-auto w-full", className)}
    >
      {blob && <Blob />}
      <LeadMascot pose={STEP_POSE[kind]} x={12} y={14} width={112} height={153} />
      <Props />
    </svg>
  );
}
