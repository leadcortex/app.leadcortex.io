/**
 * Gemme — éléments précieux (avatars collector, badges secrets).
 *
 * Cristal polyédrique, dégradé bleu-violet, brillances blanches.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type GemProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Gem({ size = 32, className, title = "Gemme" }: GemProps) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `gem-grad-${uid}`;
  const shineId = `gem-shine-${uid}`;

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
        <linearGradient id={gradId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#C7B2FF" />
          <stop offset="40%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Corps */}
      <path
        d="M16 3 26 11 16 29 6 11Z"
        fill={`url(#${gradId})`}
        stroke="#2E1065"
        strokeOpacity="0.4"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* Facettes */}
      <path d="M16 3 6 11h20Z" fill="#DDD2FF" opacity="0.25" />
      <path d="M16 3 6 11l10 18Z" fill="#000000" opacity="0.12" />
      <path d="M16 3 26 11l-10 18Z" fill="#000000" opacity="0.06" />

      {/* Éclat */}
      <path d="M10 9 14 6 12 12Z" fill={`url(#${shineId})`} />
    </svg>
  );
}