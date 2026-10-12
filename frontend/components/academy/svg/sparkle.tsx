/**
 * Étincelle — micro-accomplissement, animation de validation.
 *
 * Forme étoilée asymétrique, dégradé jaune → blanc pour l'effet lumineux.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type SparkleProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Sparkle({ size = 20, className, title = "Étincelle" }: SparkleProps) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `sparkle-grad-${uid}`;

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
        <radialGradient id={gradId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#FFF1A8" />
          <stop offset="100%" stopColor="#F5B800" stopOpacity="0.6" />
        </radialGradient>
      </defs>

      {/* Grande étincelle */}
      <path
        d="M16 2c.6 6.5 5.5 11.4 12 12-6.5.6-11.4 5.5-12 12-.6-6.5-5.5-11.4-12-12 6.5-.6 11.4-5.5 12-12Z"
        fill={`url(#${gradId})`}
      />
      {/* Petite étincelle secondaire */}
      <path
        d="M25 20c.3 3.2 2.7 5.6 6 5.9-3.3.3-5.7 2.7-6 6-.3-3.3-2.7-5.7-6-6 3.3-.3 5.7-2.7 6-5.9Z"
        fill={`url(#${gradId})`}
        opacity="0.85"
      />
    </svg>
  );
}