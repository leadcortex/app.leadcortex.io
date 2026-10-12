//frontend\components\brand-logo.tsx
import { Link } from "@tanstack/react-router";
import { BrandLogoMark } from "./brand-logo-mark";

type Props = {
  size?: number;
  showWordmark?: boolean;
  to?: string;
  className?: string;
};

export function BrandLogo({ size = 36, showWordmark = true, to = "/", className = "" }: Props) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 text-foreground ${className}`}>
      <BrandLogoMark size={size} className="object-contain" />
      {showWordmark && <span className="font-semibold tracking-tight text-[15px]">LeadCortex</span>}
    </span>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return content;
}
