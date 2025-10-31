import ETAModal from "@/components/ETAModal";
import { showToast } from "@/components/Toast";
import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  RIDE_TYPES,
  TRIP_OFFER_ACTIONS,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/hooks/usePost";
import { router } from "expo-router";
import { createContext, ReactNode, useContext, useState } from "react";

interface TripOffer {
  tripId: string;
  customerId: string;
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  biddable: boolean;
  type: "sequential" | "broadcast";
  fare?: number;
  timestamp?: number;
  for?: "io" | "hired"; // temporary field
}

interface RideOffer {
  // Basic ride offer info
  id: string;
  type: (typeof TRIP_OFFER_TYPES)[keyof typeof TRIP_OFFER_TYPES];
  status: "offered" | "accepted" | "rejected" | "expired";

  // Trip offer details
  tripOffer: TripOffer;
  bidable: boolean;

  // LiveRideOfferItem required fields
  rideType: keyof typeof RIDE_TYPES;
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
  showRideOfferModal: (offer: RideOffer, callbacks?: ModalCallbacks) => void;
  hideRideOfferModal: () => void;
  acceptRideOffer: () => Promise<void>;
  skipRideOfferPrice: () => Promise<void>;
  hideRideOffer: () => Promise<void>;
  submitETA: (eta: number) => Promise<void>;
  submitBid: (bidAmount: number) => Promise<{ success: boolean } | undefined>;
  submitBidForBroadcastOffer: (
    tripId: string,
    bidAmount: number
  ) => Promise<{ success: boolean } | undefined>;
  markSequentialOfferAsExpired: (tripId: string) => void;
  setHasAnyActiveOffer: (hasActive: boolean) => Promise<void>;
  // Temporary ride methods
  saveTemporaryRide: (notificationId: string, rideOffer: RideOffer) => void;
  getTemporaryRide: (notificationId: string) => RideOffer | null;
  removeTemporaryRide: (notificationId: string) => void;
  removeTemporaryRidesByTripId: (tripId: string) => void;
}

const RideOfferContext = createContext<RideOfferContextType | undefined>(
  undefined
);

