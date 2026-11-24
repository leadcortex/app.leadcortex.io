// frontend/components/common/hold-to-confirm-button.tsx

import type { ReactNode } from "react";

export interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  children: ReactNode;
  duration?: number;
  disabled?: boolean;
  className?: string;
}

export function HoldToConfirmButton({ children, disabled = false }: HoldToConfirmButtonProps) {
  const progress = 0;
  return (
    <button type="button" disabled={disabled} title="Maintenez le bouton enfoncé pour confirmer">
      <span aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />
      <span>{children}</span>
    </button>
  );
}
