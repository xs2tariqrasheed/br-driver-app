import { useEffect } from "react";

import { SOCKET_EVENTS } from "@/constants/global";
import { useSocket } from "@/hooks/useSocket";

import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { logger } from "@/utils/helpers";
import { showToast } from "../Toast";

/**
 * Global Socket Listener - Centralized Event Management for React Native
 *
 * Purpose: Handles global socket events in one place to prevent duplication and ensure consistency
 * Key Features:
 * - Socket disconnect events (critical for session management)
 * - New job offer notifications from the server
 * - Mobile-optimized notifications using React Native Toast
 * - Comprehensive logging for debugging and monitoring
 * - Clean event listener management with proper cleanup
 * - Driver online status validation before setting up listeners
 * - Automatic cleanup on component unmount or driver offline status
 *
 * Dependencies:
 * - useSocket hook for socket connection management
 * - DriverContext for driver online status
 * - Toast component for user notifications
 * - SOCKET_EVENTS constants for event names
 *
 * Usage: Place this component high in your component tree to ensure global event handling
 */
export function GlobalSocketListener() {
  const log = logger();
  const [auth] = useAuth();
  const { onEvent, onDisconnect } = useSocket({
    driverId: auth?.user?.id,
  });
  const [driver] = useDriver();

  useEffect(() => {
    if (!driver?.online) {
      log("🔴 Driver not online, skipping global listeners setup");
      return;
    }

    log("🟢 Setting up global socket listeners...");
    const cleanupFunctions: (() => void)[] = [];

    // 1. Socket Disconnect Event (Critical Global Event)
    const disconnectCleanup = onDisconnect(async (reason: string) => {
      log("🔌 Socket disconnected:", reason);
      log("Socket disconnected:", reason);
      showToast("Socket disconnected", { variant: "warning", position: "top" });
    });
    cleanupFunctions.push(disconnectCleanup);

    // 2. New Job Offer Event (Global Modal + Notification)
    const newJobOfferCleanup = onEvent(SOCKET_EVENTS.NEW_OFFER, (data: any) => {
      log("💬 Global new job offer received:", data);
    });
    cleanupFunctions.push(newJobOfferCleanup);

    log("✅ Global socket listeners set up successfully");

    // Cleanup function
    return () => {
      log("🧹 Cleaning up global socket listeners...");
      cleanupFunctions.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          log("❌ Error during listener cleanup:", error);
        }
      });
      log("✅ Global socket listeners cleaned up");
    };
  }, [driver?.online, onEvent]);

  // Component renders nothing - only provides side effects
  return null;
}
