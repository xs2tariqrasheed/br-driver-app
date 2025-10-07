import BidStatusModal from "@/components/BidStatusModal";
import { BID_STATUS } from "@/constants/global";
import { createContext, ReactNode, useContext, useState } from "react";

interface BidUnsuccessfulContextType {
  // State
  isBidUnsuccessfulVisible: boolean;

  // Actions
  showBidUnsuccessful: () => void;
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

  const showBidUnsuccessful = () => {
    setIsBidUnsuccessfulVisible(true);
  };

  const hideBidUnsuccessful = () => {
    setIsBidUnsuccessfulVisible(false);
  };

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
