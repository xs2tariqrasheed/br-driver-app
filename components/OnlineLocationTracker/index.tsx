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
import { connectSocket as connectOffersSocket, isOffersSocketConnected } from "@/utils/socket";
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
  const isTickInFlightRef = useRef(false);
  const lastSentLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const socketReconnectAttemptedRef = useRef(false); // Track socket reconnection attempts
  /** Sync with AppState without stale React closures (used for resume detection). */
  const appStateRef = useRef(AppState.currentState);
  /** Whether the location interval was already running for this "online + active" stretch. */
  const wasTrackingLocationRef = useRef(false);
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

  // Listen to AppState changes - socket + UI state
  // Note: We do NOT call offline API or disconnect socket on background
  // because the driver should stay online even when app is backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      const isActive = nextState === "active";
      const wasActive = prevState === "active";
      const becameActive = !wasActive && isActive;

      log(
        `[OnlineLocationTracker] AppState changed to: ${nextState} (active: ${isActive}, wasActive: ${wasActive})`
      );

      if (becameActive) {
        setWasInBackground(true);
        log(
          "[OnlineLocationTracker] App became active from background/inactive/killed resume"
        );
        // Allow socket reconnect effect to try again after errors / new process
        socketReconnectAttemptedRef.current = false;
        // Tracking effect will run a forced location POST when shouldTrack turns true again
        wasTrackingLocationRef.current = false;
      } else if (wasActive && !isActive) {
        setWasInBackground(false);
        log("[OnlineLocationTracker] App went to background/inactive state");
      }

      setAppIsActive(isActive);

      // Reconnect offers socket after resume if the TCP connection is gone (do not force new
      // socket when still connected — connectSocket() would tear down unnecessarily).
      if (
        becameActive &&
        driver?.online &&
        !trackingBlocked &&
        auth?.token &&
        !isOffersSocketConnected()
      ) {
        try {
          log(
            "[OnlineLocationTracker] Reconnecting socket after app became active..."
          );
          await connectOffersSocket();
          log("[OnlineLocationTracker] Socket reconnect finished after resume");
        } catch (error) {
          log("[OnlineLocationTracker] Failed to reconnect socket:", error);
        }
      }
    });
    return () => sub.remove();
  }, [log, driver?.online, trackingBlocked, auth?.token]);

  // Handle socket reconnection when driver comes online
  useEffect(() => {
    // Reset reconnection flag when socket connects successfully
    if (socketStatus === "connected") {
      socketReconnectAttemptedRef.current = false;
      return;
    }

    // Don't attempt reconnection if:
    // 1. Driver is not online
    // 2. App is not active
    // 3. Socket is connecting
    // 4. Socket is in error state (prevent infinite reconnection loop)
    // 5. Already attempted reconnection for this error
    if (
      !driver?.online ||
      !appIsActive ||
      socketStatus === "connecting" ||
      socketStatus === "error" ||
      socketReconnectAttemptedRef.current
    ) {
      return;
    }

    const reconnectSocket = async () => {
      try {
        socketReconnectAttemptedRef.current = true; // Mark as attempted
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
      wasTrackingLocationRef.current = false;
      log(
        "[OnlineLocationTracker] Tracking disabled - interval cleared and not restarting"
      );
      return;
    }

    log(
      "[OnlineLocationTracker] Starting location tracking - driver is online and conditions allow tracking"
    );

    const wasAlreadyTracking = wasTrackingLocationRef.current;
    wasTrackingLocationRef.current = true;

    // Function to run tracking tick
    const runTrackingTick = async () => {
      if (isTickInFlightRef.current) {
        log(
          "[OnlineLocationTracker] Previous tick still running - skipping this tick"
        );
        return;
      }

      isTickInFlightRef.current = true;
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const current = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };
        // Prefer in-memory last sent location (avoids AsyncStorage race conditions),
        // fall back to storage on cold start.
        let prev = lastSentLocationRef.current;
        if (!prev) {
          const prevRaw = await getStorageItem(PREVIOUS_LOCATION_STORAGE_KEY);
          prev = prevRaw
            ? (JSON.parse(prevRaw) as { lat: number; lng: number })
            : null;
          lastSentLocationRef.current = prev;
        }

        log(`[OnlineLocationTracker] Current: ${current.lat}, ${current.lng}`);
        log(
          `[OnlineLocationTracker] Previous: ${
            prev ? `${prev.lat}, ${prev.lng}` : "None"
          }`
        );

        // If we have never sent a location in this session, send once immediately
        // so backend has an initial position, then start threshold-based updates.
        if (!prev) {
          log(
            "[OnlineLocationTracker] No previous location found - sending initial location once"
          );
          await postOnlineLocation(current as any);
          await setStorageItem(
            PREVIOUS_LOCATION_STORAGE_KEY,
            JSON.stringify(current)
          );
          lastSentLocationRef.current = current;
          return;
        }

        // Strict dedupe: identical coordinates should never be re-sent.
        if (prev.lat === current.lat && prev.lng === current.lng) {
          log(
            "[OnlineLocationTracker] Location unchanged (lat/lng identical) - skipping API call"
          );
          return;
        }

        const distanceMeters = calculateDistanceMeters(prev, current);

        if (!Number.isFinite(distanceMeters)) {
          log(
            "[OnlineLocationTracker] Invalid distance calculated - skipping API call"
          );
          return;
        }

        if (distanceMeters >= MENTIONED_DISTANCE) {
          log(
            `[OnlineLocationTracker] Moved ${distanceMeters}m (threshold: ${MENTIONED_DISTANCE}m) - calling API`
          );
          await postOnlineLocation(current as any);
          await setStorageItem(
            PREVIOUS_LOCATION_STORAGE_KEY,
            JSON.stringify(current)
          );
          lastSentLocationRef.current = current;
        } else {
          log(
            `[OnlineLocationTracker] Moved ${distanceMeters}m (threshold: ${MENTIONED_DISTANCE}m) - skipping API call`
          );
        }
      } catch (e) {
        log("[OnlineLocationTracker] interval error", e);
      } finally {
        isTickInFlightRef.current = false;
      }
    };

    const kickoff = async () => {
      // After background, kill, or first time going "online + active": push location once
      // so the backend geo index / online-drivers sees the driver even if GPS hasn't moved.
      if (!wasAlreadyTracking) {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          const current = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          };
          log(
            "[OnlineLocationTracker] Resume/track-start — posting location to backend"
          );
          await postOnlineLocation(current as any);
          await setStorageItem(
            PREVIOUS_LOCATION_STORAGE_KEY,
            JSON.stringify(current)
          );
          lastSentLocationRef.current = current;
        } catch (e) {
          log("[OnlineLocationTracker] Resume location sync failed", e);
        }
      }

      await runTrackingTick();

      intervalRef.current = setInterval(
        runTrackingTick,
        ONLINE_LOCATION_INTERVAL_MS
      );
    };

    void kickoff();

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
