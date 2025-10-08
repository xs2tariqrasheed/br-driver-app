import { useEffect } from "react";

import {
  NOTIFICATION_TYPES,
  NotificationType,
  RIDE_OFFER_STORAGE_KEY,
  SOCKET_EVENTS,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useSocket } from "@/hooks/useSocket";

import { useAuth } from "@/context/AuthContext";
import { useBidAccepted } from "@/context/BidAcceptedContext";
import { useBidUnsuccessful } from "@/context/BidUnsuccessfulContext";
import { useBidWaitingTimer } from "@/context/BidWaitingTimerContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
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
  const { setHasAnyActiveOffer, showRideOfferModal } = useRideOffer();
  const { addBroadcastOffer } = useBroadcastJobOffers();

  // Bid context hooks
  const { showBidAccepted } = useBidAccepted();
  const { showBidUnsuccessful } = useBidUnsuccessful();
  const { hideBidWaitingTimer } = useBidWaitingTimer();

  useEffect(() => {
    // if (!driver) {
    //   log("🔴 Driver context not ready, skipping global listeners setup");
    //   return;
    // }

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
            // Transform socket data to RideOffer format using real server data
            const rideOffer = {
              // Basic ride offer info
              id: data.tripOffer?.tripId || data.tripId || `ride-${Date.now()}`,
              type: data.type || (TRIP_OFFER_TYPES.SEQUENTIAL as any),
              status: "offered" as const,
              bidable: data.tripOffer?.biddable || false,

              // Trip offer details
              tripOffer: {
                tripId:
                  data.tripOffer?.tripId || data.tripId || String(Date.now()),
                pickupLocation: {
                  lat: data.tripOffer?.pickupLocation?.lat || 37.7749,
                  lng: data.tripOffer?.pickupLocation?.lng || -122.4194,
                },
                dropoffLocation: {
                  lat: data.tripOffer?.dropoffLocation?.lat || 37.7849,
                  lng: data.tripOffer?.dropoffLocation?.lng || -122.4094,
                },
                fare: parseFloat(data.tripOffer?.fare) || 0,
              },

              // LiveRideOfferItem required fields from rideDetails
              rideType:
                data.tripOffer?.rideDetails?.rideType || ("one-way" as const),
              peopleCount: data.tripOffer?.rideDetails?.peopleCount || 2,
              rating: data.tripOffer?.rideDetails?.rating || 4.5,
              hasSpecialRequirements:
                data.tripOffer?.rideDetails?.hasSpecialRequirements || false,
              hasPackage: data.tripOffer?.rideDetails?.hasPackage || false,
              specialRequirements: data.tripOffer?.specialRequirements || {},
              packageInfo: data.tripOffer?.packageInfo || {},
              // Pickup details from rideDetails
              pickupTime: data.tripOffer?.rideDetails?.pickupTime || 5,
              pickupDistance:
                data.tripOffer?.rideDetails?.pickupDistance || 0.8,
              pickupAddress: data.tripOffer?.rideDetails?.pickupAddress || "",

              // Dropoff details from rideDetails
              dropoffTime: data.tripOffer?.rideDetails?.dropoffTime || 15,
              dropoffDistance:
                data.tripOffer?.rideDetails?.dropoffDistance || 3.2,
              dropoffAddress: data.tripOffer?.rideDetails?.dropoffAddress || "",

              // Ride details from rideDetails
              rideTime: data.tripOffer?.rideDetails?.rideTime || 20,
              rideDistance: data.tripOffer?.rideDetails?.rideDistance || 4,
              totalPrice: data.tripOffer?.rideDetails?.totalPrice || 0,
              driverEarn: data.tripOffer?.rideDetails?.driverEarn || 0,

              // Button details
              buttonTitle: data.tripOffer?.biddable ? "Bid" : "Accept",

              // Timestamps
              timestamp: data.timestamp || new Date().toISOString(),
              timeout: data.timeout || 30000, // Default 30 seconds
            };

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
              rideOfferData: rideOffer,
            };
            await addNotification(notification);

            // Store ride offer data separately for easy retrieval
            setStorageItem(RIDE_OFFER_STORAGE_KEY, JSON.stringify(rideOffer));
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

            // Transform socket data to BroadcastJobOffer format using real server data
            const broadcastOffer = {
              // Basic job offer info
              id:
                data.tripOffer?.tripId ||
                data.tripId ||
                `broadcast-${Date.now()}`,
              type: data.type || (TRIP_OFFER_TYPES.BROADCAST as any),
              status: "offered" as const,
              bidable: data.tripOffer?.biddable || false,

              // Trip offer details
              tripOffer: {
                tripId:
                  data.tripOffer?.tripId || data.tripId || String(Date.now()),
                pickupLocation: {
                  lat: data.tripOffer?.pickupLocation?.lat || 37.7749,
                  lng: data.tripOffer?.pickupLocation?.lng || -122.4194,
                },
                dropoffLocation: {
                  lat: data.tripOffer?.dropoffLocation?.lat || 37.7849,
                  lng: data.tripOffer?.dropoffLocation?.lng || -122.4094,
                },
                fare: parseFloat(data.tripOffer?.fare) || 0,
              },

              // LiveRideOfferItem required fields from rideDetails
              rideType:
                data.tripOffer?.rideDetails?.rideType || ("one-way" as const),
              peopleCount: data.tripOffer?.rideDetails?.peopleCount || 2,
              rating: data.tripOffer?.rideDetails?.rating || 4.5,
              hasSpecialRequirements:
                data.tripOffer?.rideDetails?.hasSpecialRequirements || false,
              hasPackage: data.tripOffer?.rideDetails?.hasPackage || false,
              specialRequirements: data.tripOffer?.specialRequirements || {},
              packageInfo: data.tripOffer?.packageInfo || {},
              // Pickup details from rideDetails
              pickupTime: data.tripOffer?.rideDetails?.pickupTime || 5,
              pickupDistance:
                data.tripOffer?.rideDetails?.pickupDistance || 0.8,
              pickupAddress: data.tripOffer?.rideDetails?.pickupAddress || "",

              // Dropoff details from rideDetails
              dropoffTime: data.tripOffer?.rideDetails?.dropoffTime || 15,
              dropoffDistance:
                data.tripOffer?.rideDetails?.dropoffDistance || 3.2,
              dropoffAddress: data.tripOffer?.rideDetails?.dropoffAddress || "",

              // Ride details from rideDetails
              rideTime: data.tripOffer?.rideDetails?.rideTime || 20,
              rideDistance: data.tripOffer?.rideDetails?.rideDistance || 4,
              totalPrice: data.tripOffer?.rideDetails?.totalPrice || 0,
              driverEarn: data.tripOffer?.rideDetails?.driverEarn || 0,

              // Button details
              buttonTitle: data.tripOffer?.biddable ? "Bid" : "Accept",

              // Timestamps
              timestamp: data.timestamp || new Date().toISOString(),
              timeout: data.timeout || 300000, // 5 minutes default
            };

            // Add to broadcast offers context
            addBroadcastOffer(broadcastOffer);
            log("✅ Broadcast job offer added to context:", broadcastOffer.id);

            // Show toast notification for broadcast offer
            showToast(
              `New broadcast job available! Fare: $${broadcastOffer.tripOffer.fare.toFixed(
                2
              )}`,
              {
                variant: "success",
                position: "top",
              }
            );

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
              rideOfferData: broadcastOffer,
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
            // Show toast message and close waiting timer
            const message =
              response === "reject"
                ? "Your bid was not accepted. Keep looking for other opportunities."
                : "Your bid has expired. Keep looking for other opportunities.";

            showToast(message, {
              variant: response === "reject" ? "error" : "warning",
              position: "top",
            });

            log(`❌ Bid ${response} - showing toast message`);

            // Set hasAnyActiveOffer to false on bid rejection/expiry
            setHasAnyActiveOffer(false);

            // Add notification
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

    // 3. Bid Response Event for bidable offers
    const expiredOfferCleanup = onEvent(
      SOCKET_EVENTS.EXPIRED_OFFER,
      async (data: any) => {
        log("💬 Global Expired offer received:", data);

        try {
          const { tripId, timestamp } = data;

          showToast("Ride offer expired!", {
            variant: "warning",
            position: "top",
          });
        } catch (error) {
          log("❌ Error processing bid response:", error);
          showToast("Failed to load expired offer", {
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
    onEvent,
    // Note: Intentionally not including function dependencies (showRideOfferModal, addNotification, etc.)
    // to prevent constant re-setup of listeners. The functions are accessed via closure and will
    // always use the latest versions without causing listener re-initialization.
  ]);

  // Component renders nothing - only provides side effects
  return null;
}
