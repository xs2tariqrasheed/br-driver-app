import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

// Types
export type SpecialRequirements = {
  totalPassengers?: number;
  bags?: number;
  pets?: boolean;
  wheelchair?: boolean;
  childSeat?: {
    infant?: number;
    toddler?: number;
    booster?: number;
  };
  armedDriver?: boolean;
  driverLanguage?: string;
};

type SpecialRequirementsState = {
  isOpen: boolean;
  data: SpecialRequirements | null;
};

type OpenAction = {
  type: "OPEN";
  payload: SpecialRequirements;
};

type CloseAction = {
  type: "CLOSE";
};

type SpecialRequirementsAction = OpenAction | CloseAction;

const initialState: SpecialRequirementsState = {
  isOpen: false,
  data: null,
};

function specialRequirementsReducer(
  state: SpecialRequirementsState,
  action: SpecialRequirementsAction
): SpecialRequirementsState {
  switch (action.type) {
    case "OPEN":
      return { isOpen: true, data: action.payload };
    case "CLOSE":
      return { isOpen: false, data: null };
    default:
      return state;
  }
}

type SpecialRequirementsContextValue = {
  isOpen: boolean;
  data: SpecialRequirements | null;
  openSpecialRequirements: (data: SpecialRequirements) => void;
  closeSpecialRequirements: () => void;
};

const SpecialRequirementsContext = createContext<
  SpecialRequirementsContextValue | undefined
>(undefined);

export function SpecialRequirementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(
    specialRequirementsReducer,
    initialState
  );

  const openSpecialRequirements = useCallback((data: SpecialRequirements) => {
    dispatch({ type: "OPEN", payload: data });
  }, []);

  const closeSpecialRequirements = useCallback(() => {
    dispatch({ type: "CLOSE" });
  }, []);

  const contextValue = useMemo<SpecialRequirementsContextValue>(
    () => ({
      isOpen: state.isOpen,
      data: state.data,
      openSpecialRequirements,
      closeSpecialRequirements,
    }),
    [
      state.isOpen,
      state.data,
      openSpecialRequirements,
      closeSpecialRequirements,
    ]
  );

  return (
    <SpecialRequirementsContext.Provider value={contextValue}>
      {children}
    </SpecialRequirementsContext.Provider>
  );
}

export function useSpecialRequirements(): SpecialRequirementsContextValue {
  const ctx = useContext(SpecialRequirementsContext);
  if (!ctx) {
    throw new Error(
      "useSpecialRequirements must be used within a SpecialRequirementsProvider"
    );
  }
  return ctx;
}
