//frontend\components\ui\letter-avatar.tsx
import { cn } from "@/lib/utils";

const LETTER_COLORS: Record<string, string> = {
  A: "#B96A52",
  B: "#A88A3C",
  C: "#94806B",
  D: "#7A8B5A",
  E: "#C29340",
  F: "#557A60",
  G: "#8A5058",
  H: "#B89355",
  I: "#5A7396",
  J: "#A88F45",
  K: "#8A7E50",
  L: "#8A7EA0",
  M: "#4F8570",
  N: "#6A6AB0",
  O: "#358580",
  P: "#A65A80",
  Q: "#6B7885",
  R: "#A55A48",
  S: "#6E8A70",
  T: "#4A8585",
  U: "#7B6498",
  V: "#B8705F",
  W: "#7E5670",
  X: "#4A5F75",
  Y: "#98873F",
  Z: "#8E7660",
};

const DEFAULT_COLOR = "#6B7885";

function firstLetter(name: string): string {
  if (!name) return "?";
  const cleaned = name.trim().replace(/^[^a-zA-ZÀ-ÿ]+/, "");
  const ch = cleaned.charAt(0).toUpperCase();
  return /[A-ZÀ-Ý]/.test(ch) ? ch : "?";
}

function resolveColor(letter: string): string {
  return LETTER_COLORS[letter.toUpperCase()] ?? DEFAULT_COLOR;
}

export type LetterAvatarShape = "rounded" | "circle" | "square";

export function LetterAvatar({
  name,
  size = 36,
  shape = "rounded",
  className,
  title,
}: {
  name: string;
  size?: number;
  shape?: LetterAvatarShape;
  className?: string;
  title?: string;
}) {
  const letter = firstLetter(name);
  const color = resolveColor(letter);

  const shapeClass =
    shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-sm" : "rounded-[22%]";

  return (
    <span
      role="img"
      aria-label={name}
      title={title ?? name}
      className={cn(
        "grid shrink-0 select-none place-items-center font-medium text-white",
        shapeClass,
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.44,
        lineHeight: 1,
      }}
    >
      {letter}
    </span>
  );
}

export function CompanyAvatar({
  name,
  domain: _domain,
  size = 36,
  shape = "rounded",
  className,
  title,
}: {
  name: string;

  domain?: string;
  size?: number;
  shape?: LetterAvatarShape;
  className?: string;
  title?: string;
}) {
  return (
    <LetterAvatar
      name={name}
      size={size}
      shape={shape}
      className={className}
      title={title ?? name}
    />
  );
}
