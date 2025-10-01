import { useEffect } from "react";

import {
  NOTIFICATION_TYPES,
  NotificationType,
  RIDE_OFFER_STORAGE_KEY,
  SOCKET_EVENTS,
} from "@/constants/global";
import { useSocket } from "@/hooks/useSocket";

import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { formatDateTimestamp, logger, setStorageItem } from "@/utils/helpers";
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
  const { onEvent, onDisconnect, socketStatus } = useSocket({
    driverId: auth?.user?.id,
  });
  const { addNotification } = useDriver();
  const [driver] = useDriver();
  const { showRideOfferModal } = useRideOffer();

  useEffect(() => {
    if (!driver?.online) {
      log(
        `🔴 Driver not online OR Socket status is ${socketStatus}, skipping global listeners setup`
      );
      log("Socket status:", socketStatus);
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
    const newJobOfferCleanup = onEvent(
      SOCKET_EVENTS.NEW_OFFER,
      async (data: any) => {
        log("💬 Global new job offer received test:", data);

        try {
          // Transform socket data to RideOffer format with complete mock data
          const rideOffer = {
            // Basic ride offer info
            id: data.tripOffer?.tripId || data.tripId || `ride-${Date.now()}`,
            type: data.type || ("sequential" as "sequential" | "broadcast"),
            status: "offered" as const,

            // Trip offer details
            tripOffer: {
              tripId:
                data.tripOffer?.tripId || data.tripId || String(Date.now()),
              pickupLocation: {
                lat:
                  data.tripOffer?.pickupLocation?.lat ||
                  data.pickupLocationLatitude ||
                  37.7749,
                lng:
                  data.tripOffer?.pickupLocation?.lng ||
                  data.pickupLocationLongitude ||
                  -122.4194,
              },
              dropoffLocation: {
                lat:
                  data.tripOffer?.dropoffLocation?.lat ||
                  data.dropoffLocationLatitude ||
                  37.7849,
                lng:
                  data.tripOffer?.dropoffLocation?.lng ||
                  data.dropoffLocationLongitude ||
                  -122.4094,
              },
              fare:
                parseFloat(data.tripOffer?.fare) ||
                parseFloat(data.offerAmount) ||
                55,
              expiresAt: data.tripOffer?.expiresAt,
            },

            // LiveRideOfferItem required fields
            rideType: data.rideType || ("one-way" as const),
            peopleCount: data.peopleCount || 2,
            rating: data.rating || 4.5,
            hasSpecialRequirements: data.hasSpecialRequirements || false,
            hasPackage: data.hasPackage || false,

            // Pickup details
            pickupTime: data.pickupTime || 13,
            pickupDistance: data.pickupDistance || 3.4,
            pickupAddress:
              data.pickupAddress ||
              "Pascal Ave N & N Terrace AR. Roseville 69 Main Street",

            // Dropoff details
            dropoffTime: data.dropoffTime || 24,
            dropoffDistance: data.dropoffDistance || 3.4,
            dropoffAddress:
              data.dropoffAddress || "3272 Gale Ave Long Island City NY 11101",

            // Ride details
            rideTime: data.rideTime || 49,
            rideDistance: data.rideDistance || 23.4,
            totalPrice: data.totalPrice || 55,
            driverEarn: data.driverEarn || 46,

            // Button details
            buttonTitle: data.buttonTitle || "",

            // Timestamps
            timestamp: data.timestamp || new Date().toISOString(),
            timeout: data.timeout || 30000, // Default 30 seconds
          };

          log("🚗 Opening ride offer modal:", rideOffer);

          // Add notification to notification center
          const notification = {
            id: `ride-offer-${rideOffer.tripOffer.tripId}-${Date.now()}`,
            messageTitle: "Special Ride Offer",
            messageBody: `${
              rideOffer.type === "sequential" ? "Sequential" : "Broadcast"
            } ride offer received. Fare: $${rideOffer.tripOffer.fare.toFixed(
              2
            )}`,
            dateTime: formatDateTimestamp(rideOffer?.timestamp),
            messageType: "unread" as const,
            notificationType:
              NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER as NotificationType,
            rideOfferData: rideOffer,
          };
          await addNotification(notification);

          // Store ride offer data separately for easy retrieval
          setStorageItem(RIDE_OFFER_STORAGE_KEY, JSON.stringify(rideOffer));
          log("✅ Ride offer notification added to notification center");

          // Show the modal using global handlers
          showRideOfferModal(rideOffer);
        } catch (error) {
          log("❌ Error processing ride offer:", error);
          showToast("Failed to load ride offer", {
            variant: "error",
            position: "top",
          });
        }
      }
    );
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
  }, [
    driver?.online,
    socketStatus,
    onEvent,
    showRideOfferModal,
    addNotification,
  ]);

  // Component renders nothing - only provides side effects
  return null;
}
