/**
 * Trophée — badges, accomplissements majeurs.
 *
 * Coupe dorée + base en bois, gemme centrale pour la préciosité.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type TrophyProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Trophy({ size = 32, className, title = "Trophée" }: TrophyProps) {
  const uid = useId().replace(/:/g, "_");
  const goldId = `trophy-gold-${uid}`;
  const baseId = `trophy-base-${uid}`;

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
        <linearGradient id={goldId} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#FFE89A" />
          <stop offset="45%" stopColor="#F5B800" />
          <stop offset="100%" stopColor="#A66A05" />
        </linearGradient>
        <linearGradient id={baseId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#8B5A2B" />
          <stop offset="100%" stopColor="#4A2E15" />
        </linearGradient>
      </defs>

      {/* Coupe */}
      <path
        d="M8 4h16v8a8 8 0 0 1-16 0V4Z"
        fill={`url(#${goldId})`}
        stroke="#8B5601"
        strokeOpacity="0.4"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* Anses */}
      <path
        d="M8 6H5.5a3 3 0 0 0 0 6H8"
        fill="none"
        stroke="#A66A05"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M24 6h2.5a3 3 0 0 1 0 6H24"
        fill="none"
        stroke="#A66A05"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Étoile gravée */}
      <path
        d="M16 7.5 17.6 11h3.6l-2.9 2.2 1.1 3.5-3.4-2.2-3.4 2.2 1.1-3.5L10.8 11h3.6Z"
        fill="#FFF5C2"
        opacity="0.85"
      />

      {/* Pied */}
      <path d="M14 19.5h4v3h-4z" fill={`url(#${goldId})`} />

      {/* Base */}
      <rect x="9" y="22.5" width="14" height="3" rx="0.6" fill={`url(#${baseId})`} />
      <rect x="7" y="25.5" width="18" height="3.2" rx="0.8" fill={`url(#${baseId})`} />
    </svg>
  );
}