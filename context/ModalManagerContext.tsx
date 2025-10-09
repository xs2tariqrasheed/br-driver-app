import { createContext, ReactNode, useContext, useRef } from "react";

interface ModalManagerContextType {
  closeAllModals: () => void;
  registerModal: (name: string, closeFunction: () => void) => void;
  unregisterModal: (name: string) => void;
}

const ModalManagerContext = createContext<ModalManagerContextType | undefined>(
  undefined
);

export function ModalManagerProvider({ children }: { children: ReactNode }) {
  const modalRefs = useRef<Map<string, () => void>>(new Map());

  const registerModal = (name: string, closeFunction: () => void) => {
    modalRefs.current.set(name, closeFunction);
  };

  const unregisterModal = (name: string) => {
    modalRefs.current.delete(name);
  };

  const closeAllModals = () => {
    console.log("🔽 Closing all registered modals");
    modalRefs.current.forEach((closeFunction, name) => {
      try {
        console.log(`🔽 Closing modal: ${name}`);
        closeFunction();
      } catch (error) {
        console.error(`❌ Error closing modal ${name}:`, error);
      }
    });
  };

  const value: ModalManagerContextType = {
    closeAllModals,
    registerModal,
    unregisterModal,
  };

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
    </ModalManagerContext.Provider>
  );
}

export function useModalManager(): ModalManagerContextType {
  const context = useContext(ModalManagerContext);
  if (context === undefined) {
    throw new Error(
      "useModalManager must be used within a ModalManagerProvider"
    );
  }
  return context;
}
