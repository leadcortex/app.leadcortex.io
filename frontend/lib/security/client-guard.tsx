//frontend\lib\security\client-guard.tsx
import { useEffect, useRef, useState } from "react";

let cachedFingerprint: string | null = null;

function hashString(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

export function getFingerprint(): string {
  if (cachedFingerprint) return cachedFingerprint;
  if (typeof window === "undefined") return "ssr";

  const signals: (string | number)[] = [
    navigator.userAgent,
    navigator.language,
    (navigator.languages ?? []).join(","),
    screen.width,
    screen.height,
    screen.colorDepth,
    window.devicePixelRatio ?? 1,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? 0,
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
    navigator.maxTouchPoints ?? 0,
  ];

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 100, 40);
      ctx.fillStyle = "#069";
      ctx.fillText("LeadCortex/anti-bot/αβγ", 2, 15);
      signals.push(canvas.toDataURL());
    }
  } catch {
    /* Intentionally ignored. */
  }

  try {
    const gl = document.createElement("canvas").getContext("webgl") as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        signals.push(String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)));
        signals.push(String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)));
      }
    }
  } catch {
    /* Intentionally ignored. */
  }

  cachedFingerprint = hashString(signals.join("|"));
  return cachedFingerprint;
}

export type FormGuardPayload = {
  fingerprint: string;
  formOpenedAt: number;
  firstInteractionAt: number;
  submittedAt: number;
  keyPresses: number;
  pointerMoves: number;
  honeypot: string;
};

export function useFormGuard() {
  const openedAt = useRef<number>(Date.now());
  const firstInteractionAt = useRef<number>(0);
  const keyPresses = useRef<number>(0);
  const pointerMoves = useRef<number>(0);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const markInteraction = () => {
      if (!firstInteractionAt.current) firstInteractionAt.current = Date.now();
    };
    const onKey = () => {
      markInteraction();
      keyPresses.current += 1;
    };
    const onPointer = () => {
      markInteraction();
      pointerMoves.current += 1;
    };

    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchstart", onPointer, { passive: true });
    window.addEventListener("focusin", markInteraction, { passive: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchstart", onPointer);
      window.removeEventListener("focusin", markInteraction);
    };
  }, []);

  const buildPayload = (): FormGuardPayload => ({
    fingerprint: getFingerprint(),
    formOpenedAt: openedAt.current,
    firstInteractionAt: firstInteractionAt.current || openedAt.current,
    submittedAt: Date.now(),
    keyPresses: keyPresses.current,
    pointerMoves: pointerMoves.current,
    honeypot,
  });

  return { honeypot, setHoneypot, buildPayload };
}

export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: 1,
        height: 1,
        overflow: "hidden",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <label>
        Ne pas remplir ce champ
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
