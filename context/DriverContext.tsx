import { DRIVER_STORAGE_KEY } from "@/constants/global";
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
};

export type DriverObject = {
  online: boolean;
  desiredDestinations?: DesiredDestination[];
  notifications?: NotificationItem[];
  readNotificationIds?: string[];
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

        // If no notifications exist, add sample ones
        if (!parsed?.notifications || parsed.notifications.length === 0) {
          log("No notifications found, adding sample ones");
          const sampleNotifications: NotificationItem[] = [
            {
              id: "1",
              messageTitle: "Ride Assigned",
              messageBody: "New ride request near you",
              dateTime: "2 mins ago",
              messageType: "unread",
              isSpecial: false,
            },
            {
              id: "2",
              messageTitle: "Make Stop",
              messageBody:
                "Please make a stop as requested by the customer and wait 8 mins you will be paid extra for this stop",
              dateTime: "Apr 10, 2025 10:30 am",
              messageType: "unread",
              isSpecial: true,
            },
            {
              id: "3",
              messageTitle: "Payment Received",
              messageBody:
                "You have received payment for your last ride. Amount: $25.50",
              dateTime: "1 hour ago",
              messageType: "unread",
              isSpecial: false,
            },
            {
              id: "4",
              messageTitle: "New Bonus Available",
              messageBody: "Complete 5 more rides today to earn a $10 bonus!",
              dateTime: "3 hours ago",
              messageType: "unread",
              isSpecial: false,
            },
          ];

          if (parsed) {
            parsed = {
              ...parsed,
              notifications: sampleNotifications,
              readNotificationIds: [],
            };
          } else {
            parsed = {
              online: false,
              notifications: sampleNotifications,
              readNotificationIds: [],
            };
          }

          log("Sample notifications added to parsed driver");
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
    });
  }, [
    state.driver,
    setDriver,
    notifications,
    markNotificationAsRead,
    addNotification,
    addNotifications,
    getNotificationById,
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
