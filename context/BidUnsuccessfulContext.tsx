import BidStatusModal from "@/components/BidStatusModal";
import { BID_STATUS } from "@/constants/global";
import { useModalManager } from "@/context/ModalManagerContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

interface BidUnsuccessfulContextType {
  // State
  isBidUnsuccessfulVisible: boolean;

  // Actions
  showBidUnsuccessful: (tripId?: string) => void;
  hideBidUnsuccessful: () => void;
  onTimerComplete: () => void;
  onClose: () => void;
}

const BidUnsuccessfulContext = createContext<
  BidUnsuccessfulContextType | undefined
>(undefined);

export function BidUnsuccessfulProvider({ children }: { children: ReactNode }) {
  const [isBidUnsuccessfulVisible, setIsBidUnsuccessfulVisible] =
    useState(false);
  const { registerModal, unregisterModal } = useModalManager();
  const { broadcastOffers, updateBroadcastOffer } = useBroadcastJobOffers();
  const currentTripIdRef = useRef<string | null>(null);

  const showBidUnsuccessful = (tripId?: string) => {
    // Store tripId if provided for status update
    if (tripId) {
      currentTripIdRef.current = tripId;
      // Update broadcast offer status to "rejected" locally when sheet opens
      const offerToUpdate = broadcastOffers.find(
        (o) => o.tripOffer.tripId === tripId
      );
      if (offerToUpdate) {
        updateBroadcastOffer(offerToUpdate.id, {
          status: "rejected" as any,
        });
        console.log(`[BidUnsuccessful] Updated offer ${offerToUpdate.id} status to "rejected" when sheet opened`);
      }
    }
    setIsBidUnsuccessfulVisible(true);
  };

  const hideBidUnsuccessful = () => {
    setIsBidUnsuccessfulVisible(false);
  };

  // Register modal with ModalManager
  useEffect(() => {
    registerModal("bidUnsuccessful", hideBidUnsuccessful);
    return () => unregisterModal("bidUnsuccessful");
  }, [registerModal, unregisterModal, hideBidUnsuccessful]);

  const onTimerComplete = () => {
    // Default behavior - can be overridden by parent components
    hideBidUnsuccessful();
  };

  const onClose = () => {
    // Default behavior - can be overridden by parent components
    hideBidUnsuccessful();
  };

  const contextValue: BidUnsuccessfulContextType = {
    isBidUnsuccessfulVisible,
    showBidUnsuccessful,
    hideBidUnsuccessful,
    onTimerComplete,
    onClose,
  };

  return (
    <BidUnsuccessfulContext.Provider value={contextValue}>
      {children}
      {/* Global BidUnsuccessful Status Modal */}
      <BidStatusModal
        open={isBidUnsuccessfulVisible}
        status={BID_STATUS.UNSUCCESSFUL}
        onTimerComplete={onTimerComplete}
        onClose={onClose}
      />
    </BidUnsuccessfulContext.Provider>
  );
}

export function useBidUnsuccessful(): BidUnsuccessfulContextType {
  const context = useContext(BidUnsuccessfulContext);
  if (context === undefined) {
    throw new Error(
      "useBidUnsuccessful must be used within a BidUnsuccessfulProvider"
    );
  }
  return context;
}
