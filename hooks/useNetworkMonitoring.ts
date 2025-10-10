import { useNetwork } from "@/context/NetworkContext";
import { logger } from "@/utils/helpers";
import { useEffect, useRef } from "react";

interface UseNetworkMonitoringOptions {
  // Whether to show notifications for network issues
  showNotifications?: boolean;

  // Custom thresholds for slow/critical connections
  customThresholds?: {
    slow: number;
    critical: number;
  };

  // Callback functions for network state changes
  onNetworkQualityChange?: (quality: string) => void;
  onSlowConnection?: () => void;
  onCriticalConnection?: () => void;
  onConnectionRestored?: () => void;
}

export function useNetworkMonitoring(
  options: UseNetworkMonitoringOptions = {}
) {
  const {
    showNotifications = true,
    customThresholds,
    onNetworkQualityChange,
    onSlowConnection,
    onCriticalConnection,
    onConnectionRestored,
  } = options;

  const log = logger();
  const {
    isConnected,
    connectionType,
    networkQuality,
    isSlowConnection,
    isCriticalConnection,
    showNetworkWarning,
    hideNetworkWarning,
    isInternetReachable,
    connectionStrength,
    getRecommendedAction,
    getConnectionTypeDisplay,
    getNetworkQualityDisplay,
  } = useNetwork();

  const previousQualityRef = useRef<string>("offline");
  const slowConnectionCallbackRef = useRef(onSlowConnection);
  const criticalConnectionCallbackRef = useRef(onCriticalConnection);
  const connectionRestoredCallbackRef = useRef(onConnectionRestored);

  // Update callback refs when they change
  useEffect(() => {
    slowConnectionCallbackRef.current = onSlowConnection;
    criticalConnectionCallbackRef.current = onCriticalConnection;
    connectionRestoredCallbackRef.current = onConnectionRestored;
  }, [onSlowConnection, onCriticalConnection, onConnectionRestored]);

  // Monitor network quality changes
  useEffect(() => {
    const previousQuality = previousQualityRef.current;
    const currentQuality = networkQuality;

    // Only trigger callbacks if quality actually changed
    if (previousQuality !== currentQuality) {
      log("[useNetworkMonitoring] Network quality changed:", {
        from: previousQuality,
        to: currentQuality,
      });

      // Call the general quality change callback
      onNetworkQualityChange?.(currentQuality);

      // Call specific callbacks based on quality change
      if (currentQuality === "slow" && previousQuality !== "slow") {
        slowConnectionCallbackRef.current?.();
        log("[useNetworkMonitoring] Slow connection detected");
      }

      if (currentQuality === "critical" && previousQuality !== "critical") {
        criticalConnectionCallbackRef.current?.();
        log("[useNetworkMonitoring] Critical connection detected");
      }

      if (
        (currentQuality === "excellent" || currentQuality === "good") &&
        (previousQuality === "slow" || previousQuality === "critical")
      ) {
        connectionRestoredCallbackRef.current?.();
        log("[useNetworkMonitoring] Connection restored");
      }

      previousQualityRef.current = currentQuality;
    }
  }, [networkQuality, onNetworkQualityChange, log]);

  // Get network status summary
  const getNetworkStatus = () => {
    return {
      isConnected,
      connectionType,
      networkQuality,
      isSlowConnection,
      isCriticalConnection,
      isInternetReachable,
      connectionStrength,
      showNetworkWarning,
    };
  };

  // Check if network is suitable for specific operations
  const isNetworkSuitableFor = (
    operation: "socket" | "location" | "api" | "upload"
  ) => {
    switch (operation) {
      case "socket":
        // Socket connections need at least slow connection
        return networkQuality !== "offline" && networkQuality !== "critical";

      case "location":
        // Location tracking can work with any connection
        return isConnected;

      case "api":
        // API calls need at least slow connection
        return networkQuality !== "offline" && networkQuality !== "critical";

      case "upload":
        // Uploads need good connection
        return networkQuality === "excellent" || networkQuality === "good";

      default:
        return isConnected;
    }
  };

  return {
    // Network state
    ...getNetworkStatus(),

    // Actions
    hideNetworkWarning,

    // Utilities
    getNetworkStatus,
    isNetworkSuitableFor,
    getRecommendedAction,
    getConnectionTypeDisplay,
    getNetworkQualityDisplay,
  };
}
