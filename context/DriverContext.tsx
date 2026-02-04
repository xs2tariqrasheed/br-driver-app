import {
  LIVE_JOB_ENDPOINTS,
  NOTIFICATIONS_ENDPOINTS,
} from "@/constants/endpoints";
import {
  API_CLIENT_TYPES,
  DRIVER_STORAGE_KEY,
  LOCAL_JOB_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATIONS_BACKUP_STORAGE_KEY,
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
  useState,
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
  carType?: string; // Car type: "economy" | "sedan" | "suv" | "luxury"
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
  isLoadingDestinations: boolean;
  destinationsError: string | null;
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
  isLoadingDestinations: false,
  destinationsError: null,
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
      return { ...state, driver: action.payload, isHydrated: true };
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
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  replyToNotification: (
    notificationId: string,
    reply: string,
    affiliateNumber?: string
  ) => Promise<any>;
  addNotification: (notification: NotificationItem) => Promise<void>;
  addNotifications: (notifications: NotificationItem[]) => Promise<void>;
  getNotificationById: (id: string) => NotificationItem | undefined;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  // Notification loading states
  isFetchingNotifications: boolean;
  isMarkingAsRead: boolean;
  isDeletingNotification: boolean;
  isReplyingToNotification: boolean;
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
  // Last bid ETA (for biddable offers: show ETA on active-ride when backend has not stored it yet)
  setLastBidETA: (tripId: string, eta: number) => void;
  getLastBidETA: () => { tripId: string; eta: number } | null;
  clearLastBidETA: (tripId?: string) => void;
  // Ride state functions
  setRideState: (rideState: string) => Promise<void>;
  getRideState: () => Promise<{
    rideState: string | null;
    loading: boolean;
  }>;
  removeRideState: () => Promise<void>;
  // Desired destinations functions
  fetchDesiredDestinations: () => Promise<void>;
  createDesiredDestination: (
    destination: Omit<DesiredDestination, "id" | "created_at">
  ) => Promise<DesiredDestination>;
  updateDesiredDestination: (destination: DesiredDestination) => Promise<void>;
  deleteDesiredDestination: (id: string) => Promise<void>;
  isLoadingDestinations: boolean;
  destinationsError: string | null;
};

const DriverContext = createContext<DriverContextValue | undefined>(undefined);

/**
 * Create demo notifications for demonstration purposes
 * These notifications have different types and content
 */
