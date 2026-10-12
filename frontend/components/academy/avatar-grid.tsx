//frontend\components\academy\avatar-grid.tsx
"use client";

/**
 * Avatar Grid — galerie des 12 avatars avec statut verrouillé/débloqué/équipé.
 *
 * Les données viennent de GET /avatars (AvatarSnapshot) — déjà peuplé côté
 * backend. Un clic sur un avatar débloqué l'équipe via PATCH /me/equip-avatar.
 */
import { useCallback, useState } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";

import { useAvatars, useEquipAvatar } from "@/lib/academy/hooks";
import { cn } from "@/lib/utils";

export function AvatarGrid({ className }: { className?: string }) {
  const avatarsQuery = useAvatars();
  const equipMutation = useEquipAvatar();
  const [pending, setPending] = useState<string | null>(null);

  const handleEquip = useCallback(
    async (avatarId: string) => {
      setPending(avatarId);
      try {
        await equipMutation.mutateAsync({ avatar_id: avatarId });
        toast.success("Avatar équipé");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Échec de l'équipement");
      } finally {
        setPending(null);
      }
    },
    [equipMutation],
  );

  if (avatarsQuery.isLoading) {
    return (
      <div className={cn("grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-2xl" />
        ))}
      </div>
    );
  }

  const snap = avatarsQuery.data;
  if (!snap) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold md:text-base">Avatars</h2>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {snap.unlocked_count} / {snap.total}
        </span>
      </header>

      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
        {snap.avatars.map((a) => {
          const equipped = a.equipped;
          const unlocked = a.unlocked;
          const isPending = pending === a.id;

          return (
            <li key={a.id}>
              <button
                type="button"
                disabled={!unlocked || equipped || isPending}
                onClick={() => unlocked && !equipped && handleEquip(a.id)}
                title={
                  unlocked
                    ? equipped
                      ? "Avatar équipé"
                      : "Équiper cet avatar"
                    : a.unlock.description
                }
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border bg-background p-2 transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  equipped
                    ? "border-primary bg-primary/[0.05] shadow-sm"
                    : unlocked
                      ? "border-border hover:border-primary/40 hover:bg-surface/40"
                      : "border-border opacity-50",
                  !unlocked && "cursor-not-allowed",
                  isPending && "opacity-70",
                )}
              >
                <span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-surface">
                  <img
                    src={a.svg_path}
                    alt={a.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0.15";
                    }}
                  />
                </span>
                <p className="line-clamp-1 text-[10px] font-medium leading-tight">
                  {a.name}
                </p>
                {equipped ? (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                ) : !unlocked ? (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-secondary text-muted-foreground ring-2 ring-background">
                    <Lock className="size-2.5" strokeWidth={2.5} />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}