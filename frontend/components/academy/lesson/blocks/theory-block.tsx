"use client";

/**
 * Bloc theory — slides de théorie paginées.
 *
 * Gère la navigation entre slides en interne (dots + Précédent / Suivant).
 * La bottom bar reste sur « Continuer » (elle avance au bloc suivant).
 */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

import type { BlockDTO } from "@/lib/academy/types";
import { cn } from "@/lib/utils";

import { useLessonPlayer } from "../lesson-context";

const CALLOUT_STYLE = {
  info: {
    icon: Info,
    ring: "border-primary/30 bg-primary/[0.04]",
    iconColor: "text-primary",
  },
  warning: {
    icon: AlertTriangle,
    ring: "border-warning/40 bg-warning/[0.06]",
    iconColor: "text-warning",
  },
  success: {
    icon: CheckCircle2,
    ring: "border-success/40 bg-success/[0.05]",
    iconColor: "text-success",
  },
  danger: {
    icon: AlertCircle,
    ring: "border-destructive/40 bg-destructive/[0.05]",
    iconColor: "text-destructive",
  },
} as const;

export function TheoryBlock({ block }: { block: BlockDTO }) {
  const { currentBlock } = useLessonPlayer();
  const slides = currentBlock.theory?.slides ?? block.theory?.slides ?? [];
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Reset scroll when changing slide.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  const slide = slides[index];
  if (!slide) return null;

  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  const callout = slide.callout;
  const calloutStyle = callout ? CALLOUT_STYLE[callout.tone] : null;

  return (
    <article className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Théorie
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {index + 1} / {slides.length}
        </p>
      </div>

      <div
        ref={scrollerRef}
        className="rounded-2xl border border-border bg-background p-6 md:p-8"
      >
        <h2 className="font-display text-2xl italic leading-tight md:text-3xl">
          {slide.title}
        </h2>

        {slide.body_md ? (
          <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90 md:text-[15px]">
            {slide.body_md}
          </div>
        ) : null}

        {slide.quote ? (
          <blockquote className="mt-5 border-l-2 border-primary/40 pl-4 italic text-foreground/80">
            <p className="text-sm leading-relaxed md:text-[15px]">« {slide.quote.text} »</p>
            {slide.quote.author ? (
              <footer className="mt-1 text-[11px] text-muted-foreground">
                — {slide.quote.author}
              </footer>
            ) : null}
          </blockquote>
        ) : null}

        {callout && calloutStyle ? (
          <div
            className={cn(
              "mt-5 flex items-start gap-3 rounded-xl border p-4",
              calloutStyle.ring,
            )}
          >
            <span className={cn("mt-0.5 shrink-0", calloutStyle.iconColor)}>
              <calloutStyle.icon className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              {callout.title ? (
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {callout.title}
                </p>
              ) : null}
              <p className="mt-0.5 text-sm leading-relaxed">{callout.text}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation slides */}
      {slides.length > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-surface",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <ChevronLeft className="size-3.5" />
            Précédent
          </button>

          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-primary" : "bg-border hover:bg-muted-foreground/40",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={isLast}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-surface",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            Suivant
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      ) : null}
    </article>
  );
}