//frontend\components\wavy-image-frame.tsx
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Image plein cadre dont le BORD GAUCHE est une vague.
 * ────────────────────────────────────────────────────────────────────────
 * Principe :
 *  - Le `<div>` conteneur porte un `clip-path` ondulé (bord gauche seul).
 *  - L'`<img>` à l'intérieur est en `object-cover` : elle REMPLIT la zone
 *    sans se déformer (ses proportions sont conservées, on rogne un peu
 *    sur les côtés si nécessaire). Elle ne rétrécit pas, elle ne s'étire
 *    pas — c'est exactement le comportement `background-size: cover`.
 *  - Le `clip-path` utilise `clipPathUnits="objectBoundingBox"` :
 *    les coordonnées sont dans [0,1] → la vague s'adapte automatiquement
 *    à n'importe quelle taille de conteneur, sans JS.
 *
 * Les ondulations ont des hauteurs et amplitudes VARIÉES (certaines
 * longues, d'autres courtes) pour un rendu organique, non répétitif.
 *
 * ⚠️  L'ID du clipPath est statique : un seul cadre monté à la fois
 *     (login OU signup). Si un jour plusieurs coexistent sur la même
 *     page, préfixer l'ID avec `useId()`.
 */
const WAVY_CLIP_ID = "lc-wavy-frame-clip";

export function WavyImageFrame({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <>
      {}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <clipPath id={WAVY_CLIP_ID} clipPathUnits="objectBoundingBox">
            {}
            <path
              d="
                M 0.10,0
                C 0.02,0.09 0.18,0.17 0.09,0.28
                C 0.06,0.34 0.14,0.38 0.10,0.44
                C 0.03,0.52 0.20,0.59 0.12,0.70
                C 0.07,0.76 0.17,0.81 0.10,0.88
                C 0.05,0.93 0.14,0.97 0.08,1
                L 1,1
                L 1,0
                Z
              "
            />
          </clipPath>
        </defs>
      </svg>

      <div
        className={cn("relative h-full w-full", className)}
        style={{ clipPath: `url(#${WAVY_CLIP_ID})` }}
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover object-center"
          draggable={false}
        />
      </div>
    </>
  );
}
