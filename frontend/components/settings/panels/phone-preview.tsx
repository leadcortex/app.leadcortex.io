//frontend\components\settings\panels\phone-preview.tsx
// Primitives SVG partagées par les aperçus des réglages (Affichage, Notifications) :
//  - PhoneFrame        : châssis d'iPhone (Dynamic Island, barre d'état, boutons latéraux)
//  - PhoneSkeleton     : faux contenu d'app (titre, tuiles, liste) pour donner du réalisme
//  - PhoneNavBar       : barre de navigation mobile (avec ou sans bulle Academy)
//  - NotificationCard  : carte de notification (mobile et desktop)
//
// Tout est dessiné avec les variables du thème (currentColor, --background,
// --surface, --primary) : l'aperçu suit donc automatiquement clair/sombre.

import type { ReactNode } from "react";

/** Géométrie du téléphone (proportions ≈ iPhone, ratio 0,48). */
export const PHONE = {
  W: 128,
  H: 252,
  bodyX: 6,
  bodyY: 4,
  bodyW: 116,
  bodyH: 244,
  bodyR: 22,
  // écran
  sx: 10,
  sy: 8,
  sw: 108,
  sh: 236,
  sr: 18,
} as const;

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";

/* -------------------------------------------------------------------------- */
/*  PhoneFrame                                                                */
/* -------------------------------------------------------------------------- */

