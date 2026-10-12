//frontend\components\company-logo.tsx
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LetterAvatar } from "@/components/ui/letter-avatar";
import { guessDomainFromName } from "@/lib/company-database";

function googleFaviconUrl(domain: string, size: number): string {
  const px = size <= 32 ? 64 : size <= 64 ? 128 : 256;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${px}`;
}

function duckduckgoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

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
  const rawDomain = domain || guessDomainFromName(name) || "";
  const resolvedDomain = rawDomain ? normalizeDomain(rawDomain) : "";

  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [resolvedDomain, name]);

  const radiusClass =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  if (!resolvedDomain) {
    return (
      <LetterAvatar
        name={name}
        size={size}
        shape={rounded === "full" ? "circle" : "rounded"}
        className={className}
      />
    );
  }

  if (sourceIndex >= 2) {
    return (
      <LetterAvatar
        name={name}
        size={size}
        shape={rounded === "full" ? "circle" : "rounded"}
        className={className}
      />
    );
  }

  const src =
    sourceIndex === 0 ? googleFaviconUrl(resolvedDomain, size) : duckduckgoIconUrl(resolvedDomain);

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
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="size-full object-contain p-0.5"
        onError={() => {
          setSourceIndex((i) => i + 1);
        }}
      />
    </span>
  );
}
