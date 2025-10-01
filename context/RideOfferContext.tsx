import RideOfferModal from "@/components/RideOffer";
import { createContext, ReactNode, useContext, useState } from "react";

interface TripOffer {
  tripId: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  fare: number;
  expiresAt: Date;
}

interface RideOffer {
  type: "sequential" | "broadcast";
  tripOffer: TripOffer;
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
  // Actions
  showRideOfferModal: (offer: RideOffer, callbacks?: ModalCallbacks) => void;
  hideRideOfferModal: () => void;
  acceptRideOffer: () => Promise<void>;
  skipRideOfferPrice: () => Promise<void>;
  hideRideOffer: () => Promise<void>;
}

const RideOfferContext = createContext<RideOfferContextType | undefined>(
  undefined
);

export function RideOfferProvider({ children }: { children: ReactNode }) {
  const [isRideOfferModalVisible, setIsRideOfferModalVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<RideOffer | null>(null);
  const [modalCallbacks, setModalCallbacks] = useState<ModalCallbacks | null>(
    null
  );

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
   * Calls the provided callback if available, otherwise handles globally
   */
  const acceptRideOffer = async () => {
    if (!currentOffer) return;

    console.log("✅ Accepting ride offer:", currentOffer.tripOffer.tripId);

    try {
      // If callbacks are provided, use them
      if (modalCallbacks?.onAccept) {
        await modalCallbacks.onAccept();
        // Hide modal after successful acceptance
        hideRideOfferModal();
      } else {
        // No callbacks provided - handle globally
        await handleGlobalAcceptOffer();
      }
    } catch (error) {
      console.error("❌ Error in accept callback:", error);
      // Don't hide modal on error - let the callback handle error display
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
    }
  };

  // ============================================================================
  // Global Handlers (when modal is opened without callbacks)
  // ============================================================================

  /**
   * Global handler for accepting ride offer
   * TODO: Implement API call when backend is ready
   */
  const handleGlobalAcceptOffer = async () => {
    if (!currentOffer) return;

    try {
      console.log(
        "🌐 Global accept ride offer:",
        currentOffer.tripOffer.tripId
      );

      // TODO: Implement API call
      // const response = await acceptRideOfferAPI({
      //   tripId: currentOffer.tripOffer.tripId,
      // });

      // Simulate success for now
      console.log("✅ Global ride offer accepted successfully");

      // TODO: Show success toast
      // Toast.show({
      //   type: "success",
      //   text1: "Ride Accepted",
      //   text2: "You have successfully accepted this ride offer.",
      // });

      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global accept:", error);
      // TODO: Show error toast
      // Toast.show({
      //   type: "error",
      //   text1: "Failed to Accept Offer",
      //   text2: error instanceof Error ? error.message : "Unknown error",
      // });
    }
  };

  /**
   * Global handler for skipping ride offer price
   * TODO: Implement API call when backend is ready
   */
  const handleGlobalSkipPrice = async () => {
    if (!currentOffer) return;

    try {
      console.log(
        "🌐 Global skip price for ride offer:",
        currentOffer.tripOffer.tripId
      );

      // TODO: Implement API call
      // const response = await skipRideOfferPriceAPI({
      //   tripId: currentOffer.tripOffer.tripId,
      // });

      // Simulate success for now
      console.log("✅ Global ride offer price skipped successfully");

      // TODO: Show success toast
      // Toast.show({
      //   type: "success",
      //   text1: "Price Skipped",
      //   text2: "You have skipped the price for this ride offer.",
      // });

      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global skip price:", error);
      // TODO: Show error toast
      // Toast.show({
      //   type: "error",
      //   text1: "Failed to Skip Price",
      //   text2: error instanceof Error ? error.message : "Unknown error",
      // });
    }
  };

  /**
   * Global handler for hiding ride offer
   * TODO: Implement API call when backend is ready
   */
  const handleGlobalHideOffer = async () => {
    if (!currentOffer) return;

    try {
      console.log("🌐 Global hide ride offer:", currentOffer.tripOffer.tripId);

      // TODO: Implement API call
      // const response = await hideRideOfferAPI({
      //   tripId: currentOffer.tripOffer.tripId,
      // });

      // Simulate success for now
      console.log("✅ Global ride offer hidden successfully");

      // TODO: Show success toast
      // Toast.show({
      //   type: "success",
      //   text1: "Offer Hidden",
      //   text2: "This ride offer has been hidden.",
      // });

      // Hide modal
      hideRideOfferModal();
    } catch (error) {
      console.error("❌ Error in global hide:", error);
      // TODO: Show error toast
      // Toast.show({
      //   type: "error",
      //   text1: "Failed to Hide Offer",
      //   text2: error instanceof Error ? error.message : "Unknown error",
      // });
    }
  };

  const value: RideOfferContextType = {
    isRideOfferModalVisible,
    currentOffer,
    modalCallbacks,
    showRideOfferModal,
    hideRideOfferModal,
    acceptRideOffer,
    skipRideOfferPrice,
    hideRideOffer,
  };

  return (
    <RideOfferContext.Provider value={value}>
      {children}

      {/* Global Ride Offer Modal */}
      <RideOfferModal
        visible={isRideOfferModalVisible}
        onClose={hideRideOfferModal}
        offer={currentOffer || undefined}
        onAccept={acceptRideOffer}
        onSkipPrice={skipRideOfferPrice}
        onHide={hideRideOffer}
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
