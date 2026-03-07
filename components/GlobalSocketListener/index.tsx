import { useEffect, useMemo, useRef } from "react";
import { router } from "expo-router";

import {
  NOTIFICATION_TYPES,
  NotificationType,
  SOCKET_EVENTS,
  TRIP_OFFER_ACTIONS,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useSocket } from "@/hooks/useSocket";

import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { BID_STATUS_MODAL_CONTENT_KEYS } from "@/content/components/bid-status-modal-keys";
import { useAuth } from "@/context/AuthContext";
import { useBidAccepted } from "@/context/BidAcceptedContext";
import { useBidExpired } from "@/context/BidExpiredContext";
import { useBidUnsuccessful } from "@/context/BidUnsuccessfulContext";
import { useBidWaitingTimer } from "@/context/BidWaitingTimerContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { useDriver } from "@/context/DriverContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useNotification } from "@/context/NotificationContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useSettings } from "@/context/SettingsContext";
import { useGetContent } from "@/hooks/useGetContent";
import { useNetworkMonitoring } from "@/hooks/useNetworkMonitoring";
import { usePost } from "@/hooks/usePost";
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
  // Get speech message
  const { getContent } = useGetContent();
  const { speechNewRideOffer } = useMemo(() => {
    const get = getContent;
    return {
      speechNewRideOffer: get(
        BID_STATUS_MODAL_CONTENT_KEYS.SPEECH_NEW_RIDE_OFFER,
      ),
    };
  }, [getContent]);

  const log = logger();
  const [auth] = useAuth();
  const [settings] = useSettings();
  const { onEvent, onDisconnect, socketStatus, disconnectSocket } = useSocket({
    driverId: auth?.user?.id,
  });
  const { addNotification, setTripId } = useDriver();
  const [driver] = useDriver();
  const { closeAllModals } = useModalManager();
  const { showNotification: showVisualNotification } = useNotification();
  const { isNetworkSuitableFor, networkQuality } = useNetworkMonitoring();
  const {
    setHasAnyActiveOffer,
    showRideOfferModal,
    markSequentialOfferAsExpired,
    updateCurrentOfferStatus,
    hideRideOfferModal,
    saveTemporaryRide,
    removeTemporaryRide,
    removeTemporaryRidesByTripId,
    currentOffer,
  } = useRideOffer();
  const {
    addBroadcastOffer,
    removeBroadcastOffer,
    markBroadcastOfferAsExpired,
    updateBroadcastOffer,
    broadcastOffers,
  } = useBroadcastJobOffers();

  // IMPORTANT:
  // This component intentionally avoids including many values in the effect deps to prevent
  // re-registering socket listeners. To prevent stale closures, keep the latest values in refs.
  const currentOfferRef = useRef(currentOffer);
  useEffect(() => {
    currentOfferRef.current = currentOffer;
  }, [currentOffer]);

  const broadcastOffersRef = useRef(broadcastOffers);
  useEffect(() => {
    broadcastOffersRef.current = broadcastOffers;
  }, [broadcastOffers]);

  // Guard to deduplicate redirects to the active-ride screen
  const navigatingToActiveRideRef = useRef(false);

  // Bid context hooks
  const { showBidAccepted } = useBidAccepted();
  const { showBidUnsuccessful } = useBidUnsuccessful();
  const { hideBidWaitingTimer } = useBidWaitingTimer();
  const { showBidExpired } = useBidExpired();

  // API hooks
  const { execute: expireBid } = usePost(
    LIVE_JOB_ENDPOINTS.expireBid,
    API_CLIENT_TYPES.AUCTION,
  );

  useEffect(() => {
    if (!driver?.online) {
      log(
        `🔴 Driver not online OR Socket status is ${socketStatus}, skipping global listeners setup`,
      );
      log("Socket status:", socketStatus);
      return;
    }

    // Check if network is suitable for socket operations
    if (!isNetworkSuitableFor("socket")) {
      log(
        `🔴 Network quality (${networkQuality}) not suitable for socket operations, skipping global listeners setup`,
      );
      return;
    }

    log("🟢 Setting up global socket listeners...");
    const cleanupFunctions: (() => void)[] = [];

    // 1. Socket Disconnect Event (Critical Global Event)
    const disconnectCleanup = onDisconnect(async (reason: string) => {
      log("🔌 Socket disconnected:", reason);
      log("Socket disconnected:", reason);
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
                "❌ Driver context not available, cannot process sequential offer",
              );
              return;
            }

            // Use the helper function to format socket data to RideOffer format
            const rideOffer = formatSocketDataToRideOffer(data, auth?.user?.id);
            console.log("🔍 Ride offer:", JSON.stringify(rideOffer, null, 2));

            // Check mute settings before speaking
            if (
              !settings.notifications.muteJobOffers &&
              !settings.notifications.muteAll
            ) {
              await speechManager.speak(speechNewRideOffer);
            }

            // Add notification to notification center with pickup/dropoff for clarity
            const notification = {
              id: `ride-offer-${rideOffer.tripOffer.tripId}-${Date.now()}`,
              messageTitle: "Special Ride Offer",
              messageBody: `Sequential ride offer received. Fare: $${rideOffer?.tripOffer?.fare}`,
              dateTime: formatDateTimestamp(rideOffer?.timestamp),
              messageType: "unread" as const,
              notificationType:
                NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER as NotificationType,
              rideOfferData: { tripId: rideOffer.tripOffer.tripId },
              pickupAddress: rideOffer.pickupAddress,
              dropoffAddress: rideOffer.dropoffAddress,
              tripId: rideOffer.tripOffer.tripId,
              fare: rideOffer?.tripOffer?.fare,
              rideTime: rideOffer.rideTime,
              rideDistance: rideOffer.rideDistance,
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
                "❌ Driver context not available, cannot process broadcast offer",
              );
              return;
            }

            log("📡 Processing broadcast job offer:", data);

            // Use the helper function to format socket data to BroadcastJobOffer format
            const broadcastOffer = formatSocketDataToBroadcastOffer(
              data,
              auth?.user?.id,
            );

            // Add to broadcast offers context
            addBroadcastOffer(broadcastOffer);
            log("✅ Broadcast job offer added to context:", broadcastOffer.id);

            // Show visual notification for broadcast offer
            showVisualNotification({
              type: NOTIFICATION_TYPES.INFO,
              title: "New Broadcast Job",
              subtitle: "Available Now",
              message: `You have a new broadcast job offer! with fare of $${broadcastOffer?.tripOffer?.fare}`,
            });

            // Add notification to notification center with pickup/dropoff for clarity
            const notification = {
              id: `broadcast-offer-${
                broadcastOffer.tripOffer.tripId
              }-${Date.now()}`,
              messageTitle: "New Broadcast Job",
              messageBody: `Broadcast job offer available. Fare: $${broadcastOffer?.tripOffer?.fare}`,
              dateTime: formatDateTimestamp(broadcastOffer.timestamp),
              messageType: "unread" as const,
              notificationType: NOTIFICATION_TYPES.INFO as NotificationType,
              pickupAddress: broadcastOffer.pickupAddress,
              dropoffAddress: broadcastOffer.dropoffAddress,
              tripId: broadcastOffer.tripOffer.tripId,
              fare: broadcastOffer.tripOffer.fare,
              rideTime: broadcastOffer.rideTime,
              rideDistance: broadcastOffer.rideDistance,
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
      },
    );
    cleanupFunctions.push(newJobOfferCleanup);

    // 2. Accepted Response Event for non-bidable offers
    const acceptedResponseCleanup = onEvent(
      SOCKET_EVENTS.ACCEPTED_RESPONSE,
      async (data: any) => {
        log("💬 Global Accepted response received:", data);

        try {
          const { feedback, timestamp, timeout, tripId } = data;

          if (feedback?.success) {
            // Store tripId if provided
            if (tripId) {
              try {
                await setTripId(tripId);
                log("✅ Stored tripId from accept-response:", tripId);
              } catch (e) {
                log("❌ Failed to store tripId from accept-response:", e);
              }
            }
            // Close all modals first
            hideRideOfferModal();
            closeAllModals();
            log("✅ Ride offer accepted - closing modals");

            // Set hasAnyActiveOffer to false on successful acceptance
            setHasAnyActiveOffer(false);

            // Centralized, deduplicated redirect to active-ride screen.
            // This ensures the driver is taken to the active ride even if local
            // ETA submit flows race or their navigation is interrupted.
            if (!navigatingToActiveRideRef.current) {
              navigatingToActiveRideRef.current = true;
              setTimeout(() => {
                try {
                  log(
                    "🚀 Navigating to active-ride from ACCEPTED_RESPONSE socket event",
                  );
                  router.replace("/(screens)/active-ride");
                } catch (navError) {
                  log(
                    "❌ Failed to navigate to active-ride from ACCEPTED_RESPONSE:",
                    navError,
                  );
                } finally {
                  navigatingToActiveRideRef.current = false;
                }
              }, 1500);
            }
          } else {
            // Close all modals first, then show bid unsuccessful modal
            closeAllModals();
            // Try to get tripId from current offer or data
            const tripIdForReject =
              tripId || currentOfferRef.current?.tripOffer?.tripId;
            showBidUnsuccessful(tripIdForReject);
            log("❌ Ride offer rejected - showing unsuccessful sheet");

            // Set hasAnyActiveOffer to false on rejection
            setHasAnyActiveOffer(false);
          }

          // Add notification with trip details when available (from current offer or tripId)
          const currentOffer = currentOfferRef.current;
          const offerMatchesTrip =
            tripId &&
            currentOffer &&
            String(currentOffer.tripOffer.tripId) === String(tripId);
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
            ...(tripId && { tripId: String(tripId) }),
            ...(offerMatchesTrip && {
              pickupAddress: currentOffer.pickupAddress,
              dropoffAddress: currentOffer.dropoffAddress,
              fare: currentOffer.tripOffer.fare,
            }),
          };
          await addNotification(notification);
        } catch (error) {
          log("❌ Error processing accepted response:", error);
          showToast("Failed to load accepted response", {
            variant: "error",
            position: "top",
          });
        }
      },
    );
    cleanupFunctions.push(acceptedResponseCleanup);

    // 3. Bid Response Event for bidable offers
    const bidResponseCleanup = onEvent(
      SOCKET_EVENTS.BID_RESPONSE,
      async (data: any) => {
        console.log(
          "💬 Global Bid response received:",
          JSON.stringify(data, null, 2),
        );

        try {
          const { response, tripId, timestamp, timeout, offerType } = data;

          // Hide waiting timer first
          hideBidWaitingTimer();

          // Check if this is a broadcast offer
          const isBroadcastOffer =
            offerType === TRIP_OFFER_TYPES.BROADCAST ||
            broadcastOffersRef.current.some(
              (o) => o.tripOffer.tripId === tripId,
            );

          const isBidExpired =
            response === TRIP_OFFER_ACTIONS.EXPIRE || response === "expired";

          if (response === TRIP_OFFER_ACTIONS.ACCEPT) {
            // Store tripId on successful bid accept
            if (tripId) {
              try {
                await setTripId(String(tripId));
                log("✅ Stored tripId from bid-response accept:", tripId);
              } catch (e) {
                log("❌ Failed to store tripId from bid-response:", e);
              }
            }

            // Close all modals first, then show bid accepted modal
            hideRideOfferModal();
            closeAllModals();
            // Small delay to ensure other modals close before showing bid accepted
            setTimeout(() => {
              showBidAccepted();
            }, 1000);
            log("✅ Bid accepted - showing accepted sheet");

            // Set hasAnyActiveOffer to false on bid acceptance
            setHasAnyActiveOffer(false);

            // Add success notification with trip details when available
            const broadcastOfferForTrip = tripId
              ? broadcastOffers.find(
                  (o) => String(o.tripOffer.tripId) === String(tripId),
                )
              : null;
            const notification = {
              id: `bid-accepted-${Date.now()}`,
              messageTitle: "Bid Accepted",
              messageBody:
                "Your bid has been accepted! Get ready to start the ride.",
              dateTime: formatDateTimestamp(timestamp),
              messageType: "unread" as const,
              notificationType: NOTIFICATION_TYPES.SUCCESS,
              ...(tripId && { tripId: String(tripId) }),
              ...(broadcastOfferForTrip && {
                pickupAddress: broadcastOfferForTrip.pickupAddress,
                dropoffAddress: broadcastOfferForTrip.dropoffAddress,
                fare: broadcastOfferForTrip.tripOffer.fare,
              }),
            };
            await addNotification(notification);
          } else if (response === TRIP_OFFER_ACTIONS.REJECT) {
            if (isBroadcastOffer) {
              // For broadcast offers, keep the offer bidable and show a different message
              log(
                `❌ Broadcast bid ${response} - keeping offer bidable for rebidding`,
              );

              // Set offer status to "rejected" so the UI shows "Re-bid" button
              if (tripId) {
                // Find the offer by tripId and update it using the offer's id
                const offerToUpdate = broadcastOffers.find(
                  (offer) => String(offer.tripOffer.tripId) === String(tripId),
                );
                if (offerToUpdate) {
                  updateBroadcastOffer(offerToUpdate.id, {
                    status: "rejected" as any,
                  });
                  log(
                    `[GlobalSocketListener] Set offer ${offerToUpdate.id} (tripId: ${tripId}) status to "rejected" after bid rejection`,
                  );
                } else {
                  log(
                    `[GlobalSocketListener] Could not find broadcast offer with tripId: ${tripId}`,
                  );
                }
              }

              // Hide waiting timer since bid was rejected
              hideBidWaitingTimer();

              // Don't close modals or change hasAnyActiveOffer for broadcast offers
              // The offer should remain available for rebidding
              showBidUnsuccessful(String(tripId));
              // Add notification with different message for broadcast offers
              const message =
                "Your bid was not accepted this time. You can rebid on this offer until it expires.";

              const notification = {
                id: `bid-${response}-${Date.now()}`,
                messageTitle: "Bid Not Accepted",
                messageBody: message,
                dateTime: formatDateTimestamp(timestamp),
                messageType: "unread" as const,
                notificationType: NOTIFICATION_TYPES.WARNING,
              };
              await addNotification(notification);
            } else {
              // For sequential offers, keep modal open and allow rebidding
              log(
                `❌ Sequential bid ${response} - keeping modal open for rebidding`,
              );

              // Update current offer status to "rejected" so the UI shows "Re-bid" button
              updateCurrentOfferStatus("rejected", String(tripId));
              log(
                `[GlobalSocketListener] Updated sequential offer status to "rejected" for trip ${tripId}`,
              );

              // Hide waiting timer since bid was rejected
              hideBidWaitingTimer();

              // NEW: Show unsuccessful modal for sequential offers
              showBidUnsuccessful(String(tripId));

              // Keep modal open - don't close it or set hasAnyActiveOffer to false
              // This allows driver to rebid immediately

              // Show toast notification
              showToast(
                "Your bid was not accepted. You can rebid if you're still interested.",
                {
                  variant: "warning",
                  position: "top",
                },
              );

              // Add notification
              const message =
                "Your bid was not accepted. You can rebid if you're still interested.";

              const notification = {
                id: `bid-${response}-${Date.now()}`,
                messageTitle: "Bid Not Accepted",
                messageBody: message,
                dateTime: formatDateTimestamp(timestamp),
                messageType: "unread" as const,
                notificationType: NOTIFICATION_TYPES.WARNING,
              };
              await addNotification(notification);
            }
          } else if (isBidExpired) {
            if (isBroadcastOffer) {
              // For broadcast offers, keep the offer and allow re-bidding
              log(`❌ Broadcast bid ${response} - keeping offer for rebidding`);

              // Call API to mark bid as expired in database
              const driverId = auth?.driverId;
              if (tripId && driverId) {
                try {
                  await expireBid({
                    driverId,
                    tripId: String(tripId),
                  });
                  log(
                    `[GlobalSocketListener] Called expire bid API for trip ${tripId}`,
                  );
                } catch (error) {
                  log(
                    `[GlobalSocketListener] Failed to expire bid for trip ${tripId}:`,
                    error,
                  );
                  // Continue with local state update even if API call fails
                }
              }

              // Update status to "expired" so the UI shows "Re-bid"
              if (tripId) {
                // Find the offer by tripId and update it using the offer's id
                const offerToUpdate = broadcastOffers.find(
                  (offer) => String(offer.tripOffer.tripId) === String(tripId),
                );
                if (offerToUpdate) {
                  updateBroadcastOffer(offerToUpdate.id, {
                    status: "expired" as any,
                  });
                  log(
                    `[GlobalSocketListener] Set offer ${offerToUpdate.id} (tripId: ${tripId}) status to "expired" after bid expiration`,
                  );
                } else {
                  log(
                    `[GlobalSocketListener] Could not find broadcast offer with tripId: ${tripId}`,
                  );
                }
              }

              // Hide waiting timer since bid expired
              hideBidWaitingTimer();

              // Add notification
              const message =
                "Your bid has expired. You can rebid if you're still interested.";

              const notification = {
                id: `bid-${response}-${Date.now()}`,
                messageTitle: "Bid Expired",
                messageBody: message,
                dateTime: formatDateTimestamp(timestamp),
                messageType: "unread" as const,
                notificationType: NOTIFICATION_TYPES.WARNING,
              };
              await addNotification(notification);
            } else {
              // For sequential offers, keep modal open and allow rebidding
              log(
                `❌ Sequential bid ${response} - keeping modal open for rebidding`,
              );

              // Update current offer status to "expired" so the UI shows "Re-bid" button
              updateCurrentOfferStatus("expired", String(tripId));
              log(
                `[GlobalSocketListener] Updated sequential offer status to "expired" for trip ${tripId}`,
              );

              // Hide waiting timer since bid expired
              hideBidWaitingTimer();

              // NEW: Show expired modal for sequential offers
              showBidExpired(String(tripId));

              // Keep modal open - don't close it or set hasAnyActiveOffer to false
              // This allows driver to rebid immediately

              // Show toast notification
              showToast(
                "Your bid has expired. You can rebid if you're still interested.",
                {
                  variant: "warning",
                  position: "top",
                },
              );

              // Add notification
              const message =
                "Your bid has expired. You can rebid if you're still interested.";

              const notification = {
                id: `bid-${response}-${Date.now()}`,
                messageTitle: "Bid Expired",
                messageBody: message,
                dateTime: formatDateTimestamp(timestamp),
                messageType: "unread" as const,
                notificationType: NOTIFICATION_TYPES.WARNING,
              };
              await addNotification(notification);
            }
          }
        } catch (error) {
          log("❌ Error processing bid response:", error);
          showToast("Failed to load bid response", {
            variant: "error",
            position: "top",
          });
        }
      },
    );
    cleanupFunctions.push(bidResponseCleanup);

    // 3. Expired Offer Event - Server-driven expiration
    const expiredOfferCleanup = onEvent(
      SOCKET_EVENTS.EXPIRED_OFFER,
      async (data: any) => {
        log("💬 Global Expired offer received:", data);
        try {
          // Use the ExpirationService to handle the expiration with context data
          await expirationService.handleOfferExpiration(data, {
            markSequentialOfferAsExpired,
            markBroadcastOfferAsExpired,
            hideRideOfferModal,
            setHasAnyActiveOffer,
            closeAllModals,
            // Pass context data for offer discovery
            currentOffer: currentOfferRef.current,
            broadcastOffers: broadcastOffersRef.current,
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
      },
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
