//frontend\components\workflow\menu-model.ts
import type { LucideIcon } from "lucide-react";

export type MenuEntry =
  | {
      kind: "item";
      label: string;
      icon?: LucideIcon;

      shortcut?: string;
      disabled?: boolean;
      onSelect: () => void;
    }
  | {
      kind: "check";
      label: string;
      shortcut?: string;
      checked: boolean;
      onCheckedChange: (checked: boolean) => void;
    }
  | {
      kind: "sub";
      label: string;
      icon?: LucideIcon;
      children: MenuEntry[];
    }
  | { kind: "label"; label: string }
  | { kind: "separator" };

export type MenuSection = {
  key: string;
  label: string;

  icon: LucideIcon;

  contentClassName?: string;
  entries: MenuEntry[];
};
