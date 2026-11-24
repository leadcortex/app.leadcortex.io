// frontend/lib/__tests__/hold-timer.test.ts

import { describe, expect, it } from "vitest";
import { createHoldPress, createHoldTimer } from "@/lib/ui/hold-timer";

function setup(duration = 1000) {
  let clock = 0;
  let pending: ((t: number) => void) | null = null;
  const progress: number[] = [];
  let completed = 0;

  const timer = createHoldTimer({
    duration,
    now: () => clock,
    requestFrame: (cb) => {
      pending = cb;
      return 1;
    },
    cancelFrame: () => {
      pending = null;
    },
    onProgress: (p) => progress.push(p),
    onComplete: () => {
      completed += 1;
    },
  });

  const advance = (ms: number) => {
    clock += ms;
    const cb = pending;
    pending = null;
    cb?.(clock);
  };

  return { timer, advance, progress, completed: () => completed, now: () => clock };
}

describe("hold-timer", () => {
  it("ne confirme pas avant la fin du maintien", () => {
    const { timer, advance, progress, completed } = setup(1000);
    timer.start();
    advance(500);
    expect(progress.at(-1)).toBeCloseTo(0.5);
    expect(completed()).toBe(0);
  });

  it("confirme une seule fois quand la durée est atteinte", () => {
    const { timer, advance, completed } = setup(1000);
    timer.start();
    advance(600);
    advance(600);
    advance(600);
    expect(completed()).toBe(1);
    expect(timer.isDone()).toBe(true);
  });

  it("relâcher avant la fin annule et remet à zéro", () => {
    const { timer, advance, progress, completed } = setup(1000);
    timer.start();
    advance(800);
    timer.cancel();
    expect(progress.at(-1)).toBe(0);
    advance(500);
    expect(completed()).toBe(0);
  });

  it("ne relance rien une fois confirmé, sauf après reset", () => {
    const { timer, advance, completed } = setup(1000);
    timer.start();
    advance(1000);
    timer.start();
    advance(1000);
    expect(completed()).toBe(1);
    timer.reset();
    expect(timer.isDone()).toBe(false);
    timer.start();
    advance(1000);
    expect(completed()).toBe(2);
  });
});

describe("hold-press", () => {
  it("un clic rapide ne confirme rien et demande de maintenir", () => {
    const { timer, advance, completed, now } = setup(1000);
    let hints = 0;
    const press = createHoldPress({ timer, now, onHint: () => (hints += 1) });
    press.down();
    advance(100);
    press.up();
    advance(2000);
    expect(completed()).toBe(0);
    expect(hints).toBe(1);
  });
});
