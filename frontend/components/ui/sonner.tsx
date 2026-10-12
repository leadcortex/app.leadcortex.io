//frontend\components\ui\sonner.tsx
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export type NotificationPosition =
  "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export type NotificationMobilePosition = "top" | "bottom";

export const NOTIFICATION_POSITION_KEY = "lc.notifications.position";
export const NOTIFICATION_POSITION_EVENT = "lc:notifications-position";

export const NOTIFICATION_MOBILE_POSITION_KEY = "lc.notifications.mobilePosition";
export const NOTIFICATION_MOBILE_POSITION_EVENT = "lc:notifications-mobile-position";

export const NOTIFICATION_SIZE_KEY = "lc.notifications.size";
export const NOTIFICATION_SIZE_EVENT = "lc:notifications-size";

const VALID_POSITIONS: NotificationPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const DEFAULT_POSITION: NotificationPosition = "top-left";
const DEFAULT_MOBILE_POSITION: NotificationMobilePosition = "top";
const DEFAULT_SIZE = 30;

export function readNotificationPosition(): NotificationPosition {
  if (typeof window === "undefined") return DEFAULT_POSITION;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_POSITION_KEY);
    if (raw && (VALID_POSITIONS as string[]).includes(raw)) {
      return raw as NotificationPosition;
    }
  } catch {
    /* Intentionally ignored. */
  }
  return DEFAULT_POSITION;
}

export function writeNotificationPosition(pos: NotificationPosition) {
  if (typeof window === "undefined") return;
  if (!(VALID_POSITIONS as string[]).includes(pos)) return;
  try {
    window.localStorage.setItem(NOTIFICATION_POSITION_KEY, pos);
  } catch {
    /* Intentionally ignored. */
  }
  try {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_POSITION_EVENT, { detail: pos }));
  } catch {
    /* Intentionally ignored. */
  }
}

export function readNotificationMobilePosition(): NotificationMobilePosition {
  if (typeof window === "undefined") return DEFAULT_MOBILE_POSITION;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_MOBILE_POSITION_KEY);
    if (raw === "top" || raw === "bottom") return raw;
  } catch {
    /* Intentionally ignored. */
  }
  return DEFAULT_MOBILE_POSITION;
}

export function writeNotificationMobilePosition(pos: NotificationMobilePosition) {
  if (typeof window === "undefined") return;
  if (pos !== "top" && pos !== "bottom") return;
  try {
    window.localStorage.setItem(NOTIFICATION_MOBILE_POSITION_KEY, pos);
  } catch {
    /* Intentionally ignored. */
  }
  try {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_MOBILE_POSITION_EVENT, { detail: pos }));
  } catch {
    /* Intentionally ignored. */
  }
}

export function readNotificationSize(): number {
  if (typeof window === "undefined") return DEFAULT_SIZE;
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_SIZE_KEY);
    if (raw !== null) {
      const n = Number(raw);
      if (!Number.isNaN(n) && n >= 0 && n <= 100) return n;
    }
  } catch {
    /* Intentionally ignored. */
  }
  return DEFAULT_SIZE;
}

export function writeNotificationSize(size: number) {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(100, Math.round(size)));
  try {
    window.localStorage.setItem(NOTIFICATION_SIZE_KEY, String(clamped));
  } catch {
    /* Intentionally ignored. */
  }
  try {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_SIZE_EVENT, { detail: clamped }));
  } catch {
    /* Intentionally ignored. */
  }
}

export function notificationScaleFromSize(size: number): number {
  return 0.85 + (size / 100) * 0.5;
}

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ position, ...props }: ToasterProps) => {
  const isMobile = useIsMobile();

  const [pos, setPos] = useState<NotificationPosition>(() => readNotificationPosition());
  const [mobilePos, setMobilePos] = useState<NotificationMobilePosition>(() =>
    readNotificationMobilePosition(),
  );
  const [size, setSize] = useState<number>(() => readNotificationSize());

  useEffect(() => {
    const onPos = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && (VALID_POSITIONS as string[]).includes(detail)) setPos(detail);
    };
    const onMobilePos = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "top" || detail === "bottom") setMobilePos(detail);
    };
    const onSize = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") setSize(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === NOTIFICATION_POSITION_KEY) setPos(readNotificationPosition());
      if (e.key === NOTIFICATION_MOBILE_POSITION_KEY)
        setMobilePos(readNotificationMobilePosition());
      if (e.key === NOTIFICATION_SIZE_KEY) setSize(readNotificationSize());
    };

    window.addEventListener(NOTIFICATION_POSITION_EVENT, onPos);
    window.addEventListener(NOTIFICATION_MOBILE_POSITION_EVENT, onMobilePos);
    window.addEventListener(NOTIFICATION_SIZE_EVENT, onSize);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NOTIFICATION_POSITION_EVENT, onPos);
      window.removeEventListener(NOTIFICATION_MOBILE_POSITION_EVENT, onMobilePos);
      window.removeEventListener(NOTIFICATION_SIZE_EVENT, onSize);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const finalPosition: NotificationPosition = isMobile
    ? mobilePos === "top"
      ? "top-center"
      : "bottom-center"
    : (position ?? pos);

  const scale = notificationScaleFromSize(size);

  return (
    <Sonner
      position={finalPosition}
      className="toaster group"
      style={{ "--notif-scale": String(scale) } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
