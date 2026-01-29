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
  isLoading: boolean;
  error: string | null;
};

type HydrateAction = { type: "HYDRATE"; payload: SettingsObject };
type SetAction = { type: "SET"; payload: SettingsObject };
type ClearAction = { type: "CLEAR" };
type SetLoadingAction = { type: "SET_LOADING"; payload: boolean };
type SetErrorAction = { type: "SET_ERROR"; payload: string | null };
type SettingsAction =
  | HydrateAction
  | SetAction
  | ClearAction
  | SetLoadingAction
  | SetErrorAction;

export const DEFAULT_SETTINGS: SettingsObject = {
  loginSettings: {
    enableFaceRecognition: false,
    enableFaceId: false,
    enableFingerprint: false,
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

const initialState: SettingsState = {
  settings: null,
  isHydrated: false,
  isLoading: false,
  error: null,
};

function reducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, settings: action.payload, isHydrated: true };
    case "SET":
      return { ...state, settings: action.payload };
    case "CLEAR":
      return { ...state, settings: DEFAULT_SETTINGS };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

type SettingsContextValue = [
  SettingsObject,
  (next: SettingsObject) => Promise<void>,
  {
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
    fetchSettings: () => Promise<void>;
  },
];

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from local storage on mount
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

  const setSettings = useCallback(
    async (next: SettingsObject) => {
      // Capture current settings for revert if needed
      const previousSettings = state.settings;

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      // Update local state immediately for better UX
      dispatch({ type: "SET", payload: next });

      try {
        // Save to local storage (non-blocking)
        try {
          await setStorageItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        } catch (storageErr) {
          console.warn("Local storage save failed:", storageErr);
        }

        // Sync with backend API
        const { settingsApiClient } = await import("@/config/apiConfig");
        const { DRIVER_SETTINGS_ENDPOINTS } =
          await import("@/constants/endpoints");

        const response = await settingsApiClient.post(
          DRIVER_SETTINGS_ENDPOINTS.updateSettings,
          next,
        );

        // Check if the response indicates success or failure
        const responseData = response?.data;
        const hasSuccessFlag = responseData?.success === true;
        const dbResponseCode = responseData?.data?.jHeader?.responseCode;
        const isDbSuccess =
          dbResponseCode === undefined ||
          dbResponseCode === "0" ||
          dbResponseCode === 0;

        // If any check fails, throw error
        if (
          responseData?.success === false ||
          !isDbSuccess ||
          !hasSuccessFlag
        ) {
          const errorMessage =
            responseData?.message ||
            responseData?.data?.jHeader?.message ||
            responseData?.error ||
            "Failed to sync settings to backend";

          throw new Error(errorMessage);
        }

        // Settings synced successfully
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error: any) {
        // REVERT: If API fails, revert the state and storage
        if (previousSettings) {
          dispatch({ type: "SET", payload: previousSettings });
          try {
            await setStorageItem(
              SETTINGS_STORAGE_KEY,
              JSON.stringify(previousSettings),
            );
          } catch (storageErr) {
            // ignore revert failures for local storage
          }
        }

        // Extract error message
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.data?.jHeader?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to sync settings to backend";

        console.warn("[SettingsContext] Error saving settings:", errorMessage);

        dispatch({ type: "SET_ERROR", payload: errorMessage });
        dispatch({ type: "SET_LOADING", payload: false });

        // CRITICAL: Re-throw to allow caller to catch the failure
        throw error;
      }
    },
    [state.settings],
  );

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  // Transform DB response to mobile app settings format
  const transformDbResponseToSettings = useCallback(
    (dbData: any): SettingsObject => {
      const settings: SettingsObject = { ...DEFAULT_SETTINGS };

      // The API returns data nested in driverSettings object
      const driverSettings = dbData.driverSettings || dbData;

      // Transform trip vehicle preferences
      const vehiclePref =
        driverSettings.tripVehiclePreference ||
        driverSettings.P_TRIP_VEHICLE_PREFERENCE;
      if (vehiclePref) {
        settings.ridePreferences.rideTypes = {
          economy:
            vehiclePref.ECONOMY === "YES" || vehiclePref.ECONOMY === true,
          sedan: vehiclePref.SEDAN === "YES" || vehiclePref.SEDAN === true,
          suv: vehiclePref.SUV === "YES" || vehiclePref.SUV === true,
          luxury: false, // Not in DB response
        };
      }

      // Transform trip type preferences
      const typePref =
        driverSettings.tripTypePreference ||
        driverSettings.P_TRIP_TYPE_PREFERENCE;
      if (typePref) {
        settings.ridePreferences.homePage = {
          liveJobs: typePref.LIVE_JOBS === "YES" || typePref.LIVE_JOBS === true,
          futureReservations:
            typePref.FUTURE_RESERVATIONS === "YES" ||
            typePref.FUTURE_RESERVATIONS === true,
          longDistanceIntercity:
            typePref.LONG_DISTANCE_INTERCITY === "YES" ||
            typePref.LONG_DISTANCE_INTERCITY === true,
          pets: typePref.PETS === "YES" || typePref.PETS === true,
          package: typePref.PACKAGE === "YES" || typePref.PACKAGE === true,
        };
      }

      // Transform login settings
      // The API uses camelCase field names: isFingerprintEnabled, isFaceIdEnabled, isFaceRecognitionEnabled
      // But also support the P_ prefix format for backward compatibility
      const isFingerprintEnabled =
        driverSettings.isFingerprintEnabled ||
        driverSettings.P_IS_FINGERPRINT_ENABLED;
      const isFaceIdEnabled =
        driverSettings.isFaceIdEnabled || driverSettings.P_IS_FACE_ID_ENABLED;
      const isFaceRecognitionEnabled =
        driverSettings.isFaceRecognitionEnabled ||
        driverSettings.P_IS_FACE_RECOGNITION_ENABLED;

      if (isFaceRecognitionEnabled !== undefined) {
        settings.loginSettings.enableFaceRecognition =
          isFaceRecognitionEnabled === "YES" ||
          isFaceRecognitionEnabled === true;
      }
      if (isFaceIdEnabled !== undefined) {
        settings.loginSettings.enableFaceId =
          isFaceIdEnabled === "YES" || isFaceIdEnabled === true;
      }
      if (isFingerprintEnabled !== undefined) {
        settings.loginSettings.enableFingerprint =
          isFingerprintEnabled === "YES" || isFingerprintEnabled === true;
      }

      // Log after transformation
      console.log("[SettingsContext] After transformation:", {
        enableFaceRecognition: settings.loginSettings.enableFaceRecognition,
        enableFaceId: settings.loginSettings.enableFaceId,
        enableFingerprint: settings.loginSettings.enableFingerprint,
      });

      // Transform featured driver and auto-bid settings
      const featuredDriverPrice =
        driverSettings.featuredDriverPriceUsd ||
        driverSettings.P_FEATURED_DRIVER_PRICE_USD;
      if (featuredDriverPrice !== undefined) {
        settings.featuredDriverPriceUSD =
          typeof featuredDriverPrice === "number"
            ? featuredDriverPrice
            : parseFloat(featuredDriverPrice) || 0;
      }

      const etaBuffer =
        driverSettings.etaBufferMinutes ||
        driverSettings.addExtraTimeToEtaAmount ||
        driverSettings.P_ETA_BUFFER_MINUTES;
      if (etaBuffer !== undefined) {
        settings.etaBufferMinutes =
          typeof etaBuffer === "number"
            ? etaBuffer
            : parseInt(etaBuffer, 10) || 0;
      }

      const isAutoBidEnabled =
        driverSettings.isAutoBidEnabled || driverSettings.P_IS_AUTO_BID_ENABLED;
      if (isAutoBidEnabled !== undefined) {
        settings.autoBidEnabled =
          isAutoBidEnabled === "YES" || isAutoBidEnabled === true;
      }

      const autoBidAmount =
        driverSettings.autoBidOnRideOffersAmount ||
        driverSettings.P_AUTO_BID_ON_RIDE_OFFERS_AMOUNT;
      if (autoBidAmount !== undefined) {
        // Map amount to strategy (simplified - can be enhanced)
        settings.autoBidStrategy = autoBidAmount?.toString() || null;
      }

      return settings;
    },
    [],
  );

  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { settingsApiClient } = await import("@/config/apiConfig");
      const { DRIVER_SETTINGS_ENDPOINTS } =
        await import("@/constants/endpoints");

      const response = await settingsApiClient.get(
        DRIVER_SETTINGS_ENDPOINTS.getSettings,
      );

      // Check if the response indicates success or failure
      const responseData = response?.data;
      const hasSuccessFlag = responseData?.success === true;
      const dbResponseCode = responseData?.data?.jHeader?.responseCode;
      const isDbSuccess =
        dbResponseCode === undefined ||
        dbResponseCode === "0" ||
        dbResponseCode === 0;

      // If any check fails, throw error
      if (responseData?.success === false || !isDbSuccess || !hasSuccessFlag) {
        const errorMessage =
          responseData?.message ||
          responseData?.data?.jHeader?.message ||
          responseData?.error ||
          "Failed to fetch settings from backend";

        throw new Error(errorMessage);
      }

      // Transform DB response to mobile app format
      const dbData = responseData?.data?.jData || {};
      const transformedSettings = transformDbResponseToSettings(dbData);
      // Merge with defaults to ensure all keys are present
      const mergedSettings: SettingsObject = {
        ...DEFAULT_SETTINGS,
        ...transformedSettings,
        loginSettings: {
          ...DEFAULT_SETTINGS.loginSettings,
          ...transformedSettings.loginSettings,
        },
        ridePreferences: {
          ...DEFAULT_SETTINGS.ridePreferences,
          ...transformedSettings.ridePreferences,
          homePage: {
            ...DEFAULT_SETTINGS.ridePreferences.homePage,
            ...transformedSettings.ridePreferences.homePage,
          },
          rideTypes: {
            ...DEFAULT_SETTINGS.ridePreferences.rideTypes,
            ...transformedSettings.ridePreferences.rideTypes,
          },
        },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...transformedSettings.notifications,
        },
      };

      // Update state and local storage
      dispatch({ type: "SET", payload: mergedSettings });
      try {
        await setStorageItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(mergedSettings),
        );
      } catch (storageErr) {
        console.warn("Local storage save failed:", storageErr);
      }

      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error: any) {
      // Extract error message
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.data?.jHeader?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to fetch settings from backend";

      console.warn("[SettingsContext] Error fetching settings:", errorMessage);

      dispatch({ type: "SET_ERROR", payload: errorMessage });
      dispatch({ type: "SET_LOADING", payload: false });

      // Don't throw - allow app to continue with local/default settings
    }
  }, [transformDbResponseToSettings]);

  const contextValue = useMemo<SettingsContextValue>(() => {
    return [
      state.settings ?? DEFAULT_SETTINGS,
      setSettings,
      {
        isLoading: state.isLoading,
        error: state.error,
        clearError,
        fetchSettings,
      },
    ];
  }, [
    state.settings,
    state.isLoading,
    state.error,
    setSettings,
    clearError,
    fetchSettings,
  ]);

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
