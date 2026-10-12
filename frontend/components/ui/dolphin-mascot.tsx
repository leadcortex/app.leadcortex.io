//frontend\components\ui\dolphin-mascot.tsx
import type { SVGProps } from "react";

export const DOLPHIN_COLORS = {
  body: "#A9532F",

  bodyDeep: "#8B3E23",

  bodyShadow: "#733218",

  belly: "#FBF6EC",

  bellyEdge: "#EFE6D5",

  ink: "#161514",

  light: "#FFFFFF",

  blush: "#D87A5A",
} as const;

export type DolphinMood =
  | "neutral"
  | "happy"
  | "curious"
  | "thoughtful"
  | "surprised"
  | "serene"
  | "motivated"
  | "tired"
  | "problem"
  | "success";

type DolphinMascotProps = Omit<SVGProps<SVGSVGElement>, "width" | "height" | "color"> & {
  size?: number | string;

  mood?: DolphinMood;

  blush?: boolean;

  label?: string | null;
};

/**
 * Humeurs pour lesquelles on affiche les joues rosées par défaut.
 * Sorti en constante pour rendre la condition lisible et éviter
 * tout mélange `?? ||` dans le JSX.
 */
const BLUSH_MOODS: ReadonlySet<DolphinMood> = new Set<DolphinMood>([
  "happy",
  "success",
  "motivated",
  "neutral",
]);

export function DolphinMascot({
  size = 120,
  mood = "neutral",
  blush,
  label = "Mascotte LeadCortex",
  className,
  ...props
}: DolphinMascotProps) {
  const numericSize = typeof size === "number" ? size : undefined;
  const width = numericSize;
  const height = numericSize ? Math.round(numericSize * 1.4) : undefined;

  // ⚠️  Ne PAS écrire `blush ?? mood === "happy" || …` : JS/TS interdit

  const defaultBlush = BLUSH_MOODS.has(mood);
  const showBlush = blush ?? defaultBlush;

  return (
    <svg
      viewBox="0 0 200 280"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      {...props}
    >
      {}
      {}
      {/*     Les bases se glissent sous le corps (y≈232) pour éviter une   */}
      {}
      {}
      <path
        d="
          M 82 232
          C 60 240, 34 258, 24 278
          C 30 281, 42 280, 54 275
          C 72 266, 90 252, 102 240
          Z
        "
        fill={DOLPHIN_COLORS.bodyDeep}
      />
      <path
        d="
          M 118 232
          C 140 240, 166 258, 176 278
          C 170 281, 158 280, 146 275
          C 128 266, 110 252, 98 240
          Z
        "
        fill={DOLPHIN_COLORS.bodyDeep}
      />

      {}
      {}
      {}
      {}
      {}
      <path
        d="
          M 82 46
          C 82 24, 94 12, 108 13
          C 122 14, 132 24, 134 40
          C 128 32, 118 28, 108 30
          C 96 33, 87 38, 82 46
          Z
        "
        fill={DOLPHIN_COLORS.bodyDeep}
      />

      {}
      {}
      {}
      {}
      {}
      <path
        d="
          M 52 168
          C 34 174, 20 190, 16 208
          C 14 214, 18 218, 26 216
          C 38 212, 50 200, 56 186
          C 59 180, 59 172, 56 168
          Z
        "
        fill={DOLPHIN_COLORS.bodyDeep}
      />
      <path
        d="
          M 148 168
          C 166 174, 180 190, 184 208
          C 186 214, 182 218, 174 216
          C 162 212, 150 200, 144 186
          C 141 180, 141 172, 144 168
          Z
        "
        fill={DOLPHIN_COLORS.bodyDeep}
      />

      {}
      {}
      {}
      {}
      <path
        d="
          M 100 24
          C 76 24, 56 44, 50 72
          C 44 100, 42 130, 44 160
          C 46 190, 54 216, 68 234
          C 78 246, 88 252, 100 252
          C 112 252, 122 246, 132 234
          C 146 216, 154 190, 156 160
          C 158 130, 156 100, 150 72
          C 144 44, 124 24, 100 24
          Z
        "
        fill={DOLPHIN_COLORS.body}
      />

      {}
      {}
      {}
      {}
      {}
      <path
        d="
          M 68 108
          C 78 100, 90 96, 100 96
          C 110 96, 122 100, 132 108
          C 142 122, 146 148, 144 176
          C 142 204, 134 226, 120 240
          C 114 247, 107 250, 100 250
          C 93 250, 86 247, 80 240
          C 66 226, 58 204, 56 176
          C 54 148, 58 122, 68 108
          Z
        "
        fill={DOLPHIN_COLORS.belly}
      />
      {}
      <path
        d="
          M 68 108
          C 78 100, 90 96, 100 96
          C 110 96, 122 100, 132 108
          C 122 108, 110 111, 100 111
          C 90 111, 78 108, 68 108
          Z
        "
        fill={DOLPHIN_COLORS.bellyEdge}
        opacity="0.6"
      />

      {}
      {}
      {}
      <DolphinEyes mood={mood} />

      {}
      {}
      {}
      <DolphinMouth mood={mood} />

      {}
      {}
      {}
      {showBlush && (
        <>
          <ellipse cx="60" cy="150" rx="8" ry="5" fill={DOLPHIN_COLORS.blush} opacity="0.32" />
          <ellipse cx="140" cy="150" rx="8" ry="5" fill={DOLPHIN_COLORS.blush} opacity="0.32" />
        </>
      )}
    </svg>
  );
}

