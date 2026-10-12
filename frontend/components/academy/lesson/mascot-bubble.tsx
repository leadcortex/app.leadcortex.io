"use client";

/**
 * Mascotte + bulle de dialogue.
 *
 * Affiche l'avatar équipé (via son ID backend → chemin SVG canonique), avec
 * un fallback intégré pour les IDs inconnus ou les assets manquants
 * (initiales + dégradé primaire). La bulle supporte 3 tons : neutre,
 * succès, encouragement.
 */
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/* Chemins canoniques des avatars — alignés sur all-avatars.yaml. */
const AVATAR_SVG_PATHS: Record<string, string> = {
  eagle: "/images/SVG-avatar/classic/Eagle.svg",
  fox: "/images/SVG-avatar/classic/Fox.svg",
  panda: "/images/SVG-avatar/classic/Panda.svg",
  "red-panda": "/images/SVG-avatar/classic/RedPanda.svg",
  tiger: "/images/SVG-avatar/classic/Tiger.svg",
  wolf: "/images/SVG-avatar/classic/Wolf.svg",
  owl: "/images/SVG-avatar/collector/Owl.svg",
  otter: "/images/SVG-avatar/collector/Otter.svg",
  cat: "/images/SVG-avatar/collector/Cat.svg",
  turtle: "/images/SVG-avatar/collector/Turtle.svg",
  lion: "/images/SVG-avatar/collector/Lion.svg",
  dolphin: "/images/SVG-avatar/collector/Dolphin.svg",
};

export type MascotBubbleTone = "neutral" | "success" | "encourage";

export type MascotBubbleProps = {
  /** ID backend de l'avatar (ex. "eagle"). */
  avatarId?: string;
  /** Texte affiché dans la bulle. */
  message: string;
  /** Ton de la bulle. */
  tone?: MascotBubbleTone;
  /** Taille de l'avatar en px. */
  avatarSize?: number;
  className?: string;
};

export function MascotBubble({
  avatarId = "eagle",
  message,
  tone = "neutral",
  avatarSize = 72,
  className,
}: MascotBubbleProps) {
  const uid = useId().replace(/:/g, "_");
  const gradId = `mascot-grad-${uid}`;
  const path = AVATAR_SVG_PATHS[avatarId];
  const [imageFailed, setImageFailed] = useState(false);

  const toneClasses: Record<MascotBubbleTone, string> = {
    neutral: "border-border bg-background",
    success: "border-success/40 bg-success/5",
    encourage: "border-warning/40 bg-warning/5",
  };

  return (
    <div className={cn("flex items-end gap-3", className)}>
      {/* Avatar */}
      <span
        className="relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {!imageFailed && path ? (
          <img
            src={path}
            alt=""
            aria-hidden="true"
            width={avatarSize}
            height={avatarSize}
            className="h-full w-full object-contain p-1.5"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <svg
            viewBox="0 0 64 64"
            width={avatarSize * 0.75}
            height={avatarSize * 0.75}
            role="img"
            aria-label="Mascotte"
          >
            <defs>
              <linearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#7DD3FC" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill={`url(#${gradId})`} />
            <circle cx="22" cy="28" r="3.2" fill="#FFFFFF" />
            <circle cx="42" cy="28" r="3.2" fill="#FFFFFF" />
            <path
              d="M22 42c4 4 16 4 20 0"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>

      {/* Bulle */}
      <div
        className={cn(
          "relative min-w-0 flex-1 rounded-2xl border px-4 py-3 shadow-sm",
          "before:absolute before:left-[-7px] before:bottom-4 before:h-3 before:w-3 before:rotate-45 before:border-b before:border-l",
          toneClasses[tone],
          tone === "neutral" && "before:border-border before:bg-background",
          tone === "success" && "before:border-success/40 before:bg-success/5",
          tone === "encourage" && "before:border-warning/40 before:bg-warning/5",
        )}
      >
        <p className="text-sm leading-relaxed text-foreground md:text-[15px]">{message}</p>
      </div>
    </div>
  );
}