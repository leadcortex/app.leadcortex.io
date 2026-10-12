/**
 * Bouclier — protection (hearts non consommés, streak freeze, sécurité).
 *
 * Dégradé bleu acier, contour sombre, emblème central.
 */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type ShieldProps = {
  size?: number;
  variant?: "steel" | "gold";
  className?: string;
  title?: string;
};

export function Shield({
  size = 24,
  variant = "steel",
  className,
  title = "Protection",
}: ShieldProps) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `shield-grad-${uid}`;

  const stops =
    variant === "steel"
      ? { a: "#C9D6E8", b: "#5A7DA8", c: "#2C4A73" }
      : { a: "#FFE89A", b: "#F5B800", c: "#8B5601" };

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
          <stop offset="0%" stopColor={stops.a} />
          <stop offset="55%" stopColor={stops.b} />
          <stop offset="100%" stopColor={stops.c} />
        </linearGradient>
      </defs>

      <path
        d="M16 3 4 7v9c0 6.8 4.7 12 12 13.7C23.3 28 28 22.8 28 16V7Z"
        fill={`url(#${gradId})`}
        stroke="#1F2E45"
        strokeOpacity="0.45"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />

      {/* Emblème : petit chevron */}
      <path
        d="M12 13.5 16 17l4-3.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.75"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18 16 21.5l4-3.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}