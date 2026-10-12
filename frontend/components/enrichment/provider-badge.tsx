//frontend\components\enrichment\provider-badge.tsx
import { providerBrand } from "@/lib/enrichment-mock";
import { cn } from "@/lib/utils";

export function ProviderBadge({
  slug,
  size = 32,
  className,
  ring = true,
}: {
  slug: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const { color, initial } = providerBrand(slug);
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg font-semibold text-white",
        ring && "ring-1 ring-inset ring-black/10",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.max(10, Math.round(size * 0.42)),
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
