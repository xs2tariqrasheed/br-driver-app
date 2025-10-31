import BidBottomSheetModal, { BidData } from "@/components/BidBottomSheetModal";
import { useModalManager } from "@/context/ModalManagerContext";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface BidBottomSheetContextType {
  // State
  isBidBottomSheetVisible: boolean;
  bidData: BidData | null;
  isSubmitting: boolean;
  onBidSubmit:
    | ((data: {
        selectedBid: number;
        eta: number;
        boostAmount: number;
        isBoosted: boolean;
      }) => void)
    | null;

  // Actions
  showBidBottomSheet: (
    data: BidData,
    onSubmit: (data: {
      selectedBid: number;
      eta: number;
      boostAmount: number;
      isBoosted: boolean;
    }) => void
  ) => void;
  hideBidBottomSheet: () => void;
  setSubmitting: (loading: boolean) => void;
  reopenLastBidBottomSheet: () => void;
}

const BidBottomSheetContext = createContext<
  BidBottomSheetContextType | undefined
>(undefined);

export function BidBottomSheetProvider({ children }: { children: ReactNode }) {
  const [isBidBottomSheetVisible, setIsBidBottomSheetVisible] = useState(false);
  const [bidData, setBidData] = useState<BidData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitHandlerRef = useRef<((data: any) => void) | null>(null);
  const lastBidDataRef = useRef<BidData | null>(null);
  const lastSubmitHandlerRef = useRef<((data: any) => void) | null>(null);
  const { registerModal, unregisterModal, requestOpen, requestClose } = useModalManager();

  const hideBidBottomSheet = () => {
    setIsBidBottomSheetVisible(false);
    setBidData(null);
    setIsSubmitting(false);
    submitHandlerRef.current = null;
    requestClose("bidBottomSheet");
  };

  // Register modal with ModalManager
  useEffect(() => {
    registerModal("bidBottomSheet", hideBidBottomSheet);
    return () => unregisterModal("bidBottomSheet");
  }, [registerModal, unregisterModal, hideBidBottomSheet]);

  const showBidBottomSheet = (data: BidData, onSubmit: (data: any) => void) => {
    console.log("🔔 Show bid bottom sheet:", data);
    console.log("🔔 Submit handler received:", typeof onSubmit);
    setBidData(data);
    submitHandlerRef.current = onSubmit;
    lastBidDataRef.current = data;
    lastSubmitHandlerRef.current = onSubmit;
    console.log("🔔 Submit handler stored");
    requestOpen({ name: "bidBottomSheet", priority: 9, group: "bidFlow" })
      .then(() => setIsBidBottomSheetVisible(true))
      .catch(() => setIsBidBottomSheetVisible(false));
  };

  const reopenLastBidBottomSheet = () => {
    if (lastBidDataRef.current && lastSubmitHandlerRef.current) {
      setBidData(lastBidDataRef.current);
      submitHandlerRef.current = lastSubmitHandlerRef.current;
      requestOpen({ name: "bidBottomSheet", priority: 9, group: "bidFlow" })
        .then(() => setIsBidBottomSheetVisible(true))
        .catch(() => setIsBidBottomSheetVisible(false));
    }
  };

  const setSubmitting = (loading: boolean) => {
    setIsSubmitting(loading);
  };

  const contextValue: BidBottomSheetContextType = {
    isBidBottomSheetVisible,
    bidData,
    isSubmitting,
    onBidSubmit: submitHandlerRef.current,
    showBidBottomSheet,
    hideBidBottomSheet,
    setSubmitting,
    reopenLastBidBottomSheet,
  };

  return (
    <BidBottomSheetContext.Provider value={contextValue}>
      {children}
      {/* Global BidBottomSheet Modal */}
      {bidData && (
        <BidBottomSheetModal
          bid={bidData}
          onSubmit={async (data) => {
            if (typeof submitHandlerRef.current === "function") {
              console.log("🔔 Calling submit handler...");
              setIsSubmitting(true);
              try {
                await submitHandlerRef.current(data)
                hideBidBottomSheet();
              } finally {
                setIsSubmitting(false);
              }
            } else {
              console.error(
                "🔔 Submit handler is not a function:",
                submitHandlerRef.current
              );
            }
          }}
          onClose={hideBidBottomSheet}
          open={isBidBottomSheetVisible}
          isLoading={isSubmitting}
        />
      )}
    </BidBottomSheetContext.Provider>
  );
}

export function useBidBottomSheet(): BidBottomSheetContextType {
  const context = useContext(BidBottomSheetContext);
  if (context === undefined) {
    throw new Error(
      "useBidBottomSheet must be used within a BidBottomSheetProvider"
    );
  }
  return context;
}
