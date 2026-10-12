/**
 * Étoile — XP.
 *
 * Deux variantes :
 *  - "solid"    : étoile pleine dorée, pour l'affichage d'XP gagné.
 *  - "outline"  : contour doré, pour le potentiel restant.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type StarProps = {
  size?: number;
  variant?: "solid" | "outline";
  className?: string;
  title?: string;
};

export function Star({
  size = 24,
  variant = "solid",
  className,
  title = "Points d'expérience",
}: StarProps) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `star-grad-${uid}`;
  const shineId = `star-shine-${uid}`;

  const path =
    "M16 2.8 20.2 11.4 29.7 12.8 22.9 19.4 24.5 28.9 16 24.4 7.5 28.9 9.1 19.4 2.3 12.8 11.8 11.4 Z";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFE8A3" />
          <stop offset="50%" stopColor="#FFC842" />
          <stop offset="100%" stopColor="#E0950E" />
        </linearGradient>
        <radialGradient id={shineId} cx="0.4" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {variant === "solid" ? (
        <>
          <path d={path} fill={`url(#${gradId})`} />
          <ellipse cx="12" cy="10.5" rx="3" ry="2.2" fill={`url(#${shineId})`} />
          <path
            d={path}
            fill="none"
            stroke="#A66A05"
            strokeOpacity="0.45"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <path
          d={path}
          fill="rgba(255,200,66,0.08)"
          stroke="#FFC842"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}