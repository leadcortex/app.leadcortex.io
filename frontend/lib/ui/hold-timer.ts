// frontend/lib/ui/hold-timer.ts

export interface HoldTimerOptions {
  duration: number;
  onProgress: (p: number) => void;
  onComplete: () => void;
  now?: () => number;
  requestFrame?: (cb: (t: number) => void) => number;
  cancelFrame?: (id: number) => void;
}

export interface HoldTimer {
  start: () => void;
  cancel: () => void;
  reset: () => void;
  isDone: () => boolean;
}

export interface HoldPressOptions {
  timer: HoldTimer;
  onHint: () => void;
  now?: () => number;
}

export function createHoldPress(_opts: HoldPressOptions) {
  return { down() {}, up() {} };
}

export function createHoldTimer(opts: HoldTimerOptions): HoldTimer {
  const now = opts.now ?? (() => performance.now());
  const requestFrame = opts.requestFrame ?? ((cb) => requestAnimationFrame(cb));
  const cancelFrame = opts.cancelFrame ?? ((id) => cancelAnimationFrame(id));
  let startedAt = 0;
  let done = false;
  let frame: number | null = null;

  const tick = (t: number) => {
    const p = Math.min(1, (t - startedAt) / opts.duration);
    opts.onProgress(p);
    if (p < 1) {
      frame = requestFrame(tick);
      return;
    }
    frame = null;
    done = true;
    opts.onComplete();
  };

  return {
    start() {
      if (done || frame !== null) return;
      startedAt = now();
      frame = requestFrame(tick);
    },
    cancel() {
      if (frame !== null) cancelFrame(frame);
      frame = null;
      if (!done) opts.onProgress(0);
    },
    reset() {
      if (frame !== null) cancelFrame(frame);
      frame = null;
      done = false;
      opts.onProgress(0);
    },
    isDone: () => done,
  };
}