export function RideOfferProvider({ children }: { children: ReactNode }) {
  const [auth] = useAuth();

  const driverId = auth?.user?.id;
  const [isRideOfferModalVisible, setIsRideOfferModalVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [modalCallbacks, setModalCallbacks] = useState<ModalCallbacks | null>(
    null
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

  // API hooks for driver responses
  const { execute: submitDriverResponse } = usePost(
    LIVE_JOB_ENDPOINTS.driverResponse,
    API_CLIENT_TYPES.AUCTION
  );

  /**
   * Set hasAnyActiveOffer state
   */
  const setHasAnyActiveOffer = async (hasActive: boolean) => {
    console.log(
      `[RideOfferContext] setHasAnyActiveOffer called with: ${hasActive}`
    );
    setHasAnyActiveOfferState(hasActive);
  };

  /**
   * Show the ride offer modal with optional callbacks
   * @param offer - The ride offer to display
   * @param callbacks - Optional callbacks for accept, skip price, and hide actions
   */
  const showRideOfferModal = (offer: RideOffer, callbacks?: ModalCallbacks) => {
    console.log("🔔 Showing ride offer modal:", offer);
    setCurrentOffer(offer);
    setModalCallbacks(callbacks || null);
    setIsRideOfferModalVisible(true);
    try {
      router.push("/(screens)/ride-offer");
    } catch {}
  };

  /**
   * Hide the ride offer modal and reset state
   */
  const hideRideOfferModal = () => {
    console.log("🔽 Hiding ride offer modal");
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
  };

  /**
   * Accept the current ride offer
   * Shows ETA bottom sheet instead of calling API directly
   */
  const acceptRideOffer = async () => {
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
  };

  /**
   * Skip the price for the current ride offer
   * Calls the provided callback if available, otherwise handles globally
   */
  const skipRideOfferPrice = async () => {
    if (!currentOffer) return;

    console.log(
      "⏭️ Skipping price for ride offer:",
      currentOffer.tripOffer.tripId
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
        // Close modal and reset active offer state on expired trips
        try { hideRideOfferModal(); } catch {}
        try { await setHasAnyActiveOffer(false); } catch {}
      }
      // Otherwise let the UI show error
    } finally {
      setIsSkipLoading(false);
    }
  };

  /**
   * Hide the current ride offer
   * Calls the provided callback if available, otherwise handles globally
   */
  const hideRideOffer = async () => {
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
        // Close modal and reset active offer state on expired trips
        try { hideRideOfferModal(); } catch {}
        try { await setHasAnyActiveOffer(false); } catch {}
      }
      // Otherwise let the UI show error
    } finally {
      setIsHideLoading(false);
    }
  };

  // ============================================================================
  // Global Handlers (when modal is opened without callbacks)
  // ============================================================================

  /**
   * Submit ETA and accept the ride offer
   */
  const submitETA = async (eta: number) => {
    if (!currentOffer) return;

    try {
      setIsSubmitETALoading(true);

      console.log(
        "🌐 Submitting ETA for ride offer:",
        currentOffer.tripOffer.tripId,
        "ETA:",
        eta
      );

      // Submit driver response to API with ETA
      await submitDriverResponse({
        driverId: driverId,
        tripId: currentOffer.tripOffer.tripId,
        response: TRIP_OFFER_ACTIONS.ACCEPT,
        // eta: eta,
      });

      console.log("✅ Ride offer accepted with ETA successfully");
      showToast("Ride offer accepted successfully!", {
        variant: "success",
        position: "top",
      });
      // NEW: Remove temporary rides for expired offers
      if (currentOffer.tripOffer.tripId) {
        removeTemporaryRidesByTripId(currentOffer.tripOffer.tripId);
        console.log(
          "✅ Removed temporary rides for accepted tripId:",
          currentOffer.tripOffer.tripId
        );
      }

      // Set hasAnyActiveOffer to false on successful acceptance
      await setHasAnyActiveOffer(false);

      // Hide ETA modal and the ride offer modal, clear current offer
      setIsETABottomSheetVisible(false);
      setIsRideOfferModalVisible(false);
      setCurrentOffer(null);
      setModalCallbacks(null);

      // Navigate to active-ride screen
      router.replace("/(screens)/active-ride");
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
      // On error, keep the ETA bottom sheet open so user can retry
    } finally {
      setIsSubmitETALoading(false);
    }
  };

  /**
   * Global handler for skipping ride offer price
   */
  const handleGlobalSkipPrice = async () => {
    if (!currentOffer) return;

    try {
      console.log(
        "🌐 Global skip price for ride offer:",
        currentOffer.tripOffer.tripId
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
          currentOffer.tripOffer.tripId
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
        try { hideRideOfferModal(); } catch {}
        try { await setHasAnyActiveOffer(false); } catch {}
      }
    }
  };

  /**
   * Global handler for hiding ride offer
   */
  const handleGlobalHideOffer = async () => {
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
          currentOffer.tripOffer.tripId
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
        try { hideRideOfferModal(); } catch {}
        try { await setHasAnyActiveOffer(false); } catch {}
      }
    }
  };

  /**
   * Submit a bid amount for the current ride offer
   */
  const submitBid = async (bidAmount: number) => {
    if (!currentOffer) return;

    try {
      setIsSubmitBidLoading(true);
      console.log(
        "🌐 Submitting bid for ride offer:",
        currentOffer.tripOffer.tripId,
        "bidAmount:",
        bidAmount
      );

      await submitDriverResponse({
        driverId: driverId,
        tripId: currentOffer.tripOffer.tripId,
        response: TRIP_OFFER_ACTIONS.BID,
        bidAmount,
      });

      console.log("✅ Bid submitted successfully context");
      showToast("Bid submitted successfully!", {
        variant: "success",
        position: "top",
      });
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
      setIsSubmitBidLoading(false);
      throw error;
    }
  };

  /**
   * Submit a bid amount for a broadcast offer (used by LiveJobOffersScreen)
   */
  const submitBidForBroadcastOffer = async (
    tripId: string,
    bidAmount: number
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
        bidAmount
      );

      await submitDriverResponse({
        driverId: driverId,
        tripId: tripId,
        response: TRIP_OFFER_ACTIONS.BID,
        bidAmount,
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
      setIsSubmitBidLoading(false);
      throw error;
    }
  };

  /**
   * Mark a sequential offer as expired by tripId
   * This method is called by the ExpirationService when server sends expiration event
   */
  const markSequentialOfferAsExpired = (tripId: string) => {
    console.log(`⏰ Marking sequential offer as expired: ${tripId}`);

    // Check if the current offer matches the expired tripId
    if (currentOffer && currentOffer.tripOffer.tripId === tripId) {
      console.log(`📱 Current offer matches expired tripId, updating status`);

      // Update the current offer status to expired
      setCurrentOffer((prev) =>
        prev ? { ...prev, status: "expired" as const } : null
      );

      // Hide the modal and clear state
      hideRideOfferModal();

      // Set hasAnyActiveOffer to false
      setHasAnyActiveOffer(false);

      // Redirect to home screen
      router.replace("/(tabs)");

      console.log("✅ Sequential offer marked as expired successfully");
    } else {
      console.log(`📱 Current offer does not match expired tripId: ${tripId}`);
    }
  };

  // ============================================================================
  // TEMPORARY RIDE METHODS FOR NOTIFICATIONS
  // ============================================================================

  /**
   * Save a temporary ride offer for a specific notification
   */
  const saveTemporaryRide = (notificationId: string, rideOffer: RideOffer) => {
    console.log(`💾 Saving temporary ride for notification: ${notificationId}`);
    setTemporaryRides((prev) => ({
      ...prev,
      [notificationId]: rideOffer,
    }));
  };

  /**
   * Get a temporary ride offer by notification ID
   */
  const getTemporaryRide = (notificationId: string): RideOffer | null => {
    return temporaryRides[notificationId] || null;
  };

  /**
   * Remove a temporary ride offer by notification ID
   */
  const removeTemporaryRide = (notificationId: string) => {
    console.log(
      `🗑️ Removing temporary ride for notification: ${notificationId}`
    );
    setTemporaryRides((prev) => {
      const { [notificationId]: removed, ...rest } = prev;
      return rest;
    });
  };

  /**
   * Remove temporary rides by tripId (for expiration handling)
   */
  const removeTemporaryRidesByTripId = (tripId: string) => {
    console.log(`🗑️ Removing temporary rides for tripId: ${tripId}`);
    setTemporaryRides((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(
          ([_, rideOffer]) => rideOffer.tripOffer.tripId !== tripId
        )
      );
      return filtered;
    });
  };

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
    acceptRideOffer,
    skipRideOfferPrice,
    hideRideOffer,
    submitETA,
    submitBid,
    submitBidForBroadcastOffer,
    markSequentialOfferAsExpired,
    setHasAnyActiveOffer,
    saveTemporaryRide,
    getTemporaryRide,
    removeTemporaryRide,
    removeTemporaryRidesByTripId,
  };

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

/**
 * Hook to access the RideOfferContext
 * Must be used within a RideOfferProvider
 */
export function useRideOffer() {
  const context = useContext(RideOfferContext);
  if (context === undefined) {
    throw new Error("useRideOffer must be used within a RideOfferProvider");
  }
  return context;
}
