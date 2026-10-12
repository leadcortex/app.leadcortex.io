//frontend\lib\assistant-notifications.ts
/**
 * Notifications de fin de réponse de l'assistant.
 *
 * Trois niveaux de notification, du plus visible au plus discret :
 *  1. **native** — `Notification` du navigateur, utilisé quand l'onglet est
 *     en arrière-plan ou la fenêtre non focalisée. Un clic ramène au tab.
 *  2. **toast**  — toast sonner, utilisé quand la fenêtre est focalisée mais
 *     que l'utilisateur est sur une autre application (multi-écran).
 *  3. **silent** — l'utilisateur regarde déjà la page, on ne l'interrompt pas.
 *
 * L'appelant décide du moment : typiquement à la fin du streaming. Un
 * appelant hors contexte React (ex. dans un `setTimeout`) peut appeler
 * `notifyResponseReady(...)` directement.
 *
 * La permission navigateur n'est **jamais** demandée automatiquement :
 * l'appelant doit invoquer `ensureNotificationPermission()` sur un geste
 * utilisateur (bouton dans le panneau des raccourcis, ou un bouton dédié).
 */
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

/** Vrai quand l'utilisateur n'a vraisemblablement pas les yeux sur la page. */
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
  /** Aperçu court à afficher dans le corps de la notification. */
  preview: string;
  /** Titre principal. Défaut : « Réponse prête ». */
  title?: string;
  /** Force la notification même si l'utilisateur est sur la page. */
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
          /* ignored */
        }
        n.close();
      };
      return "native";
    } catch {
      /* On retombe sur le toast ci-dessous. */
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