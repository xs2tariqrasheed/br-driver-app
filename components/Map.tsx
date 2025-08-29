import { textColors } from "@/constants/colors";
import { GOOGLE_MAPS_API_KEY } from "@/constants/global";
import {
  getCurrentLocation,
  LocationCoordinates,
  MapRegion,
  reverseGeocode,
} from "@/utils/helpers";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Typography from "./Typography";

/**
 * Props for the Map component
 */
interface MapProps {
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
 * A React Native map component for location selection.
 *
 * ⚠️ **Note:** This component is currently disabled and shows a placeholder message.
 * For actual map functionality, please use the MapWebView component instead.
 *
 * Features:
 * - Location permission handling
 * - Reverse geocoding to convert coordinates to addresses
 * - Callback system for location selection
 * - Fallback handling for location services
 *
 * @param props - The component props
 * @param props.onLocationSelect - Callback function called when a location is selected
 * @param props.initialRegion - Optional initial map region to display
 * @returns JSX element containing the map interface (currently disabled)
 *
 * @example
 * ```tsx
 * <Map
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
export default function Map({ onLocationSelect, initialRegion }: MapProps) {
  // Google Maps API key for geocoding and map display
  // Google Maps API key is imported from global constants

  // Reference to the MapView component (currently commented out)
  // const mapRef = useRef<MapView>(null);

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

  // Loading state to show spinner while initializing
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
   * @param event - The map press event containing coordinate data
   */
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    // Update local state with selected coordinates
    setSelectedLocation({ latitude, longitude });

    try {
      // Convert coordinates to human-readable address using helper function
      const address = await reverseGeocode(
        latitude,
        longitude,
        GOOGLE_MAPS_API_KEY
      );
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

  /**
   * Handles region changes when the user pans or zooms the map.
   * Updates the current region state to reflect the new map view.
   *
   * @param newRegion - The new map region data
   */
  const handleRegionChange = (newRegion: MapRegion) => {
    setRegion(newRegion);
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
      {/* MapView component commented out - using MapWebView instead */}
      <View style={styles.map}>
        <Typography type="bodyMedium" style={styles.disabledText}>
          Map component disabled - please use MapWebView component
        </Typography>
      </View>

      <View style={styles.overlay}>
        <View style={styles.instructionContainer}>
          <Typography
            type="bodySmall"
            weight="semibold"
            style={styles.instructionText}
          >
            Map component disabled - please use MapWebView component
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.grey100,
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
  disabledText: {
    color: textColors.grey600,
    textAlign: "center",
  },
  overlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  instructionContainer: {
    backgroundColor: textColors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: textColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    color: textColors.grey700,
    textAlign: "center",
  },
});
