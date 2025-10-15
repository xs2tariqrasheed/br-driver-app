import { useEffect } from "react";

import {
  ACTIVE_TRIP_SOCKET_EVENTS,
  NOTIFICATION_TYPES,
  NotificationType,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useNotification } from "@/context/NotificationContext";
import { useActiveTripSocket } from "@/hooks/useActiveTripSocket";
import { useNetworkMonitoring } from "@/hooks/useNetworkMonitoring";
import { formatDateTimestamp, logger } from "@/utils/helpers";
import { showToast } from "../Toast";

/**
 * Global Active Trip Socket Listener - Centralized Event Management for Active Trips
 *
 * Purpose: Handles global active trip socket events in one place to prevent duplication and ensure consistency
 * Key Features:
 * - Trip stop added events (updates trip state/UI when stops are added)
 * - New message events (shows notification for new customer messages)
 * - Mobile-optimized notifications using React Native Toast
 * - Comprehensive logging for debugging and monitoring
 * - Clean event listener management with proper cleanup
 * - Driver online status and active trip validation before setting up listeners
 * - Automatic cleanup on component unmount or when no active trip
 *
 * Dependencies:
 * - useActiveTripSocket hook for active trip socket connection management
 * - DriverContext for driver online status and active trip data
 * - Toast component for user notifications
 * - ACTIVE_TRIP_SOCKET_EVENTS constants for event names
 *
 * Usage: Place this component high in your component tree to ensure global active trip event handling
 */
export function GlobalActiveTripListener() {
  const log = logger();
  const [auth] = useAuth();
  const { getRetrievalId, getTripId } = useDriver();
  const [driver] = useDriver();
  const { showNotification: showVisualNotification } = useNotification();
  const { isNetworkSuitableFor, networkQuality } = useNetworkMonitoring();
  const { onActiveTripEvent, onActiveTripDisconnect, socketStatus } =
    useActiveTripSocket();

  useEffect(() => {
    // Check if we have an active trip (retrievalId exists)
    const checkActiveTrip = async () => {
      try {
        const retrievalId = await getRetrievalId();
        const tripId = await getTripId();

        if (!retrievalId || !tripId) {
          log(
            "🔴 No active trip found (missing retrievalId or tripId), skipping active trip listeners setup"
          );
          return false;
        }

        return true;
      } catch (error) {
        log("❌ Error checking active trip:", error);
        return false;
      }
    };

    // Check if driver is online
    if (!driver?.online) {
      log("🔴 Driver not online, skipping active trip listeners setup");
      return;
    }

    // Check if network is suitable for socket operations
    if (!isNetworkSuitableFor("socket")) {
      log(
        `🔴 Network quality (${networkQuality}) not suitable for socket operations, skipping active trip listeners setup`
      );
      return;
    }

    // Check for active trip and setup listeners
    const setupListeners = async () => {
      const hasActiveTrip = await checkActiveTrip();
      if (!hasActiveTrip) return;

      log("🟢 Setting up global active trip socket listeners...");
      const cleanupFunctions: (() => void)[] = [];

      // 1. Active Trip Socket Disconnect Event (Critical Global Event)
      const disconnectCleanup = onActiveTripDisconnect(
        async (reason: string) => {
          log("🔌 Active trip socket disconnected:", reason);
          showToast("Trip connection lost - You may miss important updates", {
            variant: "warning",
            position: "top",
          });
        }
      );
      cleanupFunctions.push(disconnectCleanup);

      // 1.1. Active Trip Socket Reconnect Event (Connection Restored)
      const reconnectCleanup = onActiveTripEvent("reconnect", async () => {
        log("🔄 Active trip socket reconnected");
        showToast("Trip connection restored - You'll receive updates", {
          variant: "success",
          position: "top",
        });
      });
      cleanupFunctions.push(reconnectCleanup);

      // 2. Trip Stop Added Event (Global Notification)
      const tripStopAddedCleanup = onActiveTripEvent(
        ACTIVE_TRIP_SOCKET_EVENTS.TRIP_STOP_ADDED,
        async (data: any) => {
          log("🚗 Trip stop added event received:", data);

          try {
            // Show visual notification for new stop
            showVisualNotification({
              type: NOTIFICATION_TYPES.AUTHORIZATION,
              title: "Blink Ride",
              subtitle: "Stop Request",
              message:
                "Please make a stop as requested by the customer and wait, you will be paid extra for this stop",
              modal: true,
              autoHide: false,
            });

            // Add notification to notification center
            const notification = {
              id: `trip-stop-added-${Date.now()}`,
              messageTitle: "New Stop Added",
              messageBody:
                "A new stop has been added to your trip. Check the details for more information.",
              dateTime: formatDateTimestamp(new Date().toISOString()),
              messageType: "unread" as const,
              notificationType: NOTIFICATION_TYPES.INFO as NotificationType,
            };

            // Note: You might want to add this to a trip-specific context or notification system
            // For now, we'll just log it
            log("✅ Trip stop added notification created:", notification);
          } catch (error) {
            log("❌ Error processing trip stop added event:", error);
            showToast("Failed to process trip update", {
              variant: "error",
              position: "top",
            });
          }
        }
      );
      cleanupFunctions.push(tripStopAddedCleanup);

      // 3. New Message Event (Global Notification)
      const newMessageCleanup = onActiveTripEvent(
        ACTIVE_TRIP_SOCKET_EVENTS.NEW_MESSAGE,
        async (data: any) => {
          log("💬 New message event received:", data);

          try {
            const { from, message, ts } = data;

            // Show visual notification for new message
            showVisualNotification({
              type: NOTIFICATION_TYPES.INFO,
              title: "New Message",
              subtitle: "From Customer",
              message: message || "You have a new message from the customer.",
            });

            // Add notification to notification center
            const notification = {
              id: `new-message-${ts || Date.now()}`,
              messageTitle: "New Message",
              messageBody:
                message || "You have a new message from the customer.",
              dateTime: formatDateTimestamp(
                new Date(ts || Date.now()).toISOString()
              ),
              messageType: "unread" as const,
              notificationType: NOTIFICATION_TYPES.INFO as NotificationType,
            };

            // Note: You might want to add this to a message-specific context or notification system
            // For now, we'll just log it
            log("✅ New message notification created:", notification);
          } catch (error) {
            log("❌ Error processing new message event:", error);
            showToast("Failed to process new message", {
              variant: "error",
              position: "top",
            });
          }
        }
      );
      cleanupFunctions.push(newMessageCleanup);

      log("✅ Global active trip socket listeners set up successfully");

      // Cleanup function
      return () => {
        log("🧹 Cleaning up global active trip socket listeners...");
        cleanupFunctions.forEach((cleanup) => {
          try {
            cleanup();
          } catch (error) {
            log("❌ Error during active trip listener cleanup:", error);
          }
        });
        log("✅ Global active trip socket listeners cleaned up");
      };
    };

    // Setup listeners
    let cleanup: (() => void) | undefined;
    setupListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    // Cleanup on unmount or dependency change
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [
    driver?.online,
    socketStatus,
    networkQuality,
    isNetworkSuitableFor,
    onActiveTripEvent,
    onActiveTripDisconnect,
    getRetrievalId,
    getTripId,
    showVisualNotification,
    log,
  ]);

  // Component renders nothing - only provides side effects
  return null;
}
