// frontend/components/settings/panels/DisplayPanel.tsx

import { useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  GraduationCap,
  LayoutPanelLeft,
  Monitor,
  Smartphone,
} from "@/components/icons";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/core/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useSidebarSide,
  writeSidebarSide,
  useMobileNavSide,
  writeMobileNavSide,
  useHideAcademyFromMobile,
  writeHideAcademyFromMobile,
  type SidebarSide,
  type MobileNavSide,
} from "@/lib/core/layout-prefs";
import {
  readPeoplePreferences,
  summarizePeople,
  readCompaniesPrefs,
  summarizeCompanies,
  readDashboardPrefs,
  summarizeDashboard,
} from "@/lib/section-display/preferences";
import {
  SECTION_DISPLAY_REGISTRY,
  getSectionDisplayMeta,
  type SectionDisplayKey,
} from "@/lib/section-display/registry";
import { SectionCard } from "../primitives/section-card";
import { SectionConfigDispatcher } from "./section-configs";
import { PanelIntro, PanelGroup, SettingsCard } from "./primitives";
import {
  PhoneFrame,
  PhoneSkeleton,
  PhoneNavBar,
  NAV_Y_BOTTOM,
  NAV_Y_TOP,
} from "./phone-preview";

const SIDEBAR_SIDES: { value: SidebarSide; label: string; hint: string }[] = [
  {
    value: "left",
    label: "Barre à gauche",
    hint: " ",
  },
  {
    value: "right",
    label: "Barre à droite",
    hint: " ",
  },
];

const MOBILE_NAV_SIDES: { value: MobileNavSide; label: string; hint: string }[] = [
  { value: "bottom", label: "Barre en bas", hint: "Valeur par défaut · accessible au pouce" },
  { value: "top", label: "Barre en haut", hint: "Sous la barre d'état du téléphone" },
];

function AcademyMobilePreview({ hidden }: { hidden: boolean }) {
  return (
    <PhoneFrame
      label={
        hidden
          ? "Aperçu : bulle Academy masquée dans la barre mobile"
          : "Aperçu : bulle Academy visible dans la barre mobile"
      }
    >
      <PhoneSkeleton />
      <PhoneNavBar y={NAV_Y_BOTTOM} academy={hidden ? "hidden" : "visible"} />
    </PhoneFrame>
  );
}

function MobileNavPreview({ side }: { side: MobileNavSide }) {
  const label = MOBILE_NAV_SIDES.find((s) => s.value === side)?.label.toLowerCase() ?? "";
  return (
    <PhoneFrame label={`Aperçu mobile : ${label}`}>
      <PhoneSkeleton />
      <PhoneNavBar y={side === "top" ? NAV_Y_TOP : NAV_Y_BOTTOM} />
    </PhoneFrame>
  );
}

