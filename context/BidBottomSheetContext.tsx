import BidBottomSheetModal, { BidData } from "@/components/BidBottomSheetModal";
import { createContext, ReactNode, useContext, useRef, useState } from "react";

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
}

const BidBottomSheetContext = createContext<
  BidBottomSheetContextType | undefined
>(undefined);

export function BidBottomSheetProvider({ children }: { children: ReactNode }) {
  const [isBidBottomSheetVisible, setIsBidBottomSheetVisible] = useState(false);
  const [bidData, setBidData] = useState<BidData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitHandlerRef = useRef<((data: any) => void) | null>(null);

  const showBidBottomSheet = (data: BidData, onSubmit: (data: any) => void) => {
    console.log("🔔 Show bid bottom sheet:", data);
    console.log("🔔 Submit handler received:", typeof onSubmit);
    setBidData(data);
    submitHandlerRef.current = onSubmit;
    console.log("🔔 Submit handler stored");
    setIsBidBottomSheetVisible(true);
  };

  const hideBidBottomSheet = () => {
    setIsBidBottomSheetVisible(false);
    setBidData(null);
    setIsSubmitting(false);
    submitHandlerRef.current = null;
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
  };

  return (
    <BidBottomSheetContext.Provider value={contextValue}>
      {children}
      {/* Global BidBottomSheet Modal */}
      {bidData && (
        <BidBottomSheetModal
          bid={bidData}
          onSubmit={(data) => {
            if (typeof submitHandlerRef.current === "function") {
              console.log("🔔 Calling submit handler...");
              submitHandlerRef.current(data);
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
