import { textColors } from "@/constants/colors";
import { GOOGLE_MAPS_API_KEY } from "@/constants/global";
import {
  generateHeatmapHTML,
  getCurrentLocation,
  handleWebViewLocationMessage,
  HeatmapDataPoint,
  HeatmapOptions,
  LocationCoordinates,
  LocationSelectData,
  logger,
  MapRegion,
} from "@/utils/helpers";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import Typography from "../Typography";

/**
 * Props for the HeatMapWebView component
 */
interface HeatMapWebViewProps {
  /**
   * Array of heatmap data points with coordinates, weights, and ETA information
   */
  heatmapData: HeatmapDataPoint[];
  /**
   * Callback function called when a location is selected on the map
   * @param address - The human-readable address of the selected location
   * @param coordinates - The latitude and longitude coordinates of the selected location
   */
  onLocationSelect?: (
    address: string,
    coordinates: LocationCoordinates
  ) => void;
  /**
   * Optional initial region to center the map on when it loads
   * If not provided, the map will attempt to use the user's current location
   */
  initialRegion?: MapRegion;
  /**
   * Options for customizing the heatmap appearance
   */
  heatmapOptions?: HeatmapOptions;
}

/**
 * A React Native component that displays an interactive Google Maps heatmap within a WebView.
 * Shows real-time demand data with color-coded intensity and ETA overlays for high-demand areas.
 *
 * Features:
 * - Interactive Google Maps heatmap with demand visualization
 * - ETA labels overlaid on high-demand areas
 * - Custom car icon for current location marker
 * - Color-coded demand levels (red=high, orange=medium, green=low)
 * - Legend showing demand level meanings
 * - Click-to-select functionality for choosing locations
 * - Zoom and pan controls for exploring different areas
 * - Real-time data updates
 *
 * @param props - The component props
 * @param props.heatmapData - Array of data points with lat/lng, weight, and ETA info
 * @param props.onLocationSelect - Optional callback when a location is selected
 * @param props.initialRegion - Optional initial map region to display
 * @param props.heatmapOptions - Optional customization options for heatmap appearance
 * @returns JSX element containing the WebView with embedded Google Maps heatmap
 *
 * @example
 * ```tsx
 * const heatmapData = [
 *   { lat: 37.7749, lng: -122.4194, weight: 0.9, eta: "3 mins", demandLevel: 'high' },
 *   { lat: 37.7849, lng: -122.4094, weight: 0.7, eta: "5 mins", demandLevel: 'medium' }
 * ];
 *
 * <HeatMapWebView
 *   heatmapData={heatmapData}
 *   onLocationSelect={(address, coordinates) => {
 *     console.log('Selected:', address, coordinates);
 *   }}
 *   heatmapOptions={{
 *     radius: 50,
 *     opacity: 0.7,
 *     showETALabels: true
 *   }}
 * />
 * ```
 */
export default function HeatMapWebView({
  heatmapData,
  onLocationSelect,
  initialRegion,
  heatmapOptions = {},
}: HeatMapWebViewProps) {
  // Google Maps API key is imported from global constants

  // Reference to the WebView component for direct manipulation
  const webViewRef = useRef<WebView>(null);

  // Current map region state - defines the visible area of the map
  const [region, setRegion] = useState<MapRegion>({
    latitude: 37.78825, // Default to San Francisco coordinates
    longitude: -122.4324,
    latitudeDelta: 0.0922, // Zoom level (smaller values = more zoomed in)
    longitudeDelta: 0.0421,
  });

  // Currently selected location coordinates
  const [selectedLocation, setSelectedLocation] =
    useState<LocationCoordinates | null>(null);

  // User's current location state
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);

  // Logger function
  const log = logger();

  // Loading state to show spinner while map initializes
  const [isLoading, setIsLoading] = useState(true);

  // Pickup icon URL - using the pickup icon for user location marker
  const pickupIconUrl = Image.resolveAssetSource(
    require("@/assets/images/pickup-icon.png")
  ).uri;

  useEffect(() => {
    if (initialRegion) {
      setRegion(initialRegion);
      setIsLoading(false);
    } else {
      initializeLocation();
    }
  }, [initialRegion]);

  /**
   * Initializes the map location by attempting to get the user's current location.
   * Falls back to default coordinates if location access fails.
   */
  const initializeLocation = async () => {
    try {
      // Define fallback region in case location access fails
      const fallbackRegion = {
        latitude: 37.78825, // San Francisco as fallback
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      // Attempt to get current location using helper function
      const currentLocation = await getCurrentLocation(fallbackRegion);
      setRegion(currentLocation);
      
      // Set user location for marker display
      setUserLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setIsLoading(false);
    }
  };

  /**
   * Handles map press events by processing the location selection.
   * Updates the selected location state and calls the onLocationSelect callback.
   */
  const handleMapPress = async (latitude: number, longitude: number) => {
    // Update local state with selected coordinates
    setSelectedLocation({ latitude, longitude });

    if (onLocationSelect) {
      // The address will be provided by the WebView's geocoding
      onLocationSelect(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, {
        latitude,
        longitude,
      });
    }
  };

  /**
   * Updates heatmap data dynamically by sending message to WebView
   */
  const updateHeatmapData = (newData: HeatmapDataPoint[]) => {
    if (webViewRef.current) {
      const script = `
        if (typeof window.updateHeatmapData === 'function') {
          window.updateHeatmapData(${JSON.stringify(newData)});
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  /**
   * Toggles heatmap visibility
   */
  const toggleHeatmapVisibility = (visible: boolean) => {
    if (webViewRef.current) {
      const script = `
        if (typeof window.toggleHeatmapVisibility === 'function') {
          window.toggleHeatmapVisibility(${visible});
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // Update heatmap when data changes
  useEffect(() => {
    if (!isLoading && heatmapData.length > 0) {
      // Small delay to ensure WebView is ready
      setTimeout(() => {
        updateHeatmapData(heatmapData);
      }, 1000);
    }
  }, [heatmapData, isLoading]);

  // Regenerate HTML when user location changes
  const [htmlKey, setHtmlKey] = useState(0);
  useEffect(() => {
    if (userLocation) {
      setHtmlKey(prev => prev + 1); // Force WebView to reload with new HTML
    }
  }, [userLocation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Typography type="bodyMedium" style={styles.loadingText}>
          Loading heatmap...
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={htmlKey}
        ref={webViewRef}
        source={{
          html: generateHeatmapHTML(
            region,
            GOOGLE_MAPS_API_KEY,
            heatmapData,
            {
              radius: 50,
              opacity: 0.7,
              showETALabels: true,
              ...heatmapOptions,
            },
            pickupIconUrl,
            userLocation
          ),
        }}
        style={styles.map}
        onMessage={(event) =>
          handleWebViewLocationMessage(
            event,
            (data: LocationSelectData) => {
              if (onLocationSelect) {
                onLocationSelect(data.address, data.coordinates);
              }
            },
            handleMapPress
          )
        }
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => {
          log("HeatMap WebView loaded");
          setIsLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          log("HeatMap WebView error:", nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          log("HeatMap WebView HTTP error:", nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.grey100,
  },
  loadingText: {
    color: textColors.grey600,
  },
});
