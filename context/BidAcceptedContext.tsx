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

interface BidAcceptedContextType {
  // State
  isBidAcceptedVisible: boolean;

  // Actions
  showBidAccepted: () => void;
  hideBidAccepted: () => void;
  onTimerComplete: () => void;
  onClose: () => void;
}

const BidAcceptedContext = createContext<BidAcceptedContextType | undefined>(
  undefined
);

export function BidAcceptedProvider({ children }: { children: ReactNode }) {
  const [isBidAcceptedVisible, setIsBidAcceptedVisible] = useState(false);
  const { registerModal, unregisterModal } = useModalManager();

  const showBidAccepted = () => {
    setIsBidAcceptedVisible(true);
  };

  const hideBidAccepted = () => {
    setIsBidAcceptedVisible(false);
  };

  // Register modal with ModalManager
  useEffect(() => {
    registerModal("bidAccepted", hideBidAccepted);
    return () => unregisterModal("bidAccepted");
  }, [registerModal, unregisterModal, hideBidAccepted]);

  const onTimerComplete = () => {
    // Default behavior - can be overridden by parent components
    hideBidAccepted();
  };

  const onClose = () => {
    // Default behavior - can be overridden by parent components
    hideBidAccepted();
  };

  const contextValue: BidAcceptedContextType = {
    isBidAcceptedVisible,
    showBidAccepted,
    hideBidAccepted,
    onTimerComplete,
    onClose,
  };

  return (
    <BidAcceptedContext.Provider value={contextValue}>
      {children}
      {/* Global BidAccepted Status Modal */}
      <BidStatusModal
        open={isBidAcceptedVisible}
        status={BID_STATUS.ACCEPTED}
        onTimerComplete={onTimerComplete}
        onClose={onClose}
      />
    </BidAcceptedContext.Provider>
  );
}

export function useBidAccepted(): BidAcceptedContextType {
  const context = useContext(BidAcceptedContext);
  if (context === undefined) {
    throw new Error("useBidAccepted must be used within a BidAcceptedProvider");
  }
  return context;
}