const EYE_LEFT_X = 78;
const EYE_RIGHT_X = 122;
const EYE_Y = 128;

function DolphinEyes({ mood }: { mood: DolphinMood }) {
  const openEye = (cx: number) => (
    <>
      <ellipse cx={cx} cy={EYE_Y} rx="13" ry="15.5" fill={DOLPHIN_COLORS.ink} />
      <circle cx={cx + 4.5} cy={EYE_Y - 6} r="5" fill={DOLPHIN_COLORS.light} />
      <circle cx={cx - 3.5} cy={EYE_Y + 6} r="2.4" fill={DOLPHIN_COLORS.light} opacity="0.9" />
    </>
  );

  const happyEye = (cx: number) => (
    <path
      d={`M ${cx - 11} ${EYE_Y + 3} Q ${cx} ${EYE_Y - 10} ${cx + 11} ${EYE_Y + 3}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="none"
    />
  );

  // --- Yeux mi-clos (sérénité).
  const halfEye = (cx: number) => (
    <>
      <ellipse cx={cx} cy={EYE_Y} rx="13" ry="15.5" fill={DOLPHIN_COLORS.ink} />
      <path
        d={`M ${cx - 13} ${EYE_Y - 4} Q ${cx} ${EYE_Y - 12} ${cx + 13} ${EYE_Y - 4}
            L ${cx + 13} ${EYE_Y - 18} L ${cx - 13} ${EYE_Y - 18} Z`}
        fill={DOLPHIN_COLORS.belly}
      />
      <circle cx={cx + 3} cy={EYE_Y + 5} r="3.6" fill={DOLPHIN_COLORS.light} />
    </>
  );

  // --- Yeux fatigués : paupière lourde + petit reflet bas.
  const tiredEye = (cx: number) => (
    <>
      <ellipse cx={cx} cy={EYE_Y + 2} rx="13" ry="13" fill={DOLPHIN_COLORS.ink} />
      <path
        d={`M ${cx - 13} ${EYE_Y + 2} Q ${cx} ${EYE_Y - 6} ${cx + 13} ${EYE_Y + 2}`}
        stroke={DOLPHIN_COLORS.body}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={cx - 4} cy={EYE_Y + 4} r="2" fill={DOLPHIN_COLORS.light} opacity="0.85" />
    </>
  );

  // --- Yeux « problème » : plissés + 1 reflet.
  const annoyedEye = (cx: number) => (
    <>
      <ellipse cx={cx} cy={EYE_Y} rx="12" ry="14" fill={DOLPHIN_COLORS.ink} />
      <circle cx={cx + 4} cy={EYE_Y - 5} r="4" fill={DOLPHIN_COLORS.light} />
    </>
  );

  // --- Yeux « succès » : étoiles scintillantes.
  const starryEye = (cx: number) => (
    <>
      <ellipse cx={cx} cy={EYE_Y} rx="13" ry="15.5" fill={DOLPHIN_COLORS.ink} />
      <path
        d={`
          M ${cx} ${EYE_Y - 9}
          L ${cx + 2.5} ${EYE_Y - 2.5}
          L ${cx + 9} ${EYE_Y - 2}
          L ${cx + 3.5} ${EYE_Y + 2}
          L ${cx + 5} ${EYE_Y + 8}
          L ${cx} ${EYE_Y + 4}
          L ${cx - 5} ${EYE_Y + 8}
          L ${cx - 3.5} ${EYE_Y + 2}
          L ${cx - 9} ${EYE_Y - 2}
          L ${cx - 2.5} ${EYE_Y - 2.5}
          Z
        `}
        fill={DOLPHIN_COLORS.light}
      />
    </>
  );

  // --- Yeux « surpris » : plus grands, pupille réduite relative.
  const wideEye = (cx: number) => (
    <>
      <ellipse cx={cx} cy={EYE_Y} rx="14" ry="16" fill={DOLPHIN_COLORS.ink} />
      <circle cx={cx + 4.5} cy={EYE_Y - 6} r="5.5" fill={DOLPHIN_COLORS.light} />
      <circle cx={cx - 3.5} cy={EYE_Y + 6} r="2.8" fill={DOLPHIN_COLORS.light} />
    </>
  );

  // --- Sourcils (utile pour curious / motivated / problem).
  const browUp = (cx: number) => (
    <path
      d={`M ${cx - 12} ${EYE_Y - 22} Q ${cx} ${EYE_Y - 30} ${cx + 12} ${EYE_Y - 24}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="2.8"
      strokeLinecap="round"
      fill="none"
    />
  );
  const browDown = (cx: number) => (
    <path
      d={`M ${cx - 12} ${EYE_Y - 24} Q ${cx} ${EYE_Y - 18} ${cx + 12} ${EYE_Y - 26}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  );

  switch (mood) {
    case "happy":
    case "success":
      return (
        <>
          {happyEye(EYE_LEFT_X)}
          {happyEye(EYE_RIGHT_X)}
        </>
      );

    case "serene":
      return (
        <>
          {halfEye(EYE_LEFT_X)}
          {halfEye(EYE_RIGHT_X)}
        </>
      );

    case "tired":
      return (
        <>
          {tiredEye(EYE_LEFT_X)}
          {tiredEye(EYE_RIGHT_X)}
        </>
      );

    case "problem":
      return (
        <>
          {browDown(EYE_LEFT_X)}
          {browDown(EYE_RIGHT_X)}
          {annoyedEye(EYE_LEFT_X)}
          {annoyedEye(EYE_RIGHT_X)}
        </>
      );

    case "surprised":
      return (
        <>
          {browUp(EYE_LEFT_X)}
          {browUp(EYE_RIGHT_X)}
          {wideEye(EYE_LEFT_X)}
          {wideEye(EYE_RIGHT_X)}
        </>
      );

    case "curious":
      return (
        <>
          {browUp(EYE_LEFT_X)}
          {openEye(EYE_LEFT_X)}
          <ellipse cx={EYE_RIGHT_X} cy={EYE_Y} rx="11" ry="13" fill={DOLPHIN_COLORS.ink} />
          <circle cx={EYE_RIGHT_X + 4} cy={EYE_Y - 5} r="4.5" fill={DOLPHIN_COLORS.light} />
          <circle
            cx={EYE_RIGHT_X - 3}
            cy={EYE_Y + 5}
            r="2"
            fill={DOLPHIN_COLORS.light}
            opacity="0.9"
          />
        </>
      );

    case "motivated":
      return (
        <>
          {browDown(EYE_LEFT_X)}
          {browDown(EYE_RIGHT_X)}
          {openEye(EYE_LEFT_X)}
          {openEye(EYE_RIGHT_X)}
        </>
      );

    case "thoughtful":
      return (
        <>
          {openEye(EYE_LEFT_X)}
          <ellipse cx={EYE_RIGHT_X} cy={EYE_Y} rx="12" ry="14" fill={DOLPHIN_COLORS.ink} />
          <circle cx={EYE_RIGHT_X + 4} cy={EYE_Y - 5} r="4" fill={DOLPHIN_COLORS.light} />
        </>
      );

    case "neutral":
    default:
      return (
        <>
          {openEye(EYE_LEFT_X)}
          {openEye(EYE_RIGHT_X)}
        </>
      );
  }
}

/* -------------------------------------------------------------------------- */
/*  Bouche — variantes selon l'humeur                                        */
/* -------------------------------------------------------------------------- */

function DolphinMouth({ mood }: { mood: DolphinMood }) {
  // Positions canoniques : sous le ventre, à mi-chemin entre les yeux.
  const CX = 100;
  const CY = 158;

  const smile = (
    <path
      d={`M ${CX - 10} ${CY} Q ${CX} ${CY + 10} ${CX + 10} ${CY}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="2.6"
      strokeLinecap="round"
      fill="none"
    />
  );

  const openSmile = (
    <path
      d={`
        M ${CX - 15} ${CY - 4}
        Q ${CX} ${CY + 14} ${CX + 15} ${CY - 4}
        Q ${CX} ${CY + 4} ${CX - 15} ${CY - 4}
        Z
      `}
      fill={DOLPHIN_COLORS.ink}
    />
  );

  const straight = (
    <path
      d={`M ${CX - 8} ${CY} L ${CX + 8} ${CY}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
  );

  const round = <ellipse cx={CX} cy={CY + 2} rx="5" ry="6.5" fill={DOLPHIN_COLORS.ink} />;

  const frown = (
    <path
      d={`M ${CX - 9} ${CY + 4} Q ${CX} ${CY - 3} ${CX + 9} ${CY + 4}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
  );

  const thinking = (
    <path
      d={`M ${CX - 10} ${CY} Q ${CX} ${CY - 3} ${CX + 6} ${CY + 3}`}
      stroke={DOLPHIN_COLORS.ink}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
  );

  switch (mood) {
    case "happy":
    case "success":
      return openSmile;
    case "surprised":
      return round;
    case "problem":
      return frown;
    case "thoughtful":
      return thinking;
    case "tired":
      return straight;
    case "serene":
    case "neutral":
    case "curious":
    case "motivated":
    default:
      return smile;
  }
}
