import { Link } from "@tanstack/react-router";

// Brand colors lifted from the Spoude logo.
export const SPOUDE_BLUE = "#4F6EF5";
export const SPOUDE_GOLD = "#F5A623";

/**
 * Compact monogram — used in tight spaces where the full wordmark doesn't
 * fit: collapsed sidebar rail, mobile favicon-style slots, etc.
 */
export function SpoudeMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-xl font-bold select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.56,
        background: `linear-gradient(135deg, ${SPOUDE_BLUE}, #3452d1)`,
        color: "white",
      }}
      aria-hidden
    >
      s
    </div>
  );
}

/**
 * Full text wordmark — "spoud" in brand blue, final "e" in brand gold.
 * Pass `to` to make it a clickable link (e.g. back to the dashboard home).
 */
export function SpoudeWordmark({ size = 22, to }: { size?: number; to?: string }) {
  const content = (
    <span className="font-bold tracking-tight select-none" style={{ fontSize: size, lineHeight: 1 }}>
      <span style={{ color: SPOUDE_BLUE }}>spoud</span>
      <span style={{ color: SPOUDE_GOLD }}>e</span>
    </span>
  );
  if (!to) return content;
  return (
    <Link
      to={to}
      className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      {content}
    </Link>
  );
}
