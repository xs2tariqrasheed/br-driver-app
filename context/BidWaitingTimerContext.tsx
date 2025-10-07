import BidWaitingTimerModal from "@/components/BidWaitingTimerModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { BID_WAITING_TIMER_DURATION_MS } from "@/constants/global";
import { useBidExpired } from "@/context/BidExpiredContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { createContext, ReactNode, useContext, useRef, useState } from "react";

interface BidWaitingTimerContextType {
  // State
  isBidWaitingTimerVisible: boolean;
  progressDuration: number;

  // Actions
  showBidWaitingTimer: (
    offer?: any,
    duration?: number,
    onComplete?: () => void,
    onCancel?: () => void
  ) => void;
  hideBidWaitingTimer: () => void;
}

const BidWaitingTimerContext = createContext<
  BidWaitingTimerContextType | undefined
>(undefined);

export function BidWaitingTimerProvider({ children }: { children: ReactNode }) {
  const [isBidWaitingTimerVisible, setIsBidWaitingTimerVisible] =
    useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const [progressDuration, setProgressDuration] = useState(
    BID_WAITING_TIMER_DURATION_MS
  );
  const onCompleteProgressRef = useRef<(() => void) | null>(null);
  const onCancelRef = useRef<(() => void) | null>(null);
  const { setHasAnyActiveOffer } = useRideOffer();
  const { showBidExpired } = useBidExpired();
  const showBidWaitingTimer = (
    offer?: any,
    duration?: number,
    onComplete?: () => void,
    onCancelCallback?: () => void
  ) => {
    if (duration) {
      setProgressDuration(duration);
    }
    onCompleteProgressRef.current = onComplete || null;
    onCancelRef.current = onCancelCallback || null;
    setIsBidWaitingTimerVisible(true);
  };

  const hideBidWaitingTimer = () => {
    setIsBidWaitingTimerVisible(false);
    onCompleteProgressRef.current = null;
    onCancelRef.current = null;
  };

  const handleCompleteProgress = () => {
    // Close confirmation modal if it's open when progress completes
    if (isConfirmationModalVisible) {
      setIsConfirmationModalVisible(false);
    }

    if (onCompleteProgressRef.current) {
      onCompleteProgressRef.current();
    } else {
      // Default behavior
      showBidExpired();
      hideBidWaitingTimer();
    }
  };

  const handleCancel = () => {
    // Show confirmation modal instead of directly canceling
    setIsConfirmationModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    // Hide confirmation modal
    setIsConfirmationModalVisible(false);

    if (onCancelRef.current) {
      onCancelRef.current();
    } else {
      // Default behavior
      hideBidWaitingTimer();
    }

    // Set hasAnyActiveOffer to false when bid is cancelled
    await setHasAnyActiveOffer(false);
  };

  const handleCancelConfirmation = () => {
    // Just hide the confirmation modal, don't cancel the timer
    setIsConfirmationModalVisible(false);
  };

  const contextValue: BidWaitingTimerContextType = {
    isBidWaitingTimerVisible,
    progressDuration,
    showBidWaitingTimer,
    hideBidWaitingTimer,
  };

  return (
    <BidWaitingTimerContext.Provider value={contextValue}>
      {children}
      {/* Global BidWaitingTimer Modal */}
      <BidWaitingTimerModal
        open={isBidWaitingTimerVisible}
        progressDuration={progressDuration}
        onCompleteProgress={handleCompleteProgress}
        onCancel={handleCancel}
      />
      {/* Confirmation Modal for Cancel Action */}
      <ConfirmationModal
        open={isConfirmationModalVisible}
        title="Cancel Bid"
        description="Are you sure you want to cancel this bid? This action cannot be undone."
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelConfirmation}
        cancelButtonText="Keep Waiting"
        confirmButtonText="Cancel Bid"
      />
    </BidWaitingTimerContext.Provider>
  );
}

export function useBidWaitingTimer(): BidWaitingTimerContextType {
  const context = useContext(BidWaitingTimerContext);
  if (context === undefined) {
    throw new Error(
      "useBidWaitingTimer must be used within a BidWaitingTimerProvider"
    );
  }
  return context;
}
