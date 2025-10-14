import { LIVE_JOB_ENDPOINTS } from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  DRIVER_STORAGE_KEY,
  LOCAL_JOB_STATUS,
  NotificationType,
  RETRIEVAL_ID_STORAGE_KEY,
  RIDE_STATE_STORAGE_KEY,
  TRIP_ID_STORAGE_KEY,
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
  retrievalId?: string | null;
  tripId?: string | null;
  rideState?: string | null;
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
  // Retrieval ID functions
  setRetrievalId: (retrievalId: string) => Promise<void>;
  getRetrievalId: () => Promise<{
    retrievalId: string | null;
    loading: boolean;
  }>;
  removeRetrievalId: () => Promise<void>;
  // Trip ID functions
  setTripId: (tripId: string) => Promise<void>;
  getTripId: () => Promise<{
    tripId: string | null;
    loading: boolean;
  }>;
  removeTripId: () => Promise<void>;
  // Ride state functions
  setRideState: (rideState: string) => Promise<void>;
  getRideState: () => Promise<{
    rideState: string | null;
    loading: boolean;
  }>;
  removeRideState: () => Promise<void>;
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

  // Set retrieval ID (stores in both context and AsyncStorage)
  const setRetrievalId = useCallback(
    async (retrievalId: string) => {
      if (!state.driver) {
        log("Cannot set retrieval ID: No driver data available");
        return;
      }

      log(`Setting retrieval ID: ${retrievalId}`);

      // Update driver context
      const updatedDriver = {
        ...state.driver,
        retrievalId: retrievalId,
      };
      await setDriver(updatedDriver);

      // Store in AsyncStorage separately for easy access
      try {
        await setStorageItem(RETRIEVAL_ID_STORAGE_KEY, retrievalId);
        log(`Retrieval ID ${retrievalId} stored in AsyncStorage`);
      } catch (error) {
        log(`Error storing retrieval ID in AsyncStorage:`, error);
        throw error;
      }
    },
    [state.driver, setDriver, log]
  );

  // Set trip ID (stores in both context and AsyncStorage)
  const setTripId = useCallback(
    async (tripId: string) => {
      if (!state.driver) {
        log("Cannot set trip ID: No driver data available");
        return;
      }

      log(`Setting trip ID: ${tripId}`);

      // Update driver context
      const updatedDriver = {
        ...state.driver,
        tripId: tripId,
      };
      await setDriver(updatedDriver);

      // Store in AsyncStorage separately for easy access
      try {
        await setStorageItem(TRIP_ID_STORAGE_KEY, tripId);
        log(`Trip ID ${tripId} stored in AsyncStorage`);
      } catch (error) {
        log(`Error storing trip ID in AsyncStorage:`, error);
        throw error;
      }
    },
    [state.driver, setDriver, log]
  );

  // Get retrieval ID (retrieves from AsyncStorage and sets in context)
  const getRetrievalId = useCallback(async () => {
    log("Getting retrieval ID from AsyncStorage");

    try {
      const storedRetrievalId = await getStorageItem(RETRIEVAL_ID_STORAGE_KEY);
      // Retrieval ID is stored as a plain string, not JSON
      const retrievalId = storedRetrievalId || null;

      log(`Retrieved retrieval ID from AsyncStorage: ${retrievalId}`);

      // Update context if driver exists and ID is different
      if (state.driver && state.driver.retrievalId !== retrievalId) {
        const updatedDriver = {
          ...state.driver,
          retrievalId: retrievalId,
        };
        await setDriver(updatedDriver);
        log("Updated driver context with retrieval ID from AsyncStorage");
      }

      return { retrievalId, loading: false };
    } catch (error) {
      log(`Error getting retrieval ID from AsyncStorage:`, error);
      // If there's a JSON parse error, try to clear the corrupted data
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        log("Detected JSON parse error, clearing corrupted retrieval ID data");
        try {
          await removeStorageItem(RETRIEVAL_ID_STORAGE_KEY);
        } catch (clearError) {
          log("Error clearing corrupted retrieval ID data:", clearError);
        }
      }
      return { retrievalId: null, loading: false };
    }
  }, [state.driver, setDriver, log]);

  // Get trip ID (retrieves from AsyncStorage and sets in context)
  const getTripId = useCallback(async () => {
    log("Getting trip ID from AsyncStorage");

    try {
      const storedTripId = await getStorageItem(TRIP_ID_STORAGE_KEY);
      // Trip ID is stored as a plain string, not JSON
      const tripId = storedTripId || null;

      log(`Retrieved trip ID from AsyncStorage: ${tripId}`);

      // Update context if driver exists and ID is different
      if (state.driver && state.driver.tripId !== tripId) {
        const updatedDriver = {
          ...state.driver,
          tripId: tripId,
        };
        await setDriver(updatedDriver);
        log("Updated driver context with trip ID from AsyncStorage");
      }

      return { tripId, loading: false };
    } catch (error) {
      log(`Error getting trip ID from AsyncStorage:`, error);
      // If there's a JSON parse error, try to clear the corrupted data
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        log("Detected JSON parse error, clearing corrupted trip ID data");
        try {
          await removeStorageItem(TRIP_ID_STORAGE_KEY);
        } catch (clearError) {
          log("Error clearing corrupted trip ID data:", clearError);
        }
      }
      return { tripId: null, loading: false };
    }
  }, [state.driver, setDriver, log]);

  // Remove retrieval ID (removes from both context and AsyncStorage)
  const removeRetrievalId = useCallback(async () => {
    log("Removing retrieval ID from context and AsyncStorage");

    // Update driver context
    if (state.driver) {
      const updatedDriver = {
        ...state.driver,
        retrievalId: null,
      };
      await setDriver(updatedDriver);
    }

    // Remove from AsyncStorage
    try {
      await removeStorageItem(RETRIEVAL_ID_STORAGE_KEY);
      log("Retrieval ID removed from AsyncStorage");
    } catch (error) {
      log(`Error removing retrieval ID from AsyncStorage:`, error);
      throw error;
    }
  }, [state.driver, setDriver, log]);

  // Remove trip ID (removes from both context and AsyncStorage)
  const removeTripId = useCallback(async () => {
    log("Removing trip ID from context and AsyncStorage");

    // Update driver context
    if (state.driver) {
      const updatedDriver = {
        ...state.driver,
        tripId: null,
      };
      await setDriver(updatedDriver);
    }

    // Remove from AsyncStorage
    try {
      await removeStorageItem(TRIP_ID_STORAGE_KEY);
      log("Trip ID removed from AsyncStorage");
    } catch (error) {
      log(`Error removing trip ID from AsyncStorage:`, error);
      throw error;
    }
  }, [state.driver, setDriver, log]);

  // Ride state functions
  const setRideState = useCallback(
    async (rideState: string) => {
      log("Setting ride state in context and AsyncStorage:", rideState);

      // Update driver context
      if (state.driver) {
        const updatedDriver = {
          ...state.driver,
          rideState,
        };
        await setDriver(updatedDriver);
      }

      // Save to AsyncStorage
      try {
        await setStorageItem(RIDE_STATE_STORAGE_KEY, JSON.stringify(rideState));
        log("Ride state saved to AsyncStorage:", rideState);
      } catch (error) {
        log(`Error saving ride state to AsyncStorage:`, error);
        throw error;
      }
    },
    [state.driver, setDriver, log]
  );

  const getRideState = useCallback(async () => {
    log("Getting ride state from AsyncStorage");

    try {
      const storedRideState = await getStorageItem(RIDE_STATE_STORAGE_KEY);
      const rideState = storedRideState ? JSON.parse(storedRideState) : null;

      log(`Retrieved ride state from AsyncStorage: ${rideState}`);

      return {
        rideState,
        loading: false,
      };
    } catch (error) {
      log("Error getting ride state from AsyncStorage:", error);
      return {
        rideState: null,
        loading: false,
      };
    }
  }, []);

  const removeRideState = useCallback(async () => {
    log("Removing ride state from context and AsyncStorage");

    // Update driver context
    if (state.driver) {
      const updatedDriver = {
        ...state.driver,
        rideState: null,
      };
      await setDriver(updatedDriver);
    }

    // Remove from AsyncStorage
    try {
      await removeStorageItem(RIDE_STATE_STORAGE_KEY);
      log("Ride state removed from AsyncStorage");
    } catch (error) {
      log(`Error removing ride state from AsyncStorage:`, error);
      throw error;
    }
  }, [state.driver, setDriver, log]);

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
      setRetrievalId,
      getRetrievalId,
      removeRetrievalId,
      setTripId,
      getTripId,
      removeTripId,
      setRideState,
      getRideState,
      removeRideState,
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
    setRetrievalId,
    getRetrievalId,
    removeRetrievalId,
    setTripId,
    getTripId,
    removeTripId,
    setRideState,
    getRideState,
    removeRideState,
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
