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
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import MapView, {
  Callout,
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import MapLoading from "../MapLoading";
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
    coordinates: LocationCoordinates,
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
 * iOS: Shows ETA label directly on the map
 * Android: Shows ETA in a Callout when user taps on the marker or circle
 */
interface ETAOverlayProps {
  lat: number;
  lng: number;
  eta: string;
  demandLevel?: "high" | "medium" | "low";
  isSelected?: boolean;
  onMarkerPress?: () => void;
}

const isAndroid = Platform.OS === "android";

/**
 * iOS ETA Overlay - Shows label directly
 */
const ETAOverlayIOS = ({ lat, lng, eta }: ETAOverlayProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Disable tracking after initial render to prevent blinking
    const timer = setTimeout(() => setTracksViewChanges(false), 300);
    return () => clearTimeout(timer);
  }, [eta, lat, lng]);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={9999}
    >
      <View style={styles.etaLabel}>
        <Text style={styles.etaText}>ETA: {eta}</Text>
      </View>
    </Marker>
  );
};

/**
 * Android ETA Overlay - Shows ETA in Callout on tap
 */
const ETAOverlayAndroid = ({
  lat,
  lng,
  eta,
  demandLevel,
  isSelected,
  onMarkerPress,
}: ETAOverlayProps) => {
  // Get demand color for the indicator dot
  const getDemandColor = () => {
    switch (demandLevel) {
      case "high":
        return "#DD2626";
      case "medium":
        return "#DD9726";
      case "low":
        return "#38DD38";
      default:
        return "#DD9726";
    }
  };

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      zIndex={9999}
      tappable={true}
      onPress={onMarkerPress}
    >
      {/* Keep marker hit target but avoid visual noise over demand circles */}
      <View style={styles.androidMarkerContainer}>
        {isSelected ? (
          <View
            style={[
              styles.androidMarkerDot,
              { backgroundColor: getDemandColor() },
              styles.androidMarkerDotSelected,
            ]}
          />
        ) : null}
      </View>
      {/* Callout shown on tap */}
      <Callout tooltip style={styles.calloutContainer}>
        <View style={styles.calloutBubble}>
          <Text style={styles.calloutText}>ETA: {eta}</Text>
        </View>
      </Callout>
    </Marker>
  );
};

/**
 * Platform-specific ETA Overlay
 */
