/**
 * Confetti — animation de fin de leçon réussie.
 *
 * Composant autonome : génère N particules avec des positions, rotations
 * et délais déterministes (seed) pour éviter le reflow à chaque rendu.
 *
 * Utilisation : à monter en overlay absolu, avec `pointer-events-none`.
 */
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type ConfettiProps = {
  /** Nombre de particules. */
  count?: number;
  /** Graine pour la génération déterministe. */
  seed?: number;
  /** Durée de la chute, en secondes. */
  duration?: number;
  className?: string;
};

const COLORS = [
  "#F5B800",
  "#EF4B5E",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#FF9A3C",
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotateStart: number;
  rotateEnd: number;
  size: number;
  color: string;
  shape: "rect" | "circle" | "triangle";
};

export function Confetti({
  count = 42,
  seed = 1,
  duration = 2.6,
  className,
}: ConfettiProps) {
  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(seed);
    const list: Particle[] = [];
    for (let i = 0; i < count; i += 1) {
      const shapeRoll = rand();
      const shape: Particle["shape"] =
        shapeRoll < 0.5 ? "rect" : shapeRoll < 0.8 ? "circle" : "triangle";
      list.push({
        id: i,
        left: rand() * 100,
        delay: rand() * 0.6,
        duration: duration * (0.85 + rand() * 0.4),
        rotateStart: rand() * 360,
        rotateEnd: rand() * 360 + 360 * (rand() > 0.5 ? 1 : -1),
        size: 6 + rand() * 6,
        color: COLORS[Math.floor(rand() * COLORS.length)]!,
        shape,
      });
    }
    return list;
  }, [count, seed, duration]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 1.6,
            backgroundColor: p.shape === "triangle" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "999px" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error variables CSS custom
            "--confetti-rotate-start": `${p.rotateStart}deg`,
            "--confetti-rotate-end": `${p.rotateEnd}deg`,
            ...(p.shape === "triangle"
              ? {
                  borderLeft: `${p.size / 2}px solid transparent`,
                  borderRight: `${p.size / 2}px solid transparent`,
                  borderBottom: `${p.size}px solid ${p.color}`,
                }
              : {}),
          }}
        />
      ))}
    </div>
  );
}