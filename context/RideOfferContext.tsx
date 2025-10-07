import ETAModal from "@/components/ETAModal";
import { showToast } from "@/components/Toast";
import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  RIDE_OFFER_STORAGE_KEY,
  TRIP_OFFER_ACTIONS,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/hooks/usePost";
import { removeStorageItem } from "@/utils/helpers";
import { router, usePathname } from "expo-router";
import { createContext, ReactNode, useContext, useState } from "react";

interface TripOffer {
  tripId: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  fare: number;
  expiresAt: Date;
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
  rideType: "one-way" | "round-trip" | "hourly";
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
  // Actions
  showRideOfferModal: (offer: RideOffer, callbacks?: ModalCallbacks) => void;
  hideRideOfferModal: () => void;
  acceptRideOffer: () => Promise<void>;
  skipRideOfferPrice: () => Promise<void>;
  hideRideOffer: () => Promise<void>;
  submitETA: (eta: number) => Promise<void>;
  submitBid: (bidAmount: number) => Promise<{ success: boolean } | undefined>;
  handleOfferExpired: () => Promise<void>;
  setHasAnyActiveOffer: (hasActive: boolean) => Promise<void>;
}

const RideOfferContext = createContext<RideOfferContextType | undefined>(
  undefined
);

export function RideOfferProvider({ children }: { children: ReactNode }) {
  const [auth] = useAuth();
  const pathname = usePathname();

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
  };

  /**
   * Hide the ride offer modal and reset state
   */
  const hideRideOfferModal = () => {
    console.log("🔽 Hiding ride offer modal");
    setIsRideOfferModalVisible(false);
    setCurrentOffer(null);
    setModalCallbacks(null);
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
      // Don't hide modal on error - let the callback handle error display
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
      // Don't hide modal on error - let the callback handle error display
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
      removeStorageItem(RIDE_OFFER_STORAGE_KEY);

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
      showToast("Failed to accept ride offer. Please try again.", {
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
      removeStorageItem(RIDE_OFFER_STORAGE_KEY);

      // Set hasAnyActiveOffer to false on successful skip
      await setHasAnyActiveOffer(false);

      // Redirect to home screen
      router.replace("/(tabs)");
      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global skip price:", error);
      showToast("Failed to skip ride offer price. Please try again.", {
        variant: "error",
        position: "top",
      });
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
      removeStorageItem(RIDE_OFFER_STORAGE_KEY);

      // Set hasAnyActiveOffer to false on successful hide
      await setHasAnyActiveOffer(false);

      // Redirect to home screen
      router.replace("/(tabs)");

      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global hide:", error);
      showToast("Failed to hide ride offer. Please try again.", {
        variant: "error",
        position: "top",
      });
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
      showToast("Failed to submit bid. Please try again.", {
        variant: "error",
        position: "top",
      });
      setIsSubmitBidLoading(false);
      throw error;
    }
  };

  /**
   * Handle offer expiration
   */
  const handleOfferExpired = async () => {
    if (!currentOffer) return;

    try {
      console.log("⏰ Ride offer expired:", currentOffer.tripOffer.tripId);

      // Set hasAnyActiveOffer to false when offer expires
      await setHasAnyActiveOffer(false);

      showToast("Ride offer expired!", {
        variant: "warning",
        position: "top",
      });
      // If currently on notifications screen, redirect to home
      if (pathname === "/(screens)/notifications") {
        router.replace("/(tabs)");
      }

      // Hide modal and clear state
      hideRideOfferModal();

      console.log("✅ Offer expiration handled successfully");
    } catch (error) {
      console.error("❌ Error handling offer expiration:", error);
    }
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
    showRideOfferModal,
    hideRideOfferModal,
    acceptRideOffer,
    skipRideOfferPrice,
    hideRideOffer,
    submitETA,
    submitBid,
    handleOfferExpired,
    setHasAnyActiveOffer,
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
