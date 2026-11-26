// frontend/components/settings/settings-context.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTabContextValue, useTabs } from "@/components/layout/app-tabs";

export type SettingsSection =
  | "account"
  | "billing"
  | "general"
  | "display"
  | "notifications"
  | "security"
  | "integrations"
  | "capabilities"
  | "memory"
  | "thinking"
  | "time"
  | "skills"
  | "connectors"
  | "plugins";

export type SettingsGroupKey = "account" | "preferences" | "security" | "ai" | "customize";

export type SettingsGroupMeta = {
  key: SettingsGroupKey;
  label: string;
  description: string;
};

export type SettingsSectionMeta = {
  key: SettingsSection;
  label: string;
  description: string;
  group: SettingsGroupKey;
  keywords?: string;
  badge?: "new" | "beta" | "soon";
};

export const SETTINGS_GROUPS: SettingsGroupMeta[] = [
  {
    key: "account",
    label: "Mon compte",
    description: "Profil, organisation, facturation et session.",
  },
  {
    key: "preferences",
    label: "Préférences",
    description: "Apparence, affichage, langue et notifications.",
  },
  {
    key: "security",
    label: "Sécurité et confidentialité",
    description: "Confidentialité, accès et intégrations.",
  },
  {
    key: "ai",
    label: "Intelligence artificielle",
    description: "Modèles, mémoire et comportement de l'IA.",
  },
  {
    key: "customize",
    label: "Personnalisation",
    description: "Compétences, connecteurs et plugins.",
  },
];

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  {
    key: "account",
    label: "Profil",
    description: "Nom, photo, comptes connectés et session.",
    group: "account",
    keywords:
      "profil avatar email téléphone organisation role fuseau horaire timezone devise currency déconnexion logout",
  },
  {
    key: "billing",
    label: "Facturation",
    description: "Abonnement, factures et moyens de paiement.",
    group: "account",
    keywords: "plan abonnement facture carte moyen de paiement",
  },

  {
    key: "general",
    label: "Général",
    description: "Thème, langue, organisation et fuseau horaire.",
    group: "preferences",
    keywords: "theme dark light langue apparence",
  },
  {
    key: "display",
    label: "Affichage",
    description: "Barre de navigation et affichage des pages.",
    group: "preferences",
    keywords:
      "affichage disposition layout barre navigation sidebar latérale gauche droite position assistant cortex",
    badge: "new",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Alertes, rapports et place des notifications.",
    group: "preferences",
    keywords:
      "alertes rapports emails séquence quota délivrabilité reply weekly deliverability position",
  },

  {
    key: "security",
    label: "Sécurité",
    description: "Connexion, appareils et usage des données.",
    group: "security",
    keywords: "2fa sessions sécurité données rgpd confidentialité verrouillage",
  },
  {
    key: "integrations",
    label: "Intégrations",
    description: "Google, Microsoft, LinkedIn et autres comptes connectés.",
    group: "security",
    keywords: "oauth google microsoft linkedin gmail outlook gmail api connexion compte mail",
  },

  {
    key: "capabilities",
    label: "Capacités",
    description: "Modèles d'IA, clés API et domaines d'envoi.",
    group: "ai",
    keywords: "modèles clés api providers byok équipe",
  },
  {
    key: "memory",
    label: "Mémoire",
    description: "Ce que LeadCortex retient d'une session à l'autre.",
    group: "ai",
    keywords: "souvenirs contexte mémoire ia",
  },
  {
    key: "thinking",
    label: "Réfléchir",
    description: "Vitesse ou profondeur d'analyse.",
    group: "ai",
    keywords: "raisonnement étapes analyse réflexion",
  },
  {
    key: "time",
    label: "Temps et concision",
    description: "Longueur des réponses et niveau de détail.",
    group: "ai",
    keywords: "longueur détail tldr concision",
  },

  {
    key: "skills",
    label: "Compétences",
    description: "Prompts et fichiers réutilisables.",
    group: "customize",
    keywords: "skills prompts compétences templates",
  },
  {
    key: "connectors",
    label: "Connecteurs",
    description: "Slack, Notion, HubSpot.",
    group: "customize",
    keywords: "slack notion hubspot connecteurs services",
  },
  {
    key: "plugins",
    label: "Plugins",
    description: "Modules ajoutés à LeadCortex.",
    group: "customize",
    keywords: "extensions modules plugins",
  },
];

type SettingsContextValue = {
  open: boolean;
  section: SettingsSection;
  billingReceiptOpen: boolean;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  setSection: (section: SettingsSection) => void;
  setBillingReceiptOpen: (open: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const TAB_SECTION_KEY = "settings.section";
const DEFAULT_SECTION: SettingsSection = "general";

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings doit être utilisé dans <SettingsProvider>.");
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [billingReceiptOpen, setBillingReceiptOpen] = useState(false);

  const [section, setSectionRaw] = useTabContextValue<SettingsSection>(
    TAB_SECTION_KEY,
    DEFAULT_SECTION,
  );

  const safeSection: SettingsSection = SETTINGS_SECTIONS.some((s) => s.key === section)
    ? section
    : DEFAULT_SECTION;

  const setSection = useCallback(
    (s: SettingsSection) => {
      setSectionRaw(s);
    },
    [setSectionRaw],
  );

  const { activeId } = useTabs();
  const prevActiveId = useRef(activeId);
  useEffect(() => {
    if (prevActiveId.current !== activeId) {
      prevActiveId.current = activeId;
      setOpen(false);
      setBillingReceiptOpen(false);
    }
  }, [activeId]);

  const openSettings = useCallback(
    (s?: SettingsSection) => {
      if (s) setSection(s);
      setBillingReceiptOpen(false);
      setOpen(true);
    },
    [setSection],
  );

  const closeSettings = useCallback(() => {
    setOpen(false);
    setBillingReceiptOpen(false);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      open,
      section: safeSection,
      billingReceiptOpen,
      openSettings,
      closeSettings,
      setSection,
      setBillingReceiptOpen,
    }),
    [open, safeSection, billingReceiptOpen, openSettings, closeSettings, setSection],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
