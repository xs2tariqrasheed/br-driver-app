import { getStorageItem, setStorageItem } from "@/utils/helpers";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// Storage key
export const SETTINGS_STORAGE_KEY = "@settings" as const;

// Types
export type LoginSettings = {
  enableFaceRecognition: boolean;
  enableFaceId: boolean;
  enableFingerprint: boolean;
};

export type HomePagePreferences = {
  liveJobs: boolean;
  futureReservations: boolean;
  longDistanceIntercity: boolean;
  pets: boolean;
  package: boolean;
};

export type RidePreferences = {
  homePage: HomePagePreferences;
  // New: ride types preferences (all default to false)
  rideTypes: {
    economy: boolean;
    sedan: boolean;
    suv: boolean;
    luxury: boolean;
  };
};

export type NotificationsSettings = {
  muteJobOffers: boolean;
  muteAll: boolean;
};

export type SettingsObject = {
  loginSettings: LoginSettings;
  // Extendable categories
  ridePreferences: RidePreferences;
  notifications: NotificationsSettings;
  // Driver monetization & bidding settings
  featuredDriverPriceUSD?: number; // $0 - $10
  etaBufferMinutes?: number; // 0 - 10 minutes
  autoBidEnabled?: boolean;
  autoBidStrategy?: string | null; // From AUTO_BID_PRICE_OPTIONS
  [key: string]: unknown;
};

type SettingsState = {
  settings: SettingsObject | null;
  isHydrated: boolean;
};

type HydrateAction = { type: "HYDRATE"; payload: SettingsObject };
type SetAction = { type: "SET"; payload: SettingsObject };
type ClearAction = { type: "CLEAR" };
type SettingsAction = HydrateAction | SetAction | ClearAction;

export const DEFAULT_SETTINGS: SettingsObject = {
  loginSettings: {
    enableFaceRecognition: true,
    enableFaceId: true,
    enableFingerprint: true,
  },
  ridePreferences: {
    homePage: {
      liveJobs: false,
      futureReservations: false,
      longDistanceIntercity: false,
      pets: false,
      package: false,
    },
    rideTypes: {
      economy: false,
      sedan: false,
      suv: false,
      luxury: false,
    },
  },
  notifications: {
    muteJobOffers: false,
    muteAll: false,
  },
  featuredDriverPriceUSD: 0,
  etaBufferMinutes: 0,
  autoBidEnabled: false,
  autoBidStrategy: null,
};

const initialState: SettingsState = { settings: null, isHydrated: false };

function reducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "HYDRATE":
      return { settings: action.payload, isHydrated: true };
    case "SET":
      return { ...state, settings: action.payload };
    case "CLEAR":
      return { ...state, settings: DEFAULT_SETTINGS };
    default:
      return state;
  }
}

type SettingsContextValue = [
  SettingsObject,
  (next: SettingsObject) => Promise<void>
];

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      try {
        const raw = await getStorageItem(SETTINGS_STORAGE_KEY);
        const parsed: SettingsObject | null = raw ? JSON.parse(raw) : null;
        // Merge stored settings with defaults to ensure new keys are populated
        const merged: SettingsObject = {
          ...DEFAULT_SETTINGS,
          ...(parsed ?? {}),
          loginSettings: {
            ...DEFAULT_SETTINGS.loginSettings,
            ...(parsed?.loginSettings ?? {}),
          },
          ridePreferences: {
            ...DEFAULT_SETTINGS.ridePreferences,
            ...(parsed?.ridePreferences ?? {}),
            homePage: {
              ...DEFAULT_SETTINGS.ridePreferences.homePage,
              ...((parsed?.ridePreferences as RidePreferences | undefined)
                ?.homePage ?? {}),
            },
            rideTypes: {
              ...DEFAULT_SETTINGS.ridePreferences.rideTypes,
              ...((parsed?.ridePreferences as RidePreferences | undefined)
                ?.rideTypes ?? {}),
            },
          },
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...((parsed?.notifications as
              | Partial<NotificationsSettings>
              | undefined) ?? {}),
          },
        };
        dispatch({ type: "HYDRATE", payload: merged });
      } catch {
        dispatch({ type: "HYDRATE", payload: DEFAULT_SETTINGS });
      }
    })();
  }, []);

  const setSettings = useCallback(async (next: SettingsObject) => {
    dispatch({ type: "SET", payload: next });
    try {
      await setStorageItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore persistence failures
    }
  }, []);

  const contextValue = useMemo<SettingsContextValue>(() => {
    return [state.settings ?? DEFAULT_SETTINGS, setSettings];
  }, [state.settings, setSettings]);

  if (!state.isHydrated) return null;

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
