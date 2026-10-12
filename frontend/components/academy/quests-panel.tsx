//frontend\components\academy\quests-panel.tsx
"use client";

/**
 * Quests Panel — les 3 quêtes du jour.
 *
 * Consomme GET /quests. Une quête peut être réclamée via POST /quests/{id}/claim.
 * Les quêtes sont générées côté backend à la volée au premier appel du jour.
 */
import { useState } from "react";
import { Check, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useClaimQuest, useQuests } from "@/lib/academy/hooks";
import type { QuestDTO } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function QuestsPanel({ className }: { className?: string }) {
  const questsQuery = useQuests();
  const claimMutation = useClaimQuest();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleClaim = async (id: string) => {
    setPendingId(id);
    try {
      const res = await claimMutation.mutateAsync(id);
      toast.success(`+${res.xp_awarded} XP réclamés`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de réclamer");
    } finally {
      setPendingId(null);
    }
  };

  if (questsQuery.isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const quests = questsQuery.data?.quests ?? [];
  if (quests.length === 0) return null;

  const rewardDue = questsQuery.data?.reward_due ?? 0;

  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold md:text-base">Quêtes du jour</h2>
        </div>
        {rewardDue > 0 ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
            +{rewardDue} XP à réclamer
          </span>
        ) : null}
      </header>

      <ul className="space-y-2">
        {quests.map((q) => (
          <QuestRow
            key={q.id}
            quest={q}
            isPending={pendingId === q.id}
            onClaim={() => handleClaim(q.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function QuestRow({
  quest,
  isPending,
  onClaim,
}: {
  quest: QuestDTO;
  isPending: boolean;
  onClaim: () => void;
}) {
  const ratio = quest.target > 0 ? Math.min(1, quest.progress / quest.target) : 0;
  const pct = Math.round(ratio * 100);

  const done = quest.status === "complete" || quest.status === "claimed";
  const claimed = quest.status === "claimed";

  return (
    <li
      className={cn(
        "rounded-2xl border bg-background p-3.5 transition-colors md:p-4",
        done ? "border-success/30 bg-success/[0.03]" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            claimed
              ? "bg-success/12 text-success"
              : done
                ? "bg-primary/10 text-primary"
                : "bg-surface text-muted-foreground",
          )}
        >
          {claimed ? <Check className="size-4" strokeWidth={2.6} /> : <Gift className="size-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{quest.title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {quest.description}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {quest.progress} / {quest.target}
            </span>
          </div>

          <div className="mt-2.5 space-y-2">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  claimed ? "bg-success" : done ? "bg-primary" : "bg-primary/70",
                )}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                Récompense : +{quest.reward} XP
              </span>

              {quest.status === "complete" ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onClaim}
                  className={cn(
                    "inline-flex h-7 items-center rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground",
                    "transition-opacity hover:opacity-90 disabled:opacity-50",
                  )}
                >
                  Réclamer
                </button>
              ) : quest.status === "claimed" ? (
                <span className="text-[11px] font-medium text-success">
                  Réclamée
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}