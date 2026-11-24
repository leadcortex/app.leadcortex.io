// frontend/components/consent/cookie-preferences-button.tsx

import type { ReactNode } from "react";
import { openConsentPreferences } from "@/lib/consent/consent-store";

type CookiePreferencesButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function CookiePreferencesButton({ className, children }: CookiePreferencesButtonProps) {
  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      {children ?? "Gérer mes cookies"}
    </button>
  );
}
