import BidWaitingTimerModal from "@/components/BidWaitingTimerModal";
import { BID_WAITING_TIMER_DURATION_MS } from "@/constants/global";
import { useBidExpired } from "@/context/BidExpiredContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useBidBottomSheet } from "@/context/BidBottomSheetContext";
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
  const showBidExpiredRef = useRef(showBidExpired);
  useEffect(() => {
    showBidExpiredRef.current = showBidExpired;
  }, [showBidExpired]);
  const { registerModal, unregisterModal, requestOpen, requestClose } = useModalManager();

  const hideBidWaitingTimer = useCallback(() => {
    setIsBidWaitingTimerVisible(false);
    setIsConfirming(false);
    onCompleteProgressRef.current = null;
    onCancelRef.current = null;
  }, []);

  // Register modal with ModalManager
  useEffect(() => {
    registerModal("bidWaitingTimer", hideBidWaitingTimer);
    return () => unregisterModal("bidWaitingTimer");
  }, [registerModal, unregisterModal, hideBidWaitingTimer]);

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
    if (onCompleteProgressRef.current) {
      onCompleteProgressRef.current();
    } else {
      // Default behavior
      showBidExpiredRef.current();
      hideBidWaitingTimer();
    }
  };

  const handleCancel = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsConfirming(true);
    // No modal switch, just swap content
    isTransitioningRef.current = false;
  };

  const handleConfirmCancel = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsConfirming(false);

    if (onCancelRef.current) {
      onCancelRef.current();
    } else {
      // Default behavior
      hideBidWaitingTimer();
    }

    // Set hasAnyActiveOffer to false when bid is cancelled
    await setHasAnyActiveOffer(false);
    setIsTimerActive(false);
    startTimestampRef.current = null;
    // Allow next modal in bidFlow (re-open bid sheet)
    try {
      requestClose("bidWaitingTimer");
    } catch {}
    reopenLastBidBottomSheet();
    isTransitioningRef.current = false;
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
