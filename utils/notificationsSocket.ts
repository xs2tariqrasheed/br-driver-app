/**
 * Notifications service Socket.IO client.
 * Connects to the notifications backend (port 3006) with JWT and listens
 * for the "notification" event so the app receives real-time notifications
 * when the app is in the foreground.
 */
import { getServiceUrl } from "@/config/urlResolver";
import { getStorageItem } from "@/utils/helpers";
import { AUTH_STORAGE_KEY } from "@/constants/global";
import io, { Socket } from "socket.io-client";

let notificationsSocket: Socket | null = null;

export type NotificationSocketPayload = {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
};

export type OnNotificationCallback = (payload: NotificationSocketPayload) => void;

const notificationListeners = new Set<OnNotificationCallback>();

function attachNotificationListener() {
  if (!notificationsSocket) return;
  notificationsSocket.on("notification", (payload: NotificationSocketPayload) => {
    console.log("📬 [NotificationsSocket] Received notification:", payload?.type, payload?.title);
    notificationListeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.warn("[NotificationsSocket] Listener error:", e);
      }
    });
  });
}

/**
 * Connect to the notifications service Socket.IO server with the current JWT.
 * Call when the user is logged in. Disconnects any existing connection first.
 */
export const connectNotificationsSocket = async (): Promise<Socket | null> => {
  try {
    const data = await getStorageItem(AUTH_STORAGE_KEY);
    const token = data ? JSON.parse(data).token : null;
    if (!token) {
      console.log("[NotificationsSocket] No auth token, skipping connect");
      return null;
    }

    const serverUrl = getServiceUrl(
      "notifications",
      process.env.EXPO_PUBLIC_BASE_URL,
      "https://djh0g1zn5pc6f.cloudfront.net"
    );
    // Notifications service uses default path /socket.io (no /auction prefix)
    console.log("🔌 [NotificationsSocket] Connecting to:", serverUrl);

    if (notificationsSocket) {
      notificationsSocket.off();
      notificationsSocket.disconnect();
      notificationsSocket = null;
    }

    // Send token in both auth and Authorization header so server can verify (same as notifications API client)
    const bearerToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    notificationsSocket = io(serverUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      extraHeaders: {
        Authorization: bearerToken,
      },
      auth: {
        token: token.replace(/^Bearer\s+/i, ""),
      },
    });

    notificationsSocket.on("connect", () => {
      console.log("✅ [NotificationsSocket] Connected");
    });
    notificationsSocket.on("connect_error", (err) => {
      console.warn("❌ [NotificationsSocket] Connect error:", err.message);
    });
    notificationsSocket.on("disconnect", (reason) => {
      console.log("🔌 [NotificationsSocket] Disconnected:", reason);
    });

    attachNotificationListener();
    return notificationsSocket;
  } catch (e) {
    console.warn("[NotificationsSocket] Connect failed:", e);
    return null;
  }
};

/**
 * Disconnect the notifications socket. Call on logout.
 */
export const disconnectNotificationsSocket = (): void => {
  if (notificationsSocket) {
    console.log("🔌 [NotificationsSocket] Disconnecting");
    notificationsSocket.off();
    notificationsSocket.disconnect();
    notificationsSocket = null;
  }
  notificationListeners.clear();
};

/**
 * Subscribe to real-time notification events from the notifications service.
 * Returns a cleanup function.
 */
export const onNotificationReceived = (callback: OnNotificationCallback): (() => void) => {
  notificationListeners.add(callback);
  return () => {
    notificationListeners.delete(callback);
  };
};

export const getNotificationsSocket = (): Socket | null => notificationsSocket;
