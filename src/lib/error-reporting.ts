// Lightweight error reporting — no external/Lovable dependency.
// Swap the body of this function for a real error-monitoring SDK
// (e.g. Sentry or GlitchTip) whenever one is wired up.
export function reportError(error: unknown, context?: Record<string, unknown>) {
  console.error("[Spoude error]", error, context);
}
