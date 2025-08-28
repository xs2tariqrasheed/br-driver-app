import { textColors } from "@/constants/colors";
import {
  generateMapHTML,
  getCurrentLocation,
  handleWebViewLocationMessage,
  LocationCoordinates,
  LocationSelectData,
  logger,
  MapRegion,
  reverseGeocode,
} from "@/utils/helpers";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import Typography from "../Typography";

/**
 * Props for the CustomMap component
 */
interface CustomMapProps {
  /**
   * Callback function called when a location is selected on the map
   * @param address - The human-readable address of the selected location
   * @param coordinates - The latitude and longitude coordinates of the selected location
   */
  onLocationSelect: (address: string, coordinates: LocationCoordinates) => void;
  /**
   * Optional initial region to center the map on when it loads
   * If not provided, the map will attempt to use the user's current location
   */
  initialRegion?: MapRegion;
}

/**
 * A React Native component that displays an interactive Google Maps interface within a WebView.
 * Allows users to select locations on the map and provides address geocoding functionality.
 *
 * Features:
 * - Interactive Google Maps with location selection
 * - Automatic current location detection and centering
 * - Reverse geocoding to convert coordinates to human-readable addresses
 * - Click-to-select functionality for choosing locations
 * - Fallback handling for location permissions and geocoding failures
 *
 * @param props - The component props
 * @param props.onLocationSelect - Callback function called when a location is selected
 * @param props.initialRegion - Optional initial map region to display
 * @returns JSX element containing the WebView with embedded Google Maps
 *
 * @example
 * ```tsx
 * <CustomMap
 *   onLocationSelect={(address, coordinates) => {
 *     console.log('Selected:', address, coordinates);
 *   }}
 *   initialRegion={{
 *     latitude: 37.7749,
 *     longitude: -122.4194,
 *     latitudeDelta: 0.0922,
 *     longitudeDelta: 0.0421,
 *   }}
 * />
 * ```
 */
export default function CustomMap({
  onLocationSelect,
  initialRegion,
}: CustomMapProps) {
  // Google Maps API key for geocoding and map display
  const GOOGLE_MAPS_API_KEY = "AIzaSyDXb5djCy2217thBLl785mPmds2_qudYC8";

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

  // Logger function
  const log = logger();

  // Loading state to show spinner while map initializes
  const [isLoading, setIsLoading] = useState(true);

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
   *
   * This function is called when no initialRegion is provided to center the map
   * on the user's current location for better user experience.
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
      setIsLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setIsLoading(false);
    }
  };

  /**
   * Handles map press events by reverse geocoding the coordinates to get an address.
   * Updates the selected location state and calls the onLocationSelect callback.
   *
   * @param latitude - The latitude coordinate of the pressed location
   * @param longitude - The longitude coordinate of the pressed location
   */
  const handleMapPress = async (latitude: number, longitude: number) => {
    // Update local state with selected coordinates
    setSelectedLocation({ latitude, longitude });

    try {
      // Convert coordinates to human-readable address using helper function
      const address = await reverseGeocode(
        latitude,
        longitude,
        GOOGLE_MAPS_API_KEY
      );
      log("address", address);
      onLocationSelect(address, { latitude, longitude });
    } catch (error) {
      console.error("Error getting address:", error);
      // Fallback to coordinate string if geocoding fails
      onLocationSelect(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, {
        latitude,
        longitude,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Typography type="bodyMedium" style={styles.loadingText}>
          Loading map...
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML(region, GOOGLE_MAPS_API_KEY) }}
        style={styles.map}
        onMessage={(event) =>
          handleWebViewLocationMessage(
            event,
            (data: LocationSelectData) => {
              onLocationSelect(data.address, data.coordinates);
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
          log("WebView loaded");
          setIsLoading(false);
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
