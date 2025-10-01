import { DRIVER_ENDPOINTS } from "@/constants/endpoints";
import {
  MENTIONED_DISTANCE,
  ONLINE_LOCATION_INTERVAL_MS,
  PREVIOUS_LOCATION_STORAGE_KEY,
} from "@/constants/global";
import { useAuth } from "@/context/AuthContext";
import { useDriver } from "@/context/DriverContext";
import { usePost } from "@/hooks/usePost";
import { useSocket } from "@/hooks/useSocket";
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
  const { connectSocket, socketStatus } = useSocket({
    driverId: auth?.user?.id,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState === "active"
  );
  const [wasInBackground, setWasInBackground] = useState(false);

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
    }, appIsActive: ${appIsActive}, socketStatus: ${socketStatus}, trackingBlocked: ${trackingBlocked}, shouldTrack: ${shouldTrack}`
  );

  // Listen to AppState changes - Handle location tracking and socket reconnection
  // Note: We do NOT call offline API or disconnect socket on background
  // because the driver should stay online even when app is backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      const isActive = nextState === "active";
      const wasActive = appIsActive;

      log(
        `[OnlineLocationTracker] AppState changed to: ${nextState} (active: ${isActive}, wasActive: ${wasActive})`
      );

      // Track if we were in background
      if (!wasActive && isActive) {
        setWasInBackground(true);
        log(
          "[OnlineLocationTracker] App became active from background/inactive state"
        );
      } else if (wasActive && !isActive) {
        setWasInBackground(false);
        log("[OnlineLocationTracker] App went to background/inactive state");
      }

      setAppIsActive(isActive);

      // Reconnect socket when app becomes active and driver is online
      if (
        !wasActive &&
        isActive &&
        driver?.online &&
        socketStatus !== "connected"
      ) {
        try {
          log(
            "[OnlineLocationTracker] Reconnecting socket after app became active..."
          );
          await connectSocket();
          log("[OnlineLocationTracker] Socket reconnected successfully");
        } catch (error) {
          log("[OnlineLocationTracker] Failed to reconnect socket:", error);
        }
      }
    });
    return () => sub.remove();
  }, [log, appIsActive, driver?.online, socketStatus, connectSocket]);

  // Handle socket reconnection when driver comes online
  useEffect(() => {
    if (driver?.online && socketStatus !== "connected" && appIsActive) {
      const reconnectSocket = async () => {
        try {
          log(
            "[OnlineLocationTracker] Driver is online but socket not connected, reconnecting..."
          );
          await connectSocket();
          log("[OnlineLocationTracker] Socket reconnected for online driver");
        } catch (error) {
          log(
            "[OnlineLocationTracker] Failed to reconnect socket for online driver:",
            error
          );
        }
      };

      reconnectSocket();
    }
  }, [driver?.online, socketStatus, appIsActive, connectSocket, log]);

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