function DesktopSidebarPreview({ side }: { side: SidebarSide }) {
  const W = 240;
  const H = 168;
  const contentX = 8;
  const contentY = 46;
  const contentW = W - contentX * 2;
  const contentH = H - contentY - 8;
  const sidebarW = 52;
  const gap = 4;
  const isLeft = side === "left";
  const sbX = isLeft ? contentX : contentX + contentW - sidebarW;
  const mainX = isLeft ? contentX + sidebarW + gap : contentX;
  const mainW = contentW - sidebarW - gap;
  const label = SIDEBAR_SIDES.find((s) => s.value === side)?.label.toLowerCase() ?? "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Aperçu desktop : ${label}`}
    >
      <rect
        x="0.5"
        y="0.5"
        width={W - 1}
        height={H - 1}
        rx="12"
        fill="var(--background)"
        stroke="currentColor"
        strokeOpacity="0.15"
      />
      <circle cx="16" cy="12" r="3.2" fill="#ff5f57" />
      <circle cx="27" cy="12" r="3.2" fill="#febc2e" />
      <circle cx="38" cy="12" r="3.2" fill="#28c840" />
      <rect x="58" y="5.5" width={W - 72} height="13" rx="6.5" fill="currentColor" fillOpacity="0.07" />
      <text
        x="68"
        y="14.5"
        fontSize="6.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="currentColor"
        fillOpacity="0.55"
      >
        app.leadcortex.io
      </text>
      <rect
        x={contentX}
        y={contentY}
        width={contentW}
        height={contentH}
        rx="6"
        fill="currentColor"
        fillOpacity="0.03"
        stroke="currentColor"
        strokeOpacity="0.06"
      />
      <rect
        x={sbX}
        y={contentY + 4}
        width={sidebarW}
        height={contentH - 8}
        rx="4"
        fill="currentColor"
        fillOpacity="0.10"
        stroke="currentColor"
        strokeOpacity="0.08"
      />
      <rect
        x={sbX + 6}
        y={contentY + 10}
        width="18"
        height="8"
        rx="3"
        fill="currentColor"
        fillOpacity="0.24"
      />
      <g fill="currentColor" fillOpacity="0.22">
        <rect x={sbX + 6} y={contentY + 26} width={sidebarW - 12} height="5" rx="2.5" />
        <rect x={sbX + 6} y={contentY + 36} width={sidebarW - 12} height="5" rx="2.5" />
        <rect x={sbX + 6} y={contentY + 46} width={sidebarW - 12} height="5" rx="2.5" />
        <rect x={sbX + 6} y={contentY + 56} width={sidebarW - 12} height="5" rx="2.5" />
        <rect x={sbX + 6} y={contentY + 66} width={sidebarW - 12} height="5" rx="2.5" />
      </g>
      <rect
        x={isLeft ? sbX : sbX + sidebarW - 2}
        y={contentY + 36}
        width="2"
        height="5"
        rx="1"
        fill="var(--primary)"
      />
      <g fill="currentColor" fillOpacity="0.08">
        <rect x={mainX + 8} y={contentY + 12} width="44" height="6" rx="3" />
        <rect x={mainX + 8} y={contentY + 24} width={mainW - 16} height="4" rx="2" />
        <rect x={mainX + 8} y={contentY + 32} width={mainW - 30} height="4" rx="2" />
        <rect x={mainX + 8} y={contentY + 48} width={mainW - 16} height="14" rx="4" />
        <rect x={mainX + 8} y={contentY + 68} width={mainW - 16} height="14" rx="4" />
        <rect x={mainX + 8} y={contentY + 88} width={mainW - 16} height="14" rx="4" />
      </g>
    </svg>
  );
}

function SelectorCard({
  active,
  onClick,
  label,
  hint,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label} — ${hint}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary/[0.04] shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-surface/50",
      )}
    >
      {children}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-xs font-medium transition-colors",
              active ? "text-primary" : "text-foreground",
            )}
          >
            {label}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{hint}</p>
        </div>
        <span
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded-full border transition-all",
            active ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
          aria-hidden
        >
          {active && (
            <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor">
              <path
                d="M2 6l3 3 5-6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>
    </button>
  );
}

