/**
 * Nœud de leçon — élément central de l'arbre de progression Academy.
 *
 * Cinq états visuels :
 *   - locked      : gris, cadenas, aucune interaction.
 *   - available   : coloré contour, prêt à démarrer.
 *   - in_progress : rempli coloré + anneau animé de progression.
 *   - completed   : rempli vert + coche.
 *   - mastered    : rempli or + couronne.
 *
 * Le composant est purement visuel. La progression (0-1) est utilisée
 * pour dessiner un arc autour du nœud (état in_progress).
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type LessonNodeState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered";

export type LessonNodeProps = {
  size?: number;
  state?: LessonNodeState;
  /** Progression 0-1 (utilisée en in_progress). */
  progress?: number;
  className?: string;
  title?: string;
};

const STATE_PALETTE: Record<
  LessonNodeState,
  { from: string; to: string; stroke: string; bg: string }
> = {
  locked: {
    from: "#A8AFBB",
    to: "#5A6373",
    stroke: "#4A5260",
    bg: "rgba(168,175,187,0.12)",
  },
  available: {
    from: "#7DD3FC",
    to: "#2563EB",
    stroke: "#1D4ED8",
    bg: "rgba(59,130,246,0.12)",
  },
  in_progress: {
    from: "#FBBF24",
    to: "#EA580C",
    stroke: "#B45309",
    bg: "rgba(251,191,36,0.14)",
  },
  completed: {
    from: "#6EE7B7",
    to: "#059669",
    stroke: "#065F46",
    bg: "rgba(16,185,129,0.14)",
  },
  mastered: {
    from: "#FFE89A",
    to: "#F5B800",
    stroke: "#A66A05",
    bg: "rgba(245,184,0,0.16)",
  },
};

export function LessonNode({
  size = 64,
  state = "locked",
  progress = 0,
  className,
  title,
}: LessonNodeProps) {
  const uid = useId().replace(/:/g, "_");
  const fillId = `ln-fill-${uid}`;
  const innerId = `ln-inner-${uid}`;

  const palette = STATE_PALETTE[state];
  const cx = 32;
  const cy = 32;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);

  const label =
    title ??
    ({
      locked: "Leçon verrouillée",
      available: "Leçon disponible",
      in_progress: "Leçon en cours",
      completed: "Leçon terminée",
      mastered: "Leçon maîtrisée",
    }[state]);

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={fillId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <radialGradient id={innerId} cx="0.4" cy="0.3" r="0.65">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo extérieur (visible sur les états actifs) */}
      {(state === "in_progress" || state === "mastered") && (
        <circle
          cx={cx}
          cy={cy}
          r={28}
          fill="none"
          stroke={palette.to}
          strokeOpacity="0.18"
          strokeWidth="4"
        />
      )}

      {/* Cercle principal (remplissage ou contour selon état) */}
      {state === "locked" || state === "available" ? (
        <circle
          cx={cx}
          cy={cy}
          r={20}
          fill={palette.bg}
          stroke={palette.stroke}
          strokeWidth="2"
        />
      ) : (
        <>
          <circle cx={cx} cy={cy} r={20} fill={`url(#${fillId})`} />
          <circle
            cx={cx}
            cy={cy}
            r={20}
            fill="none"
            stroke={palette.stroke}
            strokeOpacity="0.55"
            strokeWidth="1"
          />
          <circle cx={cx} cy={cy} r={20} fill={`url(#${innerId})`} />
        </>
      )}

      {/* Anneau de progression (état in_progress) */}
      {state === "in_progress" && (
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={palette.stroke}
            strokeOpacity="0.18"
            strokeWidth="3"
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={palette.to}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 300ms ease-out" }}
          />
        </g>
      )}

      {/* Symbole central selon état */}
      <g>
        {state === "locked" && (
          <>
            {/* petit cadenas */}
            <path
              d="M28 33v-2.2a4 4 0 0 1 8 0V33"
              fill="none"
              stroke="#F0F2F5"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="25.5" y="32.5" width="13" height="9.5" rx="1.6" fill="#F0F2F5" />
            <circle cx="32" cy="36.5" r="1.3" fill="#5A6373" />
            <rect x="31.2" y="37.3" width="1.6" height="3.2" fill="#5A6373" />
          </>
        )}

        {state === "available" && (
          <path
            d="M27 25.5 39.5 32 27 38.5Z"
            fill={palette.stroke}
            strokeLinejoin="round"
          />
        )}

        {state === "in_progress" && (
          <path
            d="M27 25.5 39.5 32 27 38.5Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
            strokeLinejoin="round"
          />
        )}

        {state === "completed" && (
          <path
            d="M24 32.5 29 37.5 40.5 26"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {state === "mastered" && (
          <>
            <path
              d="M32 22.5 34 28h5.5l-4.4 3.2 1.7 5.3L32 33.5l-4.8 3 1.7-5.3L24.5 28H30Z"
              fill="#FFFFFF"
              fillOpacity="0.95"
            />
          </>
        )}
      </g>
    </svg>
  );
}