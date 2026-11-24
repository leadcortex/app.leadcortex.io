// frontend/lib/ai/assistant-notifications.ts

import { toast } from "sonner";

export type NotifyResult = "native" | "toast" | "silent";

export function canUseNativeNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!canUseNativeNotifications()) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function isUserAway(): boolean {
  if (typeof document === "undefined") return false;
  if (document.hidden) return true;
  try {
    return !document.hasFocus();
  } catch {
    return false;
  }
}

export type NotifyOptions = {
  preview: string;
  title?: string;
  force?: boolean;
};

export function notifyResponseReady(options: NotifyOptions): NotifyResult {
  const away = options.force === true || isUserAway();
  if (!away) return "silent";

  if (canUseNativeNotifications() && Notification.permission === "granted") {
    try {
      const n = new Notification(options.title ?? "Réponse prête", {
        body: options.preview.slice(0, 140),
        tag: "lc-assistant-response",
        silent: false,
      });
      n.onclick = () => {
        try {
          window.focus();
        } catch {
        }
        n.close();
      };
      return "native";
    } catch {
    }
  }

  try {
    toast.message(options.title ?? "Réponse prête", {
      description: options.preview.slice(0, 120),
    });
    return "toast";
  } catch {
    return "silent";
  }
}
