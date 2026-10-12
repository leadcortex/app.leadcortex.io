//frontend\lib\error-reporting.ts
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  try {
    if (typeof window === "undefined") {
      console.error("Reported error (server):", error, context);
      return;
    }
    console.error("Reported error (client):", error, context);
  } catch (e) {}
}