export function createDemoNotifications(): NotificationItem[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      id: "demo-notification-1",
      messageTitle: "Special Ride Offer Available",
      messageBody:
        "A new premium ride offer is available near your location. Tap to view details and accept.",
      dateTime: oneHourAgo.toISOString(),
      messageType: "unread" as const, // Will be computed based on readNotificationIds
      notificationType: NOTIFICATION_TYPES.SPECIAL_RIDE_OFFER,
      isSpecial: true,
    },
    {
      id: "demo-notification-2",
      messageTitle: "Authorization Required",
      messageBody:
        "Please make a stop as requested by the customer and wait 8 mins. You will be paid extra for this stop.",
      dateTime: twoHoursAgo.toISOString(),
      messageType: "unread" as const, // Will be computed based on readNotificationIds
      notificationType: NOTIFICATION_TYPES.AUTHORIZATION,
      isSpecial: false,
    },
    {
      id: "demo-notification-3",
      messageTitle: "System Update",
      messageBody:
        "Your driver app has been updated with new features. Please restart the app to apply changes.",
      dateTime: threeHoursAgo.toISOString(),
      messageType: "unread" as const, // Will be computed based on readNotificationIds
      notificationType: NOTIFICATION_TYPES.INFO,
      isSpecial: false,
    },
    {
      id: "demo-notification-4",
      messageTitle: "Ride Completed Successfully",
      messageBody:
        "Your ride with customer John Doe has been completed. Payment of $45.50 has been processed.",
      dateTime: oneDayAgo.toISOString(),
      messageType: "unread" as const, // Will be computed based on readNotificationIds
      notificationType: NOTIFICATION_TYPES.SUCCESS,
      isSpecial: false,
    },
    {
      id: "demo-notification-5",
      messageTitle: "New Message Received",
      messageBody:
        "You have received a new message from customer. Tap to view and reply.",
      dateTime: oneHourAgo.toISOString(),
      messageType: "unread" as const, // Will be computed based on readNotificationIds
      notificationType: NOTIFICATION_TYPES.MESSAGE,
      isSpecial: false,
    },
  ];
}

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);
  const [auth] = useAuth();
  const driverId = auth?.user?.id;

  // Logger function - memoized to prevent infinite loops when used as a dependency
  const log = useMemo(() => logger(), []);

  // Use a ref to store the driver state to avoid dependency loops in callbacks
  const driverRef = React.useRef(state.driver);
  useEffect(() => {
    driverRef.current = state.driver;
  }, [state.driver]);

  // Loading states for notifications
  const [isFetchingNotifications, setIsFetchingNotifications] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isDeletingNotification, setIsDeletingNotification] = useState(false);
  const [isReplyingToNotification, setIsReplyingToNotification] =
    useState(false);

  // API hook for driver responses
  const { execute: submitDriverResponse } = usePost(
    LIVE_JOB_ENDPOINTS.driverResponse,
    API_CLIENT_TYPES.AUCTION
  );

  // Hydrate once on mount
  useEffect(() => {
    (async () => {
      try {
        // Check for notifications backup first (from logout)
        const notificationsBackupRaw = await getStorageItem(
          NOTIFICATIONS_BACKUP_STORAGE_KEY
        );
        let notificationsBackup: {
          notifications: any[];
          readNotificationIds: string[];
        } | null = null;

        if (notificationsBackupRaw) {
          try {
            const parsedBackup = JSON.parse(notificationsBackupRaw);
            notificationsBackup = parsedBackup;
            log(
              "Found notifications backup:",
              Array.isArray(parsedBackup?.notifications)
                ? parsedBackup.notifications.length
                : 0,
              "notifications"
            );
          } catch (parseError) {
            log("Error parsing notifications backup:", parseError);
            // Clear corrupted backup
            await removeStorageItem(NOTIFICATIONS_BACKUP_STORAGE_KEY);
          }
        }

        const raw = await getStorageItem(DRIVER_STORAGE_KEY);
        let parsed: DriverObject = raw ? JSON.parse(raw) : null;

        // Restore notifications from backup if they exist and driver exists
        if (notificationsBackup && parsed) {
          parsed = {
            ...parsed,
            notifications: notificationsBackup.notifications,
            readNotificationIds: notificationsBackup.readNotificationIds,
          };
          // Save restored notifications to driver storage
          await setStorageItem(DRIVER_STORAGE_KEY, JSON.stringify(parsed));
          // Remove backup after successful restoration
          await removeStorageItem(NOTIFICATIONS_BACKUP_STORAGE_KEY);
          log("Notifications restored from backup and backup cleared");
        }

        // Keep all destinations (valid + expired) so desired-destinations screen can show expired with "Expired" tag
        if (
          parsed?.desiredDestinations &&
          parsed.desiredDestinations.length > 0
        ) {
          const { expired } = filterExpiredDestinations(
            parsed.desiredDestinations
          );
          if (expired.length > 0) {
            log(
              `Desired destinations: ${expired.length} expired (shown in UI for user to delete)`
            );
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

  // Removed automatic fetch - notifications will be fetched when notifications screen is focused
  // This prevents infinite loops and unnecessary API calls

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

  // Fetch notifications from backend with fallback to demo
  const fetchNotifications = useCallback(async () => {
    setIsFetchingNotifications(true);
    try {
      const mergeById = (
        primary: NotificationItem[],
        secondary: NotificationItem[]
      ): NotificationItem[] => {
        const map = new Map<string, NotificationItem>();
        for (const n of [...primary, ...secondary]) {
          if (!map.has(n.id)) map.set(n.id, n);
        }
        return Array.from(map.values()).sort((a, b) => {
          const at = new Date(a.dateTime).getTime();
          const bt = new Date(b.dateTime).getTime();
          return bt - at;
        });
      };

      const currentDriver = driverRef.current;
      const existingNotifications = currentDriver?.notifications || [];

      // IMPORTANT:
      // Don't wipe locally-added notifications (e.g. sequential ride-offer notifications)
      // when backend is unavailable or empty. Only fall back to demo when we have nothing.
      if (!auth?.token) {
        if (existingNotifications.length > 0) {
          log(
            "[DriverContext] fetchNotifications: no auth token, preserving existing local notifications:",
            existingNotifications.length
          );
          return;
        }
        const demoNotifications = createDemoNotifications();
        // Ensure all demo notifications are unread
        const unreadDemoNotifications = demoNotifications.map((n) => ({
          ...n,
          messageType: "unread" as const,
        }));

        if (currentDriver) {
          await setDriver({
            ...currentDriver,
            notifications: unreadDemoNotifications,
            readNotificationIds: [],
          });
        } else {
          await setDriver({
            online: false,
            notifications: unreadDemoNotifications,
            readNotificationIds: [],
          });
        }
        return;
      }

      try {
        const { notificationsApiClient } = await import("@/config/apiConfig");
        const response = await notificationsApiClient.get(
          NOTIFICATIONS_ENDPOINTS.getNotifications
        );

        const responseData = response?.data;
        if (
          responseData?.success &&
          Array.isArray(responseData.data) &&
          responseData.data.length > 0
        ) {
          // Transform backend notifications to app format
          const backendNotifications: NotificationItem[] =
            responseData.data.map((item: any) => ({
              id: String(
                item.notification_rec_id ||
                  item.id ||
                  `notif-${Date.now()}-${Math.random()}`
              ),
              messageTitle:
                item.notification_title || item.title || "Notification",
              messageBody:
                item.notification_body || item.body || item.message || "",
              dateTime:
                item.created_at || item.dateTime || new Date().toISOString(),
              messageType: item.is_read
                ? ("read" as const)
                : ("unread" as const),
              isSpecial: item.is_special || false,
              notificationType: item.notification_type as
                | NotificationType
                | undefined,
            }));

          // Update read notification IDs based on backend data
          const readIds = backendNotifications
            .filter((n) => n.messageType === "read")
            .map((n) => n.id);

          if (currentDriver) {
            const merged = mergeById(
              existingNotifications,
              backendNotifications
            );
            const existingReadIds = currentDriver.readNotificationIds || [];
            await setDriver({
              ...currentDriver,
              notifications: merged,
              readNotificationIds: Array.from(
                new Set([...existingReadIds, ...readIds])
              ),
            });
          } else {
            await setDriver({
              online: false,
              notifications: backendNotifications,
              readNotificationIds: readIds,
            });
          }
          log(
            `Fetched ${backendNotifications.length} notifications from backend`
          );
        } else {
          // Empty response, use demo notifications
          throw new Error("Empty response or invalid format");
        }
      } catch (apiError: any) {
        log(
          "Error fetching notifications from backend, using demo notifications:",
          apiError
        );
        // Fallback: keep existing notifications if we have any; otherwise use demo.
        if (existingNotifications.length > 0) {
          log(
            "[DriverContext] fetchNotifications: backend failed, preserving existing local notifications:",
            existingNotifications.length
          );
          return;
        }

        // Fallback to demo notifications - all unread
        const demoNotifications = createDemoNotifications();
        const unreadDemoNotifications = demoNotifications.map((n) => ({
          ...n,
          messageType: "unread" as const,
        }));

        if (currentDriver) {
          await setDriver({
            ...currentDriver,
            notifications: unreadDemoNotifications,
            readNotificationIds: [],
          });
        } else {
          await setDriver({
            online: false,
            notifications: unreadDemoNotifications,
            readNotificationIds: [],
          });
        }
      }
    } finally {
      setIsFetchingNotifications(false);
    }
  }, [auth?.token, setDriver, log]); // Removed state.driver from dependencies

  // Mark notification as read
  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) return;

      const currentReadIds = currentDriver.readNotificationIds || [];
      if (currentReadIds.includes(notificationId)) return; // Already read

      setIsMarkingAsRead(true);
      try {
        // Optimistically update local state
        const updatedDriver = {
          ...currentDriver,
          readNotificationIds: [...currentReadIds, notificationId],
        };
        await setDriver(updatedDriver);

        // Call backend API
        try {
          const { notificationsApiClient } = await import("@/config/apiConfig");
          await notificationsApiClient.put(
            NOTIFICATIONS_ENDPOINTS.markAsRead(notificationId)
          );
          log(`Notification ${notificationId} marked as read in backend`);
        } catch (error: any) {
          log("Error marking notification as read in backend:", error);
          // Keep local state even if backend call fails
        }
      } finally {
        setIsMarkingAsRead(false);
      }
    },
    [setDriver, log] // Removed state.driver from dependencies
  );

  // Reply to actionable notification
  const replyToNotification = useCallback(
    async (notificationId: string, reply: string, affiliateNumber?: string) => {
      setIsReplyingToNotification(true);
      try {
        const { notificationsApiClient } = await import("@/config/apiConfig");
        const response = await notificationsApiClient.post(
          NOTIFICATIONS_ENDPOINTS.reply(notificationId),
          {
            reply,
            ...(affiliateNumber && { affiliateNumber }),
          }
        );
        log(`Reply sent for notification ${notificationId}`);
        return response.data;
      } catch (error: any) {
        log("Error replying to notification:", error);
        throw error;
      } finally {
        setIsReplyingToNotification(false);
      }
    },
    [log]
  );

  // Add new notification
  const addNotification = useCallback(
    async (notification: NotificationItem) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) return;

      const currentNotifications = currentDriver.notifications || [];
      const updatedDriver = {
        ...currentDriver,
        notifications: [notification, ...currentNotifications], // Add to beginning
      };

      await setDriver(updatedDriver);
    },
    [setDriver] // Removed state.driver from dependencies
  );

  // Add multiple notifications at once
  const addNotifications = useCallback(
    async (notifications: NotificationItem[]) => {
      log(
        "addNotifications called with:",
        notifications.length,
        "notifications"
      );

      const currentDriver = driverRef.current;
      // If no driver exists yet, create a basic one
      if (!currentDriver) {
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

      const currentNotifications = currentDriver.notifications || [];
      log("Current notifications count:", currentNotifications.length);
      const updatedDriver = {
        ...currentDriver,
        notifications: [...notifications, ...currentNotifications], // Add all to beginning
      };

      log(
        "Updated driver notifications count:",
        updatedDriver.notifications.length
      );
      await setDriver(updatedDriver);
      log("Driver updated successfully");
    },
    [setDriver, log]
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
      const currentDriver = driverRef.current;
      if (!currentDriver) {
        log("Cannot delete notification: No driver data available");
        return;
      }

      setIsDeletingNotification(true);
      try {
        log(`Deleting notification with ID: ${notificationId}`);

        const currentNotifications = currentDriver.notifications || [];
        const currentReadIds = currentDriver.readNotificationIds || [];

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
          ...currentDriver,
          notifications: updatedNotifications,
          readNotificationIds: updatedReadIds,
        };

        await setDriver(updatedDriver);
        log(
          `Notification ${notificationId} deleted successfully from context and AsyncStorage`
        );
      } catch (error) {
        log(`Error deleting notification ${notificationId}:`, error);
        throw error;
      } finally {
        setIsDeletingNotification(false);
      }
    },
    [setDriver, log] // Removed state.driver from dependencies
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    const currentDriver = driverRef.current;
    if (!currentDriver) {
      log("Cannot delete all notifications: No driver data available");
      return;
    }

    const currentNotifications = currentDriver.notifications || [];
    const currentReadIds = currentDriver.readNotificationIds || [];

    if (currentNotifications.length === 0 && currentReadIds.length === 0) {
      log("No notifications to delete");
      return;
    }

    log(
      `Deleting all notifications (${currentNotifications.length} notifications, ${currentReadIds.length} read IDs)`
    );

    const updatedDriver = {
      ...currentDriver,
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
  }, [setDriver, log]); // Removed state.driver from dependencies

  // Get hidden live offers
  const hiddenLiveOffers = useMemo(() => {
    return state.driver?.hiddenLiveOffers || [];
  }, [state.driver?.hiddenLiveOffers]);

  // Hide live offer
  const hideLiveOffer = useCallback(
    async (offerId: string) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) return;

      // Handle demo offers locally without API call
      if (offerId.startsWith("demo-")) {
        log(
          `[DriverContext] Hiding demo offer ${offerId} - local only, skipping API`
        );

        // Update local state only
        const currentHiddenOffers = currentDriver.hiddenLiveOffers || [];
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
            ...currentDriver,
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
            ...currentDriver,
            hiddenLiveOffers: [...currentHiddenOffers, newHiddenOffer],
          };
          await setDriver(updatedDriver);
        }
        return;
      }

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
        const currentHiddenOffers = currentDriver.hiddenLiveOffers || [];
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
            ...currentDriver,
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
            ...currentDriver,
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
    [setDriver, submitDriverResponse, driverId, log]
  );

  // Skip live offer
  const skipLiveOffer = useCallback(
    async (offerId: string) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) return;

      // Handle demo offers locally without API call
      if (offerId.startsWith("demo-")) {
        log(
          `[DriverContext] Skipping demo offer ${offerId} - local only, skipping API`
        );

        // Update local state only
        const currentHiddenOffers = currentDriver.hiddenLiveOffers || [];
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
            ...currentDriver,
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
            ...currentDriver,
            hiddenLiveOffers: [...currentHiddenOffers, newSkippedOffer],
          };
          await setDriver(updatedDriver);
        }
        return;
      }

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
        const currentHiddenOffers = currentDriver.hiddenLiveOffers || [];
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
            ...currentDriver,
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
            ...currentDriver,
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
    [setDriver, submitDriverResponse, driverId, log]
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
      const currentDriver = driverRef.current;
      if (!currentDriver) return;

      const currentHiddenOffers = currentDriver.hiddenLiveOffers || [];
      const updatedOffers = currentHiddenOffers.filter(
        (offer) => offer.id !== offerId
      );

      const updatedDriver = {
        ...currentDriver,
        hiddenLiveOffers: updatedOffers,
      };
      await setDriver(updatedDriver);
    },
    [setDriver]
  );

  // Set retrieval ID (stores in both context and AsyncStorage)
  const setRetrievalId = useCallback(
    async (retrievalId: string) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) {
        log("Cannot set retrieval ID: No driver data available");
        return;
      }

      log(`Setting retrieval ID: ${retrievalId}`);

      // Update driver context
      const updatedDriver = {
        ...currentDriver,
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
    [setDriver, log]
  );

  // Set trip ID (stores in both context and AsyncStorage)
  const setTripId = useCallback(
    async (tripId: string) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) {
        log("Cannot set trip ID: No driver data available");
        return;
      }

      log(`Setting trip ID: ${tripId}`);

      // Update driver context
      const updatedDriver = {
        ...currentDriver,
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
    [setDriver, log]
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
      const currentDriver = driverRef.current;
      if (currentDriver && currentDriver.retrievalId !== retrievalId) {
        const updatedDriver = {
          ...currentDriver,
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
  }, [setDriver, log]);

  // Get trip ID (retrieves from AsyncStorage and sets in context)
  const getTripId = useCallback(async () => {
    log("Getting trip ID from AsyncStorage");

    try {
      const storedTripId = await getStorageItem(TRIP_ID_STORAGE_KEY);
      // Trip ID is stored as a plain string, not JSON
      const tripId = storedTripId || null;

      log(`Retrieved trip ID from AsyncStorage: ${tripId}`);

      // Update context if driver exists and ID is different
      const currentDriver = driverRef.current;
      if (currentDriver && currentDriver.tripId !== tripId) {
        const updatedDriver = {
          ...currentDriver,
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
  }, [setDriver, log]);

  // Remove retrieval ID (removes from both context and AsyncStorage)
  const removeRetrievalId = useCallback(async () => {
    log("Removing retrieval ID from context and AsyncStorage");

    // Update driver context
    const currentDriver = driverRef.current;
    if (currentDriver) {
      const updatedDriver = {
        ...currentDriver,
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
  }, [setDriver, log]);

  // Remove trip ID (removes from both context and AsyncStorage)
  const removeTripId = useCallback(async () => {
    log("Removing trip ID from context and AsyncStorage");

    // Update driver context
    const currentDriver = driverRef.current;
    if (currentDriver) {
      const updatedDriver = {
        ...currentDriver,
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
  }, [setDriver, log]);

  // Last bid ETA (in-memory only): when driver submits a bid, we store ETA so active-ride can show it if get-eta returns null
  const lastBidETARef = React.useRef<{ tripId: string; eta: number } | null>(
    null
  );
  const setLastBidETA = useCallback(
    (tripId: string, eta: number) => {
      lastBidETARef.current = { tripId, eta };
      log(`Stored last bid ETA for trip ${tripId}: ${eta} mins`);
    },
    [log]
  );
  const getLastBidETA = useCallback(() => lastBidETARef.current, []);
  const clearLastBidETA = useCallback(
    (tripId?: string) => {
      if (tripId === undefined || lastBidETARef.current?.tripId === tripId) {
        lastBidETARef.current = null;
        if (tripId !== undefined)
          log(`Cleared last bid ETA for trip ${tripId}`);
      }
    },
    [log]
  );

  // Ride state functions
  const setRideState = useCallback(
    async (rideState: string) => {
      log("Setting ride state in context and AsyncStorage:", rideState);

      // Update driver context
      const currentDriver = driverRef.current;
      if (currentDriver) {
        const updatedDriver = {
          ...currentDriver,
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
    [setDriver, log]
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
    const currentDriver = driverRef.current;
    if (currentDriver) {
      const updatedDriver = {
        ...currentDriver,
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
  }, [setDriver, log]);

  // Desired destinations functions
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [destinationsError, setDestinationsError] = useState<string | null>(
    null
  );

  // Fetch desired destinations from backend
  const fetchDesiredDestinations = useCallback(async () => {
    const currentDriver = driverRef.current;
    if (!currentDriver) return;

    setIsLoadingDestinations(true);
    setDestinationsError(null);

    try {
      const { settingsApiClient } = await import("@/config/apiConfig");
      const { DESIRED_DESTINATIONS_ENDPOINTS } = await import(
        "@/constants/endpoints"
      );

      const response = await settingsApiClient.get(
        DESIRED_DESTINATIONS_ENDPOINTS.getDestinations
      );

      const responseData = response?.data;
      const hasSuccessFlag = responseData?.success === true;
      const dbResponseCode = responseData?.data?.jHeader?.responseCode;
      const isDbSuccess =
        dbResponseCode === undefined ||
        dbResponseCode === "0" ||
        dbResponseCode === 0;

      if (!hasSuccessFlag || !isDbSuccess) {
        const errorMessage =
          responseData?.message ||
          responseData?.data?.jHeader?.message ||
          responseData?.error ||
          "Failed to fetch desired destinations";
        throw new Error(errorMessage);
      }

      // Transform backend destinations to mobile app format
      // Backend returns data in jData.driverDesiredDestinations array
      const backendDestinations =
        responseData?.data?.jData?.driver_desired_destinations || [];
      console.log(
        "📥 [DriverContext] Backend destinations:",
        JSON.stringify(backendDestinations, null, 2)
      );
      const transformedDestinations: DesiredDestination[] =
        backendDestinations.map(
          (dest: any) =>
            ({
              id: dest.desired_destination_id || Date.now(),
              created_at: dest.created_at || new Date().toISOString(),
              address: dest.desired_destination || "",
              expired_at:
                dest.expires_at ||
                new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              // Include additional fields for editing
              googleReferenceNumber: dest.google_reference_number || "",
              latitude: dest.latitude || null,
              longitude: dest.longitude || null,
              targetZipCode: dest.target_zip_code || "",
              commissionPercentage:
                dest.comission_percentage || dest.commission_percentage || 0,
              priority: dest.priority || 1,
            } as any)
        );
      console.log(
        "📥 [DriverContext] Transformed destinations:",
        JSON.stringify(transformedDestinations, null, 2)
      );
      // Keep all destinations (valid + expired) so UI can show expired with "Expired" tag; max 3 valid enforced on screen
      const updatedDriver = {
        ...currentDriver,
        desiredDestinations: transformedDestinations,
      };
      await setDriver(updatedDriver);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.data?.jHeader?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to fetch desired destinations";
      log("Error fetching desired destinations:", errorMessage);
      setDestinationsError(errorMessage);
      throw error;
    } finally {
      setIsLoadingDestinations(false);
    }
  }, [setDriver, log]);

  // Create desired destination
  const createDesiredDestination = useCallback(
    async (destination: Omit<DesiredDestination, "id" | "created_at">) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) {
        throw new Error("Driver not found");
      }

      setIsLoadingDestinations(true);
      setDestinationsError(null);

      try {
        const { settingsApiClient } = await import("@/config/apiConfig");
        const { DESIRED_DESTINATIONS_ENDPOINTS } = await import(
          "@/constants/endpoints"
        );

        // Calculate expiry date (default to 6 hours from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 6);

        const response = await settingsApiClient.post(
          DESIRED_DESTINATIONS_ENDPOINTS.createDestination,
          {
            address: destination.address,
            expiresAt: destination.expired_at || expiryDate.toISOString(),
            googleReferenceNumber:
              (destination as any).googleReferenceNumber || "",
            latitude: (destination as any).latitude || null,
            longitude: (destination as any).longitude || null,
            targetZipCode: (destination as any).targetZipCode || "",
            commissionPercentage:
              (destination as any).commissionPercentage || 0,
          }
        );

        const responseData = response?.data;
        const hasSuccessFlag = responseData?.success === true;
        const dbResponseCode = responseData?.data?.jHeader?.responseCode;
        const isDbSuccess =
          dbResponseCode === undefined ||
          dbResponseCode === "0" ||
          dbResponseCode === 0;

        if (!hasSuccessFlag || !isDbSuccess) {
          const errorMessage =
            responseData?.message ||
            responseData?.data?.jHeader?.message ||
            responseData?.error ||
            "Failed to create desired destination";
          throw new Error(errorMessage);
        }

        // Create destination object with ID from backend or generate one
        const createdDestination: DesiredDestination = {
          id:
            responseData?.data?.jData?.driver_desired_destination_rec_id ||
            Date.now(),
          created_at: new Date().toISOString(),
          address: destination.address,
          expired_at: destination.expired_at || expiryDate.toISOString(),
        };

        // Update local state
        const currentDestinations = currentDriver.desiredDestinations || [];
        const updatedDriver = {
          ...currentDriver,
          desiredDestinations: [...currentDestinations, createdDestination],
        };
        await setDriver(updatedDriver);

        return createdDestination;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.data?.jHeader?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to create desired destination";
        log("Error creating desired destination:", errorMessage);
        setDestinationsError(errorMessage);
        throw error;
      } finally {
        setIsLoadingDestinations(false);
      }
    },
    [setDriver, log]
  );

  // Update desired destination
  const updateDesiredDestination = useCallback(
    async (destination: DesiredDestination) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) {
        throw new Error("Driver not found");
      }

      setIsLoadingDestinations(true);
      setDestinationsError(null);

      try {
        const { settingsApiClient } = await import("@/config/apiConfig");
        const { DESIRED_DESTINATIONS_ENDPOINTS } = await import(
          "@/constants/endpoints"
        );

        const destWithExtras = destination as any;
        const response = await settingsApiClient.put(
          DESIRED_DESTINATIONS_ENDPOINTS.updateDestination(destination.id),
          {
            id: destination.id,
            address: destination.address,
            expiresAt: destination.expired_at,
            googleReferenceNumber: destWithExtras.googleReferenceNumber || "",
            latitude: destWithExtras.latitude || null,
            longitude: destWithExtras.longitude || null,
            targetZipCode: destWithExtras.targetZipCode || "",
            priority: destWithExtras.priority || 1,
            commissionPercentage: destWithExtras.commissionPercentage || 0,
          }
        );

        const responseData = response?.data;
        const hasSuccessFlag = responseData?.success === true;
        const dbResponseCode = responseData?.data?.jHeader?.responseCode;
        const isDbSuccess =
          dbResponseCode === undefined ||
          dbResponseCode === "0" ||
          dbResponseCode === 0;

        if (!hasSuccessFlag || !isDbSuccess) {
          const errorMessage =
            responseData?.message ||
            responseData?.data?.jHeader?.message ||
            responseData?.error ||
            "Failed to update desired destination";
          throw new Error(errorMessage);
        }

        // Update local state
        const currentDestinations = currentDriver.desiredDestinations || [];
        const updatedDestinations = currentDestinations.map((dest) =>
          dest.id === destination.id ? destination : dest
        );
        const updatedDriver = {
          ...currentDriver,
          desiredDestinations: updatedDestinations,
        };
        await setDriver(updatedDriver);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.data?.jHeader?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to update desired destination";
        log("Error updating desired destination:", errorMessage);
        setDestinationsError(errorMessage);
        throw error;
      } finally {
        setIsLoadingDestinations(false);
      }
    },
    [setDriver, log]
  );

  // Delete desired destination
  const deleteDesiredDestination = useCallback(
    async (id: string) => {
      const currentDriver = driverRef.current;
      if (!currentDriver) {
        throw new Error("Driver not found");
      }

      setIsLoadingDestinations(true);
      setDestinationsError(null);

      try {
        const { settingsApiClient } = await import("@/config/apiConfig");
        const { DESIRED_DESTINATIONS_ENDPOINTS } = await import(
          "@/constants/endpoints"
        );

        const response = await settingsApiClient.delete(
          DESIRED_DESTINATIONS_ENDPOINTS.deleteDestination(id)
        );

        const responseData = response?.data;
        const hasSuccessFlag = responseData?.success === true;
        const dbResponseCode = responseData?.data?.jHeader?.responseCode;
        const isDbSuccess =
          dbResponseCode === undefined ||
          dbResponseCode === "0" ||
          dbResponseCode === 0;

        if (!hasSuccessFlag || !isDbSuccess) {
          const errorMessage =
            responseData?.message ||
            responseData?.data?.jHeader?.message ||
            responseData?.error ||
            "Failed to delete desired destination";
          throw new Error(errorMessage);
        }

        // Update local state
        const currentDestinations = currentDriver.desiredDestinations || [];
        const updatedDestinations = currentDestinations.filter(
          (dest) => dest.id !== id
        );
        const updatedDriver = {
          ...currentDriver,
          desiredDestinations: updatedDestinations,
        };
        await setDriver(updatedDriver);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.data?.jHeader?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to delete desired destination";
        log("Error deleting desired destination:", errorMessage);
        setDestinationsError(errorMessage);
        throw error;
      } finally {
        setIsLoadingDestinations(false);
      }
    },
    [setDriver, log]
  );

  const contextValue = useMemo<DriverContextValue>(() => {
    const baseArray: [DriverObject, (value: DriverObject) => Promise<void>] = [
      state.driver,
      setDriver,
    ];

    // Add notification methods to the array object
    return Object.assign(baseArray, {
      notifications,
      fetchNotifications,
      markNotificationAsRead,
      replyToNotification,
      addNotification,
      addNotifications,
      getNotificationById,
      deleteNotification,
      deleteAllNotifications,
      isFetchingNotifications,
      isMarkingAsRead,
      isDeletingNotification,
      isReplyingToNotification,
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
      setLastBidETA,
      getLastBidETA,
      clearLastBidETA,
      setRideState,
      getRideState,
      removeRideState,
      fetchDesiredDestinations,
      createDesiredDestination,
      updateDesiredDestination,
      deleteDesiredDestination,
      isLoadingDestinations,
      destinationsError,
    });
  }, [
    state.driver,
    setDriver,
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    replyToNotification,
    addNotification,
    addNotifications,
    getNotificationById,
    deleteNotification,
    deleteAllNotifications,
    isFetchingNotifications,
    isMarkingAsRead,
    isDeletingNotification,
    isReplyingToNotification,
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
    setLastBidETA,
    getLastBidETA,
    clearLastBidETA,
    setRideState,
    getRideState,
    removeRideState,
    fetchDesiredDestinations,
    createDesiredDestination,
    updateDesiredDestination,
    deleteDesiredDestination,
    isLoadingDestinations,
    destinationsError,
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
