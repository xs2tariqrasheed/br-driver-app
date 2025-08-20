import { DRIVER_STORAGE_KEY } from "@/constants/global";
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "@/utils/helpers";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// Types
export type DriverObject = {
  online: boolean;
  // Extendable for future driver data
  [key: string]: unknown;
} | null;

type DriverState = {
  driver: DriverObject;
  isHydrated: boolean;
};

type SetDriverAction = {
  type: "SET_DRIVER";
  payload: DriverObject;
};

type ClearDriverAction = {
  type: "CLEAR_DRIVER";
};

type HydrateDriverAction = {
  type: "HYDRATE_DRIVER";
  payload: DriverObject;
};

type DriverAction = SetDriverAction | ClearDriverAction | HydrateDriverAction;

const initialState: DriverState = {
  driver: null,
  isHydrated: false,
};

function driverReducer(state: DriverState, action: DriverAction): DriverState {
  switch (action.type) {
    case "SET_DRIVER": {
      return { ...state, driver: action.payload };
    }
    case "CLEAR_DRIVER": {
      return { ...state, driver: null };
    }
    case "HYDRATE_DRIVER": {
      return { driver: action.payload, isHydrated: true };
    }
    default: {
      return state;
    }
  }
}

type DriverContextValue = [
  DriverObject,
  (value: DriverObject) => Promise<void>
];

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);

  // Hydrate once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await getStorageItem(DRIVER_STORAGE_KEY);
        const parsed: DriverObject = raw ? JSON.parse(raw) : null;
        dispatch({ type: "HYDRATE_DRIVER", payload: parsed });
      } catch {
        dispatch({ type: "HYDRATE_DRIVER", payload: null });
      }
    })();
  }, []);

  const setDriver = useCallback(async (value: DriverObject) => {
    dispatch({ type: "SET_DRIVER", payload: value });
    try {
      if (value == null) {
        await removeStorageItem(DRIVER_STORAGE_KEY);
      } else {
        await setStorageItem(DRIVER_STORAGE_KEY, JSON.stringify(value));
      }
    } catch {
      // ignore persistence failures
    }
  }, []);

  const contextValue = useMemo<DriverContextValue>(
    () => [state.driver, setDriver],
    [state.driver, setDriver]
  );

  if (!state.isHydrated) return null;

  return (
    <DriverContext.Provider value={contextValue}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver(): DriverContextValue {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error("useDriver must be used within a DriverProvider");
  }
  return ctx;
}
