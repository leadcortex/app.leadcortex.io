/**
 * Flamme — streak / jours consécutifs.
 *
 * Dégradé jaune → orange → rouge, avec un cœur plus clair pour la
 * profondeur. Utilisable en icône statique ou dans un badge de streak.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type FlameProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Flame({ size = 24, className, title = "Série" }: FlameProps) {
  const uid = useId().replace(/:/g, "_");
  const outerId = `flame-outer-${uid}`;
  const innerId = `flame-inner-${uid}`;

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
        <linearGradient id={outerId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFD966" />
          <stop offset="45%" stopColor="#FF9A3C" />
          <stop offset="100%" stopColor="#E14B20" />
        </linearGradient>
        <radialGradient id={innerId} cx="0.5" cy="0.65" r="0.55">
          <stop offset="0%" stopColor="#FFF5C2" />
          <stop offset="60%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#FF9A3C" stopOpacity="0.4" />
        </radialGradient>
      </defs>

      <path
        d="M16 2.5c.5 3.2-1.1 5.1-3.3 7.2-2.7 2.6-6.4 5.8-6.4 11.2 0 5.6 4.4 8.6 9.7 8.6s9.7-3 9.7-8.6c0-3.3-1.4-6.2-3.4-8.5-.4 1.4-1.3 2.6-2.7 3.2.6-3.6-.6-7.4-3.6-10.1-.6 1-.9 2.1-.9 3.3-1.6-1.6-2.6-3.6-2.7-5.9Z"
        fill={`url(#${outerId})`}
      />
      <path
        d="M16 12.2c-1.4 1.6-2.4 3.3-2.4 5.2 0 2.1 1.6 3.5 3.4 3.5s3.4-1.4 3.4-3.5c0-2-1.1-3.7-2.4-5.2-.5 1-1 1.9-2 2.6.2-1 .1-2-.4-3Z"
        fill={`url(#${innerId})`}
      />
    </svg>
  );
}