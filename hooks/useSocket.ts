import {
  connectSocket as baseConnectSocket,
  disconnectSocket as baseDisconnectSocket,
  emitEvent as baseEmitEvent,
  onDisconnect as baseOnDisconnect,
  onEvent as baseOnEvent,
} from "@/utils/socket";
import { useCallback, useRef, useState } from "react";

// Socket connection status constants
export const STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
} as const;

type SocketStatus = (typeof STATUS)[keyof typeof STATUS];

interface UseSocketParams {
  driverId?: string | number;
}

export const useSocket = (params?: UseSocketParams) => {
  const { driverId } = params || {};
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(
    STATUS.DISCONNECTED
  );
  const [socketError, setSocketError] = useState<any>(null);
  const listenersAttachedRef = useRef(false);
  const driverIdRef = useRef(driverId);

  // Keep driverId ref up to date
  driverIdRef.current = driverId;

  const connectSocket = useCallback(async () => {
    setSocketStatus(STATUS.CONNECTING);
    setSocketError(null);

    try {
      const socket = await baseConnectSocket();

      // If socket is already connected, update status immediately
      if (socket?.connected) {
        console.log("✅ Socket connected successfully");
        setSocketStatus(STATUS.CONNECTED);

        // Emit driver-connect immediately if already connected
        if (driverIdRef.current) {
          console.log(
            "🔗 Emitting driver-connect (already connected):",
            driverIdRef.current
          );
          baseEmitEvent("driver-connect", { driverId: driverIdRef.current });
        }
      }

      // Attach global listeners only once
      if (!listenersAttachedRef.current) {
        baseOnEvent("connect", () => {
          console.log("✅ Socket connected");
          setSocketStatus(STATUS.CONNECTED);

          // Emit driver-connect when connection is established
          if (driverIdRef.current) {
            console.log(
              "🔗 Emitting driver-connect (on connect):",
              driverIdRef.current
            );
            baseEmitEvent("driver-connect", { driverId: driverIdRef.current });
          }
        });

        baseOnEvent("reconnect", () => {
          console.log("🔄 Socket reconnected");
          setSocketStatus(STATUS.CONNECTED);

          // Emit driver-connect on reconnect as well
          if (driverIdRef.current) {
            console.log(
              "🔗 Emitting driver-connect (on reconnect):",
              driverIdRef.current
            );
            baseEmitEvent("driver-connect", { driverId: driverIdRef.current });
          }
        });

        baseOnEvent("connect_error", (err: any) => {
          console.log("❌ Socket connection error:", err);
          setSocketStatus(STATUS.ERROR);
          setSocketError(err);
        });

        baseOnEvent("error", (err: any) => {
          console.log("❌ Socket error:", err);
          setSocketStatus(STATUS.ERROR);
          setSocketError(err);
        });

        baseOnDisconnect((reason: string) => {
          console.log("🔌 Socket disconnected:", reason);
          setSocketStatus(STATUS.DISCONNECTED);
        });

        listenersAttachedRef.current = true;
      }

      return socket;
    } catch (error) {
      console.log("❌ Failed to connect socket:", error);
      setSocketStatus(STATUS.ERROR);
      setSocketError(error);
      throw error;
    }
  }, []);

  const emitEvent = useCallback((eventName: string, data?: any) => {
    baseEmitEvent(eventName, data);
  }, []);

  const onEvent = useCallback(
    (eventName: string, handler: (data: any) => void) => {
      return baseOnEvent(eventName, handler);
    },
    []
  );

  const onDisconnect = useCallback((handler: (reason: string) => void) => {
    return baseOnDisconnect(handler);
  }, []);

  const disconnectSocket = useCallback(() => {
    baseDisconnectSocket();
    setSocketStatus(STATUS.DISCONNECTED);
    setSocketError(null);
  }, []);

  return {
    socketStatus,
    socketError,
    connectSocket,
    disconnectSocket,
    emitEvent,
    onEvent,
    onDisconnect,
  };
};
