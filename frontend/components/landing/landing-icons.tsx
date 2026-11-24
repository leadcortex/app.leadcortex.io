// frontend/components/landing/landing-icons.tsx

import * as React from "react";

type IconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & { size?: number | string };

function createIcon(name: string, children: React.ReactNode) {
  const Icon = ({ size = 24, className, ...props }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

export const ChevronDown = createIcon("ChevronDown", <path d="m6 9 6 6 6-6" />);
export const Plus = createIcon(
  "Plus",
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>,
);
export const Minus = createIcon("Minus", <path d="M5 12h14" />);
export const ArrowRight = createIcon(
  "ArrowRight",
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>,
);
export const Check = createIcon("Check", <path d="M20 6 9 17l-5-5" />);
export const Play = createIcon("Play", <polygon points="6 3 20 12 6 21 6 3" />);
export const Menu = createIcon(
  "Menu",
  <>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </>,
);
export const X = createIcon(
  "X",
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);
