import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { useModalManager } from "@/context/ModalManagerContext";

// Types
export type PackageInfo = {
  numberOfPackages?: number;
  weight?: string;
  phoneNumber?: string;
  recipientName?: string;
  instructions?: string;
};

type PackageInfoState = {
  isOpen: boolean;
  data: PackageInfo | null;
};

type OpenAction = {
  type: "OPEN";
  payload: PackageInfo;
};

type CloseAction = {
  type: "CLOSE";
};

type PackageInfoAction = OpenAction | CloseAction;

const initialState: PackageInfoState = {
  isOpen: false,
  data: null,
};

function packageInfoReducer(
  state: PackageInfoState,
  action: PackageInfoAction
): PackageInfoState {
  switch (action.type) {
    case "OPEN":
      return { isOpen: true, data: action.payload };
    case "CLOSE":
      return { isOpen: false, data: null };
    default:
      return state;
  }
}

type PackageInfoContextValue = {
  isOpen: boolean;
  data: PackageInfo | null;
  openPackageInfo: (data: PackageInfo) => void;
  closePackageInfo: () => void;
};

const PackageInfoContext = createContext<PackageInfoContextValue | undefined>(
  undefined
);

export function PackageInfoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(packageInfoReducer, initialState);
  const { requestOpen, requestClose } = useModalManager();

  const openPackageInfo = useCallback((data: PackageInfo) => {
    console.log("📦 PackageInfoContext: Opening with data:", data);
    requestOpen({ name: "packageInfo", priority: 6, group: "rideOfferFlow" })
      .then(() => dispatch({ type: "OPEN", payload: data }))
      .catch(() => {});
  }, []);

  const closePackageInfo = useCallback(() => {
    dispatch({ type: "CLOSE" });
    requestClose("packageInfo");
  }, []);

  const contextValue = useMemo<PackageInfoContextValue>(
    () => ({
      isOpen: state.isOpen,
      data: state.data,
      openPackageInfo,
      closePackageInfo,
    }),
    [state.isOpen, state.data, openPackageInfo, closePackageInfo]
  );

  return (
    <PackageInfoContext.Provider value={contextValue}>
      {children}
    </PackageInfoContext.Provider>
  );
}

export function usePackageInfo(): PackageInfoContextValue {
  const ctx = useContext(PackageInfoContext);
  if (!ctx) {
    throw new Error("usePackageInfo must be used within a PackageInfoProvider");
  }
  return ctx;
}
