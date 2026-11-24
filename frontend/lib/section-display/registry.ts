// frontend/lib/section-display/registry.ts

import {
  Users,
  Building2,
  LayoutDashboard,
  type LucideIcon,
} from "@/components/icons";

export type SectionDisplayKey = "people" | "companies" | "dashboard";

export type SectionDisplayMeta = {
  key: SectionDisplayKey;
  label: string;
  description: string;
  icon: LucideIcon;
  order: number;
};

export const SECTION_DISPLAY_REGISTRY: SectionDisplayMeta[] = [
  {
    key: "people",
    label: "Prospects",
    icon: Users,
    order: 10,
  },
  {
    key: "companies",
    label: "Entreprises",
    icon: Building2,
    order: 20,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    order: 30,
  },
];

export function getSectionDisplayMeta(key: SectionDisplayKey): SectionDisplayMeta {
  return (
    SECTION_DISPLAY_REGISTRY.find((s) => s.key === key) ?? SECTION_DISPLAY_REGISTRY[0]!
  );
}
