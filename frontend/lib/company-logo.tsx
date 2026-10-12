//frontend\lib\company-logo.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCompanyLogoUrl, guessDomainFromName } from "@/lib/company-database";

const PALETTE = [
  "from-primary/25 to-primary/5 text-primary",
  "from-amber-500/25 to-amber-500/5 text-amber-600",
  "from-emerald-500/25 to-emerald-500/5 text-emerald-600",
  "from-sky-500/25 to-sky-500/5 text-sky-600",
  "from-fuchsia-500/25 to-fuchsia-500/5 text-fuchsia-600",
  "from-rose-500/25 to-rose-500/5 text-rose-600",
  "from-indigo-500/25 to-indigo-500/5 text-indigo-600",
  "from-cyan-500/25 to-cyan-500/5 text-cyan-600",
];

function toneFromName(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % PALETTE.length;
  return PALETTE[hash];
}

function initialsFromName(name: string) {
  const words = name.split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const failedCache = new Set<string>();

export type CompanyLogoProps = {
  domain?: string | null;

  name: string;

  size?: number;
  className?: string;

  rounded?: "md" | "lg" | "full";
};

export function CompanyLogo({
  domain,
  name,
  size = 28,
  className,
  rounded = "md",
}: CompanyLogoProps) {
  const resolvedDomain = domain || guessDomainFromName(name);
  const logoUrl = resolvedDomain ? getCompanyLogoUrl(resolvedDomain) : "";
  const [failed, setFailed] = useState(!logoUrl || failedCache.has(resolvedDomain ?? ""));

  const radiusClass =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  if (!logoUrl || failed) {
    return (
      <span
        aria-hidden="true"
        title={name}
        className={cn(
          "grid shrink-0 place-items-center bg-gradient-to-br font-semibold ring-1 ring-inset ring-black/5",
          toneFromName(name),
          radiusClass,
          className,
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(9, Math.round(size * 0.36)),
        }}
      >
        {initialsFromName(name)}
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      title={name}
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-inset ring-black/5",
        radiusClass,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="size-full object-contain p-0.5"
        onError={() => {
          if (resolvedDomain) failedCache.add(resolvedDomain);
          setFailed(true);
        }}
      />
    </span>
  );
}
