import BidStatusModal from "@/components/BidStatusModal";
import { BID_STATUS } from "@/constants/global";
import { useModalManager } from "@/context/ModalManagerContext";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface BidExpiredContextType {
  // State
  isBidExpiredVisible: boolean;

  // Actions
  showBidExpired: () => void;
  hideBidExpired: () => void;
  onTimerComplete: () => void;
  onClose: () => void;
}

const BidExpiredContext = createContext<BidExpiredContextType | undefined>(
  undefined
);

export function BidExpiredProvider({ children }: { children: ReactNode }) {
  const [isBidExpiredVisible, setIsBidExpiredVisible] = useState(false);
  const { registerModal, unregisterModal } = useModalManager();

  const showBidExpired = () => {
    setIsBidExpiredVisible(true);
  };

  const hideBidExpired = () => {
    setIsBidExpiredVisible(false);
  };

  // Register modal with ModalManager
  useEffect(() => {
    registerModal("bidExpired", hideBidExpired);
    return () => unregisterModal("bidExpired");
  }, [registerModal, unregisterModal, hideBidExpired]);

  const onTimerComplete = () => {
    // Default behavior - can be overridden by parent components
    hideBidExpired();
  };

  const onClose = () => {
    // Default behavior - can be overridden by parent components
    hideBidExpired();
  };

  const contextValue: BidExpiredContextType = {
    isBidExpiredVisible,
    showBidExpired,
    hideBidExpired,
    onTimerComplete,
    onClose,
  };

  return (
    <BidExpiredContext.Provider value={contextValue}>
      {children}
      {/* Global BidExpired Status Modal */}
      <BidStatusModal
        open={isBidExpiredVisible}
        status={BID_STATUS.EXPIRED}
        onTimerComplete={onTimerComplete}
        onClose={onClose}
      />
    </BidExpiredContext.Provider>
  );
}

export function useBidExpired(): BidExpiredContextType {
  const context = useContext(BidExpiredContext);
  if (context === undefined) {
    throw new Error("useBidExpired must be used within a BidExpiredProvider");
  }
  return context;
}
