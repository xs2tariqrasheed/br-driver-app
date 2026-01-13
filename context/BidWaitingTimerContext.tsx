import BidWaitingTimerModal from "@/components/BidWaitingTimerModal";
import { BID_WAITING_TIMER_DURATION_MS, API_CLIENT_TYPES } from "@/constants/global";
import { useBidExpired } from "@/context/BidExpiredContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useBidBottomSheet } from "@/context/BidBottomSheetContext";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import { useAuth } from "@/context/AuthContext";
import { usePost } from "@/hooks/usePost";
import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import { showToast } from "@/components/Toast";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

interface BidWaitingTimerContextType {
  // State
  isBidWaitingTimerVisible: boolean;
  progressDuration: number;
  isTimerActive: boolean;
  isConfirming: boolean;
  isCanceling: boolean;

  // Actions
  showBidWaitingTimer: (
    offer?: any,
    duration?: number,
    onComplete?: () => void,
    onCancel?: () => void
  ) => void;
  hideBidWaitingTimer: () => void;
  cancelTimer: () => void;
}

const BidWaitingTimerContext = createContext<
  BidWaitingTimerContextType | undefined
>(undefined);

export function BidWaitingTimerProvider({ children }: { children: ReactNode }) {
  const [isBidWaitingTimerVisible, setIsBidWaitingTimerVisible] =
    useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [progressDuration, setProgressDuration] = useState(
    BID_WAITING_TIMER_DURATION_MS
  );
  const [isTimerActive, setIsTimerActive] = useState(false);
  const startTimestampRef = useRef<number | null>(null);
  const durationRef = useRef<number>(BID_WAITING_TIMER_DURATION_MS);
  const isTransitioningRef = useRef<boolean>(false);
  const onCompleteProgressRef = useRef<(() => void) | null>(null);
  const onCancelRef = useRef<(() => void) | null>(null);
  const { setHasAnyActiveOffer } = useRideOffer();
  const { reopenLastBidBottomSheet } = useBidBottomSheet();
  const { showBidExpired } = useBidExpired();
  const { broadcastOffers, updateBroadcastOffer } = useBroadcastJobOffers();
  const showBidExpiredRef = useRef(showBidExpired);
  const currentOfferRef = useRef<any>(null);
  useEffect(() => {
    showBidExpiredRef.current = showBidExpired;
  }, [showBidExpired]);
  const { registerModal, unregisterModal, requestOpen, requestClose } = useModalManager();
  const [auth] = useAuth();
  const { execute: cancelBid, loading: isCancelLoading } = usePost(
    LIVE_JOB_ENDPOINTS.cancelBid,
    API_CLIENT_TYPES.AUCTION
  );

  const hideBidWaitingTimer = useCallback(() => {
    setIsBidWaitingTimerVisible(false);
    setIsConfirming(false);
    onCompleteProgressRef.current = null;
    onCancelRef.current = null;
  }, []);

  // Register modal with ModalManager
  useEffect(() => {
    // Prevent closing during cancel API call
    const handleClose = () => {
      if (isCanceling || isConfirming) {
        return; // Prevent closing during cancel process
      }
      hideBidWaitingTimer();
    };
    registerModal("bidWaitingTimer", handleClose);
    return () => unregisterModal("bidWaitingTimer");
  }, [registerModal, unregisterModal, hideBidWaitingTimer, isCanceling, isConfirming]);

  // Compute remaining ms without causing provider re-renders
  const getRemainingMs = () => {
    if (!startTimestampRef.current) return durationRef.current;
    const elapsed = Date.now() - startTimestampRef.current;
    return Math.max(durationRef.current - elapsed, 0);
  };
  const showBidWaitingTimer = (
    offer?: any,
    duration?: number,
    onComplete?: () => void,
    onCancelCallback?: () => void
  ) => {
    const dur = duration || BID_WAITING_TIMER_DURATION_MS;
    setProgressDuration(dur);
    durationRef.current = dur;
    onCompleteProgressRef.current = onComplete || null;
    onCancelRef.current = onCancelCallback || null;
    startTimestampRef.current = Date.now();
    setIsTimerActive(true);
    // Store the current offer for status updates
    currentOfferRef.current = offer;
    // Gate opening via orchestrator (bidFlow group)
    requestOpen({ name: "bidWaitingTimer", priority: 10, group: "bidFlow" })
      .then(() => {
        setIsBidWaitingTimerVisible(true);
      })
      .catch(() => {
        setIsBidWaitingTimerVisible(false);
      });
  };

  const handleCompleteProgress = () => {
    // Exit confirming mode if active and proceed to default completion
    if (isConfirming) setIsConfirming(false);
    
    // Update broadcast offer status to "expired" locally when timer completes
    // This ensures button shows "Re-bid" immediately, even before socket response
    if (currentOfferRef.current) {
      const offer = currentOfferRef.current;
      const tripId = offer?.tripOffer?.tripId || offer?.tripId;
      if (tripId) {
        const offerToUpdate = broadcastOffers.find(
          (o) => o.tripOffer.tripId === tripId
        );
        if (offerToUpdate) {
          updateBroadcastOffer(offerToUpdate.id, {
            status: "expired" as any,
          });
          console.log(`[BidWaitingTimer] Updated offer ${offerToUpdate.id} status to "expired" when timer completed`);
        }
      }
    }
    
    // Extract tripId from the offer for showing expired sheet
    const tripId = currentOfferRef.current?.tripOffer?.tripId || currentOfferRef.current?.tripId;
    
    if (onCompleteProgressRef.current) {
      onCompleteProgressRef.current();
    } else {
      // Default behavior - show expired sheet with tripId
      showBidExpiredRef.current(tripId);
      hideBidWaitingTimer();
    }
  };

  const handleCancel = () => {
    if (isTransitioningRef.current || isCanceling) return;
    isTransitioningRef.current = true;
    setIsConfirming(true);
    // No modal switch, just swap content
    isTransitioningRef.current = false;
  };

  const handleConfirmCancel = async () => {
    if (isTransitioningRef.current || isCanceling) return;
    
    const offer = currentOfferRef.current;
    if (!offer) {
      console.error("No offer found to cancel bid");
      return;
    }

    const tripId = offer?.tripOffer?.tripId || offer?.tripId;
    if (!tripId) {
      console.error("No tripId found in offer");
      return;
    }

    isTransitioningRef.current = true;
    setIsCanceling(true);
    setIsConfirming(false);
    
    // Cancel the timer immediately
    setIsTimerActive(false);
    startTimestampRef.current = null;

    try {
      // Get driver ID from auth context
      const driverId = auth?.user?.id;
      
      if (!driverId) {
        throw new Error("Driver ID not found. Please log in again.");
      }

      // Call cancel bid API
      await cancelBid({
        driverId,
        tripId,
      });

      // Update local state
      const offerToUpdate = broadcastOffers.find(
        (o) => o.tripOffer.tripId === tripId
      );
      if (offerToUpdate) {
        updateBroadcastOffer(offerToUpdate.id, {
          status: "rejected" as any, // Mark as rejected so it can be rebid
        });
      }

      // Show success toast
      showToast("Bid canceled successfully", {
        variant: "success",
        position: "top",
      });

      // Set hasAnyActiveOffer to false
      await setHasAnyActiveOffer(false);

      // Close modal and reopen bid sheet
      hideBidWaitingTimer();
      try {
        requestClose("bidWaitingTimer");
      } catch {}
      reopenLastBidBottomSheet();
    } catch (error) {
      console.error("Error canceling bid:", error);
      
      // Show error toast
      showToast(
        error instanceof Error ? error.message : "Failed to cancel bid",
        {
          variant: "error",
          position: "top",
        }
      );

      // Restore confirming state so user can try again
      setIsConfirming(true);
    } finally {
      setIsCanceling(false);
      isTransitioningRef.current = false;
    }
  };

  const handleCancelConfirmation = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsConfirming(false);
    isTransitioningRef.current = false;
  };

  const cancelTimer = () => {
    setIsTimerActive(false);
    startTimestampRef.current = null;
  };

  const contextValue: BidWaitingTimerContextType = {
    isBidWaitingTimerVisible,
    progressDuration,
    isTimerActive,
    isConfirming,
    isCanceling,
    showBidWaitingTimer,
    hideBidWaitingTimer,
    cancelTimer,
  };

  return (
    <BidWaitingTimerContext.Provider value={contextValue}>
      {children}
      {/* Global BidWaitingTimer Modal */}
      <BidWaitingTimerModal
        open={isBidWaitingTimerVisible}
        progressDuration={getRemainingMs() || progressDuration}
        onCompleteProgress={handleCompleteProgress}
        onCancel={handleCancel}
        isConfirming={isConfirming}
        isCanceling={isCanceling}
        onKeepWaiting={handleCancelConfirmation}
        onConfirmCancel={handleConfirmCancel}
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
