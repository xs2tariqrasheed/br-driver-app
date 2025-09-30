import { DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
  MENTIONED_DISTANCE,
  ONLINE_LOCATION_INTERVAL_MS,
  PREVIOUS_LOCATION_STORAGE_KEY,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { usePost } from "@/hooks/usePost";
import {
  calculateDistanceMeters,
  getStorageItem,
  logger,
  setStorageItem,
} from "@/utils/helpers";
import * as Location from "expo-location";
import { usePathname } from "expo-router";
import React, { useEffect, useRef } from "react";
import { AppState } from "react-native";

const OnlineLocationTracker: React.FC = () => {
  const log = logger();
  const [auth] = useAuth();
  const [driver] = useDriver();
  const pathname = usePathname();
  const { execute: postOnlineLocation } = usePost(
    DRIVER_ENDPOINTS.postOnlineLocation(auth?.user?.id || "")
  );
  const intervalRef = useRef<NodeJS.Timer | null>(null);
  const appState = useRef(AppState.currentState);
  const driverOnlineRef = useRef<boolean>(!!driver?.online);
  const disableTrackingRef = useRef<boolean>(false);

  // Check if we should disable tracking
  const disableTracking =
    pathname === "/(screens)/active-ride" ||
    pathname.startsWith("/auth") ||
    !auth?.token ||
    !driver?.online;

  // Debug logging
  log(
    `[OnlineLocationTracker] Debug - pathname: ${pathname}, hasToken: ${!!auth?.token}, driverOnline: ${
      driver?.online
    }, disableTracking: ${disableTracking}`
  );

  // Keep latest values available inside interval callback without stale closures
  useEffect(() => {
    driverOnlineRef.current = !!driver?.online;
  }, [driver?.online]);

  useEffect(() => {
    disableTrackingRef.current = disableTracking;
  }, [disableTracking]);

  const start = () => {
    // Don't start tracking if conditions are met
    if (disableTrackingRef.current || !driverOnlineRef.current) {
      log(
        "[OnlineLocationTracker] Skipping location tracking - disabled due to current conditions"
      );
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current as unknown as number);
      intervalRef.current = null;
    }
    intervalRef.current = setInterval(async () => {
      try {
        // Double check using refs to avoid stale closures
        if (disableTrackingRef.current || !driverOnlineRef.current) {
          log(
            "[OnlineLocationTracker] Tracking disabled or driver offline - clearing interval"
          );
          if (intervalRef.current) {
            clearInterval(intervalRef.current as unknown as number);
            intervalRef.current = null;
          }
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const prevRaw = await getStorageItem(PREVIOUS_LOCATION_STORAGE_KEY);
        const prev = prevRaw
          ? (JSON.parse(prevRaw) as { lat: number; lng: number })
          : null;

        log(`[OnlineLocationTracker] Current: ${current.lat}, ${current.lng}`);
        log(
          `[OnlineLocationTracker] Previous: ${
            prev ? `${prev.lat}, ${prev.lng}` : "None"
          }`
        );
        const distanceMeters = calculateDistanceMeters(prev, current);
        if (distanceMeters > MENTIONED_DISTANCE) {
          log(
            `[OnlineLocationTracker] Moved ${distanceMeters}m (threshold: ${MENTIONED_DISTANCE}m) - calling API`
          );
          await postOnlineLocation(current as any);
          await setStorageItem(
            PREVIOUS_LOCATION_STORAGE_KEY,
            JSON.stringify(current)
          );
        } else {
          log(
            `[OnlineLocationTracker] Moved ${distanceMeters}m (threshold: ${MENTIONED_DISTANCE}m) - skipping API call`
          );
        }
      } catch (e) {
        log("[OnlineLocationTracker] interval error", e);
      }
    }, ONLINE_LOCATION_INTERVAL_MS) as unknown as NodeJS.Timer;
  };

  useEffect(() => {
    // React to state changes: ensure interval cleared when disabled/offline; start when allowed
    if (driver?.online && !disableTracking) {
      log(
        "[OnlineLocationTracker] Starting location tracking - driver is online"
      );
      start();
    } else {
      if (intervalRef.current) {
        log(
          "[OnlineLocationTracker] Clearing interval - tracking disabled or driver offline"
        );
        clearInterval(intervalRef.current as unknown as number);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        log("[OnlineLocationTracker] Cleanup - clearing interval on unmount");
        clearInterval(intervalRef.current as unknown as number);
        intervalRef.current = null;
      }
    };
  }, [driver?.online, disableTracking]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const was = appState.current;
      appState.current = nextState;
      if (was.match(/inactive|background/) && nextState === "active") {
        if (driverOnlineRef.current && !disableTrackingRef.current) {
          log(
            "[OnlineLocationTracker] App became active - restarting tracking"
          );
          start();
        } else {
          log(
            "[OnlineLocationTracker] App became active but tracking disabled/offline - not starting"
          );
        }
      }
    });
    return () => sub.remove();
  }, [driver?.online, disableTracking]);

  return null;
};

export default OnlineLocationTracker;