const ETAOverlay = (props: ETAOverlayProps) => {
  if (isAndroid) {
    return <ETAOverlayAndroid {...props} />;
  }
  // iOS doesn't need isSelected or onMarkerPress
  const { isSelected, onMarkerPress, ...iosProps } = props;
  return <ETAOverlayIOS {...iosProps} />;
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
    longitude: -74.006,
    latitudeDelta: 0.3, // Zoom level to show NYC area (smaller values = more zoomed in)
    longitudeDelta: 0.3,
  });

  // User's current location state
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(
    null,
  );

  // Logger function
  const log = logger();

  // Loading state to show spinner while map initializes
  const [isLoading, setIsLoading] = useState(true);

  // Track which marker should show its callout (Android only)
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(
    null,
  );

  // Prevent car marker flickering: stop tracking view changes after first paint (same as RideMap)
  const [carTracksViewChanges, setCarTracksViewChanges] = useState(true);

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
        longitude: -74.006,
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
   * Calculate distance between two coordinates in meters (Haversine formula)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Handles map press events by processing the location selection.
   * On Android, also checks if tap is within a circle to show ETA.
   */
  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    log("Map pressed at:", coordinate);

    // On Android, check if tap is within any circle's radius
    if (isAndroid && showETALabels) {
      for (let i = 0; i < heatmapData.length; i++) {
        const point = heatmapData[i];
        if (!point.eta) continue;

        const w = typeof point.weight === "number" ? point.weight : 0.5;
        const radiusScale = 0.8 + w * 0.6;
        const circleRadius = radius * radiusScale;

        const distance = calculateDistance(
          coordinate.latitude,
          coordinate.longitude,
          point.lat,
          point.lng,
        );

        // If tap is within circle radius, show the callout
        if (distance <= circleRadius) {
          setSelectedMarkerIndex(i);
          // Reset after a delay
          setTimeout(() => setSelectedMarkerIndex(null), 5000);
          return; // Don't trigger location select for circle taps
        }
      }
    }

    if (onLocationSelect) {
      // For now, use coordinates as address
      // In production, you might want to use reverse geocoding
      const address = `${coordinate.latitude.toFixed(
        6,
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
  const getDemandRgb = (demandLevel: "high" | "medium" | "low" | undefined) => {
    switch (demandLevel) {
      case "high":
        return { r: 221, g: 38, b: 38 };
      case "medium":
        return { r: 221, g: 151, b: 38 };
      case "low":
        return { r: 56, g: 221, b: 56 };
      default:
        return { r: 221, g: 151, b: 38 };
    }
  };

  if (isLoading) {
    return <MapLoading isLoading={isLoading} />;
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
          const { r, g, b } = getDemandRgb(point.demandLevel);
          // Use weight (already normalized by screen logic) to drive intensity/size.
          const w = typeof point.weight === "number" ? point.weight : 0.5;
          const fillAlpha = Math.max(0.15, Math.min(0.8, opacity * w));
          const strokeAlpha = Math.max(0.35, Math.min(0.95, fillAlpha + 0.35));
          const radiusScale = 0.8 + w * 0.6;
          return (
            <Circle
              key={`circle-${index}`}
              center={{ latitude: point.lat, longitude: point.lng }}
              radius={radius * radiusScale}
              fillColor={`rgba(${r}, ${g}, ${b}, ${fillAlpha})`}
              strokeColor={`rgba(${r}, ${g}, ${b}, ${strokeAlpha})`}
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
                key={`eta-${point.lat}-${point.lng}-${index}`}
                lat={point.lat}
                lng={point.lng}
                eta={point.eta}
                demandLevel={point.demandLevel}
                isSelected={isAndroid && selectedMarkerIndex === index}
                onMarkerPress={() => {
                  if (isAndroid) {
                    setSelectedMarkerIndex(index);
                    setTimeout(() => setSelectedMarkerIndex(null), 5000);
                  }
                }}
              />
            );
          })}

        {/* Current location marker (car icon - same as active-ride map) */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Current Location"
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1000}
            tracksViewChanges={carTracksViewChanges}
          >
            <Image
              source={require("@/assets/images/3d-car-icon.png")}
              style={styles.carIcon}
              resizeMode="contain"
              onLoad={() => setCarTracksViewChanges(false)}
            />
          </Marker>
        )}
      </MapView>

      {/* Legend overlay */}
      <Legend />

      {/* Custom ETA overlay for Android when circle is tapped */}
      {isAndroid &&
        showETALabels &&
        selectedMarkerIndex !== null &&
        heatmapData[selectedMarkerIndex]?.eta && (
          <View style={styles.customEtaOverlay}>
            <View style={styles.customEtaBubble}>
              <Text style={styles.customEtaText}>
                ETA: {heatmapData[selectedMarkerIndex].eta}
              </Text>
            </View>
          </View>
        )}

      {/* Android footer hint - tell users to tap on circles to view ETA */}
      {isAndroid && showETALabels && heatmapData.some((p) => p.eta) && (
        <View style={styles.androidFooter}>
          <Text style={styles.androidFooterText}>
            Tap on a circle to view ETA
          </Text>
        </View>
      )}
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
  etaLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
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
  // Android-specific styles
  androidMarkerContainer: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    // Transparent hit area for easier tapping
    backgroundColor: "transparent",
  },
  androidMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  androidMarkerDotSelected: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    elevation: 8,
  },
  calloutContainer: {
    backgroundColor: "transparent",
  },
  calloutBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  calloutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  androidFooter: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  androidFooterText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  customEtaOverlay: {
    position: "absolute",
    top: "47%",
    left: "57%",
    transform: [{ translateX: -80 }],
    zIndex: 10000,
  },
  customEtaBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  customEtaText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  carIcon: {
    width: 65,
    height: 65,
  },
});
