// frontend/components/landing/landing-link.tsx

import type * as React from "react";
import { Link, type LinkProps } from "@tanstack/react-router";

export const routes = {
  signup: "/signup",
  login: "/login",
  pricing: "/pricing",
  product: "/product",
  manifest: "/manifest",
  security: "/security",
  support: "/support",
  docs: "/docs",
  docsStart: "/docs/demarrage-rapide",
  docsSearch: "/docs/prospection",
  docsEnrichment: "/docs/enrichissement",
  docsAi: "/docs/integrations-ia",
  legalNotice: "/legal/mentions-legales",
  legalTerms: "/legal/cgv",
  legalPrivacy: "/legal/confidentialite",
  legalCookies: "/legal/cookies",
} as const;

export function SiteLink({
  to,
  children,
  ...props
}: Omit<React.ComponentProps<"a">, "href"> & { to: string }) {
  if (to.startsWith("#")) {
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to as LinkProps["to"]} {...props}>
      {children}
    </Link>
  );
}
