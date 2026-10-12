/**
 * Médaille — accomplissements intermédiaires (badges de progression).
 *
 * Ruban rouge dégradé + disque doré + étoile centrale.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type MedalProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Medal({ size = 32, className, title = "Médaille" }: MedalProps) {
  const uid = useId().replace(/:/g, "_");
  const ribbonId = `medal-ribbon-${uid}`;
  const discId = `medal-disc-${uid}`;

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
        <linearGradient id={ribbonId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="100%" stopColor="#1E5FA8" />
        </linearGradient>
        <radialGradient id={discId} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#FFE89A" />
          <stop offset="55%" stopColor="#F5B800" />
          <stop offset="100%" stopColor="#A66A05" />
        </radialGradient>
      </defs>

      {/* Ruban */}
      <path d="M11 3h4l-2 10-3.5-1Z" fill={`url(#${ribbonId})`} />
      <path d="M17 3h4l1.5 9L19 13Z" fill={`url(#${ribbonId})`} />

      {/* Disque */}
      <circle cx="16" cy="20" r="9.5" fill={`url(#${discId})`} stroke="#8B5601" strokeOpacity="0.4" strokeWidth="0.7" />
      <circle cx="16" cy="20" r="7.5" fill="none" stroke="#FFF5C2" strokeOpacity="0.55" strokeWidth="0.7" />

      {/* Étoile */}
      <path
        d="M16 14.5 17.5 18h3.6l-2.8 2.2 1 3.4-3.3-2.1-3.3 2.1 1-3.4L10.9 18h3.6Z"
        fill="#FFF5C2"
        opacity="0.95"
      />
    </svg>
  );
}