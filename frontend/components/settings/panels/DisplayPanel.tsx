//frontend\components\settings\panels\DisplayPanel.tsx
// ⚠️ Conditionnement mobile/desktop :

import { AlertCircle, Check, LayoutTemplate, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useSidebarSide,
  writeSidebarSide,
  useMobileNavSide,
  writeMobileNavSide,
  type SidebarSide,
  type MobileNavSide,
} from "@/lib/layout-prefs";
import { PanelIntro, PanelGroup, SettingsCard } from "./primitives";

const SIDEBAR_SIDES: {
  value: SidebarSide;
  label: string;
  hint: string;
}[] = [
  {
    value: "left",
    label: "Barre à gauche",
    hint: "Valeur par défaut · lecture de gauche à droite",
  },
  { value: "right", label: "Barre à droite", hint: "Assistant IA et Cortex à gauche" },
];

const MOBILE_NAV_SIDES: {
  value: MobileNavSide;
  label: string;
  hint: string;
}[] = [
  { value: "bottom", label: "Barre en bas", hint: "Valeur par défaut · accessible au pouce" },
  { value: "top", label: "Barre en haut", hint: "Sous la barre d'état du téléphone" },
];

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

      <rect
        x="58"
        y="5.5"
        width={W - 72}
        height="13"
        rx="6.5"
        fill="currentColor"
        fillOpacity="0.07"
      />
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
        <rect x={sbX + 6} y={contentY + 82} width={sidebarW - 12} height="5" rx="2.5" />
        <rect x={sbX + 6} y={contentY + 92} width={sidebarW - 12} height="5" rx="2.5" />
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

      <rect
        x={mainX + 4}
        y={contentY + 4}
        width={mainW - 8}
        height="4"
        rx="2"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  MobileNavPreview — aperçu SVG d'un téléphone avec la barre en haut/bas    */
/* -------------------------------------------------------------------------- */

function MobileNavPreview({ side }: { side: MobileNavSide }) {
  const W = 160;
  const H = 300;

  const phoneX = 20;
  const phoneY = 6;
  const phoneW = W - 40;
  const phoneH = H - 12;
  const phoneR = 18;

  const screenX = phoneX + 4;
  const screenY = phoneY + 4;
  const screenW = phoneW - 8;
  const screenH = phoneH - 8;
  const screenR = 14;

  const navW = screenW - 16;
  const navH = 22;
  const navX = screenX + 8;

  const isTop = side === "top";
  const navY = isTop ? screenY + 8 : screenY + screenH - navH - 8;

  const notchW = 40;
  const notchH = 6;
  const notchX = W / 2 - notchW / 2;
  const notchY = screenY + 3;

  const label = MOBILE_NAV_SIDES.find((s) => s.value === side)?.label.toLowerCase() ?? "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Aperçu mobile : ${label}`}
    >
      <rect
        x={phoneX}
        y={phoneY}
        width={phoneW}
        height={phoneH}
        rx={phoneR}
        fill="var(--background)"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />

      <rect
        x={screenX}
        y={screenY}
        width={screenW}
        height={screenH}
        rx={screenR}
        fill="currentColor"
        fillOpacity="0.025"
      />

      <rect
        x={notchX}
        y={notchY}
        width={notchW}
        height={notchH}
        rx={notchH / 2}
        fill="currentColor"
        fillOpacity="0.22"
      />

      <g fill="currentColor" fillOpacity="0.08">
        <rect x={screenX + 12} y={screenY + 18} width="40" height="6" rx="3" />
        <rect x={screenX + 12} y={screenY + 30} width="80" height="4" rx="2" />
        <rect x={screenX + 12} y={screenY + 50} width={screenW - 24} height="20" rx="5" />
        <rect x={screenX + 12} y={screenY + 78} width={screenW - 24} height="20" rx="5" />
        <rect x={screenX + 12} y={screenY + 106} width={screenW - 24} height="20" rx="5" />
        <rect x={screenX + 12} y={screenY + 134} width={screenW - 24} height="20" rx="5" />
        <rect x={screenX + 12} y={screenY + 162} width={screenW - 24} height="20" rx="5" />
      </g>

      <g transform={`translate(${navX}, ${navY})`}>
        <rect x="0" y="1" width={navW} height={navH} rx="7" fill="#0b0b0f" fillOpacity="0.10" />
        <rect
          x="0"
          y="0"
          width={navW}
          height={navH}
          rx="7"
          fill="var(--surface)"
          stroke="currentColor"
          strokeOpacity="0.1"
        />
        {[0, 1, 2, 3, 4].map((i) => {
          const itemW = navW / 5;
          const cx = itemW * i + itemW / 2;
          const cy = navH / 2;
          const active = i === 2;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={active ? 3.4 : 2.6}
              fill={active ? "var(--primary)" : "currentColor"}
              fillOpacity={active ? 1 : 0.35}
            />
          );
        })}
      </g>

      <rect
        x={W / 2 - 20}
        y={phoneY + phoneH - 3}
        width="40"
        height="2"
        rx="1"
        fill="currentColor"
        fillOpacity="0.28"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  SelectorCard — carte sélectionnable générique (partagée desktop/mobile)    */
