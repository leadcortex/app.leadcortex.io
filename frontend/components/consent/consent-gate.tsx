// frontend/components/consent/consent-gate.tsx

import type { ReactNode } from "react";
import type { ConsentCategoryId } from "@/lib/consent/consent-config";
import { useHasConsent } from "@/lib/consent/consent-store";

type ConsentGateProps = {
  category: ConsentCategoryId;
  fallback?: ReactNode;
  children: ReactNode;
};

export function ConsentGate({ category, fallback = null, children }: ConsentGateProps) {
  const allowed = useHasConsent(category);
  return <>{allowed ? children : fallback}</>;
}
