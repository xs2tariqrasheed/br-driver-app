import * as Device from "expo-device";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

export type PermissionType = "location" | "notifications";

export type PermissionStatusMap = {
  location: Location.PermissionStatus | "unavailable";
  notifications: Notifications.PermissionStatus | "unavailable";
};

export type UseAppPermissionsResult = {
  statuses: PermissionStatusMap;
  isAllGranted: boolean;
  isAnyDenied: boolean;
  isLoading: boolean;
  requestAll: () => Promise<void>;
  requestLocation: () => Promise<void>;
  requestNotifications: () => Promise<void>;
  openSettingsIfDenied: () => void;
};

/**
 * useAppPermissions centralizes Location + Push Notifications permissions on iOS/Android.
 * It handles: initial check, request flow, foreground app state changes, and convenience booleans.
 */
export function useAppPermissions(): UseAppPermissionsResult {
  const [statuses, setStatuses] = useState<PermissionStatusMap>({
    location: "unavailable",
    notifications: "unavailable",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const updateStatuses = useCallback(
    (next: Partial<PermissionStatusMap>) =>
      setStatuses((prev) => ({ ...prev, ...next })),
    []
  );

  const checkLocation = useCallback(async () => {
    try {
      // Ask for foreground accuracy (drivers usually need foreground; background optional by product)
      const { status } = await Location.getForegroundPermissionsAsync();
      updateStatuses({ location: status });
    } catch (e) {
      updateStatuses({ location: "unavailable" });
    }
  }, [updateStatuses]);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      updateStatuses({ location: status });
    } catch (e) {
      updateStatuses({ location: "unavailable" });
    }
  }, [updateStatuses]);

  const checkNotifications = useCallback(async () => {
    try {
      if (!Device.isDevice) {
        updateStatuses({
          notifications: "granted" as Notifications.PermissionStatus,
        });
        return;
      }
      const settings = await Notifications.getPermissionsAsync();
      updateStatuses({ notifications: settings.status });
    } catch (e) {
      updateStatuses({ notifications: "unavailable" });
    }
  }, [updateStatuses]);

  const requestNotifications = useCallback(async () => {
    try {
      if (!Device.isDevice) {
        updateStatuses({
          notifications: "granted" as Notifications.PermissionStatus,
        });
        return;
      }
      const settings = await Notifications.requestPermissionsAsync();
      updateStatuses({ notifications: settings.status });
    } catch (e) {
      updateStatuses({ notifications: "unavailable" });
    }
  }, [updateStatuses]);

  const requestAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([requestLocation(), requestNotifications()]);
    setIsLoading(false);
  }, [requestLocation, requestNotifications]);

  const openSettingsIfDenied = useCallback(() => {
    if (Platform.OS === "ios") {
      // On iOS, there is no module helper in expo-notifications to open settings.
      // Use Linking to open the app settings page.
      // Deferred import to avoid cycle and keep hook platform agnostic.
      const { Linking } = require("react-native");
      Linking.openSettings();
    } else {
      const IntentLauncher = require("expo-intent-launcher");
      // Open Android app notification settings page; fallback to general app settings.
      try {
        IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APP_NOTIFICATION_SETTINGS
        );
      } catch {
        IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS
        );
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      await Promise.all([checkLocation(), checkNotifications()]);
      if (mounted) setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [checkLocation, checkNotifications]);

  // Re-check when app comes to foreground (user might change in Settings)
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (next) => {
      const prev = appState.current;
      appState.current = next;
      if (prev.match(/inactive|background/) && next === "active") {
        await Promise.all([checkLocation(), checkNotifications()]);
      }
    });
    return () => sub.remove();
  }, [checkLocation, checkNotifications]);

  const isAllGranted = useMemo(() => {
    return (
      statuses.location === "granted" && statuses.notifications === "granted"
    );
  }, [statuses]);

  const isAnyDenied = useMemo(() => {
    const locDenied =
      statuses.location === "denied" || statuses.location === "unavailable";
    const notiDenied =
      statuses.notifications === "denied" ||
      statuses.notifications === "unavailable";
    return locDenied || notiDenied;
  }, [statuses]);

  return {
    statuses,
    isAllGranted,
    isAnyDenied,
    isLoading,
    requestAll,
    requestLocation,
    requestNotifications,
    openSettingsIfDenied,
  };
}

export default useAppPermissions;
