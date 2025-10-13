import { useEffect } from "react";

import {
  NOTIFICATION_TYPES,
  NotificationType,
  SOCKET_EVENTS,
  SPEECH_MESSAGES,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useSocket } from "@/hooks/useSocket";

import { useAuth } from "@/context/AuthContext";
import { useBidAccepted } from "@/context/BidAcceptedContext";
import { useBidUnsuccessful } from "@/context/BidUnsuccessfulContext";
import { useBidWaitingTimer } from "@/context/BidWaitingTimerContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { useDriver } from "@/context/DriverContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useNotification } from "@/context/NotificationContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useNetworkMonitoring } from "@/hooks/useNetworkMonitoring";
import { expirationService } from "@/services/ExpirationService";
import { formatDateTimestamp, logger } from "@/utils/helpers";
import {
  formatSocketDataToBroadcastOffer,
  formatSocketDataToRideOffer,
} from "@/utils/socketDataFormatter";
import { speechManager } from "@/utils/speechManager";
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
  const { closeAllModals } = useModalManager();
  const { showNotification: showVisualNotification } = useNotification();
  const { isNetworkSuitableFor, networkQuality } = useNetworkMonitoring();
  const {
    setHasAnyActiveOffer,
    showRideOfferModal,
    markSequentialOfferAsExpired,
    hideRideOfferModal,
    saveTemporaryRide,
    removeTemporaryRide,
    removeTemporaryRidesByTripId,
  } = useRideOffer();
  const { addBroadcastOffer, markBroadcastOfferAsExpired } =
    useBroadcastJobOffers();

  // Bid context hooks
  const { showBidAccepted } = useBidAccepted();
  const { showBidUnsuccessful } = useBidUnsuccessful();
  const { hideBidWaitingTimer } = useBidWaitingTimer();

  useEffect(() => {
    if (!driver?.online) {
      log(
        `🔴 Driver not online OR Socket status is ${socketStatus}, skipping global listeners setup`
      );
      log("Socket status:", socketStatus);
      return;
    }

    // Check if network is suitable for socket operations
    if (!isNetworkSuitableFor("socket")) {
      log(
        `🔴 Network quality (${networkQuality}) not suitable for socket operations, skipping global listeners setup`
      );
      return;
    }

    log("🟢 Setting up global socket listeners...");
    const cleanupFunctions: (() => void)[] = [];

    // 1. Socket Disconnect Event (Critical Global Event)
    const disconnectCleanup = onDisconnect(async (reason: string) => {
      log("🔌 Socket disconnected:", reason);
      log("Socket disconnected:", reason);
      showToast("Connection lost - You may miss new ride offers", {
        variant: "warning",
        position: "top",
      });
    });
    cleanupFunctions.push(disconnectCleanup);

    // 1.1. Socket Reconnect Event (Connection Restored)
    const reconnectCleanup = onEvent("reconnect", async () => {
      log("🔄 Socket reconnected");
      showToast("Connection restored - You'll receive new ride offers", {
        variant: "success",
        position: "top",
      });
    });
    cleanupFunctions.push(reconnectCleanup);

    // 2. New Job Offer Event (Global Modal + Notification)
    const newJobOfferCleanup = onEvent(
      SOCKET_EVENTS.NEW_OFFER,
      async (data: any) => {
        log("💬 Global new job offer received:", data);

        // Handle Sequential offers (show modal)
        if (data?.tripOffer?.type === TRIP_OFFER_TYPES.SEQUENTIAL) {
          try {
            // Check if driver context is still available
            if (!driver) {
              log(
                "❌ Driver context not available, cannot process sequential offer"
              );
              return;
            }

            // Use the helper function to format socket data to RideOffer format
            const rideOffer = formatSocketDataToRideOffer(data, auth?.user?.id);
            await speechManager.speak(SPEECH_MESSAGES.NEW_RIDE_OFFER);
            // Add notification to notification center
            const notification = {
              id: `ride-offer-${rideOffer.tripOffer.tripId}-${Date.now()}`,
              messageTitle: "Special Ride Offer",
              messageBody: `Sequential ride offer received. Fare: $${rideOffer.tripOffer.fare.toFixed(
                2
              )}`,
              dateTime: formatDateTimestamp(rideOffer?.timestamp),
              messageType: "unread" as const,
              notificationType:
                NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER as NotificationType,
            };
            await addNotification(notification);

            // Save temporary ride for this notification
            saveTemporaryRide(notification.id, rideOffer);
            log("✅ Ride offer notification added to notification center");

            // Set hasAnyActiveOffer to true when new offer is received
            // log("🔄 Calling setHasAnyActiveOffer(true) for new job offer");
            await setHasAnyActiveOffer(true);
            // log("✅ Set hasAnyActiveOffer to true for new job offer");
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

        // Handle Broadcast offers (add to context array)
        if (data?.tripOffer?.type === TRIP_OFFER_TYPES.BROADCAST) {
          try {
            // Check if driver context is still available
            if (!driver) {
              log(
                "❌ Driver context not available, cannot process broadcast offer"
              );
              return;
            }

            log("📡 Processing broadcast job offer:", data);

            // Use the helper function to format socket data to BroadcastJobOffer format
            const broadcastOffer = formatSocketDataToBroadcastOffer(
              data,
              auth?.user?.id
            );

            // Add to broadcast offers context
            addBroadcastOffer(broadcastOffer);
            log("✅ Broadcast job offer added to context:", broadcastOffer.id);

            // Show visual notification for broadcast offer
            showVisualNotification({
              type: NOTIFICATION_TYPES.INFO,
              title: "New Broadcast Job",
              subtitle: "Available Now",
              message: `You have a new broadcast job offer! with fare of $${broadcastOffer.tripOffer.fare.toFixed(
                2
              )}`,
            });

            // Add notification to notification center
            const notification = {
              id: `broadcast-offer-${
                broadcastOffer.tripOffer.tripId
              }-${Date.now()}`,
              messageTitle: "New Broadcast Job",
              messageBody: `Broadcast job offer available. Fare: $${broadcastOffer.tripOffer.fare.toFixed(
                2
              )}`,
              dateTime: formatDateTimestamp(broadcastOffer.timestamp),
              messageType: "unread" as const,
              notificationType: NOTIFICATION_TYPES.INFO as NotificationType,
            };
            await addNotification(notification);
            log("✅ Broadcast offer notification added to notification center");
          } catch (error) {
            log("❌ Error processing broadcast offer:", error);
            showToast("Failed to load broadcast offer", {
              variant: "error",
              position: "top",
            });
          }
        }
      }
    );
    cleanupFunctions.push(newJobOfferCleanup);

    // 2. Accepted Response Event for non-bidable offers
    const acceptedResponseCleanup = onEvent(
      SOCKET_EVENTS.ACCEPTED_RESPONSE,
      async (data: any) => {
        log("💬 Global Accepted response received:", data);

        try {
          const { feedback, timestamp, timeout } = data;

          if (feedback?.success) {
            // Show bid accepted bottom sheet
            showBidAccepted();
            log("✅ Ride offer accepted - showing accepted sheet");

            // Set hasAnyActiveOffer to false on successful acceptance
            setHasAnyActiveOffer(false);
          } else {
            // Show bid unsuccessful bottom sheet
            showBidUnsuccessful();
            log("❌ Ride offer rejected - showing unsuccessful sheet");

            // Set hasAnyActiveOffer to false on rejection
            setHasAnyActiveOffer(false);
          }

          // Add notification to notification center
          const notification = {
            id: `accepted-response-${Date.now()}`,
            messageTitle: feedback?.success ? "Ride Accepted" : "Ride Rejected",
            messageBody:
              feedback?.message ||
              (feedback?.success
                ? "Your ride offer has been accepted. Get ready to start the ride."
                : "Your ride offer was not accepted. Keep looking for other opportunities."),
            dateTime: formatDateTimestamp(timestamp),
            messageType: "unread" as const,
            notificationType: feedback?.success
              ? NOTIFICATION_TYPES.SUCCESS
              : NOTIFICATION_TYPES.ERROR,
          };
          await addNotification(notification);
        } catch (error) {
          log("❌ Error processing accepted response:", error);
          showToast("Failed to load accepted response", {
            variant: "error",
            position: "top",
          });
        }
      }
    );
    cleanupFunctions.push(acceptedResponseCleanup);

    // 3. Bid Response Event for bidable offers
    const bidResponseCleanup = onEvent(
      SOCKET_EVENTS.BID_RESPONSE,
      async (data: any) => {
        log("💬 Global Bid response received:", data);

        try {
          const { response, tripId, timestamp, timeout } = data;

          // Hide waiting timer first
          hideBidWaitingTimer();

          if (response === "accept") {
            // Show bid accepted bottom sheet
            showBidAccepted();
            log("✅ Bid accepted - showing accepted sheet");

            // Set hasAnyActiveOffer to false on bid acceptance
            setHasAnyActiveOffer(false);

            // Add success notification
            const notification = {
              id: `bid-accepted-${Date.now()}`,
              messageTitle: "Bid Accepted",
              messageBody:
                "Your bid has been accepted! Get ready to start the ride.",
              dateTime: formatDateTimestamp(timestamp),
              messageType: "unread" as const,
              notificationType: NOTIFICATION_TYPES.SUCCESS,
            };
            await addNotification(notification);
          } else if (response === "reject" || response === "expired") {
            // Show BidUnsuccessful modal instead of toast
            showBidUnsuccessful();
            log(`❌ Bid ${response} - showing BidUnsuccessful modal`);

            // Set hasAnyActiveOffer to false on bid rejection/expiry
            setHasAnyActiveOffer(false);

            // Add notification
            const message =
              response === "reject"
                ? "Your bid was not accepted. Keep looking for other opportunities."
                : "Your bid has expired. Keep looking for other opportunities.";

            const notification = {
              id: `bid-${response}-${Date.now()}`,
              messageTitle:
                response === "reject" ? "Bid Rejected" : "Bid Expired",
              messageBody: message,
              dateTime: formatDateTimestamp(timestamp),
              messageType: "unread" as const,
              notificationType:
                response === "reject"
                  ? NOTIFICATION_TYPES.ERROR
                  : NOTIFICATION_TYPES.WARNING,
            };
            await addNotification(notification);
          }
        } catch (error) {
          log("❌ Error processing bid response:", error);
          showToast("Failed to load bid response", {
            variant: "error",
            position: "top",
          });
        }
      }
    );
    cleanupFunctions.push(bidResponseCleanup);

    // 3. Expired Offer Event - Server-driven expiration
    const expiredOfferCleanup = onEvent(
      SOCKET_EVENTS.EXPIRED_OFFER,
      async (data: any) => {
        log("💬 Global Expired offer received:", data);
        const modifiedData = {
          ...data,
          offerType: data?.offerType || TRIP_OFFER_TYPES.BROADCAST,
        };
        try {
          // Use the ExpirationService to handle the expiration
          await expirationService.handleOfferExpiration(modifiedData, {
            markSequentialOfferAsExpired,
            markBroadcastOfferAsExpired,
            hideRideOfferModal,
            setHasAnyActiveOffer,
            closeAllModals,
          });

          // NEW: Remove temporary rides for expired offers
          if (data.tripId) {
            removeTemporaryRidesByTripId(data.tripId);
            log("✅ Removed temporary rides for expired tripId:", data.tripId);
          }
        } catch (error) {
          log("❌ Error processing expired offer:", error);
          showToast("Failed to process expired offer", {
            variant: "error",
            position: "top",
          });
        }
      }
    );
    cleanupFunctions.push(expiredOfferCleanup);

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
    networkQuality,
    isNetworkSuitableFor,
    onEvent,
    // Note: Intentionally not including function dependencies (showRideOfferModal, addNotification, etc.)
    // to prevent constant re-setup of listeners. The functions are accessed via closure and will
    // always use the latest versions without causing listener re-initialization.
  ]);

  // Component renders nothing - only provides side effects
  return null;
}
