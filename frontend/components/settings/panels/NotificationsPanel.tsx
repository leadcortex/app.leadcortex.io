//frontend\components\settings\panels\NotificationsPanel.tsx
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Bell, Check, Minus, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  readNotificationPosition,
  writeNotificationPosition,
  readNotificationMobilePosition,
  writeNotificationMobilePosition,
  readNotificationSize,
  writeNotificationSize,
  type NotificationPosition,
  type NotificationMobilePosition,
} from "@/components/ui/sonner";
import { PanelIntro, PanelGroup, SettingsCard, Row } from "./primitives";

const DESKTOP_POSITIONS: {
  value: NotificationPosition;
  label: string;
  hint: string;
}[] = [
  { value: "top-left", label: "En haut à gauche", hint: "Position par défaut" },
  { value: "top-right", label: "En haut à droite", hint: "Visible immédiatement" },
  { value: "bottom-left", label: "En bas à gauche", hint: "Discrète, hors du contenu" },
  { value: "bottom-right", label: "En bas à droite", hint: "Près du contenu" },
];

const MOBILE_POSITIONS: {
  value: NotificationMobilePosition;
  label: string;
  hint: string;
}[] = [
  { value: "top", label: "En haut", hint: "Sous la barre d'état" },
  { value: "bottom", label: "En bas", hint: "Au-dessus de la nav" },
];

function BrowserNotificationPreview({ position }: { position: NotificationPosition }) {
  const W = 240;
  const H = 168;

  const contentX = 8;
  const contentY = 46;
  const contentW = W - contentX * 2;
  const contentH = H - contentY - 8;

  const notifW = 80;
  const notifH = 44;
  const pad = 10;

  const isRight = position === "top-right" || position === "bottom-right";
  const isTop = position === "top-left" || position === "top-right";

  const notifX = isRight ? contentX + contentW - notifW - pad : contentX + pad;
  const notifY = isTop ? contentY + pad : contentY + contentH - notifH - pad;

  const label = DESKTOP_POSITIONS.find((p) => p.value === position)?.label.toLowerCase() ?? "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Aperçu : notification ${label}`}
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

      <g fill="currentColor" fillOpacity="0.08">
        <rect x={contentX + 16} y={contentY + 14} width="64" height="6" rx="3" />
        <rect x={contentX + 16} y={contentY + 26} width="118" height="4" rx="2" />
        <rect x={contentX + 16} y={contentY + 34} width="96" height="4" rx="2" />
        <rect x={contentX + 16} y={contentY + 56} width={contentW - 32} height="12" rx="4" />
        <rect x={contentX + 16} y={contentY + 74} width={contentW - 32} height="12" rx="4" />
        <rect x={contentX + 16} y={contentY + 92} width={contentW - 32} height="12" rx="4" />
      </g>

      <g transform={`translate(${notifX}, ${notifY})`}>
        <rect x="0" y="2" width={notifW} height={notifH} rx="7" fill="#0b0b0f" fillOpacity="0.22" />
        <rect
          x="0"
          y="0"
          width={notifW}
          height={notifH}
          rx="7"
          fill="#ffffff"
          stroke="#000000"
          strokeOpacity="0.06"
        />
        <circle cx="14" cy="15" r="6.5" fill="var(--primary)" fillOpacity="0.14" />
        <circle cx="14" cy="15" r="2.2" fill="var(--primary)" />
        <rect x="25" y="9.5" width="44" height="4" rx="2" fill="#111111" fillOpacity="0.72" />
        <rect x="25" y="18" width="34" height="3" rx="1.5" fill="#111111" fillOpacity="0.4" />
        <rect x="25" y="25" width="48" height="3" rx="1.5" fill="#111111" fillOpacity="0.22" />
      </g>
    </svg>
  );
}

/* =========================================================================
 *  MobileNotificationPreview — aperçu mobile (téléphone)                     *
 * ====================================================================== */