function GlobalDisplayBlock() {
  const isMobile = useIsMobile();
  const sidebarSide = useSidebarSide();
  const mobileNavSide = useMobileNavSide();
  const hideAcademy = useHideAcademyFromMobile();

  const handleSidebarSideChange = (next: SidebarSide) => {
    if (next === sidebarSide) return;
    writeSidebarSide(next);
    toast.success(
      next === "left"
        ? "Barre déplacée à gauche"
        : "Barre déplacée à droite · assistant IA à gauche",
    );
  };

  const handleMobileNavSideChange = (next: MobileNavSide) => {
    if (next === mobileNavSide) return;
    writeMobileNavSide(next);
    toast.success(
      next === "bottom"
        ? "Barre mobile repositionnée en bas"
        : "Barre mobile repositionnée en haut",
    );
  };

  const handleHideAcademyChange = (next: boolean) => {
    writeHideAcademyFromMobile(next);
    toast.success(
      next ? "Academy masquée dans la barre mobile" : "Academy réaffichée dans la barre mobile",
    );
  };

  return (
    <>
      {isMobile && (
        <PanelGroup label="Mobile" description="Réglages de disposition pour les petits écrans.">
          <SettingsCard
            title="Position de la barre de navigation"
            description="Sur mobile, la barre de navigation est normalement en bas, à portée de pouce."
            icon={Smartphone}
          >
            <div className="grid grid-cols-2 gap-3">
              {MOBILE_NAV_SIDES.map((s) => (
                <SelectorCard
                  key={s.value}
                  active={mobileNavSide === s.value}
                  onClick={() => handleMobileNavSideChange(s.value)}
                  label={s.label}
                  hint={s.hint}
                >
                  <div className="mx-auto w-full max-w-[112px]">
                    <MobileNavPreview side={s.value} />
                  </div>
                </SelectorCard>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard
            title="Academy dans la barre"
            description="La bulle Academy à gauche de la barre de navigation peut être masquée."
            icon={GraduationCap}
          >
            <div className="grid gap-4 sm:grid-cols-[minmax(0,128px)_1fr] sm:items-center">
              <div className="mx-auto w-full max-w-[128px]">
                <AcademyMobilePreview hidden={hideAcademy} />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/30 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Masquer la bulle Academy</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {hideAcademy
                      ? "La barre principale occupe toute la largeur."
                      : "La bulle Academy apparaît à gauche de la barre principale."}
                  </p>
                </div>
                <Switch
                  checked={hideAcademy}
                  onCheckedChange={handleHideAcademyChange}
                  aria-label="Masquer la bulle Academy"
                />
              </div>
            </div>
          </SettingsCard>
        </PanelGroup>
      )}

      {!isMobile && (
        <PanelGroup
          label="Ordinateur"
        >
          <SettingsCard
            title="Position de la barre principale"
            icon={Monitor}
          >
            <div className="grid grid-cols-2 gap-3">
              {SIDEBAR_SIDES.map((s) => (
                <SelectorCard
                  key={s.value}
                  active={sidebarSide === s.value}
                  onClick={() => handleSidebarSideChange(s.value)}
                  label={s.label}
                  hint={s.hint}
                >
                  <DesktopSidebarPreview side={s.value} />
                </SelectorCard>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
              <span>
                {sidebarSide === "left"
                  ? "L'assistant IA s'affiche à droite."
                  : "L'assistant IA s'affiche à gauche."}{" "}
                Le réglage est conservé sur cet appareil.
              </span>
            </div>
          </SettingsCard>
        </PanelGroup>
      )}
    </>
  );
}

function summariesFor(key: SectionDisplayKey): string {
  switch (key) {
    case "people":
      return summarizePeople(readPeoplePreferences());
    case "companies":
      return summarizeCompanies(readCompaniesPrefs());
    case "dashboard":
      return summarizeDashboard(readDashboardPrefs());
    default:
      return "";
  }
}

function SectionsDisplayBlock({ onOpen }: { onOpen: (key: SectionDisplayKey) => void }) {
  return (
    <PanelGroup
      label="Par section"
    >
      <div className="space-y-4">
        {SECTION_DISPLAY_REGISTRY.map((meta) => {
          const Icon = meta.icon;
          return (
            <SectionCard
              key={meta.key}
              title={meta.label.toUpperCase()}
              description={meta.description}
              summary={summariesFor(meta.key)}
              icon={Icon}
              onDrilldown={() => onOpen(meta.key)}
            />
          );
        })}
      </div>
    </PanelGroup>
  );
}

function DrilldownView({
  section,
  onBack,
}: {
  section: SectionDisplayKey;
  onBack: () => void;
}) {
  const meta = getSectionDisplayMeta(section);
  const Icon = meta.icon;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour aux sections"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-surface"
        >
          <ChevronLeft className="size-4" strokeWidth={2} />
        </button>
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4.5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">{meta.label}</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      <SectionConfigDispatcher section={section} />
    </div>
  );
}

export function DisplayPanel() {
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SectionDisplayKey | null>(null);

  if (activeSection) {
    return <DrilldownView section={activeSection} onBack={() => setActiveSection(null)} />;
  }

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={isMobile ? Smartphone : LayoutPanelLeft}
        title="Affichage"
      />

      <GlobalDisplayBlock />

      <SectionsDisplayBlock onOpen={(key) => setActiveSection(key)} />
    </div>
  );
}
