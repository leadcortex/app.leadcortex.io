/**
 * Cadenas — bloc verrouillé, leçon non encore accessible.
 *
 * Deux variantes :
 *  - "closed" : cadenas fermé (leçon locked).
 *  - "open"   : cadenas ouvert (transition).
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type LockProps = {
  size?: number;
  variant?: "closed" | "open";
  className?: string;
  title?: string;
};

export function Lock({
  size = 24,
  variant = "closed",
  className,
  title = "Verrouillé",
}: LockProps) {
  const uid = useId().replace(/:/g, "_");
  const bodyId = `lock-body-${uid}`;

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
        <linearGradient id={bodyId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#A8AFBB" />
          <stop offset="100%" stopColor="#5A6373" />
        </linearGradient>
      </defs>

      {/* Anse */}
      {variant === "closed" ? (
        <path
          d="M11 12V9a5 5 0 0 1 10 0v3"
          fill="none"
          stroke="#4A5260"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M11 12V9a5 5 0 0 1 8.5-3.5"
          fill="none"
          stroke="#4A5260"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}

      {/* Corps */}
      <rect
        x="7"
        y="12"
        width="18"
        height="14"
        rx="2.6"
        fill={`url(#${bodyId})`}
        stroke="#303640"
        strokeOpacity="0.5"
        strokeWidth="0.8"
      />

      {/* Serrure */}
      <circle cx="16" cy="18" r="1.9" fill="#1F242C" />
      <path d="M15.2 19.2h1.6v4.2h-1.6z" fill="#1F242C" rx="0.4" />
    </svg>
  );
}