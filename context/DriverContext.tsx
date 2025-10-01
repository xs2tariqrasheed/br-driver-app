import {
  DRIVER_STORAGE_KEY,
  LOCAL_JOB_STATUS,
  NotificationType,
  type LocalJobStatus,
} from "@/constants/global";

import {
  DesiredDestination,
  filterExpiredDestinations,
  getStorageItem,
  logger,
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

// Re-export the DesiredDestination type for backward compatibility
export type { DesiredDestination };

export type NotificationItem = {
  id: string;
  messageTitle: string;
  messageBody: string;
  dateTime: string;
  messageType: "read" | "unread";
  isSpecial?: boolean;
  notificationType?: NotificationType;
  rideOfferData?: any;
};

export type HiddenLiveOffer = {
  id: string;
  status: LocalJobStatus;
  timestamp: number;
};

export type DriverObject = {
  online: boolean;
  desiredDestinations?: DesiredDestination[];
  notifications?: NotificationItem[];
  readNotificationIds?: string[];
  hiddenLiveOffers?: HiddenLiveOffer[];
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
] & {
  notifications: NotificationItem[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  addNotification: (notification: NotificationItem) => Promise<void>;
  addNotifications: (notifications: NotificationItem[]) => Promise<void>;
  getNotificationById: (id: string) => NotificationItem | undefined;
  hiddenLiveOffers: HiddenLiveOffer[];
  hideLiveOffer: (offerId: string) => Promise<void>;
  skipLiveOffer: (offerId: string) => Promise<void>;
  getLiveOfferStatus: (offerId: string) => HiddenLiveOffer | undefined;
  unhideLiveOffer: (offerId: string) => Promise<void>;
};

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);

  // Logger function
  const log = logger();

  // Hydrate once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await getStorageItem(DRIVER_STORAGE_KEY);
        let parsed: DriverObject = raw ? JSON.parse(raw) : null;

        // Filter out expired destinations if they exist
        if (
          parsed?.desiredDestinations &&
          parsed.desiredDestinations.length > 0
        ) {
          const { valid, expired } = filterExpiredDestinations(
            parsed.desiredDestinations
          );

          // Log expired destinations
          expired.forEach((dest) => {
            log(`Desired location has been expired and removed:`, {
              id: dest.id,
              address: dest.address,
              expired_at: dest.expired_at,
              created_at: dest.created_at,
            });
          });

          // Update parsed driver object with only valid destinations
          if (expired.length > 0) {
            parsed = {
              ...parsed,
              desiredDestinations: valid,
            };

            // Save the updated driver object back to storage
            if (parsed) {
              await setStorageItem(DRIVER_STORAGE_KEY, JSON.stringify(parsed));
            }
          }
        }

        // Initialize notifications array if it doesn't exist
        if (!parsed?.notifications) {
          log("No notifications found, initializing empty array");
          if (parsed) {
            parsed = {
              ...parsed,
              notifications: [],
              readNotificationIds: [],
            };
          } else {
            parsed = {
              online: false,
              notifications: [],
              readNotificationIds: [],
            };
          }
        }

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

  // Get notifications with read/unread status
  const notifications = useMemo(() => {
    const driverNotifications = state.driver?.notifications || [];
    const readIds = state.driver?.readNotificationIds || [];

    log(
      "Computing notifications - driver notifications:",
      driverNotifications.length,
      "read IDs:",
      readIds.length
    );

    const result = driverNotifications.map((notification) => ({
      ...notification,
      messageType: readIds.includes(notification.id)
        ? ("read" as const)
        : ("unread" as const),
    }));

    log(
      "Computed notifications result:",
      result.length,
      "unread:",
      result.filter((n) => n.messageType === "unread").length
    );
    return result;
  }, [state.driver?.notifications, state.driver?.readNotificationIds]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!state.driver) return;

      const currentReadIds = state.driver.readNotificationIds || [];
      if (currentReadIds.includes(notificationId)) return; // Already read

      const updatedDriver = {
        ...state.driver,
        readNotificationIds: [...currentReadIds, notificationId],
      };

      await setDriver(updatedDriver);
    },
    [state.driver, setDriver]
  );

  // Add new notification
  const addNotification = useCallback(
    async (notification: NotificationItem) => {
      if (!state.driver) return;

      const currentNotifications = state.driver.notifications || [];
      const updatedDriver = {
        ...state.driver,
        notifications: [notification, ...currentNotifications], // Add to beginning
      };

      await setDriver(updatedDriver);
    },
    [state.driver, setDriver]
  );

  // Add multiple notifications at once
  const addNotifications = useCallback(
    async (notifications: NotificationItem[]) => {
      log(
        "addNotifications called with:",
        notifications.length,
        "notifications"
      );

      // If no driver exists yet, create a basic one
      if (!state.driver) {
        log("No driver exists, creating new one with notifications");
        const newDriver: DriverObject = {
          online: false,
          notifications: notifications,
          readNotificationIds: [],
        };
        await setDriver(newDriver);
        log("New driver created with notifications");
        return;
      }

      const currentNotifications = state.driver.notifications || [];
      log("Current notifications count:", currentNotifications.length);
      const updatedDriver = {
        ...state.driver,
        notifications: [...notifications, ...currentNotifications], // Add all to beginning
      };

      log(
        "Updated driver notifications count:",
        updatedDriver.notifications.length
      );
      await setDriver(updatedDriver);
      log("Driver updated successfully");
    },
    [state.driver, setDriver]
  );

  // Get notification by ID
  const getNotificationById = useCallback(
    (id: string) => {
      return notifications.find((notification) => notification.id === id);
    },
    [notifications]
  );

  // Get hidden live offers
  const hiddenLiveOffers = useMemo(() => {
    return state.driver?.hiddenLiveOffers || [];
  }, [state.driver?.hiddenLiveOffers]);

  // Hide live offer
  const hideLiveOffer = useCallback(
    async (offerId: string) => {
      if (!state.driver) return;

      const currentHiddenOffers = state.driver.hiddenLiveOffers || [];
      const existingOffer = currentHiddenOffers.find(
        (offer) => offer.id === offerId
      );

      if (existingOffer) {
        // Update existing offer status to hidden
        const updatedOffers = currentHiddenOffers.map((offer) =>
          offer.id === offerId
            ? {
                ...offer,
                status: LOCAL_JOB_STATUS.HIDDEN,
                timestamp: Date.now(),
              }
            : offer
        );

        const updatedDriver = {
          ...state.driver,
          hiddenLiveOffers: updatedOffers,
        };
        await setDriver(updatedDriver);
      } else {
        // Add new hidden offer
        const newHiddenOffer: HiddenLiveOffer = {
          id: offerId,
          status: LOCAL_JOB_STATUS.HIDDEN,
          timestamp: Date.now(),
        };

        const updatedDriver = {
          ...state.driver,
          hiddenLiveOffers: [...currentHiddenOffers, newHiddenOffer],
        };
        await setDriver(updatedDriver);
      }
    },
    [state.driver, setDriver]
  );

  // Skip live offer
  const skipLiveOffer = useCallback(
    async (offerId: string) => {
      if (!state.driver) return;

      const currentHiddenOffers = state.driver.hiddenLiveOffers || [];
      const existingOffer = currentHiddenOffers.find(
        (offer) => offer.id === offerId
      );

      if (existingOffer) {
        // Update existing offer status to skipped
        const updatedOffers = currentHiddenOffers.map((offer) =>
          offer.id === offerId
            ? {
                ...offer,
                status: LOCAL_JOB_STATUS.SKIPPED,
                timestamp: Date.now(),
              }
            : offer
        );

        const updatedDriver = {
          ...state.driver,
          hiddenLiveOffers: updatedOffers,
        };
        await setDriver(updatedDriver);
      } else {
        // Add new skipped offer
        const newSkippedOffer: HiddenLiveOffer = {
          id: offerId,
          status: LOCAL_JOB_STATUS.SKIPPED,
          timestamp: Date.now(),
        };

        const updatedDriver = {
          ...state.driver,
          hiddenLiveOffers: [...currentHiddenOffers, newSkippedOffer],
        };
        await setDriver(updatedDriver);
      }
    },
    [state.driver, setDriver]
  );

  // Get live offer status
  const getLiveOfferStatus = useCallback(
    (offerId: string) => {
      return hiddenLiveOffers.find((offer) => offer.id === offerId);
    },
    [hiddenLiveOffers]
  );

  // Unhide live offer (remove from hidden list)
  const unhideLiveOffer = useCallback(
    async (offerId: string) => {
      if (!state.driver) return;

      const currentHiddenOffers = state.driver.hiddenLiveOffers || [];
      const updatedOffers = currentHiddenOffers.filter(
        (offer) => offer.id !== offerId
      );

      const updatedDriver = {
        ...state.driver,
        hiddenLiveOffers: updatedOffers,
      };
      await setDriver(updatedDriver);
    },
    [state.driver, setDriver]
  );

  const contextValue = useMemo<DriverContextValue>(() => {
    const baseArray: [DriverObject, (value: DriverObject) => Promise<void>] = [
      state.driver,
      setDriver,
    ];

    // Add notification methods to the array object
    return Object.assign(baseArray, {
      notifications,
      markNotificationAsRead,
      addNotification,
      addNotifications,
      getNotificationById,
      hiddenLiveOffers,
      hideLiveOffer,
      skipLiveOffer,
      getLiveOfferStatus,
      unhideLiveOffer,
    });
  }, [
    state.driver,
    setDriver,
    notifications,
    markNotificationAsRead,
    addNotification,
    addNotifications,
    getNotificationById,
    hiddenLiveOffers,
    hideLiveOffer,
    skipLiveOffer,
    getLiveOfferStatus,
    unhideLiveOffer,
  ]);

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
