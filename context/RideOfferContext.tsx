import ETAModal from "@/components/ETAModal";
import { showToast } from "@/components/Toast";
import { ACTIVE_TRIP_ROUTES, LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  OFFER_TIMEOUT,
  RIDE_TYPES,
  TRIP_OFFER_ACTIONS,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { usePost } from "@/hooks/usePost";
import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface RideOffer {
  // Basic ride offer info
  id: string;
  type: (typeof TRIP_OFFER_TYPES)[keyof typeof TRIP_OFFER_TYPES];
  // Status meanings:
  // - offered: fresh offer (countdown active)
  // - bidding: driver has placed a bid and is waiting (countdown should NOT expire locally)
  // - expired: bid expired (offer still eligible for rebid if bidable)
  // - rejected: bid rejected (offer still eligible for rebid if bidable)
  // - offer-expired: offer itself expired (disable actions)
  status:
    | "offered"
    | "bidding"
    | "accepted"
    | "rejected"
    | "expired"
    | "offer-expired";

  // Trip offer details
  tripOffer: any;
  bidable: boolean;

  // LiveRideOfferItem required fields
  rideType: (typeof RIDE_TYPES)[keyof typeof RIDE_TYPES];
  peopleCount: number;
  rating: number;
  hasSpecialRequirements: boolean;
  hasPackage: boolean;

  // Pickup details
  pickupTime: number;
  pickupDistance: number;
  pickupAddress: string;

  // Dropoff details
  dropoffTime: number;
  dropoffDistance: number;
  dropoffAddress: string;

  // Ride details
  rideTime: number;
  rideDistance: number;
  totalPrice: number;
  driverEarn: number;

  // Button details
  buttonTitle: string;

  // Timestamps
  timestamp: string;
  timeout: number;

  // Expiration timestamp (ISO string or Date). Used for local expiry countdown.
  expiredAt?: string | Date | null;
}

interface ModalCallbacks {
  onAccept?: () => void | Promise<void>;
  onSkipPrice?: () => void | Promise<void>;
  onHide?: () => void | Promise<void>;
}

interface RideOfferContextType {
  // State
  isRideOfferModalVisible: boolean;
  currentOffer: RideOffer | null;
  modalCallbacks: ModalCallbacks | null;
  isSkipLoading: boolean;
  isHideLoading: boolean;
  isETABottomSheetVisible: boolean;
  hasAnyActiveOffer: boolean;
  isSubmitBidLoading: boolean;
  isSubmitETALoading: boolean;
  // Temporary ride state for notifications
  temporaryRides: { [notificationId: string]: RideOffer };
  // Actions
  showRideOfferModal: (offer: any, callbacks?: ModalCallbacks) => void;
  hideRideOfferModal: () => void;
  /** Close the sequential-offer ETA modal overlay without affecting the ride-offer modal. */
  hideETAModal: () => void;
  /**
   * LiveJobOffersScreen mounts its own ETAModal; subscribe so hideETAModal (socket/expiry)
   * dismisses that copy too. Returns unsubscribe.
   */
  subscribeToHideETA: (listener: () => void) => () => void;
  acceptRideOffer: () => Promise<void>;
  skipRideOfferPrice: () => Promise<void>;
  hideRideOffer: () => Promise<void>;
  submitETA: (eta: number) => Promise<void>;
  submitBid: (
    bidAmount: number,
    eta?: number | string,
    boostAmount?: number,
  ) => Promise<{ success: boolean } | undefined>;
  submitBidForBroadcastOffer: (
    tripId: string,
    bidAmount: number,
    eta?: number | string,
    boostAmount?: number,
  ) => Promise<{ success: boolean } | undefined>;
  markSequentialOfferAsExpired: (tripId: string) => void;
  updateCurrentOfferStatus: (
    status: "bidding" | "rejected" | "expired" | "offer-expired",
    tripId?: string,
  ) => void;
  setHasAnyActiveOffer: (hasActive: boolean) => Promise<void>;
  // Temporary ride methods
  saveTemporaryRide: (notificationId: string, rideOffer: RideOffer) => void;
  getTemporaryRide: (notificationId: string) => RideOffer | null;
  getTemporaryRideByTripId: (tripId: string) => RideOffer | null;
  removeTemporaryRide: (notificationId: string) => void;
  removeTemporaryRidesByTripId: (tripId: string) => void;
}

const RideOfferContext = createContext<RideOfferContextType | undefined>(
  undefined,
);

export function RideOfferProvider({ children }: { children: ReactNode }) {
  const [auth] = useAuth();
  const { closeAllModals } = useModalManager();

  const driverId = auth?.user?.id;

  // API hooks for driver responses
  const { execute: submitDriverResponse } = usePost(
    LIVE_JOB_ENDPOINTS.driverResponse,
    API_CLIENT_TYPES.AUCTION,
  );

  // API hook for updating ETA (non-blocking, used after trip acceptance)
  const { execute: updateETA } = usePost(
    ACTIVE_TRIP_ROUTES.UPDATE_ETA,
    API_CLIENT_TYPES.ACTIVE_TRIP,
  );

  const [isRideOfferModalVisible, setIsRideOfferModalVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [modalCallbacks, setModalCallbacks] = useState<ModalCallbacks | null>(
    null,
  );
  const [isETABottomSheetVisible, setIsETABottomSheetVisible] = useState(false);
  const [hasAnyActiveOffer, setHasAnyActiveOfferState] = useState(false);

  // Separate loading states for each button
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [isHideLoading, setIsHideLoading] = useState(false);
  const [isSubmitETALoading, setIsSubmitETALoading] = useState(false);
  const [isSubmitBidLoading, setIsSubmitBidLoading] = useState(false);

  // Temporary ride state for notifications
  const [temporaryRides, setTemporaryRides] = useState<{
    [notificationId: string]: RideOffer;
  }>({});

  // Local expiry timer for sequential offers
  const sequentialExpiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  /** Extra ETAModal instances (e.g. LiveJobOffersScreen) register here so hideETAModal clears them. */
  const hideETAListenersRef = useRef<Set<() => void>>(new Set());

  /**
   * Set hasAnyActiveOffer state
   */
  const setHasAnyActiveOffer = useCallback(async (hasActive: boolean) => {
    console.log(
      `[RideOfferContext] setHasAnyActiveOffer called with: ${hasActive}`,
    );
    setHasAnyActiveOfferState(hasActive);
  }, []);

  /**
   * Update current offer status (for bid rejection/expiration)
   * This allows the modal to stay open and show "Re-bid" button
   */
  const updateCurrentOfferStatus = useCallback(
    (
      status: "bidding" | "rejected" | "expired" | "offer-expired",
      tripId?: string,
    ) => {
      // IMPORTANT: do NOT rely on the captured `currentOffer` here.
      // Socket listeners may hold an older function reference; using functional updates
      // ensures we always update the latest state.
      const targetTripId = tripId;

      if (!targetTripId) {
        console.log(`⚠️ No tripId found to update status to: ${status}`);
        return;
      }

      console.log(
        `📱 Updating offer status for trip ${targetTripId} to: ${status}`,
      );

      // 1. Update currentOffer if it matches
      setCurrentOffer((prev) => {
        if (!prev) return prev;
        // Use loose equality or cast to string to handle potential type mismatches (string vs number)
        if (String(prev.tripOffer?.tripId) !== String(targetTripId))
          return prev;
        return {
          ...prev,
          status: status as
            | "bidding"
            | "rejected"
            | "expired"
            | "offer-expired",
        };
      });

      // 2. Also update temporaryRides so Notifications stay in sync
      setTemporaryRides((prev) => {
        const updated = { ...prev };
        let found = false;
        Object.keys(updated).forEach((key) => {
          if (String(updated[key].tripOffer.tripId) === String(targetTripId)) {
            updated[key] = { ...updated[key], status: status as any };
            found = true;
          }
        });
        if (found)
          console.log(`✅ Updated temporary ride status to: ${status}`);
        return updated;
      });

      console.log(
        `✅ Current offer and temporary rides status updated to: ${status}`,
      );
    },
    [],
  );

  /**
   * Remove temporary rides by tripId (for expiration handling)
   */
  const removeTemporaryRidesByTripId = useCallback((tripId: string) => {
    console.log(`🗑️ Removing temporary rides for tripId: ${tripId}`);
    setTemporaryRides((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(
          ([_, rideOffer]) =>
            String(rideOffer.tripOffer.tripId) !== String(tripId),
        ),
      );
      return filtered;
    });
  }, []);

  const subscribeToHideETA = useCallback((listener: () => void) => {
    hideETAListenersRef.current.add(listener);
    return () => {
      hideETAListenersRef.current.delete(listener);
    };
  }, []);

  /** Sequential "Provide ETA" overlay (RN Modal) — must clear whenever the ride-offer flow ends. */
  const hideETAModal = useCallback(() => {
    setIsETABottomSheetVisible(false);
    setIsSubmitETALoading(false);
    hideETAListenersRef.current.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn("[RideOfferContext] hideETA subscriber error:", e);
      }
    });
  }, []);

  /**
   * Hide the ride offer modal and reset state
   */
  const hideRideOfferModal = useCallback(() => {
    console.log("🔽 Hiding ride offer modal");
    hideETAModal();
    setIsRideOfferModalVisible(false);
    setCurrentOffer(null);
    setModalCallbacks(null);
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        // If no previous screen, navigate to home tabs
        router.replace("/(tabs)");
      }
    } catch {
      // Fallback to home if navigation fails
      try {
        router.replace("/(tabs)");
      } catch {}
    }
  }, [hideETAModal]);

  /**
   * Mark a sequential offer as expired by tripId
   * This method is called by the ExpirationService when server sends expiration event
   */
  const markSequentialOfferAsExpired = useCallback(
    (tripId: string) => {
      console.log(`⏰ Marking sequential offer as expired: ${tripId}`);

      // RN Modal (Provide ETA) is not in ModalManager — always dismiss explicitly.
      hideETAModal();

      // Close all modals and bottom sheets when offer expires
      closeAllModals();

      // Remove temporary rides for this expired tripId
      // This ensures notifications won't show expired offers
      removeTemporaryRidesByTripId(tripId);
      console.log(`🗑️ Removed temporary rides for expired tripId: ${tripId}`);

      // Check if the current offer matches the expired tripId
      if (currentOffer && currentOffer.tripOffer.tripId === tripId) {
        console.log(`📱 Current offer matches expired tripId, updating status`);

        // Offer expired (not bid expired)
        setCurrentOffer((prev) =>
          prev ? { ...prev, status: "offer-expired" as const } : null,
        );

        // Hide the modal and clear state
        hideRideOfferModal();

        // Set hasAnyActiveOffer to false
        setHasAnyActiveOffer(false);

        // Redirect to home screen
        router.replace("/(tabs)");

        console.log("✅ Sequential offer marked as expired successfully");
      } else {
        console.log(
          `📱 Current offer does not match expired tripId: ${tripId}`,
        );
        // Even if current offer doesn't match, set hasAnyActiveOffer to false
        // as the sequential offer has expired
        setHasAnyActiveOffer(false);
      }
    },
    [
      currentOffer,
      closeAllModals,
      removeTemporaryRidesByTripId,
      hideETAModal,
      hideRideOfferModal,
      setHasAnyActiveOffer,
    ],
  );

  /**
   * Show the ride offer modal with optional callbacks
   * @param offer - The ride offer to display
   * @param callbacks - Optional callbacks for accept, skip price, and hide actions
   */
  const showRideOfferModal = useCallback(
    (offer: any, callbacks?: ModalCallbacks) => {
      console.log("🔔 Showing ride offer modal:", offer);
      // Ensure we always have an expiration timestamp for local countdown logic.
      // Prefer existing expiredAt; otherwise compute from offer.timestamp + offer.timeout.
      const baseTs = offer?.timestamp
        ? new Date(offer.timestamp).getTime()
        : Date.now();
      const timeoutMs =
        typeof offer?.timeout === "number" ? offer.timeout : OFFER_TIMEOUT;
      const computedExpiredAt = new Date(baseTs + timeoutMs).toISOString();
      setCurrentOffer({
        ...offer,
        expiredAt: offer.expiredAt ?? computedExpiredAt,
      });
      setModalCallbacks(callbacks || null);
      setIsRideOfferModalVisible(false);
      try {
        router.push("/(screens)/ride-offer");
      } catch {}
    },
    [],
  );

  /**
   * Global handler for skipping ride offer price
   */
  const handleGlobalSkipPrice = useCallback(async () => {
    if (!currentOffer) return;

    try {
      console.log(
        "🌐 Global skip price for ride offer:",
        currentOffer.tripOffer.tripId,
      );

      // Submit driver response to API
      await submitDriverResponse({
        driverId: driverId,
        tripId: currentOffer.tripOffer.tripId,
        response: TRIP_OFFER_ACTIONS.SKIP,
      });

      console.log("✅ Global ride offer price skipped successfully");
      showToast("Ride offer price skipped successfully!", {
        variant: "success",
        position: "top",
      });
      // NEW: Remove temporary rides for expired offers
      if (currentOffer.tripOffer.tripId) {
        removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        console.log(
          "✅ Removed temporary rides for skipped tripId:",
          currentOffer.tripOffer.tripId,
        );
      }
      // Set hasAnyActiveOffer to false on successful skip
      await setHasAnyActiveOffer(false);

      // Redirect to home screen
      router.replace("/(tabs)");
      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global skip price:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to skip ride offer price. Please try again.";
      showToast(errorMessage, { variant: "error", position: "top" });
      if (errorMessage?.toLowerCase().includes("expired")) {
        try {
          removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        } catch {}
        try {
          updateCurrentOfferStatus(
            "offer-expired",
            currentOffer.tripOffer.tripId,
          );
        } catch {}
        try {
          hideRideOfferModal();
        } catch {}
        try {
          await setHasAnyActiveOffer(false);
        } catch {}
      }
    }
  }, [
    currentOffer,
    driverId,
    submitDriverResponse,
    removeTemporaryRidesByTripId,
    setHasAnyActiveOffer,
    updateCurrentOfferStatus,
    hideRideOfferModal,
  ]);

  /**
   * Global handler for hiding ride offer
   */
  const handleGlobalHideOffer = useCallback(async () => {
    if (!currentOffer) return;

    try {
      console.log("🌐 Global hide ride offer:", currentOffer.tripOffer.tripId);

      // Submit driver response to API
      await submitDriverResponse({
        driverId: driverId,
        tripId: currentOffer.tripOffer.tripId,
        response: TRIP_OFFER_ACTIONS.HIDE,
      });

      console.log("✅ Global ride offer hidden successfully");
      showToast("Ride offer hidden successfully!", {
        variant: "success",
        position: "top",
      });
      // NEW: Remove temporary rides for expired offers
      if (currentOffer.tripOffer.tripId) {
        removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        console.log(
          "✅ Removed temporary rides for hidden tripId:",
          currentOffer.tripOffer.tripId,
        );
      }

      // Set hasAnyActiveOffer to false on successful hide
      await setHasAnyActiveOffer(false);

      // Redirect to home screen
      router.replace("/(tabs)");

      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global hide:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to hide ride offer. Please try again.";
      showToast(errorMessage, { variant: "error", position: "top" });
      if (errorMessage?.toLowerCase().includes("expired")) {
        try {
          removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        } catch {}
        try {
          updateCurrentOfferStatus(
            "offer-expired",
            currentOffer.tripOffer.tripId,
          );
        } catch {}
        try {
          hideRideOfferModal();
        } catch {}
        try {
          await setHasAnyActiveOffer(false);
        } catch {}
      }
    }
  }, [
    currentOffer,
    driverId,
    submitDriverResponse,
    removeTemporaryRidesByTripId,
    setHasAnyActiveOffer,
    updateCurrentOfferStatus,
    hideRideOfferModal,
  ]);

  /**
   * Accept the current ride offer
   * Shows ETA bottom sheet instead of calling API directly
   */
  const acceptRideOffer = useCallback(async () => {
    if (!currentOffer) return;

    console.log("✅ Accepting ride offer:", currentOffer.tripOffer.tripId);

    // If callbacks are provided, use them
    if (modalCallbacks?.onAccept) {
      try {
        await modalCallbacks.onAccept();
        // Hide modal after successful acceptance
        hideRideOfferModal();
      } catch (error) {
        console.error("❌ Error in accept callback:", error);
        // Don't hide modal on error - let the callback handle error display
      }
    } else {
      // No callbacks provided - show ETA modal as overlay (don't close ride offer modal)
      setIsETABottomSheetVisible(true);
    }
  }, [currentOffer, modalCallbacks, hideRideOfferModal]);

  /**
   * Skip the price for the current ride offer
   * Calls the provided callback if available, otherwise handles globally
   */
  const skipRideOfferPrice = useCallback(async () => {
    if (!currentOffer) return;

    console.log(
      "⏭️ Skipping price for ride offer:",
      currentOffer.tripOffer.tripId,
    );

    try {
      setIsSkipLoading(true);

      // If callbacks are provided, use them
      if (modalCallbacks?.onSkipPrice) {
        await modalCallbacks.onSkipPrice();
        // Hide modal after successful skip
        hideRideOfferModal();
      } else {
        // No callbacks provided - handle globally
        await handleGlobalSkipPrice();
      }
    } catch (error) {
      console.error("❌ Error in skip price callback:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg?.toLowerCase().includes("expired")) {
        try {
          removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        } catch {}
        try {
          updateCurrentOfferStatus(
            "offer-expired",
            currentOffer.tripOffer.tripId,
          );
        } catch {}
        // Close modal and reset active offer state on expired trips
        try {
          hideRideOfferModal();
        } catch {}
        try {
          await setHasAnyActiveOffer(false);
        } catch {}
      }
      // Otherwise let the UI show error
    } finally {
      setIsSkipLoading(false);
    }
  }, [
    currentOffer,
    modalCallbacks,
    hideRideOfferModal,
    handleGlobalSkipPrice,
    removeTemporaryRidesByTripId,
    updateCurrentOfferStatus,
    setHasAnyActiveOffer,
  ]);

  /**
   * Hide the current ride offer
   * Calls the provided callback if available, otherwise handles globally
   */
  const hideRideOffer = useCallback(async () => {
    if (!currentOffer) return;

    console.log("👁️ Hiding ride offer:", currentOffer.tripOffer.tripId);

    try {
      setIsHideLoading(true);

      // If callbacks are provided, use them
      if (modalCallbacks?.onHide) {
        await modalCallbacks.onHide();
        // Hide modal after successful hide
        hideRideOfferModal();
      } else {
        // No callbacks provided - handle globally
        await handleGlobalHideOffer();
      }
    } catch (error) {
      console.error("❌ Error in hide callback:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg?.toLowerCase().includes("expired")) {
        try {
          removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        } catch {}
        try {
          updateCurrentOfferStatus(
            "offer-expired",
            currentOffer.tripOffer.tripId,
          );
        } catch {}
        // Close modal and reset active offer state on expired trips
        try {
          hideRideOfferModal();
        } catch {}
        try {
          await setHasAnyActiveOffer(false);
        } catch {}
      }
      // Otherwise let the UI show error
    } finally {
      setIsHideLoading(false);
    }
  }, [
    currentOffer,
    modalCallbacks,
    hideRideOfferModal,
    handleGlobalHideOffer,
    removeTemporaryRidesByTripId,
    updateCurrentOfferStatus,
    setHasAnyActiveOffer,
  ]);

  /**
   * Submit ETA and accept the ride offer
   */
  const submitETA = useCallback(
    async (eta: number) => {
      if (!currentOffer) return;

      try {
        setIsSubmitETALoading(true);

        console.log(
          "🌐 Submitting ETA for ride offer:",
          currentOffer.tripOffer.tripId,
          "ETA:",
          eta,
        );

        // Store tripId before clearing currentOffer
        const tripId = currentOffer.tripOffer.tripId;

        // Submit driver response to API with ETA
        await submitDriverResponse({
          driverId: driverId,
          tripId: tripId,
          response: TRIP_OFFER_ACTIONS.ACCEPT,
          eta: eta,
        });

        console.log("✅ Ride offer accepted with ETA successfully");
        showToast("Ride offer accepted successfully!", {
          variant: "success",
          position: "top",
        });

        // NEW: Remove temporary rides for expired offers
        if (tripId) {
          removeTemporaryRidesByTripId(tripId);
          console.log(
            "✅ Removed temporary rides for accepted tripId:",
            tripId,
          );
        }

        // Set hasAnyActiveOffer to false on successful acceptance
        await setHasAnyActiveOffer(false);

        // Hide ETA modal and the ride offer modal, clear current offer
        setIsETABottomSheetVisible(false);
        setIsRideOfferModalVisible(false);
        setCurrentOffer(null);
        setModalCallbacks(null);

        // Non-blocking: Try to update ETA in the database.
        // We keep a small delay to give the Active Trip service time to initialize,
        // but navigation to the active-ride screen is now handled centrally by the
        // ACCEPTED_RESPONSE socket event in GlobalSocketListener to avoid races.
        setTimeout(() => {
          (async () => {
            try {
              console.log(
                "🔄 Attempting to update ETA in database (non-blocking)...",
              );
              await updateETA({
                tripId: tripId,
                driverId: driverId,
                eta: eta,
              });
              console.log("✅ ETA updated in database successfully");
            } catch (etaError) {
              console.warn(
                "⚠️ Failed to update ETA in database (non-blocking):",
                etaError,
              );
              showToast(
                "Ride accepted! ETA update failed. You can update it later during the active ride.",
                {
                  variant: "error",
                  position: "top",
                },
              );
            }
          })();
        }, 1500);
      } catch (error) {
        console.error("❌ Error in submit ETA:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to accept ride offer. Please try again.";
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });
        if (
          errorMessage.toLowerCase().includes("expired") &&
          currentOffer?.tripOffer?.tripId
        ) {
          try {
            removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
          } catch {}
          try {
            updateCurrentOfferStatus(
              "offer-expired",
              currentOffer.tripOffer.tripId,
            );
          } catch {}
          try {
            await setHasAnyActiveOffer(false);
          } catch {}
          try {
            hideRideOfferModal();
          } catch {}
        }
        // On error, keep the ETA bottom sheet open so user can retry
      } finally {
        setIsSubmitETALoading(false);
      }
    },
    [
      currentOffer,
      driverId,
      submitDriverResponse,
      removeTemporaryRidesByTripId,
      setHasAnyActiveOffer,
      updateCurrentOfferStatus,
      hideRideOfferModal,
      updateETA,
    ],
  );

  /**
   * Submit a bid amount for the current ride offer
   */
  const submitBid = useCallback(
    async (bidAmount: number, eta?: number | string, boostAmount?: number) => {
      if (!currentOffer) return;

      try {
        setIsSubmitBidLoading(true);
        console.log(
          "🌐 Submitting bid for ride offer:",
          currentOffer.tripOffer.tripId,
          "bidAmount:",
          bidAmount,
          "eta:",
          eta,
          "boostAmount:",
          boostAmount,
        );

        await submitDriverResponse({
          driverId: driverId,
          tripId: currentOffer.tripOffer.tripId,
          response: TRIP_OFFER_ACTIONS.BID,
          bidAmount,
          eta,
          boostAmount,
        });

        console.log("✅ Bid submitted successfully context");
        showToast("Bid submitted successfully!", {
          variant: "success",
          position: "top",
        });
        // Mirror broadcast behavior: once bidding, don't expire locally.
        try {
          updateCurrentOfferStatus("bidding", currentOffer.tripOffer.tripId);
        } catch {}
        setIsSubmitBidLoading(false);
        return { success: true };
        // Note: hasAnyActiveOffer will be set to false when bid response is received via socket
      } catch (error) {
        console.error("❌ Error submitting bid:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to submit bid. Please try again.";
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });

        // If trip is expired, remove it and close modal
        if (errorMessage.toLowerCase().includes("expired")) {
          try {
            removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
          } catch {}
          try {
            updateCurrentOfferStatus(
              "offer-expired",
              currentOffer.tripOffer.tripId,
            );
          } catch {}
          try {
            hideRideOfferModal();
          } catch {}
          try {
            await setHasAnyActiveOffer(false);
          } catch {}
        }

        setIsSubmitBidLoading(false);
        throw error;
      }
    },
    [
      currentOffer,
      driverId,
      submitDriverResponse,
      updateCurrentOfferStatus,
      removeTemporaryRidesByTripId,
      hideRideOfferModal,
      setHasAnyActiveOffer,
    ],
  );

  /**
   * Submit a bid amount for a broadcast offer (used by LiveJobOffersScreen)
   */
  const submitBidForBroadcastOffer = useCallback(
    async (
      tripId: string,
      bidAmount: number,
      eta?: number | string,
      boostAmount?: number,
    ) => {
      if (!tripId || !driverId) {
        console.error("❌ Missing tripId or driverId for bid submission");
        return;
      }

      try {
        setIsSubmitBidLoading(true);
        console.log(
          "🌐 Submitting bid for broadcast offer:",
          tripId,
          "bidAmount:",
          bidAmount,
          "eta:",
          eta,
          "boostAmount:",
          boostAmount,
        );

        await submitDriverResponse({
          driverId: driverId,
          tripId: tripId,
          response: TRIP_OFFER_ACTIONS.BID,
          bidAmount,
          eta,
          boostAmount,
        });

        console.log("✅ Bid submitted successfully for broadcast offer");
        showToast("Bid submitted successfully!", {
          variant: "success",
          position: "top",
        });
        setIsSubmitBidLoading(false);
        return { success: true };
        // Note: hasAnyActiveOffer will be set to false when bid response is received via socket
      } catch (error) {
        console.error("❌ Error submitting bid for broadcast offer:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to submit bid. Please try again.";
        showToast(errorMessage, {
          variant: "error",
          position: "top",
        });

        // If trip is expired, ensure state is cleaned up
        if (errorMessage.toLowerCase().includes("expired")) {
          try {
            await setHasAnyActiveOffer(false);
          } catch {}
        }

        setIsSubmitBidLoading(false);
        throw error;
      }
    },
    [driverId, submitDriverResponse, setHasAnyActiveOffer],
  );

  /**
   * Save a temporary ride offer for a specific notification
   */
  const saveTemporaryRide = useCallback(
    (notificationId: string, rideOffer: RideOffer) => {
      console.log(
        `💾 Saving temporary ride for notification: ${notificationId}`,
      );
      setTemporaryRides((prev) => ({
        ...prev,
        [notificationId]: rideOffer,
      }));
    },
    [],
  );

  /**
   * Get a temporary ride offer by notification ID
   */
  const getTemporaryRide = useCallback(
    (notificationId: string): RideOffer | null => {
      return temporaryRides[notificationId] || null;
    },
    [temporaryRides],
  );

  /**
   * Get a temporary ride offer by tripId.
   * This is important because notification IDs can change (e.g. backend refresh),
   * but tripId remains stable.
   */
  const getTemporaryRideByTripId = useCallback(
    (tripId: string): RideOffer | null => {
      const rides = Object.values(temporaryRides);
      return rides.find((r) => r?.tripOffer?.tripId === tripId) || null;
    },
    [temporaryRides],
  );

  /**
   * Remove a temporary ride offer by notification ID
   */
  const removeTemporaryRide = useCallback((notificationId: string) => {
    console.log(
      `🗑️ Removing temporary ride for notification: ${notificationId}`,
    );
    setTemporaryRides((prev) => {
      const { [notificationId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const value: RideOfferContextType = {
    isRideOfferModalVisible,
    currentOffer,
    modalCallbacks,
    isSkipLoading,
    isHideLoading,
    isETABottomSheetVisible,
    hasAnyActiveOffer,
    isSubmitBidLoading,
    isSubmitETALoading,
    temporaryRides,
    showRideOfferModal,
    hideRideOfferModal,
    hideETAModal,
    subscribeToHideETA,
    acceptRideOffer,
    skipRideOfferPrice,
    hideRideOffer,
    submitETA,
    submitBid,
    submitBidForBroadcastOffer,
    markSequentialOfferAsExpired,
    updateCurrentOfferStatus,
    setHasAnyActiveOffer,
    saveTemporaryRide,
    getTemporaryRide,
    getTemporaryRideByTripId,
    removeTemporaryRide,
    removeTemporaryRidesByTripId,
  };

  // ============================================================================
  // SIDE EFFECTS
  // ============================================================================

  // Local sequential offer expiry logic (Consolidated)
  useEffect(() => {
    // 1. Check all sequential offers in temporaryRides
    const checkAllExpirations = () => {
      const now = Date.now();
      const rides = Object.values(temporaryRides);

      rides.forEach((offer) => {
        if (
          offer.type === TRIP_OFFER_TYPES.SEQUENTIAL &&
          offer.status === "offered"
        ) {
          const expiredAtMs =
            offer.expiredAt instanceof Date
              ? offer.expiredAt.getTime()
              : offer.expiredAt
                ? new Date(offer.expiredAt).getTime()
                : NaN;

          if (Number.isFinite(expiredAtMs) && expiredAtMs <= now) {
            console.log(
              `⏰ Local expiry triggered for trip ${offer.tripOffer.tripId}`,
            );
            showToast("Ride offer expired!", {
              variant: "warning",
              position: "top",
            });
            markSequentialOfferAsExpired(offer.tripOffer.tripId);
          }
        }
      });
    };

    // 2. Specific timer for currentOffer (immediate feedback)
    const setupCurrentOfferTimer = () => {
      if (sequentialExpiryTimerRef.current) {
        clearTimeout(sequentialExpiryTimerRef.current);
        sequentialExpiryTimerRef.current = null;
      }

      if (
        !currentOffer ||
        currentOffer.type !== TRIP_OFFER_TYPES.SEQUENTIAL ||
        currentOffer.status !== "offered"
      ) {
        return;
      }

      const tripId = currentOffer.tripOffer?.tripId;
      const expiredAtMs =
        currentOffer.expiredAt instanceof Date
          ? currentOffer.expiredAt.getTime()
          : currentOffer.expiredAt
            ? new Date(currentOffer.expiredAt).getTime()
            : NaN;

      if (!Number.isFinite(expiredAtMs)) return;

      const msLeft = expiredAtMs - Date.now();
      if (msLeft <= 0) {
        showToast("Ride offer expired!", {
          variant: "warning",
          position: "top",
        });
        markSequentialOfferAsExpired(tripId);
        return;
      }

      sequentialExpiryTimerRef.current = setTimeout(() => {
        showToast("Ride offer expired!", {
          variant: "warning",
          position: "top",
        });
        markSequentialOfferAsExpired(tripId);
      }, msLeft);
    };

    // Initialize
    checkAllExpirations();
    setupCurrentOfferTimer();

    // Background checker
    const interval = setInterval(checkAllExpirations, 1000);

    return () => {
      clearInterval(interval);
      if (sequentialExpiryTimerRef.current) {
        clearTimeout(sequentialExpiryTimerRef.current);
      }
    };
  }, [currentOffer, temporaryRides, markSequentialOfferAsExpired]);

  return (
    <RideOfferContext.Provider value={value}>
      {children}

      {/* ETA Modal Overlay */}
      <ETAModal
        open={isETABottomSheetVisible}
        onClose={() => {
          // Just close the ETA modal, ride offer modal stays open
          setIsETABottomSheetVisible(false);
        }}
        onSubmit={submitETA}
        isLoading={isSubmitETALoading}
      />
    </RideOfferContext.Provider>
  );
}

export function useRideOffer() {
  const context = useContext(RideOfferContext);
  if (context === undefined) {
    throw new Error("useRideOffer must be used within a RideOfferProvider");
  }
  return context;
}