function MobileNotificationPreview({
  side,
  size,
}: {
  side: NotificationMobilePosition;
  size: number;
}) {
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

  const notchW = 40;
  const notchH = 6;
  const notchX = W / 2 - notchW / 2;
  const notchY = screenY + 3;

  // Échelle de la carte notification en fonction de la préférence de taille
  // (0 → 0.55, 100 → 1.25). La carte s'agrandit visuellement sur l'aperçu.
  const cardScale = 0.55 + (size / 100) * 0.7;
  const cardW = 120 * cardScale;
  const cardH = 40 * cardScale;
  const cardX = screenX + (screenW - cardW) / 2;
  const isTop = side === "top";
  const cardY = isTop ? screenY + 24 : screenY + screenH - cardH - 24;

  const label = isTop ? "en haut" : "en bas";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Aperçu mobile : notification ${label}`}
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
        <rect x={screenX + 12} y={screenY + 20} width="50" height="6" rx="3" />
        <rect x={screenX + 12} y={screenY + 32} width="80" height="4" rx="2" />
        <rect x={screenX + 12} y={screenY + 54} width={screenW - 24} height="18" rx="5" />
        <rect x={screenX + 12} y={screenY + 80} width={screenW - 24} height="18" rx="5" />
        <rect x={screenX + 12} y={screenY + 106} width={screenW - 24} height="18" rx="5" />
        <rect x={screenX + 12} y={screenY + 132} width={screenW - 24} height="18" rx="5" />
      </g>

      <g>
        <rect
          x={cardX}
          y={cardY + 2}
          width={cardW}
          height={cardH}
          rx={7 * cardScale}
          fill="#0b0b0f"
          fillOpacity="0.18"
        />

        <rect
          x={cardX}
          y={cardY}
          width={cardW}
          height={cardH}
          rx={7 * cardScale}
          fill="#ffffff"
          stroke="#000000"
          strokeOpacity="0.06"
        />

        <circle
          cx={cardX + 14 * cardScale}
          cy={cardY + cardH / 2}
          r={6 * cardScale}
          fill="var(--primary)"
          fillOpacity="0.15"
        />
        <circle
          cx={cardX + 14 * cardScale}
          cy={cardY + cardH / 2}
          r={2.2 * cardScale}
          fill="var(--primary)"
        />

        <rect
          x={cardX + 25 * cardScale}
          y={cardY + 9 * cardScale}
          width={44 * cardScale}
          height={3 * cardScale}
          rx={1.5 * cardScale}
          fill="#111111"
          fillOpacity="0.72"
        />
        <rect
          x={cardX + 25 * cardScale}
          y={cardY + 17 * cardScale}
          width={34 * cardScale}
          height={2.4 * cardScale}
          rx={1.2 * cardScale}
          fill="#111111"
          fillOpacity="0.4"
        />
        <rect
          x={cardX + 25 * cardScale}
          y={cardY + 24 * cardScale}
          width={48 * cardScale}
          height={2.4 * cardScale}
          rx={1.2 * cardScale}
          fill="#111111"
          fillOpacity="0.22"
        />
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

/* =========================================================================
 *  SelectorCard — carte radio générique                                      *
 * ====================================================================== */

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

/* =========================================================================
 *  Helpers                                                                   *
 * ====================================================================== */

function sizeLabel(size: number): string {
  if (size <= 25) return "Petite";
  if (size <= 66) return "Moyenne";
  return "Grande";
}

/* =========================================================================
 *  NotificationsPanel                                                        *
 * ====================================================================== */

export function NotificationsPanel() {
  const isMobile = useIsMobile();

  /* Alertes (mêmes dans les deux modes). */
  const [notifs, setNotifs] = useState({
    reply: true,
    sequence: true,
    quota: true,
    weekly: false,
    deliverability: true,
  });

  /* Position desktop. */
  const [position, setPosition] = useState<NotificationPosition>(() => readNotificationPosition());

  /* Position mobile. */
  const [mobilePosition, setMobilePosition] = useState<NotificationMobilePosition>(() =>
    readNotificationMobilePosition(),
  );

  /* Taille (appliquée globalement). */
  const [size, setSize] = useState<number>(() => readNotificationSize());

  /* Throttle du toast de prévisualisation pour éviter le spam. */
  const lastPreviewAt = useRef<number>(0);

  /* ── Handlers ───────────────────────────────────────────────────────── */

  const handleDesktopPositionChange = (next: NotificationPosition) => {
    setPosition(next);
    writeNotificationPosition(next);
  };

  const handleMobilePositionChange = (next: NotificationMobilePosition) => {
    setMobilePosition(next);
    writeNotificationMobilePosition(next);
  };

  const handleSizeChange = (next: number) => {
    setSize(next);
    writeNotificationSize(next);

    // Toast de prévisualisation (throttlé) — l'id fixe garantit
    // qu'on remplace toujours le même toast au lieu d'en empiler.
    const now = Date.now();
    if (now - lastPreviewAt.current > 220) {
      lastPreviewAt.current = now;
      toast("Aperçu de la taille", {
        id: "notif-size-preview",
        description: `Taille ${sizeLabel(next).toLowerCase()} · ${next} %`,
        duration: 2600,
      });
    }
  };

  /* ── Rendu ──────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-8">
      <PanelIntro
        icon={Bell}
        title="Notifications"
        description="Choisissez les alertes à recevoir et l'endroit où elles s'affichent à l'écran."
      />

      {isMobile ? (
        <PanelGroup label="Position d'affichage">
          <SettingsCard
            title="Où afficher les notifications ?"
            description="Les notifications apparaissent centrées, en haut ou en bas de l'écran."
          >
            <div className="grid grid-cols-2 gap-3">
              {MOBILE_POSITIONS.map((p) => (
                <SelectorCard
                  key={p.value}
                  active={mobilePosition === p.value}
                  onClick={() => handleMobilePositionChange(p.value)}
                  label={p.label}
                  hint={p.hint}
                  ariaLabel={`${p.label} — ${p.hint}`}
                >
                  <div className="mx-auto w-full max-w-[130px]">
                    <MobileNotificationPreview side={p.value} size={size} />
                  </div>
                </SelectorCard>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
              <span>
                Les notifications apparaîtront{" "}
                <b className="text-foreground">{mobilePosition === "top" ? "en haut" : "en bas"}</b>{" "}
                de l'écran. Le réglage est conservé sur cet appareil.
              </span>
            </div>
          </SettingsCard>
        </PanelGroup>
      ) : (
        <PanelGroup label="Position d'affichage">
          <SettingsCard
            title="Où afficher les notifications ?"
            description="Choisissez le coin de l'écran où apparaîtront les messages temporaires."
          >
            <div className="grid grid-cols-2 gap-3">
              {DESKTOP_POSITIONS.map((p) => (
                <SelectorCard
                  key={p.value}
                  active={position === p.value}
                  onClick={() => handleDesktopPositionChange(p.value)}
                  label={p.label}
                  hint={p.hint}
                  ariaLabel={`${p.label} — ${p.hint}`}
                >
                  <BrowserNotificationPreview position={p.value} />
                </SelectorCard>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
              <span>
                Les notifications apparaîtront dans le coin{" "}
                <b className="text-foreground">
                  {DESKTOP_POSITIONS.find((p) => p.value === position)?.label.toLowerCase()}
                </b>{" "}
                de la fenêtre. Le réglage est conservé sur cet appareil.
              </span>
            </div>
          </SettingsCard>
        </PanelGroup>
      )}

      {isMobile && (
        <PanelGroup label="Taille des notifications">
          <SettingsCard
            title="Ajuster la taille"
            description="Déplacez le curseur pour changer la taille en temps réel. Un aperçu apparaît à l'écran."
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-muted-foreground">
                  <Minus className="size-3.5" strokeWidth={2.4} />
                </span>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={size}
                  onChange={(e) => handleSizeChange(Number(e.target.value))}
                  aria-label="Taille des notifications"
                  className="notif-slider flex-1"
                />

                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-muted-foreground">
                  <Plus className="size-3.5" strokeWidth={2.4} />
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px]">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                  {sizeLabel(size)}
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">{size} %</span>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-surface/40 p-3 text-[11px] text-muted-foreground">
                <AlertCircle className="mt-px size-3.5 shrink-0 text-primary" />
                <span>
                  Un exemple de notification s'affiche à l'écran chaque fois que vous ajustez la
                  taille. Elle disparaît après quelques secondes.
                </span>
              </div>
            </div>
          </SettingsCard>
        </PanelGroup>
      )}

      <PanelGroup label="Alertes produit">
        <SettingsCard
          title="Événements en temps réel"
          description="Notifications déclenchées par l'activité de vos prospects."
        >
          <div className="divide-y divide-border">
            <Row title="Nouvelle réponse" description="Quand un prospect répond à une séquence.">
              <Switch
                checked={notifs.reply}
                onCheckedChange={(v) => setNotifs((n) => ({ ...n, reply: v }))}
                aria-label="Notifications : nouvelles réponses"
              />
            </Row>
            <Row title="Séquence terminée">
              <Switch
                checked={notifs.sequence}
                onCheckedChange={(v) => setNotifs((n) => ({ ...n, sequence: v }))}
                aria-label="Notifications : séquence terminée"
              />
            </Row>
            <Row title="Quota presque atteint">
              <Switch
                checked={notifs.quota}
                onCheckedChange={(v) => setNotifs((n) => ({ ...n, quota: v }))}
                aria-label="Notifications : quota presque atteint"
              />
            </Row>
          </div>
        </SettingsCard>
      </PanelGroup>

      <PanelGroup label="Rapports & délivrabilité">
        <SettingsCard
          title="Rapports périodiques"
          description="Résumés et alertes de santé d'envoi."
        >
          <div className="divide-y divide-border">
            <Row title="Rapport hebdomadaire">
              <Switch
                checked={notifs.weekly}
                onCheckedChange={(v) => setNotifs((n) => ({ ...n, weekly: v }))}
                aria-label="Notifications : rapport hebdomadaire"
              />
            </Row>
            <Row title="Alerte de délivrabilité">
              <Switch
                checked={notifs.deliverability}
                onCheckedChange={(v) => setNotifs((n) => ({ ...n, deliverability: v }))}
                aria-label="Notifications : alerte de délivrabilité"
              />
            </Row>
          </div>
        </SettingsCard>
      </PanelGroup>
    </div>
  );
}