export function PhoneFrame({ label, children }: { label: string; children?: ReactNode }) {
  const { W, H, bodyX, bodyY, bodyW, bodyH, bodyR, sx, sy, sw, sh, sr } = PHONE;
  const cx = W / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
      {/* Boutons latéraux : action, volume +/-, power */}
      <g fill="currentColor" fillOpacity="0.28">
        <rect x={bodyX - 2.5} y="44" width="2.5" height="7" rx="1.2" />
        <rect x={bodyX - 2.5} y="58" width="2.5" height="13" rx="1.2" />
        <rect x={bodyX - 2.5} y="75" width="2.5" height="13" rx="1.2" />
        <rect x={bodyX + bodyW} y="66" width="2.5" height="21" rx="1.2" />
      </g>

      {/* Châssis */}
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        rx={bodyR}
        fill="var(--background)"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.6"
      />
      {/* Liseré intérieur du cadre */}
      <rect
        x={bodyX + 1.6}
        y={bodyY + 1.6}
        width={bodyW - 3.2}
        height={bodyH - 3.2}
        rx={bodyR - 1.6}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="0.6"
      />

      {/* Écran */}
      <rect
        x={sx}
        y={sy}
        width={sw}
        height={sh}
        rx={sr}
        fill="currentColor"
        fillOpacity="0.04"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="0.5"
      />

      {/* Barre d'état : heure à gauche, signal / wifi / batterie à droite */}
      <g fill="currentColor" fillOpacity="0.8">
        <text
          x={sx + 12}
          y={sy + 13.5}
          fontSize="7"
          fontWeight="600"
          fontFamily={FONT}
          textAnchor="start"
        >
          9:41
        </text>

        {/* Signal */}
        <rect x="80.5" y="19.5" width="1.4" height="2.5" rx="0.5" />
        <rect x="82.6" y="18" width="1.4" height="4" rx="0.5" />
        <rect x="84.7" y="16.5" width="1.4" height="5.5" rx="0.5" />
        <rect x="86.8" y="15" width="1.4" height="7" rx="0.5" />

        {/* Wifi */}
        <path
          d="M89.7 18.3 A4.3 4.3 0 0 1 95.3 18.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M91 19.8 A2.3 2.3 0 0 1 94 19.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <circle cx="92.5" cy="21.3" r="0.85" />

        {/* Batterie */}
        <rect
          x="98"
          y="15.7"
          width="10"
          height="5.6"
          rx="1.6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="0.6"
        />
        <rect x="98.9" y="16.6" width="7.4" height="3.8" rx="0.9" />
        <rect x="108.6" y="17.5" width="0.9" height="2.4" rx="0.4" fillOpacity="0.5" />
      </g>

      {/* Contenu de l'aperçu */}
      {children}

      {/* Dynamic Island (au-dessus de tout) */}
      <rect x={cx - 13} y={sy + 6} width="26" height="8.5" rx="4.25" fill="#0b0b0f" />

      {/* Barre « home » iOS */}
      <rect
        x={cx - 17}
        y={sy + sh - 6.5}
        width="34"
        height="2.4"
        rx="1.2"
        fill="currentColor"
        fillOpacity="0.5"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  PhoneSkeleton — faux contenu d'application                                */
/* -------------------------------------------------------------------------- */

export function PhoneSkeleton() {
  const { sx, sw } = PHONE;
  const x = sx + 9;
  const w = sw - 18;
  const tileW = (w - 5) / 2;

  return (
    <g fill="currentColor" fillOpacity="0.08">
      {/* En-tête */}
      <rect x={x} y="36" width="38" height="5" rx="2.5" fillOpacity="0.16" />
      <rect x={x} y="45" width="60" height="3.2" rx="1.6" />

      {/* Deux tuiles de stats */}
      <rect x={x} y="56" width={tileW} height="26" rx="6" />
      <rect x={x + tileW + 5} y="56" width={tileW} height="26" rx="6" />
      <rect x={x + 6} y="62" width="14" height="3" rx="1.5" fillOpacity="0.14" />
      <rect x={x + 6} y="69" width="22" height="6" rx="2" fillOpacity="0.16" />
      <rect x={x + tileW + 11} y="62" width="14" height="3" rx="1.5" fillOpacity="0.14" />
      <rect x={x + tileW + 11} y="69" width="22" height="6" rx="2" fillOpacity="0.16" />

      {/* Liste */}
      {[92, 114, 136, 158].map((y) => (
        <g key={y}>
          <rect x={x} y={y} width={w} height="18" rx="6" fillOpacity="0.06" />
          <circle cx={x + 9} cy={y + 9} r="4.5" fillOpacity="0.14" />
          <rect x={x + 18} y={y + 4.5} width="34" height="3" rx="1.5" fillOpacity="0.16" />
          <rect x={x + 18} y={y + 10.5} width="50" height="2.6" rx="1.3" fillOpacity="0.1" />
        </g>
      ))}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  PhoneNavBar — barre de navigation mobile                                  */
/* -------------------------------------------------------------------------- */

export type AcademyState = "none" | "visible" | "hidden";

export const NAV_H = 22;

export function PhoneNavBar({ y, academy = "none" }: { y: number; academy?: AcademyState }) {
  const { sx, sw } = PHONE;
  const pad = 8;
  const gap = 5;
  const totalX = sx + pad;
  const totalW = sw - pad * 2;

  const showBubble = academy === "visible";
  const barX = showBubble ? totalX + NAV_H + gap : totalX;
  const barW = showBubble ? totalW - NAV_H - gap : totalW;
  const itemW = barW / 5;

  return (
    <g>
      {/* Bulle Academy */}
      {showBubble && (
        <g>
          <circle
            cx={totalX + NAV_H / 2 + 0.4}
            cy={y + NAV_H / 2 + 1.4}
            r={NAV_H / 2}
            fill="#0b0b0f"
            fillOpacity="0.12"
          />
          <circle
            cx={totalX + NAV_H / 2}
            cy={y + NAV_H / 2}
            r={NAV_H / 2}
            fill="var(--surface)"
            stroke="currentColor"
            strokeOpacity="0.14"
            strokeWidth="0.6"
          />
          {/* Toque de diplômé */}
          <g transform={`translate(${totalX + NAV_H / 2 - 6}, ${y + NAV_H / 2 - 5.5})`}>
            <path d="M6 1 L12 4 L6 7 L0 4 Z" fill="var(--primary)" />
            <path
              d="M2.6 5.6 V8.6 C2.6 9.8 9.4 9.8 9.4 8.6 V5.6"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        </g>
      )}

      {/* Barre principale : ombre + fond */}
      <rect
        x={barX}
        y={y + 1.4}
        width={barW}
        height={NAV_H}
        rx={NAV_H / 2}
        fill="#0b0b0f"
        fillOpacity="0.12"
      />
      <rect
        x={barX}
        y={y}
        width={barW}
        height={NAV_H}
        rx={NAV_H / 2}
        fill="var(--surface)"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="0.6"
      />

      {/* Items : l'actif a une pastille + point plein */}
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = barX + itemW * i + itemW / 2;
        const cy = y + NAV_H / 2;
        const active = i === 2;
        return (
          <g key={i}>
            {active && (
              <rect
                x={cx - Math.min(itemW - 1.5, 17) / 2}
                y={cy - 7.5}
                width={Math.min(itemW - 1.5, 17)}
                height="15"
                rx="7.5"
                fill="var(--primary)"
                fillOpacity="0.14"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={active ? 3 : 2.1}
              fill={active ? "var(--primary)" : "currentColor"}
              fillOpacity={active ? 1 : 0.35}
            />
          </g>
        );
      })}
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*  NotificationCard — carte de notification (dimensions de base 96 × 30)     */
/* -------------------------------------------------------------------------- */

export const NOTIF_BASE_W = 96;
export const NOTIF_BASE_H = 30;

export function NotificationCard({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = NOTIF_BASE_W;
  const h = NOTIF_BASE_H;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Ombres portées (2 couches pour un rendu doux) */}
      <rect x="1" y="3.5" width={w - 2} height={h} rx="9.5" fill="#0b0b0f" fillOpacity="0.1" />
      <rect x="0" y="2" width={w} height={h} rx="9.5" fill="#0b0b0f" fillOpacity="0.16" />

      {/* Carte */}
      <rect
        width={w}
        height={h}
        rx="9.5"
        fill="var(--background)"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="0.7"
      />

      {/* Icône d'app : tuile + cloche */}
      <rect x="7" y="7.5" width="15" height="15" rx="4" fill="var(--primary)" />
      <g transform="translate(11.9, 11.6)" fill="#ffffff">
        <path d="M2.6 0 C4.3 0 5.2 1.3 5.2 2.8 V4.4 L6.1 5.7 H-0.9 L0 4.4 V2.8 C0 1.3 0.9 0 2.6 0 Z" />
        <circle cx="2.6" cy="6.9" r="0.9" />
      </g>

      {/* Titre + horodatage */}
      <rect x="28" y="8.5" width="30" height="3.4" rx="1.7" fill="currentColor" fillOpacity="0.75" />
      <rect x="71" y="9" width="18" height="2.6" rx="1.3" fill="currentColor" fillOpacity="0.28" />
      {/* Corps du message */}
      <rect x="28" y="15" width="58" height="2.8" rx="1.4" fill="currentColor" fillOpacity="0.4" />
      <rect x="28" y="20.5" width="40" height="2.8" rx="1.4" fill="currentColor" fillOpacity="0.24" />
    </g>
  );
}

/** Positions verticales de la barre de nav dans l'écran du téléphone. */
export const NAV_Y_BOTTOM = PHONE.sy + PHONE.sh - NAV_H - 17;
export const NAV_Y_TOP = 31;
