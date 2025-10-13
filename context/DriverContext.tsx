import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  DRIVER_STORAGE_KEY,
  LOCAL_JOB_STATUS,
  NotificationType,
  TRIP_OFFER_ACTIONS,
  type LocalJobStatus,
} from "@/constants/global";

import { usePost } from "@/hooks/usePost";
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
import { useAuth } from "./AuthContext";

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
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  hiddenLiveOffers: HiddenLiveOffer[];
  hideLiveOffer: (offerId: string) => Promise<void>;
  skipLiveOffer: (offerId: string) => Promise<void>;
  getLiveOfferStatus: (offerId: string) => HiddenLiveOffer | undefined;
  unhideLiveOffer: (offerId: string) => Promise<void>;
};

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);
  const [auth] = useAuth();
  const driverId = auth?.user?.id;

  // API hook for driver responses
  const { execute: submitDriverResponse } = usePost(
    LIVE_JOB_ENDPOINTS.driverResponse,
    API_CLIENT_TYPES.AUCTION
  );

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

  // Delete a single notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!state.driver) {
        log("Cannot delete notification: No driver data available");
        return;
      }

      log(`Deleting notification with ID: ${notificationId}`);

      const currentNotifications = state.driver.notifications || [];
      const currentReadIds = state.driver.readNotificationIds || [];

      // Check if notification exists
      const notificationExists = currentNotifications.some(
        (notification) => notification.id === notificationId
      );

      if (!notificationExists) {
        log(`Notification with ID ${notificationId} not found`);
        return;
      }

      // Remove notification from notifications array
      const updatedNotifications = currentNotifications.filter(
        (notification) => notification.id !== notificationId
      );

      // Remove notification ID from readNotificationIds if it exists
      const updatedReadIds = currentReadIds.filter(
        (id) => id !== notificationId
      );

      const updatedDriver = {
        ...state.driver,
        notifications: updatedNotifications,
        readNotificationIds: updatedReadIds,
      };

      try {
        await setDriver(updatedDriver);
        log(
          `Notification ${notificationId} deleted successfully from context and AsyncStorage`
        );
      } catch (error) {
        log(`Error deleting notification ${notificationId}:`, error);
        throw error;
      }
    },
    [state.driver, setDriver, log]
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!state.driver) {
      log("Cannot delete all notifications: No driver data available");
      return;
    }

    const currentNotifications = state.driver.notifications || [];
    const currentReadIds = state.driver.readNotificationIds || [];

    if (currentNotifications.length === 0 && currentReadIds.length === 0) {
      log("No notifications to delete");
      return;
    }

    log(
      `Deleting all notifications (${currentNotifications.length} notifications, ${currentReadIds.length} read IDs)`
    );

    const updatedDriver = {
      ...state.driver,
      notifications: [],
      readNotificationIds: [],
    };

    try {
      await setDriver(updatedDriver);
      log(
        "All notifications deleted successfully from context and AsyncStorage"
      );
    } catch (error) {
      log("Error deleting all notifications:", error);
      throw error;
    }
  }, [state.driver, setDriver, log]);

  // Get hidden live offers
  const hiddenLiveOffers = useMemo(() => {
    return state.driver?.hiddenLiveOffers || [];
  }, [state.driver?.hiddenLiveOffers]);

  // Hide live offer
  const hideLiveOffer = useCallback(
    async (offerId: string) => {
      if (!state.driver) return;

      try {
        log(`[DriverContext] Hiding offer ${offerId} - calling API`);

        // Call API first
        await submitDriverResponse({
          driverId: driverId,
          tripId: offerId,
          response: TRIP_OFFER_ACTIONS.HIDE,
        });

        log(
          `[DriverContext] API success - updating local state for offer ${offerId}`
        );

        // Only update local state if API succeeds
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
      } catch (error) {
        log(`[DriverContext] Failed to hide offer ${offerId}:`, error);
        // Re-throw error so UI can handle it
        throw error;
      }
    },
    [state.driver, setDriver, submitDriverResponse, driverId, log]
  );

  // Skip live offer
  const skipLiveOffer = useCallback(
    async (offerId: string) => {
      if (!state.driver) return;

      try {
        log(`[DriverContext] Skipping offer ${offerId} - calling API`);

        // Call API first
        await submitDriverResponse({
          driverId: driverId,
          tripId: offerId,
          response: TRIP_OFFER_ACTIONS.SKIP,
        });

        log(
          `[DriverContext] API success - updating local state for offer ${offerId}`
        );

        // Only update local state if API succeeds
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
      } catch (error) {
        log(`[DriverContext] Failed to skip offer ${offerId}:`, error);
        // Re-throw error so UI can handle it
        throw error;
      }
    },
    [state.driver, setDriver, submitDriverResponse, driverId, log]
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
      deleteNotification,
      deleteAllNotifications,
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
    deleteNotification,
    deleteAllNotifications,
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
