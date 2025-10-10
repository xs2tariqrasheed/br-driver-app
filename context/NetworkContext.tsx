import { NETWORK_MONITORING, NetworkQuality } from "@/constants/global";
import { logger } from "@/utils/helpers";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface NetworkContextType {
  // Basic connection info
  isConnected: boolean;
  connectionType: string | null;

  // Network quality assessment
  networkQuality: NetworkQuality;
  isSlowConnection: boolean;
  isCriticalConnection: boolean;

  // UI state
  showNetworkWarning: boolean;
  hideNetworkWarning: () => void;

  // Network details
  isInternetReachable: boolean | null;
  connectionStrength: number | null; // 0-100 percentage
  getRecommendedAction: () => string;
  getConnectionTypeDisplay: () => string;
  getNetworkQualityDisplay: () => string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: React.ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const log = logger();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [networkQuality, setNetworkQuality] =
    useState<NetworkQuality>("offline");
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean | null
  >(null);
  const [connectionStrength, setConnectionStrength] = useState<number | null>(
    null
  );
  const [showNetworkWarning, setShowNetworkWarning] = useState<boolean>(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived states
  const isSlowConnection = networkQuality === "slow";
  const isCriticalConnection = networkQuality === "critical";

  // Assess network quality based on connection type and state
  const assessNetworkQuality = (netInfoState: NetInfoState): NetworkQuality => {
    // If not connected, return offline
    if (!netInfoState.isConnected) {
      return "offline";
    }

    // If connected but internet is not reachable, treat as offline
    if (netInfoState.isInternetReachable === false) {
      return "offline";
    }

    const { type, details } = netInfoState;
    const thresholds =
      NETWORK_MONITORING.CONNECTION_THRESHOLDS[
        type as keyof typeof NETWORK_MONITORING.CONNECTION_THRESHOLDS
      ] || NETWORK_MONITORING.CONNECTION_THRESHOLDS.unknown;

    // For now, we'll use connection type and basic heuristics
    // In a more advanced implementation, you could add actual bandwidth testing
    switch (type) {
      case "wifi":
        // WiFi is generally good, but we can check if it's slow based on other factors
        if (
          details &&
          "strength" in details &&
          typeof details.strength === "number"
        ) {
          const strength = details.strength;
          if (strength < 20) return "critical";
          if (strength < 50) return "slow";
          if (strength < 80) return "good";
          return "excellent";
        }
        return "good"; // Default for WiFi without strength info

      case "cellular":
        // Cellular quality depends on generation and signal strength
        if (details && "cellularGeneration" in details) {
          const generation = details.cellularGeneration;
          if (generation === "5g") return "excellent";
          if (generation === "4g") return "good";
          if (generation === "3g") return "slow";
          return "critical";
        }
        return "good"; // Default for cellular without generation info

      case "ethernet":
        return "excellent";

      case "bluetooth":
        return "slow";

      default:
        return "good";
    }
  };

  // Estimate connection strength based on connection type and details
  const estimateConnectionStrength = (
    netInfoState: NetInfoState
  ): number | null => {
    if (!netInfoState.isConnected) return null;

    const { type, details } = netInfoState;

    switch (type) {
      case "wifi":
        if (
          details &&
          "strength" in details &&
          typeof details.strength === "number"
        ) {
          return Math.max(0, Math.min(100, details.strength));
        }
        return 75; // Default WiFi strength

      case "cellular":
        if (details && "cellularGeneration" in details) {
          const generation = details.cellularGeneration;
          switch (generation) {
            case "5g":
              return 95;
            case "4g":
              return 80;
            case "3g":
              return 50;
            case "2g":
              return 20;
            default:
              return 60;
          }
        }
        return 60; // Default cellular strength

      case "ethernet":
        return 100;

      case "bluetooth":
        return 30;

      default:
        return 50;
    }
  };

  // Handle network state changes
  const handleNetworkStateChange = (state: NetInfoState) => {
    log("[NetworkContext] Network state changed:", {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });

    setIsConnected(state.isConnected ?? false);
    setConnectionType(state.type);
    setIsInternetReachable(state.isInternetReachable);

    const quality = assessNetworkQuality(state);
    setNetworkQuality(quality);

    const strength = estimateConnectionStrength(state);
    setConnectionStrength(strength);

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Show warning for offline, slow, or critical connections
    if (quality === "offline" || quality === "slow" || quality === "critical") {
      // Debounce showing warning to prevent flickering
      debounceTimeoutRef.current = setTimeout(() => {
        setShowNetworkWarning(true);
        log("[NetworkContext] Showing network warning for quality:", quality);
      }, 500); // 500ms delay
    } else if (quality === "excellent" || quality === "good") {
      // Hide warning immediately when connection improves
      setShowNetworkWarning(false);
      log(
        "[NetworkContext] Hiding network warning - connection improved to:",
        quality
      );
    }
  };

  // Manual function to hide network warning
  const hideNetworkWarning = () => {
    setShowNetworkWarning(false);
    log("[NetworkContext] Network warning manually hidden");
  };

  // Get recommended action based on network quality
  const getRecommendedAction = () => {
    switch (networkQuality) {
      case "offline":
        return "Check your internet connection";
      case "critical":
        return "Move to a better network area or wait for connection to improve";
      case "slow":
        return "Some features may work slowly. Consider moving to a better network area";
      case "good":
        return "Connection is good";
      case "excellent":
        return "Connection is excellent";
      default:
        return "Unknown network status";
    }
  };

  // Get connection type display name
  const getConnectionTypeDisplay = () => {
    if (!isConnected) return "Offline";

    switch (connectionType) {
      case "wifi":
        return "WiFi";
      case "cellular":
        return "Cellular";
      case "bluetooth":
        return "Bluetooth";
      case "ethernet":
        return "Ethernet";
      default:
        return connectionType || "Unknown";
    }
  };

  // Get network quality display name
  const getNetworkQualityDisplay = () => {
    switch (networkQuality) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "slow":
        return "Slow";
      case "critical":
        return "Critical";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  // Set up network monitoring
  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(handleNetworkStateChange);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkStateChange);

    return () => {
      unsubscribe();
      // Clear any pending debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const value: NetworkContextType = {
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
  };

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
