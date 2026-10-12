//frontend\components\onboarding\welcome-hero.tsx
/**
 * Bandeau « Votre pipeline en 4 mouvements » de la page de démarrage.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  Mise en page
 * ─────────────────────────────────────────────────────────────────────────
 *  Les 4 étapes sont alignées côte à côte et reliées par des flèches.
 *  Chaque colonne : illustration → pastille numérotée + titre → phrase.
 *
 *  ⚠️ Anti-débordement
 *  La page vit entre la sidebar et le panneau Suggestion Cortex : sa largeur
 *  réelle n'a RIEN à voir avec la largeur de la fenêtre. On utilise donc des
 *  *container queries* (`@lg:`, `@5xl:`…) : la grille s'adapte à la place
 *  réellement disponible, pas à l'écran. Les textes ne sont jamais tronqués
 *  ni posés en hauteur fixe : ils passent à la ligne (`text-pretty`,
 *  `break-words`) et les colonnes ont `min-w-0` pour ne jamais forcer leur
 *  parent.
 *
 *  Prérequis : un ancêtre porte la classe `@container` (EmptyDashboard).
 * ─────────────────────────────────────────────────────────────────────────
 */
import { Fragment } from "react";
import { ArrowRight } from "lucide-react";

import { ONBOARDING_STEPS, type OnboardingStepDefinition } from "@/lib/onboarding";
import { StepIllustration } from "./step-illustrations";

type WelcomeHeroProps = {
  steps?: readonly OnboardingStepDefinition[];
};

export function WelcomeHero({ steps = ONBOARDING_STEPS }: WelcomeHeroProps) {
  return (
    <section
      aria-labelledby="welcome-hero-title"
      className="rounded-3xl border border-primary/10 bg-primary/[0.06] px-5 py-8 @2xl:px-8 @2xl:py-10"
    >
      {}
      <header className="mx-auto mb-8 max-w-xl text-center @2xl:mb-10">
        <h2
          id="welcome-hero-title"
          className="text-balance text-xl font-bold tracking-tight @2xl:text-2xl"
        >
          Votre pipeline en 4 mouvements
        </h2>
        <p className="mt-2 text-pretty text-sm text-muted-foreground @2xl:text-[15px]">
          De la découverte de prospects à la conversion, en toute simplicité.
        </p>
      </header>

      {}
      <ol className="grid gap-x-6 gap-y-10 @lg:grid-cols-2 @5xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] @5xl:gap-x-3 @5xl:gap-y-0">
        {steps.map((step, i) => (
          <Fragment key={step.id}>
            <li className="mx-auto flex w-full min-w-0 max-w-[15rem] flex-col">
              <StepIllustration kind={step.kind} />

              <div className="mt-3 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {i + 1}
                </span>
                <h3 className="min-w-0 text-balance break-words text-[15px] font-semibold leading-snug">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {step.label}
                </h3>
              </div>

              <p className="mt-2 text-pretty break-words text-[13px] leading-relaxed text-muted-foreground">
                {step.overview}
              </p>
            </li>

            {}
            {i < steps.length - 1 && (
              <li
                aria-hidden="true"
                className="hidden items-start justify-center pt-[4.75rem] @5xl:flex"
              >
                <ArrowRight className="size-5 text-primary/70" strokeWidth={1.6} />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
