import { textColors } from "@/constants/colors";
import {
  getCurrentLocation,
  HeatmapDataPoint,
  HeatmapOptions,
  LocationCoordinates,
  logger,
  MapRegion,
} from "@/utils/helpers";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import Typography from "../Typography";

/**
 * Props for the HeatMap component
 */
interface HeatMapProps {
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
 * Custom Overlay component for ETA labels
 */
interface ETAOverlayProps {
  coordinate: LocationCoordinates;
  eta: string;
}

const ETAOverlay = ({ coordinate, eta }: ETAOverlayProps) => {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View style={styles.etaLabel}>
        <Text style={styles.etaText}>ETA: {eta}</Text>
      </View>
    </Marker>
  );
};

/**
 * Legend component for demand levels
 */
const Legend = () => {
  return (
    <View style={styles.legend}>
      <Typography type="bodyMedium" style={styles.legendTitle}>
        Demand Level
      </Typography>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.legendColorHigh]} />
        <Typography type="bodySmall">High Demand</Typography>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.legendColorMedium]} />
        <Typography type="bodySmall">Medium Demand</Typography>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, styles.legendColorLow]} />
        <Typography type="bodySmall">Low Demand</Typography>
      </View>
    </View>
  );
};

/**
 * A React Native component that displays an interactive Google Maps heatmap using native MapView.
 * Shows real-time demand data with color-coded intensity and ETA overlays for high-demand areas.
 *
 * Features:
 * - Native Google Maps with demand visualization using circles
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
 * @returns JSX element containing the native MapView with heatmap visualization
 *
 * @example
 * ```tsx
 * const heatmapData = [
 *   { lat: 37.7749, lng: -122.4194, weight: 0.9, eta: "3 mins", demandLevel: 'high' },
 *   { lat: 37.7849, lng: -122.4094, weight: 0.7, eta: "5 mins", demandLevel: 'medium' }
 * ];
 *
 * <HeatMap
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
export default function HeatMap({
  heatmapData,
  onLocationSelect,
  initialRegion,
  heatmapOptions = {},
}: HeatMapProps) {
  // Reference to the MapView component for direct manipulation
  const mapRef = useRef<MapView>(null);

  // Current map region state - defines the visible area of the map
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128, // Default to New York coordinates
    longitude: -74.0060,
    latitudeDelta: 0.3, // Zoom level to show NYC area (smaller values = more zoomed in)
    longitudeDelta: 0.3,
  });

  // User's current location state
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(
    null
  );

  // Logger function
  const log = logger();

  // Loading state to show spinner while map initializes
  const [isLoading, setIsLoading] = useState(true);

  // Pickup icon for user location marker
  const pickupIcon = Image.resolveAssetSource(
    require("@/assets/images/pickup-icon.png")
  );

  // Heatmap options with defaults
  const { radius = 500, opacity = 0.7, showETALabels = true } = heatmapOptions;

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
        latitude: 40.7128, // New York as fallback
        longitude: -74.0060,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
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
   */
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    log("Map pressed at:", coordinate);

    if (onLocationSelect) {
      // For now, use coordinates as address
      // In production, you might want to use reverse geocoding
      const address = `${coordinate.latitude.toFixed(
        6
      )}, ${coordinate.longitude.toFixed(6)}`;
      onLocationSelect(address, {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
    }
  };

  /**
   * Get color for demand level
   */
  const getDemandColor = (
    demandLevel: "high" | "medium" | "low" | undefined
  ) => {
    switch (demandLevel) {
      case "high":
        return {
          fillColor: "rgba(221, 38, 38, 0.4)", // red-500 with opacity
          strokeColor: "rgba(221, 38, 38, 0.8)",
        };
      case "medium":
        return {
          fillColor: "rgba(221, 151, 38, 0.4)", // yellow-500 with opacity
          strokeColor: "rgba(221, 151, 38, 0.8)",
        };
      case "low":
        return {
          fillColor: "rgba(56, 221, 56, 0.4)", // green-500 with opacity
          strokeColor: "rgba(56, 221, 56, 0.8)",
        };
      default:
        return {
          fillColor: "rgba(221, 151, 38, 0.4)", // default to medium
          strokeColor: "rgba(221, 151, 38, 0.8)",
        };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Typography type="bodyMedium" style={styles.loadingText}>
          Loading heat map...
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
        onPress={handleMapPress}
      >
        {/* Render demand circles */}
        {heatmapData.map((point, index) => {
          const colors = getDemandColor(point.demandLevel);
          return (
            <Circle
              key={`circle-${index}`}
              center={{ latitude: point.lat, longitude: point.lng }}
              radius={radius}
              fillColor={colors.fillColor}
              strokeColor={colors.strokeColor}
              strokeWidth={2}
            />
          );
        })}

        {/* Render ETA labels if enabled */}
        {showETALabels &&
          heatmapData.map((point, index) => {
            if (!point.eta) return null;
            return (
              <ETAOverlay
                key={`eta-${index}`}
                coordinate={{ latitude: point.lat, longitude: point.lng }}
                eta={point.eta}
              />
            );
          })}

        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Current Location"
            anchor={{ x: 0.5, y: 0.5 }}
            icon={pickupIcon}
          ></Marker>
        )}
      </MapView>

      {/* Legend overlay */}
      <Legend />
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
  etaLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  etaText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  legend: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  legendTitle: {
    fontWeight: "bold",
    marginBottom: 8,
    color: textColors.grey900,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendColorHigh: {
    backgroundColor: "#DD2626",
  },
  legendColorMedium: {
    backgroundColor: "#DD9726",
  },
  legendColorLow: {
    backgroundColor: "#38DD38",
  },
});
