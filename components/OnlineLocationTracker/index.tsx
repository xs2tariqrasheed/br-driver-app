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
import React, { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

const OnlineLocationTracker: React.FC = () => {
  const log = logger();
  const [auth] = useAuth();
  const [driver] = useDriver();
  const pathname = usePathname();
  const { execute: postOnlineLocation } = usePost(
    DRIVER_ENDPOINTS.postOnlineLocation(auth?.user?.id || "")
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState === "active"
  );

  // Check if we should disable tracking
  const trackingBlocked =
    pathname === "/(screens)/active-ride" ||
    pathname.startsWith("/auth") ||
    !auth?.token;

  const shouldTrack = !!driver?.online && !trackingBlocked && appIsActive;

  // Debug logging
  log(
    `[OnlineLocationTracker] Debug - pathname: ${pathname}, hasToken: ${!!auth?.token}, driverOnline: ${
      driver?.online
    }, appIsActive: ${appIsActive}, trackingBlocked: ${trackingBlocked}, shouldTrack: ${shouldTrack}`
  );

  // Listen to AppState changes - ONLY update state, don't manage intervals
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const isActive = nextState === "active";
      log(
        `[OnlineLocationTracker] AppState changed to: ${nextState} (active: ${isActive})`
      );
      setAppIsActive(isActive);
    });
    return () => sub.remove();
  }, [log]);

  // Main tracking effect - reacts to shouldTrack changes
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      log(
        "[OnlineLocationTracker] Clearing existing interval before state change"
      );
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!shouldTrack) {
      log(
        "[OnlineLocationTracker] Tracking disabled - interval cleared and not restarting"
      );
      return;
    }

    log(
      "[OnlineLocationTracker] Starting location tracking - driver is online and conditions allow tracking"
    );

    // Function to run tracking tick
    const runTrackingTick = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const current = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };
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

        if (prev && !Number.isFinite(distanceMeters)) {
          log(
            "[OnlineLocationTracker] Invalid distance calculated - skipping API call"
          );
          return;
        }

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
    };

    // Run immediately
    runTrackingTick();

    // Start interval
    intervalRef.current = setInterval(
      runTrackingTick,
      ONLINE_LOCATION_INTERVAL_MS
    );

    // Cleanup on unmount or when shouldTrack changes
    return () => {
      if (intervalRef.current) {
        log(
          "[OnlineLocationTracker] Cleanup - clearing interval on unmount or dependency change"
        );
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldTrack, log, postOnlineLocation]);

  return null;
};

export default OnlineLocationTracker;
