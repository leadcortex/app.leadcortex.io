// frontend/lib/__tests__/search-flight.test.ts

import { describe, expect, it } from "vitest";
import {
  cubicBezier,
  flightPosition,
  flightProgress,
  fusionPath,
  makeVariation,
} from "@/lib/ui/search-flight";

describe("search-flight", () => {
  const s = { x: 900, y: 24 };
  const e = { x: 896, y: 76 };

  it("part exactement du départ et arrive exactement à l'emplacement", () => {
    for (let i = 0; i < 50; i++) {
      const v = makeVariation();
      const p0 = flightPosition(flightProgress(0, v), s, e, v);
      const p1 = flightPosition(flightProgress(1, v), s, e, v);
      expect(p0.x).toBeCloseTo(s.x, 5);
      expect(p0.y).toBeCloseTo(s.y, 5);
      expect(p1.x).toBeCloseTo(e.x, 5);
      expect(p1.y).toBeCloseTo(e.y, 5);
    }
  });

  it("garde une progression bornée entre 0 et 1", () => {
    const v = makeVariation();
    for (let t = 0; t <= 1; t += 0.01) {
      const u = flightProgress(t, v);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(1);
    }
  });

  it("décollage lent puis milieu rapide (bézier)", () => {
    const ease = cubicBezier(0.64, 0.03, 0.22, 1);
    expect(ease(0.2)).toBeLessThan(0.2);
    expect(ease(0.5)).toBeGreaterThan(0.5);
  });

  it("dessine un tracé fermé avec congés concaves", () => {
    const { fill, outline } = fusionPath(580, 254, 18, 22);
    expect(fill.endsWith("Z")).toBe(true);
    expect(outline.startsWith("M 0 0")).toBe(true);
  });
});
