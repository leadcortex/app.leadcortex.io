// frontend/lib/ui/search-flight.ts

export type Point = { x: number; y: number };

export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-5) return sampleY(t);
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = sampleX(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

export type FlightVariation = {
  duration: number;
  ease: (t: number) => number;
  wobbleAmp: number;
  wobbleFreq: number;
  wobblePhase: number;
  arcRadius: number;
  arcTurn: number;
  arcStart: number;
};

export function makeVariation(rand: () => number = Math.random): FlightVariation {
  const r = (min: number, max: number) => min + (max - min) * rand();
  return {
    duration: r(720, 880),
    ease: cubicBezier(r(0.58, 0.7), r(0, 0.06), r(0.16, 0.28), 1),
    wobbleAmp: r(0.008, 0.02),
    wobbleFreq: r(1.6, 2.6),
    wobblePhase: r(0, Math.PI * 2),
    arcRadius: r(30, 38),
    arcTurn: r(0.5, 0.58),
    arcStart: -Math.PI / 2 - r(0.1, 0.45),
  };
}

export function flightProgress(t: number, v: FlightVariation): number {
  const base = v.ease(t);
  const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  const wobble = v.wobbleAmp * envelope * Math.sin(Math.PI * 2 * v.wobbleFreq * t + v.wobblePhase);
  return Math.min(1, Math.max(0, base + wobble));
}

export function flightPosition(u: number, s: Point, e: Point, v: FlightVariation): Point {
  const k = Math.min(1, Math.max(0, u));
  const lx = s.x + (e.x - s.x) * k;
  const ly = s.y + (e.y - s.y) * k;
  const radius = v.arcRadius * Math.sin(Math.PI * Math.pow(k, 0.72));
  const theta = v.arcStart + Math.PI * 2 * v.arcTurn * k;
  return { x: lx + radius * Math.cos(theta), y: ly + radius * Math.sin(theta) };
}

export function landingBounce(ms: number, amplitude = 9) {
  const t = Math.max(0, ms) / 1000;
  const decay = Math.exp(-t / 0.13);
  const dy = amplitude * Math.sin((2 * Math.PI * t) / 0.3) * decay;
  const squash = Math.max(0, Math.cos((2 * Math.PI * t) / 0.3)) * decay;
  return { dy, scaleY: 1 - 0.2 * squash, scaleX: 1 + 0.16 * squash };
}

export const LANDING_BOUNCE_MS = 640;

export function fusionPath(width: number, height: number, fillet: number, radius: number) {
  const F = fillet;
  const R = Math.min(radius, (width - 2 * F) / 2, height - F);
  const W = width;
  const H = height;
  const outline =
    `M 0 0 A ${F} ${F} 0 0 1 ${F} ${F} L ${F} ${H - R} A ${R} ${R} 0 0 0 ${F + R} ${H} ` +
    `L ${W - F - R} ${H} A ${R} ${R} 0 0 0 ${W - F} ${H - R} L ${W - F} ${F} A ${F} ${F} 0 0 1 ${W} 0`;
  return { outline, fill: buildFill(W, H, F, R) };
}

function buildFill(W: number, H: number, F: number, R: number) {
  return (
    `M 0 -2 L ${W} -2 L ${W} 0 A ${F} ${F} 0 0 0 ${W - F} ${F} L ${W - F} ${H - R} ` +
    `A ${R} ${R} 0 0 1 ${W - F - R} ${H} L ${F + R} ${H} A ${R} ${R} 0 0 1 ${F} ${H - R} ` +
    `L ${F} ${F} A ${F} ${F} 0 0 0 0 0 Z`
  );
}
