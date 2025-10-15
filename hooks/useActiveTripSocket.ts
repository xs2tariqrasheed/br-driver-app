import {
  connectActiveTripSocket as baseConnectActiveTripSocket,
  disconnectActiveTripSocket as baseDisconnectActiveTripSocket,
  emitActiveTripEvent as baseEmitActiveTripEvent,
  onActiveTripDisconnect as baseOnActiveTripDisconnect,
  onActiveTripEvent as baseOnActiveTripEvent,
} from "@/utils/activeTripSocket";
import { useCallback, useRef, useState } from "react";

// Active trip socket connection status constants
export const ACTIVE_TRIP_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
} as const;

type ActiveTripSocketStatus =
  (typeof ACTIVE_TRIP_STATUS)[keyof typeof ACTIVE_TRIP_STATUS];

export const useActiveTripSocket = () => {
  const [socketStatus, setSocketStatus] = useState<ActiveTripSocketStatus>(
    ACTIVE_TRIP_STATUS.DISCONNECTED
  );
  const [socketError, setSocketError] = useState<any>(null);
  const listenersAttachedRef = useRef(false);

  const connectActiveTripSocket = useCallback(
    async (driverId: string, retrievalId: string, tripId: string) => {
      if (!driverId || !retrievalId || !tripId) {
        console.error(
          "❌ Missing required parameters for active trip socket connection"
        );
        setSocketStatus(ACTIVE_TRIP_STATUS.ERROR);
        setSocketError("Missing driverId, retrievalId, or tripId");
        return null;
      }

      setSocketStatus(ACTIVE_TRIP_STATUS.CONNECTING);
      setSocketError(null);

      try {
        const socket = await baseConnectActiveTripSocket(
          driverId,
          retrievalId,
          tripId
        );

        // If socket is already connected, update status immediately
        if (socket?.connected) {
          console.log("✅ Active trip socket connected successfully");
          setSocketStatus(ACTIVE_TRIP_STATUS.CONNECTED);
        }

        // Attach global listeners only once
        if (!listenersAttachedRef.current) {
          baseOnActiveTripEvent("connect", () => {
            console.log("✅ Active trip socket connected");
            setSocketStatus(ACTIVE_TRIP_STATUS.CONNECTED);
          });

          baseOnActiveTripEvent("reconnect", () => {
            console.log("🔄 Active trip socket reconnected");
            setSocketStatus(ACTIVE_TRIP_STATUS.CONNECTED);
          });

          baseOnActiveTripEvent("connect_error", (err: any) => {
            console.log("❌ Active trip socket connection error:", err);
            setSocketStatus(ACTIVE_TRIP_STATUS.ERROR);
            setSocketError(err);
          });

          baseOnActiveTripEvent("error", (err: any) => {
            console.log("❌ Active trip socket error:", err);
            setSocketStatus(ACTIVE_TRIP_STATUS.ERROR);
            setSocketError(err);
          });

          baseOnActiveTripDisconnect((reason: string) => {
            console.log("🔌 Active trip socket disconnected:", reason);
            setSocketStatus(ACTIVE_TRIP_STATUS.DISCONNECTED);
          });

          listenersAttachedRef.current = true;
        }

        return socket;
      } catch (error) {
        console.log("❌ Failed to connect active trip socket:", error);
        setSocketStatus(ACTIVE_TRIP_STATUS.ERROR);
        setSocketError(error);
        throw error;
      }
    },
    []
  );

  const emitActiveTripEvent = useCallback((eventName: string, data?: any) => {
    baseEmitActiveTripEvent(eventName, data);
  }, []);

  const onActiveTripEvent = useCallback(
    (eventName: string, handler: (data: any) => void) => {
      return baseOnActiveTripEvent(eventName, handler);
    },
    []
  );

  const onActiveTripDisconnect = useCallback(
    (handler: (reason: string) => void) => {
      return baseOnActiveTripDisconnect(handler);
    },
    []
  );

  const disconnectActiveTripSocket = useCallback(() => {
    baseDisconnectActiveTripSocket();
    setSocketStatus(ACTIVE_TRIP_STATUS.DISCONNECTED);
    setSocketError(null);
    listenersAttachedRef.current = false;
  }, []);

  return {
    socketStatus,
    socketError,
    connectActiveTripSocket,
    disconnectActiveTripSocket,
    emitActiveTripEvent,
    onActiveTripEvent,
    onActiveTripDisconnect,
  };
};
