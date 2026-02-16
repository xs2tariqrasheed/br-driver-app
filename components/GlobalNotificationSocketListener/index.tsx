/**
 * Listens to the notifications service Socket.IO "notification" event and
 * adds incoming notifications to the driver's notification center and shows a toast.
 * Connect when user is logged in; disconnect on logout.
 */
import { showToast } from "@/components/Toast";
import { NOTIFICATION_TYPES } from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { formatDateTimestamp } from "@/utils/helpers";
import {
    connectNotificationsSocket,
    disconnectNotificationsSocket,
    onNotificationReceived,
} from "@/utils/notificationsSockets";
import { useEffect } from "react";

export function GlobalNotificationSocketListener() {
  const [auth] = useAuth();
  const { addNotification } = useDriver();

  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) {
      disconnectNotificationsSocket();
      return;
    }

    let cleanup: (() => void) | undefined;

    (async () => {
      const socket = await connectNotificationsSocket();
      if (!socket) return;

      cleanup = onNotificationReceived((payload) => {
        const notification = {
          id: `socket-${payload.type}-${payload.timestamp}-${Math.random().toString(36).slice(2)}`,
          messageTitle: payload.title ?? "Notification",
          messageBody: payload.body ?? "",
          dateTime: formatDateTimestamp(payload.timestamp),
          messageType: "unread" as const,
          notificationType: NOTIFICATION_TYPES.INFO,
        };
        addNotification(notification);
        showToast(payload.title || "New notification", {
          variant: "success",
          position: "top",
        });
      });
    })();

    return () => {
      cleanup?.();
      disconnectNotificationsSocket();
    };
  }, [auth?.user?.id, addNotification]);

  return null;
}
