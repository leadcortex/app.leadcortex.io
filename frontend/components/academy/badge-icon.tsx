//frontend\components\academy\badge-icon.tsx
"use client";

/**
 * Icône d'un badge — mapping entre le nom logique du catalogue YAML
 * et un composant visuel (SVG personnalisé ou icône Lucide).
 *
 * Le SVG gamifié est préféré quand il existe (flame, star, crown, medal,
 * trophy, shield, sparkle, gem). Sinon on tombe sur Lucide en couleur
 * (brain, check-circle, moon, sunrise, footsteps, flag).
 */
import {
  Brain,
  CheckCircle2,
  Flag,
  Footprints,
  Moon,
  Sunrise,
} from "lucide-react";

import { Crown } from "./svg/crown";
import { Flame } from "./svg/flame";
import { Gem } from "./svg/gem";
import { Medal } from "./svg/medal";
import { Shield } from "./svg/shield";
import { Sparkle } from "./svg/sparkle";
import { Star } from "./svg/star";
import { Trophy } from "./svg/trophy";

export type BadgeIconProps = {
  icon: string;
  size?: number;
  className?: string;
};

export function BadgeIcon({ icon, size = 32, className }: BadgeIconProps) {
  switch (icon) {
    case "flame":
      return <Flame size={size} className={className} />;
    case "star":
      return <Star size={size} className={className} />;
    case "crown":
      return <Crown size={size} className={className} />;
    case "medal":
      return <Medal size={size} className={className} />;
    case "trophy":
      return <Trophy size={size} className={className} />;
    case "shield":
      return <Shield size={size} className={className} />;
    case "gem":
      return <Gem size={size} className={className} />;
    case "sparkle":
      return <Sparkle size={size} className={className} />;

    case "brain":
      return <Brain size={size} className={className} strokeWidth={1.8} />;
    case "check-circle":
      return <CheckCircle2 size={size} className={className} strokeWidth={1.8} />;
    case "moon":
      return <Moon size={size} className={className} strokeWidth={1.8} />;
    case "sunrise":
      return <Sunrise size={size} className={className} strokeWidth={1.8} />;
    case "footsteps":
      return <Footprints size={size} className={className} strokeWidth={1.8} />;
    case "flag":
      return <Flag size={size} className={className} strokeWidth={1.8} />;

    default:
      return <Star size={size} className={className} />;
  }
}