/* -------------------------------------------------------------------------- */

function SelectorCard({
  active,
  onClick,
  label,
  hint,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
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
          {active && <Check className="size-2.5" strokeWidth={3} />}
        </span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  DisplayPanel                                                              */
/* -------------------------------------------------------------------------- */

export function DisplayPanel() {
  const isMobile = useIsMobile();
  const sidebarSide = useSidebarSide();
  const mobileNavSide = useMobileNavSide();

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

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={isMobile ? Smartphone : Monitor}
        title="Affichage"
        description="Organisez la disposition de l'interface selon vos habitudes."
      />

      {isMobile && (
        <PanelGroup label="Mobile" description="Réglages de disposition pour les petits écrans.">
          <SettingsCard
            title="Position de la barre de navigation"
            description="Sur mobile, la barre de navigation est normalement en bas, à portée de pouce. Vous pouvez la déplacer en haut si vous préférez."
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
                  ariaLabel={`${s.label} — ${s.hint}`}
                >
                  <div className="mx-auto w-full max-w-[160px]">
                    <MobileNavPreview side={s.value} />
                  </div>
                </SelectorCard>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
              <span>
                {mobileNavSide === "bottom"
                  ? "La barre est ancrée en bas de l'écran, au-dessus de la zone sûre iOS."
                  : "La barre est ancrée en haut de l'écran, sous la barre d'état du téléphone."}{" "}
                Le réglage est conservé sur cet appareil.
              </span>
            </div>
          </SettingsCard>
        </PanelGroup>
      )}

      {!isMobile && (
        <>
          <PanelGroup
            label="Ordinateur"
            description="Réglages de disposition pour les écrans larges (≥ 768 px)."
          >
            <SettingsCard
              title="Position de la barre principale"
              description="Choisissez le côté où s'affiche la barre latérale de navigation. L'assistant IA et le panneau Suggestion Cortex basculent automatiquement du côté opposé."
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
                    ariaLabel={`${s.label} — ${s.hint}`}
                  >
                    <DesktopSidebarPreview side={s.value} />
                  </SelectorCard>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
                <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
                <span>
                  {sidebarSide === "left"
                    ? "L'assistant IA s'affiche à droite. Cliquez sur la languette latérale pour l'ouvrir."
                    : "L'assistant IA s'affiche à gauche. Cliquez sur la languette latérale pour l'ouvrir."}{" "}
                  Le réglage est conservé sur cet appareil.
                </span>
              </div>
            </SettingsCard>
          </PanelGroup>

          <PanelGroup label="Panneaux latéraux">
            <SettingsCard
              title="Suggestion Cortex"
              description="Sur le Dashboard, un panneau de suggestions accompagne la page."
              icon={LayoutTemplate}
            >
              <div className="flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
                <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
                <span>
                  Le panneau <b className="text-foreground">Suggestion Cortex</b> suit
                  automatiquement le côté de l'assistant IA (
                  {sidebarSide === "left" ? "droite" : "gauche"}). Aucun réglage supplémentaire
                  n'est nécessaire.
                </span>
              </div>
            </SettingsCard>
          </PanelGroup>
        </>
      )}
    </div>
  );
}
