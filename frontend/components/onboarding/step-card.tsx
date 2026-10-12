//frontend\components\onboarding\step-card.tsx
/**
 * Carte détaillée d'une étape d'onboarding (grille 2×2 sous le hero).
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Anatomie
 * ─────────────────────────────────────────────────────────────────────────
 *  ┌──────────────────────────────────────────────────────────┐
 *  │ ┌──────────────┐   (01)                                  │
 *  │ │ illustration │   Titre                                 │
 *  │ │   (tuile)    │   Description sur deux lignes…          │
 *  │ └──────────────┘   [ Commencer → ]                       │
 *  └──────────────────────────────────────────────────────────┘
 *
 *  • La carte est elle-même un `@container` : tuile + texte passent côte à
 *    côte dès que SA largeur le permet, et s'empilent sinon. Le texte ne
 *    sort donc jamais de la carte, quelle que soit la largeur de la page.
 *  • `featured` : bouton plein (étape à faire en premier). Les autres ont
 *    un bouton « doux ».
 *  • `done` : carte verdie, bouton remplacé par « Étape validée ».
 *  • Le CTA est un <Link> TanStack vers la vraie page de l'app.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import type { OnboardingStepDefinition } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { StepIllustration } from "./step-illustrations";

type StepCardProps = {
  step: OnboardingStepDefinition;

  index: number;

  featured?: boolean;

  done?: boolean;
};

export function StepCard({ step, index, featured = false, done = false }: StepCardProps) {
  const indexLabel = String(index).padStart(2, "0");

  return (
    <article
      className={cn(
        "@container group min-w-0 rounded-2xl border bg-background p-5 shadow-[var(--shadow-card)] transition-colors",
        done ? "border-success/30 bg-success/[0.03]" : "border-border hover:border-primary/30",
      )}
    >
      <div className="grid items-center gap-4 @sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] @sm:gap-5 @lg:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)]">
        {}
        <div className="mx-auto w-full max-w-[14rem] overflow-hidden rounded-2xl bg-primary/[0.08] @sm:mx-0 @sm:max-w-none">
          <StepIllustration kind={step.kind} blob={false} />
        </div>

        {}
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-5 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-semibold tabular-nums",
                done ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
              )}
            >
              {indexLabel}
            </span>
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-success">
                <CheckCircle2 className="size-3" />
                Terminé
              </span>
            )}
          </div>

          <h3 className="text-balance break-words text-base font-semibold leading-snug tracking-tight">
            {step.label}
          </h3>
          <p className="mt-1.5 text-pretty break-words text-[13px] leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          <div className="mt-4">
            {done ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-success">
                <CheckCircle2 className="size-4" />
                Étape validée
              </span>
            ) : (
              <Link
                to={step.href}
                className={cn(
                  "inline-flex h-9 max-w-full items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-primary/10 text-primary hover:bg-primary/[0.16]",
                )}
              >
                <span className="min-w-0 truncate">{step.cta}</span>
                <ArrowRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.8}
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
