// academy/src/components/academy/glyphs/relief-glyph.tsx

type GlyphKind =
  | "eq"
  | "neq"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "arrow"
  | "slash"
  | "percent"
  | "semicolon";

type GlyphTone = "gold" | "red" | "green" | "blue";

const TONE_COLORS: Record<GlyphTone, { main: string; shadow: string; bg: string }> = {
  gold: {
    main: "#C99A2E",
    shadow: "#8F6B1F",
    bg: "#FBF1D6",
  },
  red: {
    main: "#C24A4A",
    shadow: "#8F3030",
    bg: "#FCE7E7",
  },
  green: {
    main: "#2E9B5E",
    shadow: "#1F6B40",
    bg: "#DCFCE7",
  },
  blue: {
    main: "#2E6EE0",
    shadow: "#1E4A9E",
    bg: "#DBEAFE",
  },
};

export function ReliefGlyph({
  kind,
  tone = "gold",
  size = 22,
}: {
  kind: GlyphKind;
  tone?: GlyphTone;
  size?: number;
}) {
  const colors = TONE_COLORS[tone];

  return (
    <span
      className="relief-glyph"
      style={{
        width: size,
        height: size,
        ["--glyph-bg" as string]: colors.bg,
        ["--glyph-main" as string]: colors.main,
        ["--glyph-shadow" as string]: colors.shadow,
      }}
      aria-label={ARIA_LABELS[kind]}
      role="img"
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        {renderPath(kind)}
      </svg>
    </span>
  );
}

function renderPath(kind: GlyphKind): React.ReactNode {
  const strokeProps = {
    stroke: "var(--glyph-shadow)",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  const accentProps = {
    stroke: "var(--glyph-main)",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  switch (kind) {
    case "eq":
      return (
        <>
          <line x1="5" y1="10" x2="19" y2="10" {...strokeProps} />
          <line x1="5" y1="14" x2="19" y2="14" {...accentProps} />
        </>
      );
    case "neq":
      return (
        <>
          <line x1="5" y1="10" x2="19" y2="10" {...strokeProps} />
          <line x1="5" y1="14" x2="19" y2="14" {...strokeProps} />
          <line x1="9" y1="6" x2="15" y2="18" {...accentProps} />
        </>
      );
    case "gt":
      return <polyline points="7,6 17,12 7,18" {...accentProps} />;
    case "lt":
      return <polyline points="17,6 7,12 17,18" {...accentProps} />;
    case "gte":
      return (
        <>
          <polyline points="7,5 17,11 7,17" {...accentProps} />
          <line x1="7" y1="20" x2="17" y2="20" {...strokeProps} />
        </>
      );
    case "lte":
      return (
        <>
          <polyline points="17,5 7,11 17,17" {...accentProps} />
          <line x1="7" y1="20" x2="17" y2="20" {...strokeProps} />
        </>
      );
    case "arrow":
      return (
        <>
          <line x1="4" y1="12" x2="18" y2="12" {...strokeProps} />
          <polyline points="13,7 19,12 13,17" {...accentProps} />
        </>
      );
    case "slash":
      return <line x1="17" y1="5" x2="7" y2="19" {...accentProps} />;
    case "percent":
      return (
        <>
          <line x1="17" y1="5" x2="7" y2="19" {...strokeProps} />
          <circle cx="8" cy="8" r="2" {...accentProps} />
          <circle cx="16" cy="16" r="2" {...accentProps} />
        </>
      );
    case "semicolon":
      return (
        <>
          <circle cx="12" cy="8" r="1.6" fill="var(--glyph-main)" />
          <path d="M12 14 Q12 17 10 18" stroke="var(--glyph-main)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      );
    default:
      return null;
  }
}

const ARIA_LABELS: Record<GlyphKind, string> = {
  eq: "égal à",
  neq: "différent de",
  gt: "supérieur à",
  lt: "inférieur à",
  gte: "supérieur ou égal à",
  lte: "inférieur ou égal à",
  arrow: "conduit à",
  slash: "divisé par",
  percent: "pourcent",
  semicolon: "point-virgule",
};
