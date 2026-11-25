// frontend/lib/mobile/nav-tree.ts

import type { Users } from "@/components/icons";

export type MobileNavLink = {
  to: string;
  label: string;
  icon: typeof Users;
  exact?: boolean;
};

export type MobileNavSubGroup = {
  label: string;
  items: MobileNavLink[];
};

export type MobileNavSection = {
  key: string;
  label: string;
  icon: typeof Users;
  matches: string[];
  items: MobileNavLink[];
  groups?: MobileNavSubGroup[];
  opensSheet?: boolean;
};

export function isSectionActive(section: MobileNavSection, pathname: string): boolean {
  if (section.key === "home") return pathname === "/app" || pathname === "/app/";
  // Fix du test « Accueil retiré sans tout activer » : "/app" ne correspond qu'à lui-même.
  if (pathname === "/app" || pathname === "/app/") return section.matches.includes("/app");
  return section.matches.some((m) => m !== "/app" && (pathname === m || pathname.startsWith(`${m}/`)));
}

export function isLinkActive(link: MobileNavLink, pathname: string): boolean {
  if (link.exact) return pathname === link.to || pathname === `${link.to}/`;
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}
