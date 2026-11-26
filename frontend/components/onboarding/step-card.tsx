// frontend/components/onboarding/step-card.tsx

import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "@/components/icons";

import type { OnboardingStepDefinition } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { StepIllustration } from "./step-illustrations";

type StepCardProps = {
  step: OnboardingStepDefinition;

  index: number;

  featured?: boolean;

  done?: boolean;
};

export function StepCard({ step, index, featured = false, done = false }: StepCardProps) {
  return (
    <article className="@container min-w-0 rounded-xl border border-border bg-card p-6">
      <div className="grid items-center gap-4 @sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] @sm:gap-6 @lg:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-[14rem] overflow-hidden rounded-xl bg-primary/[0.08] @sm:mx-0 @sm:max-w-none">
          <StepIllustration kind={step.kind} blob={false} />
        </div>

        <div className="min-w-0">
          <p className="text-xs tabular-nums text-muted-foreground">Étape {index}</p>
          <h3 className="mt-1 text-balance break-words text-base font-semibold">{step.label}</h3>
          <p className="mt-1 text-pretty break-words text-[13px] text-muted-foreground">
            {step.description}
          </p>

          <div className="mt-4">
            {done ? (
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-success">
                <CheckCircle2 className="size-4" />
                Étape validée
              </span>
            ) : (
              <Button asChild size="sm" variant={featured ? "default" : "outline"}>
                <Link to={step.href}>
                  {step.cta}
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
