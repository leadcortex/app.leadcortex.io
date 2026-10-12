//frontend\components\academy\profile-view.tsx
"use client";

/**
 * Profile View — vue complète du profil apprenant.
 *
 * Assemble :
 *   - ProfileHeader (avatar, nom, niveau, XP, streak, cœurs)
 *   - Grille de StatCards
 *   - RecommendationCard (adaptatif)
 *   - QuestsPanel (quêtes du jour)
 *   - SrsPanel (révisions)
 *   - AvatarGrid (galerie)
 *   - BadgeGrid (accomplissements)
 */
import { Star, Flame, Heart, Brain, Target } from "lucide-react";

import { useAcademyMe, useAcademySnapshot, useRecommendation } from "@/lib/academy/hooks";
import type { LearnerDTO, Snapshot } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

import { ProfileHeader } from "./profile-header";
import { StatCard } from "./stat-card";
import { RecommendationCard } from "./recommendation-card";
import { BadgeGrid } from "./badge-grid";
import { AvatarGrid } from "./avatar-grid";
import { QuestsPanel } from "./quests-panel";
import { SrsPanel } from "./srs-panel";
import { Flame as FlameIcon } from "./svg/flame";
import { Heart as HeartIcon } from "./svg/heart";
import { Crown as CrownIcon } from "./svg/crown";
import { Star as StarIcon } from "./svg/star";

export function ProfileView({ className }: { className?: string }) {
  const meQuery = useAcademyMe();
  const snapshotQuery = useAcademySnapshot();
  const recQuery = useRecommendation();

  if (meQuery.isLoading || !meQuery.data) {
    return <ProfileSkeleton />;
  }

  const learner: LearnerDTO = meQuery.data;
  const snapshot: Snapshot | undefined = snapshotQuery.data;

  // Nombre de concepts maîtrisés : dérivé du snapshot, fallback 0.
  const masteredCount = extractMasteredCount(snapshot);

  return (
    <div className={cn("space-y-6 pb-10", className)}>
      <ProfileHeader learner={learner} />

      {/* Grid de stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<StarIcon size={20} />}
          label="XP total"
          value={learner.xp}
          hint={`Niveau ${learner.level}`}
          tone="primary"
        />
        <StatCard
          icon={<FlameIcon size={20} />}
          label="Série actuelle"
          value={`${learner.streak_days} j`}
          hint={`Record : ${learner.best_streak_days} j`}
          tone="warning"
        />
        <StatCard
          icon={<HeartIcon size={18} />}
          label="Vies"
          value={`${learner.hearts}/${learner.max_hearts}`}
          hint="Régénération : 1 / 30 min"
        />
        <StatCard
          icon={<Brain className="size-5 text-success" strokeWidth={1.9} />}
          label="Concepts maîtrisés"
          value={masteredCount}
          tone="success"
        />
      </section>

      {/* Recommandation */}
      {recQuery.data && recQuery.data.kind !== "none" ? (
        <RecommendationCard recommendation={recQuery.data} />
      ) : null}

      {/* Quêtes + SRS en colonnes sur desktop */}
      <section className="grid gap-6 lg:grid-cols-2">
        <QuestsPanel />
        <SrsPanel />
      </section>

      {/* Avatars */}
      <AvatarGrid />

      {/* Badges */}
      <BadgeGrid earnedIds={learner.earned_badge_ids} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

/**
 * Extrait le nombre de concepts maîtrisés depuis le snapshot.
 * En V1, le snapshot Go n'expose pas encore ce compteur de manière dédiée,
 * on essaie plusieurs chemins et on tombe sur 0 par défaut.
 */
function extractMasteredCount(snapshot: Snapshot | undefined): number {
  if (!snapshot) return 0;
  const direct =
    (snapshot as Record<string, unknown>).concepts_mastered_count ??
    (snapshot as Record<string, unknown>).mastered_concepts_count;
  if (typeof direct === "number") return direct;

  const learner = snapshot as unknown as {
    learner?: { concepts_mastered?: number };
  };
  if (learner.learner && typeof learner.learner.concepts_mastered === "number") {
    return learner.learner.concepts_mastered;
  }

  return 0;
}

/* ═══════════════════════════════════════════════════════════════════════ */

function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="skeleton h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-2xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}