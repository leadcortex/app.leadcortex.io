//frontend\components\settings\panels\GeneralPanel.tsx
import { useState } from "react";
import { Globe2, LayoutPanelLeft, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { PanelIntro, PanelGroup, SettingsCard, SELECT_Z } from "./primitives";

function ThemePreview({ variant }: { variant: ThemeMode }) {
  const isSystem = variant === "system";
  const isDark = variant === "dark";
  const outerBg = isSystem
    ? "linear-gradient(135deg, #f7f6f3 0%, #f7f6f3 50%, #1a1a1c 50%, #1a1a1c 100%)"
    : isDark
      ? "#1a1a1c"
      : "#f7f6f3";
  const innerBg = isSystem
    ? "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #26262a 50%, #26262a 100%)"
    : isDark
      ? "#26262a"
      : "#ffffff";
  const outerBorder = isDark || isSystem ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const innerBorder = isDark || isSystem ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const bar1 = isSystem
    ? "linear-gradient(135deg, #d4d4d4 0%, #d4d4d4 50%, #4a4a4d 50%, #4a4a4d 100%)"
    : isDark
      ? "#4a4a4d"
      : "#d4d4d4";
  const bar2 = isSystem
    ? "linear-gradient(135deg, #e5e5e5 0%, #e5e5e5 50%, #3a3a3d 50%, #3a3a3d 100%)"
    : isDark
      ? "#3a3a3d"
      : "#e5e5e5";

  return (
    <div
      className="relative h-[72px] w-full overflow-hidden rounded-xl"
      style={{ background: outerBg, boxShadow: `inset 0 0 0 1px ${outerBorder}` }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-2 rounded-lg"
        style={{ background: innerBg, boxShadow: `inset 0 0 0 1px ${innerBorder}` }}
      >
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="block h-[6px] w-10 rounded-full" style={{ background: bar1 }} />
          <span className="block h-[6px] w-7 rounded-full" style={{ background: bar2 }} />
        </div>
        <span
          className="absolute bottom-3 right-3 block size-2.5 rounded-full"
          style={{ background: "#BA6651" }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  GeneralPanel                                                              */
/* -------------------------------------------------------------------------- */

export function GeneralPanel() {
  const { mode, setMode } = useTheme();
  const [language, setLanguage] = useState("fr");

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={LayoutPanelLeft}
        title="Général"
        description="Apparence et langue de l'interface. Ces préférences sont conservées sur cet appareil."
      />

      <PanelGroup label="Apparence">
        <SettingsCard
          title="Thème"
          description="Choisissez le thème de l'interface."
          icon={Sparkles}
        >
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {(
              [
                { value: "light", label: "Clair" },
                { value: "dark", label: "Sombre" },
                { value: "system", label: "Système" },
              ] as const
            ).map((opt) => {
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value as ThemeMode)}
                  aria-pressed={active}
                  aria-label={`Thème ${opt.label}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <div
                    className={cn(
                      "w-full rounded-2xl p-1 transition-all",
                      active
                        ? "ring-2 ring-primary/70"
                        : "ring-1 ring-transparent group-hover:ring-border",
                    )}
                  >
                    <ThemePreview variant={opt.value as ThemeMode} />
                  </div>
                  <span
                    className={cn(
                      "text-xs transition-colors md:text-sm",
                      active
                        ? "font-medium text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Langue">
        <SettingsCard
          title="Langue de l'interface"
          description="Langue utilisée pour l'interface et les réponses générées."
          icon={Globe2}
        >
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-10 w-full border-input bg-background md:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className={SELECT_Z}>
              <SelectItem value="fr">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-base leading-none">
                    🇫🇷
                  </span>
                  Français
                </span>
              </SelectItem>
              <SelectItem value="en" disabled>
                <span className="flex w-full items-center gap-2">
                  <span aria-hidden className="text-base leading-none">
                    🇬🇧
                  </span>
                  <span className="flex-1">English</span>
                  <span className="ml-2 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                    Bientôt
                  </span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-[11px] text-muted-foreground">
            D'autres langues seront ajoutées progressivement. Le français reste la langue de
            référence.
          </p>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
