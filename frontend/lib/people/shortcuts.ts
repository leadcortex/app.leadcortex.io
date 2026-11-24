// frontend/lib/people/shortcuts.ts

export type ShortcutGroup = "Navigation" | "Sélection" | "Actions" | "Édition" | "Aide";

export type ShortcutDef = {
  id: string;
  keys: string;
  label: string;
  description?: string;
  group: ShortcutGroup;
  signature: {
    mod?: boolean;
    shift?: boolean;
    alt?: boolean;
    key: string;
  };
};

export const PEOPLE_SHORTCUTS: ShortcutDef[] = [
  {
    id: "goto-home",
    keys: "G puis H",
    label: "Aller au dashboard",
    description: "Depuis n'importe quelle page de la section.",
    group: "Navigation",
    signature: { key: "gh-sequential" },
  },
  {
    id: "goto-people",
    keys: "G puis P",
    label: "Aller aux prospects",
    group: "Navigation",
    signature: { key: "gp-sequential" },
  },
  {
    id: "goto-companies",
    keys: "G puis C",
    label: "Aller aux entreprises",
    group: "Navigation",
    signature: { key: "gc-sequential" },
  },
  {
    id: "focus-search",
    keys: "/",
    label: "Rechercher",
    description: "Place le focus sur la barre de recherche.",
    group: "Navigation",
    signature: { key: "/" },
  },
  {
    id: "next-row",
    keys: "↓ ou J",
    label: "Ligne suivante",
    group: "Navigation",
    signature: { key: "arrowdown" },
  },
  {
    id: "prev-row",
    keys: "↑ ou K",
    label: "Ligne précédente",
    group: "Navigation",
    signature: { key: "arrowup" },
  },
  {
    id: "open-focused",
    keys: "Entrée",
    label: "Ouvrir la fiche",
    group: "Navigation",
    signature: { key: "enter" },
  },

  {
    id: "select-all",
    keys: "⌘ A",
    label: "Tout sélectionner",
    group: "Sélection",
    signature: { mod: true, key: "a" },
  },
  {
    id: "clear-selection",
    keys: "⌘ D",
    label: "Désélectionner",
    group: "Sélection",
    signature: { mod: true, key: "d" },
  },
  {
    id: "toggle-row",
    keys: "X",
    label: "Basculer la sélection (ligne focus)",
    group: "Sélection",
    signature: { key: "x" },
  },

  {
    id: "new-person",
    keys: "⌘ N",
    label: "Nouveau prospect",
    group: "Actions",
    signature: { mod: true, key: "n" },
  },
  {
    id: "export",
    keys: "⌘ E",
    label: "Exporter la sélection",
    group: "Actions",
    signature: { mod: true, key: "e" },
  },
  {
    id: "bulk-delete",
    keys: "⌘ ⌫",
    label: "Supprimer la sélection",
    group: "Actions",
    signature: { mod: true, key: "backspace" },
  },
  {
    id: "peek",
    keys: "Espace",
    label: "Aperçu rapide",
    description: "Ouvre l'aperçu sans quitter la liste.",
    group: "Actions",
    signature: { key: " " },
  },

  {
    id: "undo",
    keys: "⌘ Z",
    label: "Annuler",
    group: "Édition",
    signature: { mod: true, key: "z" },
  },
  {
    id: "redo",
    keys: "⌘ Y",
    label: "Rétablir",
    group: "Édition",
    signature: { mod: true, key: "y" },
  },
  {
    id: "save-edit",
    keys: "⌘ S",
    label: "Enregistrer la fiche",
    description: "Fonctionne quand la modale d'édition est ouverte.",
    group: "Édition",
    signature: { mod: true, key: "s" },
  },
  {
    id: "close",
    keys: "Échap",
    label: "Fermer / annuler",
    group: "Édition",
    signature: { key: "escape" },
  },

  {
    id: "help",
    keys: "⌘ /",
    label: "Afficher les raccourcis",
    group: "Aide",
    signature: { mod: true, key: "/" },
  },
  {
    id: "help-alt",
    keys: "?",
    label: "Afficher les raccourcis",
    group: "Aide",
    signature: { key: "?" },
  },
];

export const SHORTCUT_GROUP_ORDER: ShortcutGroup[] = [
  "Navigation",
  "Sélection",
  "Actions",
  "Édition",
  "Aide",
];

export function formatShortcut(sig: ShortcutDef["signature"]): string {
  const parts: string[] = [];
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

  if (sig.mod) parts.push(isMac ? "⌘" : "Ctrl");
  if (sig.shift) parts.push("Shift");
  if (sig.alt) parts.push("Alt");

  const key = sig.key.length === 1 ? sig.key.toUpperCase() : sig.key;
  parts.push(key === " " ? "Espace" : key);
  return parts.join(" + ");
}
