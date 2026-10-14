import astralOwl from '../../assets/collector/Astral-owl.svg';
import lunarCat from '../../assets/collector/Lunar-cat.svg';
import foundingDolphin from '../../assets/collector/Founding-dolphin.svg';
import goldenDolphin from '../../assets/collector/Golden-dolphin.svg';
import mosaicTurtle from '../../assets/collector/Mosaic-turtle.svg';
import solarLion from '../../assets/collector/Solar-lion.svg';
import eagle from '../../assets/classic/Eagle.svg';
import fox from '../../assets/classic/Fox.svg';
import panda from '../../assets/classic/panda.svg';
import redPanda from '../../assets/classic/Red-panda.svg';
import tiger from '../../assets/classic/Tiger.svg';
import wolf from '../../assets/classic/Wolf.svg';

export type AvatarRarity = 'default' | 'classic' | 'collector' | 'limited';

export type AvatarDef = {
  id: string;
  label: string;
  description: string;
  src: string;
  rarity: AvatarRarity;
};

export const AVATARS: AvatarDef[] = [
  // ---- Compagnon par défaut (seul, toujours débloqué) ----
  {
    id: 'fox',
    label: 'Renard rusé',
    description: 'Fin stratège, jamais pris au dépourvu.',
    src: fox,
    rarity: 'default',
  },

  // ---- Compagnons classiques (débloquables via coffres) ----
  {
    id: 'eagle',
    label: 'Aigle royal',
    description: 'Vision perçante, décisions tranchantes.',
    src: eagle,
    rarity: 'classic',
  },
  {
    id: 'panda',
    label: 'Panda posé',
    description: 'Zen, régulier, imperturbable.',
    src: panda,
    rarity: 'classic',
  },
  {
    id: 'red-panda',
    label: 'Panda roux',
    description: 'Curieux, vif, toujours partant.',
    src: redPanda,
    rarity: 'classic',
  },
  {
    id: 'tiger',
    label: 'Tigre audacieux',
    description: 'Fonceur, puissant, un peu imprévisible.',
    src: tiger,
    rarity: 'classic',
  },
  {
    id: 'wolf',
    label: 'Loup fidèle',
    description: 'Stratège, loyal, joue collectif.',
    src: wolf,
    rarity: 'classic',
  },

  // ---- Compagnons collector (rares, via coffres) ----
  {
    id: 'astral-owl',
    label: 'Hibou astral',
    description: 'Observateur, méthodique, toujours en éveil.',
    src: astralOwl,
    rarity: 'collector',
  },
  {
    id: 'lunar-cat',
    label: 'Chat lunaire',
    description: 'Vif, curieux, jamais à court d’idées.',
    src: lunarCat,
    rarity: 'collector',
  },
  {
    id: 'golden-dolphin',
    label: 'Dauphin doré',
    description: 'Rare, lumineux, porte-bonheur.',
    src: goldenDolphin,
    rarity: 'collector',
  },
  {
    id: 'mosaic-turtle',
    label: 'Tortue mosaïque',
    description: 'Patience et constance font sa force.',
    src: mosaicTurtle,
    rarity: 'collector',
  },
  {
    id: 'solar-lion',
    label: 'Lion solaire',
    description: 'Charismatique, rayonnant, mène la meute.',
    src: solarLion,
    rarity: 'collector',
  },

  // ---- Compagnon à édition limitée (très rare) ----
  {
    id: 'founding-dolphin',
    label: 'Dauphin fondateur',
    description: 'Édition limitée. Réservé aux tout premiers explorateurs.',
    src: foundingDolphin,
    rarity: 'limited',
  },
];

export const DEFAULT_AVATAR_IDS: string[] = AVATARS.filter(
  (a) => a.rarity === 'default',
).map((a) => a.id);

export const CLASSIC_AVATAR_IDS: string[] = AVATARS.filter(
  (a) => a.rarity === 'classic',
).map((a) => a.id);

export const COLLECTOR_AVATAR_IDS: string[] = AVATARS.filter(
  (a) => a.rarity === 'collector',
).map((a) => a.id);

export const LIMITED_AVATAR_IDS: string[] = AVATARS.filter(
  (a) => a.rarity === 'limited',
).map((a) => a.id);

const SRC_BY_ID: Record<string, string> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a.src]),
);

export function getAvatarDef(id: string): AvatarDef | undefined {
  return AVATARS.find((a) => a.id === id);
}

export function getAvatarSrc(id: string): string {
  return SRC_BY_ID[id] ?? fox;
}

/* ==========================================================================
   Avatar
   ========================================================================== */

export function Avatar({
  kind = 'fox',
  className = '',
}: {
  kind?: string;
  className?: string;
}) {
  const def = getAvatarDef(kind);
  return (
    <img
      className={`academy-avatar ${className}`}
      src={getAvatarSrc(kind)}
      alt={def?.label ?? 'Compagnon'}
    />
  );
}

/* ==========================================================================
   Illustrations décoratives
   ========================================================================== */

export function Flame() {
  return (
    <svg className="game-icon flame" viewBox="0 0 40 48" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23 1c3 12-1 14 5 20 1-5 4-8 4-8 1 10 8 14 7 22-1 9-9 13-19 13S1 42 1 32C1 19 16 16 23 1Z"
      />
      <path
        className="flame-core"
        d="M21 23c1 7 9 9 8 15-1 4-4 7-9 7s-9-3-9-8c0-6 7-8 10-14Z"
      />
    </svg>
  );
}

export function Chest() {
  return (
    <svg viewBox="0 0 90 80" className="chest-art" aria-hidden="true">
      <path className="chest-shadow" d="M15 33h60v39H15z" />
      <path className="chest-body" d="M12 26h66v40H12z" />
      <path className="chest-lid" d="M9 16q0-10 12-10h48q12 0 12 10v19H9z" />
      <path className="chest-bands" d="M21 7h9v59h-9zm39 0h9v59h-9zM9 28h72v9H9z" />
      <rect className="chest-lock" x="36" y="26" width="18" height="21" rx="4" />
      <path className="chest-shadow" d="M42 31h6v9h-6z" />
    </svg>
  );
}