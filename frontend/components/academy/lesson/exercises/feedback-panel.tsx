"use client";

/**
 * Feedback Panel — affiché après évaluation d'un exercice.
 *
 * Affiche :
 *   - verdict (correct/incorrect) + score + XP gagnée
 *   - feedback_md (explication de l'auteur)
 *   - détail par sous-question selon le type d'exercice :
 *       blank_results, pair_results, step_results, scenario_results
 *   - pour free_text : mots-clés présents / manquants
 */
import { CheckCircle2, XCircle } from "lucide-react";

import type {
  EvaluationResponse,
  ResultDetailsDTO,
  SubResultDTO,
} from "@/lib/academy/types";
import { cn } from "@/lib/utils";

export function FeedbackPanel({
  result,
  className,
}: {
  result: EvaluationResponse;
  className?: string;
}) {
  const Icon = result.correct ? CheckCircle2 : XCircle;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border p-4 md:p-5",
        result.correct
          ? "border-success/40 bg-success/[0.06]"
          : "border-destructive/40 bg-destructive/[0.05]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 shrink-0",
            result.correct ? "text-success" : "text-destructive",
          )}
        >
          <Icon className="size-5" strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <header className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider">
              {result.correct ? "Correct" : "Incorrect"} · {result.score}/100
            </p>
            {result.xp_awarded > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                +{result.xp_awarded} XP
              </span>
            ) : null}
          </header>

          {result.feedback_md ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {result.feedback_md}
            </p>
          ) : null}

          {result.details ? <FeedbackDetails details={result.details} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

function FeedbackDetails({ details }: { details: ResultDetailsDTO }) {
  const hasBlanks = (details.blank_results?.length ?? 0) > 0;
  const hasPairs = (details.pair_results?.length ?? 0) > 0;
  const hasSteps = (details.step_results?.length ?? 0) > 0;
  const hasScenario = (details.scenario_results?.length ?? 0) > 0;
  const hasKeywords =
    (details.matched_keywords?.length ?? 0) > 0 ||
    (details.missing_keywords?.length ?? 0) > 0;

  if (!hasBlanks && !hasPairs && !hasSteps && !hasScenario && !hasKeywords) {
    return null;
  }

  return (
    <div className="mt-2 space-y-3">
      {hasBlanks ? (
        <DetailSection title="Trous">
          <ul className="space-y-1">
            {details.blank_results!.map((r) => (
              <SubResultRow key={r.index} r={r} />
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {hasPairs ? (
        <DetailSection title="Associations">
          <ul className="space-y-1">
            {details.pair_results!.map((r) => (
              <SubResultRow key={r.index} r={r} />
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {hasSteps ? (
        <DetailSection title="Ordre">
          <ul className="space-y-1">
            {details.step_results!.map((r) => (
              <SubResultRow key={r.index} r={r} />
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {hasScenario ? (
        <DetailSection title="Scénario">
          <ul className="space-y-1">
            {details.scenario_results!.map((r) => (
              <SubResultRow key={r.index} r={r} />
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {hasKeywords ? (
        <DetailSection title="Analyse de la réponse">
          <div className="space-y-2 text-sm">
            {details.word_count ? (
              <p className="text-muted-foreground">
                Longueur : <span className="font-mono">{details.word_count}</span> mot
                {details.word_count > 1 ? "s" : ""}
              </p>
            ) : null}
            {(details.matched_keywords?.length ?? 0) > 0 ? (
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">Présents :</span>
                {details.matched_keywords!.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-success/12 px-2 py-0.5 text-[11px] text-success"
                  >
                    {k}
                  </span>
                ))}
              </p>
            ) : null}
            {(details.missing_keywords?.length ?? 0) > 0 ? (
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">À ajouter :</span>
                {details.missing_keywords!.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-warning/14 px-2 py-0.5 text-[11px] text-warning"
                  >
                    {k}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-background/60 p-3">
      <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function SubResultRow({ r }: { r: SubResultDTO }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px]">
      <span
        className={cn(
          "mt-0.5 shrink-0 font-mono font-semibold",
          r.correct ? "text-success" : "text-destructive",
        )}
        aria-hidden="true"
      >
        {r.correct ? "✔" : "✘"}
      </span>
      <span className="min-w-0 flex-1 text-muted-foreground">
        {r.expected ? (
          <>
            attendu <span className="font-mono text-foreground">{r.expected}</span>
            {r.got ? (
              <>
                {" · "}fourni <span className="font-mono text-foreground">{r.got}</span>
              </>
            ) : null}
          </>
        ) : r.got ? (
          <span className="font-mono text-foreground">{r.got}</span>
        ) : (
          <span className="italic">non répondu</span>
        )}
      </span>
    </li>
  );
}