import { DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
  MENTIONED_DISTANCE,
  ONLINE_LOCATION_INTERVAL_MS,
  PREVIOUS_LOCATION_STORAGE_KEY,
} from "@/constants/global";
import { useDriver } from "@/context/DriverContext";
import { usePost } from "@/hooks/usePost";
import {
  computeDeltaMetersAgainstThreshold,
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
  const [driver] = useDriver();
  const pathname = usePathname();
  const { execute: postOnlineLocation } = usePost(
    DRIVER_ENDPOINTS.postOnlineLocation
  );
  const intervalRef = useRef<NodeJS.Timer | null>(null);
  const appState = useRef(AppState.currentState);

  // Check if we're on the active-ride screen
  const isOnActiveRideScreen = pathname === "/(screens)/active-ride";

  const start = () => {
    // Don't start tracking if on active-ride screen
    if (isOnActiveRideScreen) {
      log(
        "[OnlineLocationTracker] Skipping location tracking - on active-ride screen"
      );
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current as unknown as number);
      intervalRef.current = null;
    }
    intervalRef.current = setInterval(async () => {
      try {
        if (!driver?.online) return;
        // Double check we're not on active-ride screen during interval
        if (isOnActiveRideScreen) return;

        const loc = await Location.getCurrentPositionAsync({});
        const current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        const prevRaw = await getStorageItem(PREVIOUS_LOCATION_STORAGE_KEY);
        const prev = prevRaw
          ? (JSON.parse(prevRaw) as { lat: number; lng: number })
          : null;
        const delta = computeDeltaMetersAgainstThreshold(
          prev,
          current,
          MENTIONED_DISTANCE
        );
        if (delta > 0) {
          await postOnlineLocation(current as any);
          await setStorageItem(
            PREVIOUS_LOCATION_STORAGE_KEY,
            JSON.stringify(current)
          );
        }
      } catch (e) {
        log("[OnlineLocationTracker] interval error", e);
      }
    }, ONLINE_LOCATION_INTERVAL_MS) as unknown as NodeJS.Timer;
  };

  useEffect(() => {
    if (driver?.online && !isOnActiveRideScreen) {
      start();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current as unknown as number);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as unknown as number);
        intervalRef.current = null;
      }
    };
  }, [driver?.online, isOnActiveRideScreen]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const was = appState.current;
      appState.current = nextState;
      if (was.match(/inactive|background/) && nextState === "active") {
        if (driver?.online && !isOnActiveRideScreen) start();
      }
    });
    return () => sub.remove();
  }, [driver?.online, isOnActiveRideScreen]);

  return null;
};

export default OnlineLocationTracker;
