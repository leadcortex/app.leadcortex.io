// frontend/components/skeletons/hydration-gate.tsx

import type { ReactNode } from "react";
import { useAppStore } from "@/lib/state/store";

export function HydrationGate({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  const { hydrated } = useAppStore();
  return <>{hydrated ? children : fallback}</>;
}
