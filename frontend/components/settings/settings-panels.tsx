//frontend\components\settings\settings-panels.tsx
import type { SettingsSection } from "./settings-context";
import { BillingPanel } from "./billing-panel";
import { GeneralPanel } from "./panels/GeneralPanel";
import { DisplayPanel } from "./panels/DisplayPanel";
import { NotificationsPanel } from "./panels/NotificationsPanel";
import { AccountPanel } from "./panels/AccountPanel";
import { SecurityPanel } from "./panels/SecurityPanel";
import { IntegrationsPanel } from "./panels/IntegrationsPanel";
import { CapabilitiesPanel } from "./panels/CapabilitiesPanel";
import { MemoryPanel } from "./panels/MemoryPanel";
import { ThinkingPanel } from "./panels/ThinkingPanel";
import { TimePanel } from "./panels/TimePanel";
import { SkillsPanel } from "./panels/SkillsPanel";
import { ConnectorsPanel } from "./panels/ConnectorsPanel";
import { PluginsPanel } from "./panels/PluginsPanel";

export function SettingsPanel({ section }: { section: SettingsSection }) {
  switch (section) {
    case "account":
      return <AccountPanel />;
    case "billing":
      return <BillingPanel />;
    case "general":
      return <GeneralPanel />;
    case "display":
      return <DisplayPanel />;
    case "notifications":
      return <NotificationsPanel />;
    case "security":
      return <SecurityPanel />;
    case "integrations":
      return <IntegrationsPanel />;
    case "capabilities":
      return <CapabilitiesPanel />;
    case "memory":
      return <MemoryPanel />;
    case "thinking":
      return <ThinkingPanel />;
    case "time":
      return <TimePanel />;
    case "skills":
      return <SkillsPanel />;
    case "connectors":
      return <ConnectorsPanel />;
    case "plugins":
      return <PluginsPanel />;
    default:
      return null;
  }
}
