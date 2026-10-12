/**
 * Couronne — niveau, rang, palier atteint.
 *
 * Dégradé doré chaud, gemmes colorées pour la richesse visuelle.
 * Utilisable dans une carte de profil, un badge de niveau.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type CrownProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Crown({ size = 32, className, title = "Niveau" }: CrownProps) {
  const uid = useId().replace(/:/g, "_");
  const goldId = `crown-gold-${uid}`;
  const shineId = `crown-shine-${uid}`;

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
        <linearGradient id={goldId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFE07A" />
          <stop offset="45%" stopColor="#F5B800" />
          <stop offset="100%" stopColor="#A66A05" />
        </linearGradient>
        <radialGradient id={shineId} cx="0.35" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base */}
      <path
        d="M4 25h24l-1.2 3.2a1.4 1.4 0 0 1-1.3.9H6.5a1.4 1.4 0 0 1-1.3-.9L4 25Z"
        fill={`url(#${goldId})`}
      />

      {/* Corps de la couronne */}
      <path
        d="M3.5 11.4 9 16.8l3.6-7.3a.6.6 0 0 1 1-.1l2.9 4.6 3.1-6.9a.6.6 0 0 1 1.1 0l3 6.8 3-4.5a.6.6 0 0 1 1 .1l3.6 7.3L27 11.4 25 22.5H7Z"
        fill={`url(#${goldId})`}
        stroke="#8B5601"
        strokeOpacity="0.4"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Gemmes */}
      <circle cx="7" cy="11.4" r="1.9" fill="#EF4B5E" />
      <circle cx="16" cy="10.2" r="2" fill="#3B82F6" />
      <circle cx="25" cy="11.4" r="1.9" fill="#10B981" />

      {/* Shine */}
      <ellipse cx="12" cy="19" rx="4.5" ry="1.6" fill={`url(#${shineId})`} />
    </svg>
  );
}