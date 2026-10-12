/**
 * Cœur — vie / hearts.
 *
 * Deux variantes visuelles :
 *  - "full"   : cœur plein coloré (rouge/rose avec dégradé).
 *  - "empty"  : contour seul, légèrement transparent.
 *
 * Utilisé dans la barre de vie de la leçon et sur le profil apprenant.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type HeartProps = {
  size?: number;
  variant?: "full" | "empty";
  className?: string;
  title?: string;
};

export function Heart({
  size = 24,
  variant = "full",
  className,
  title = "Vie",
}: HeartProps) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `heart-grad-${uid}`;
  const shineId = `heart-shine-${uid}`;

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
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF7A8A" />
          <stop offset="55%" stopColor="#EF4B5E" />
          <stop offset="100%" stopColor="#B71C2E" />
        </linearGradient>
        <radialGradient id={shineId} cx="0.35" cy="0.28" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {variant === "full" ? (
        <>
          <path
            d="M16 27.5c-.35 0-.7-.12-.98-.35C9.6 22.6 3 17.4 3 10.9 3 6.9 6.2 4 10.1 4c2.5 0 4.7 1.2 5.9 3.2C17.2 5.2 19.4 4 21.9 4 25.8 4 29 6.9 29 10.9c0 6.5-6.6 11.7-12.02 16.25A1.55 1.55 0 0 1 16 27.5Z"
            fill={`url(#${gradId})`}
          />
          <ellipse
            cx="11.5"
            cy="10.5"
            rx="4.5"
            ry="3.2"
            fill={`url(#${shineId})`}
          />
          <path
            d="M16 27.5c-.35 0-.7-.12-.98-.35C9.6 22.6 3 17.4 3 10.9 3 6.9 6.2 4 10.1 4c2.5 0 4.7 1.2 5.9 3.2C17.2 5.2 19.4 4 21.9 4 25.8 4 29 6.9 29 10.9c0 6.5-6.6 11.7-12.02 16.25A1.55 1.55 0 0 1 16 27.5Z"
            fill="none"
            stroke="#7A0E1E"
            strokeOpacity="0.35"
            strokeWidth="0.8"
          />
        </>
      ) : (
        <path
          d="M16 27.5c-.35 0-.7-.12-.98-.35C9.6 22.6 3 17.4 3 10.9 3 6.9 6.2 4 10.1 4c2.5 0 4.7 1.2 5.9 3.2C17.2 5.2 19.4 4 21.9 4 25.8 4 29 6.9 29 10.9c0 6.5-6.6 11.7-12.02 16.25A1.55 1.55 0 0 1 16 27.5Z"
          fill="rgba(239,75,94,0.10)"
          stroke="#EF4B5E"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}