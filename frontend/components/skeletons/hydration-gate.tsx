//frontend\components\skeletons\hydration-gate.tsx
import type { ReactNode } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Affiche `fallback` (un squelette) tant que le store n'est pas hydraté
 * depuis le localStorage, puis rend `children`.
 *
 * Le gate est placé AU-DESSUS de la page (au niveau de la route) pour éviter
 * tout retour conditionnel à l'intérieur d'un composant qui utilise des hooks.
 */
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
