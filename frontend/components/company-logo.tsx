// frontend/components/company-logo.tsx

import { useState } from "react";
import { cn } from "@/lib/core/utils";
import { knownDomainFromName } from "@/lib/companies/database";

function googleFaviconUrl(domain: string, size: number): string {
  const px = size <= 32 ? 64 : size <= 64 ? 128 : 256;
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&nfrd=1&size=${px}&url=${encodeURIComponent(`https://${domain}`)}`;
}

function duckduckgoIconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

const MIN_FAVICON_PX = 32;

const noUsableIconCache = new Set<string>();

const NO_LOGO_SRC = "/images/app/company-placeholder.svg";

function NoLogoBadge({
  name,
  size,
  radiusClass,
  className,
}: {
  name: string;
  size: number;
  radiusClass: string;
  className?: string;
}) {
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
        src={NO_LOGO_SRC}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        className="size-full object-contain p-0.5"
      />
    </span>
  );
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

export type CompanyAvatarProps = {
  name: string;
  domain?: string | null;
  logoUrl?: string | null;
  size?: number;
  shape?: "rounded" | "circle" | "square";
  className?: string;
  title?: string;
};

export function CompanyAvatar({
  name,
  domain,
  logoUrl,
  size = 36,
  shape = "rounded",
  className,
}: CompanyAvatarProps) {
  const rounded = shape === "circle" ? "full" : shape === "square" ? "md" : "lg";
  const shapeClass =
    shape === "rounded" ? "rounded-[22%]" : shape === "square" ? "rounded-sm" : undefined;
  return (
    <CompanyLogo
      name={name}
      domain={domain}
      logoUrl={logoUrl}
      size={size}
      rounded={rounded}
      className={cn(shapeClass, className)}
    />
  );
}

export type CompanyLogoProps = {
  domain?: string | null;
  logoUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
  rounded?: "md" | "lg" | "full";
};

export function CompanyLogo({
  domain,
  logoUrl,
  name,
  size = 28,
  className,
  rounded = "md",
}: CompanyLogoProps) {
  const resolvedDomain = domain ? normalizeDomain(domain) : (knownDomainFromName(name) ?? "");

  const identity = `${name}|${resolvedDomain}|${logoUrl ?? ""}`;
  const [attempt, setAttempt] = useState<{ identity: string; index: number; logoFailed: boolean }>({
    identity,
    index: 0,
    logoFailed: false,
  });
  const current =
    attempt.identity === identity ? attempt : { identity, index: 0, logoFailed: false };
  const sourceIndex = current.index;
  const logoUrlFailed = current.logoFailed;

  const radiusClass =
    rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  const hasProvidedLogo = Boolean(logoUrl && !logoUrlFailed);
  const skipFavicons = !resolvedDomain || noUsableIconCache.has(resolvedDomain);

  if (!hasProvidedLogo && (skipFavicons || sourceIndex >= 2)) {
    return <NoLogoBadge name={name} size={size} radiusClass={radiusClass} className={className} />;
  }

  const advance = () => {
    if (hasProvidedLogo) {
      setAttempt({ identity, index: 0, logoFailed: true });
      return;
    }
    if (sourceIndex + 1 >= 2 && resolvedDomain) noUsableIconCache.add(resolvedDomain);
    setAttempt({ identity, index: sourceIndex + 1, logoFailed: false });
  };

  const src =
    logoUrl && !logoUrlFailed
      ? logoUrl
      : sourceIndex === 0
        ? googleFaviconUrl(resolvedDomain, size)
        : duckduckgoIconUrl(resolvedDomain);

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
        onError={advance}
        onLoad={(event) => {
          if (hasProvidedLogo) return;
          if (event.currentTarget.naturalWidth < MIN_FAVICON_PX) advance();
        }}
      />
    </span>
  );
}
