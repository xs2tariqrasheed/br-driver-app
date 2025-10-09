import Button from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { GOOGLE_MAPS_API_KEY } from "@/constants/global";
import {
  geocodeAddress,
  getCurrentLocation,
  LocationCoordinates,
  logger,
} from "@/utils/helpers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Callout,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

/**
 * Props for the RideMap component
 */
interface RideMapProps {
  /**
   * The pickup address as a string
   */
  pickupAddress: string;
  /**
   * The dropoff address as a string
   */
  dropoffAddress: string;
  /**
   * Current ride status to display in the status tag
   */
  rideStatus?: string;
  /**
   * Current ride ETA to display in the ETA tag
   */
  eta?: string;
  /**
   * Whether to show the Waze button
   */
  showWazeButton?: boolean;
  /**
   * Callback when Waze button is pressed
   */
  onWazePress?: () => void;
  /**
   * Optional callback when map is ready
   */
  onMapReady?: () => void;
  /**
   * Optional callback when there's an error
   */
  onError?: (error: string) => void;
}

/**
 * A React Native component that displays a Google Maps interface showing:
 * - Current location (car icon with rotation)
 * - Pickup location (pickup icon)
 * - Dropoff location (dropoff icon)
 * - Route polylines connecting all locations
 *
 * Features:
 * - Native Google Maps with custom markers
 * - Automatic geocoding of addresses
 * - Route calculation and display
 * - Car rotation based on direction
 * - Status and ETA overlays
 * - Waze integration
 * - Testing mode for simulating movement
 *
 * @param props - The component props
 * @returns JSX element containing the native MapView
 */
export default function RideMap({
  pickupAddress,
  dropoffAddress,
  rideStatus = "En Route",
  eta = "",
  showWazeButton = false,
  onWazePress,
  onMapReady,
  onError,
}: RideMapProps) {
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const log = logger();

  // State for locations
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null);
  const [pickupLocation, setPickupLocation] =
    useState<LocationCoordinates | null>(null);
  const [dropoffLocation, setDropoffLocation] =
    useState<LocationCoordinates | null>(null);

  // Route states
  const [pickupInterpolated, setPickupInterpolated] = useState<
    LocationCoordinates[]
  >([]);
  const [dropoffInterpolated, setDropoffInterpolated] = useState<
    LocationCoordinates[]
  >([]);

  // Indices for route progress
  const [currentPickupIndex, setCurrentPickupIndex] = useState(0);
  const [currentDropoffIndex, setCurrentDropoffIndex] = useState(0);

  // Ride phase
  const [ridePhase, setRidePhase] = useState<"toPickup" | "toDropoff">(
    "toPickup"
  );

  // Animated values for smooth car movement
  const animatedLatitude = useRef(new Animated.Value(0));
  const animatedLongitude = useRef(new Animated.Value(0));
  const animatedRotation = useRef(new Animated.Value(0));

  // State for UI
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carRotation, setCarRotation] = useState(0);

  // Testing state
  const [isTesting, setIsTesting] = useState(false);

  // Speed for realistic movement
  const SPEED = 15; // meters per second

  // Icon sources - use resolveAssetSource for native markers
  const carIcon = Image.resolveAssetSource(
    require("@/assets/images/car-icon.png")
  );
  const pickupIconSource = require("@/assets/images/pickup-icon.png");
  const dropoffIconSource = require("@/assets/images/dropoff-icon.png");
  const wazeIcon = require("@/assets/images/waze-icon.png");

  // Memoize map region to prevent unnecessary re-renders
  const mapRegion = useMemo(() => {
    if (!currentLocation) return null;
    return {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }, [currentLocation]);

  // Memoize animated coordinate object
  const animatedCoordinate = useMemo(
    () => ({
      latitude: animatedLatitude.current,
      longitude: animatedLongitude.current,
    }),
    []
  );

  // Memoize the initialization to prevent unnecessary re-runs
  const initializeMapMemo = useCallback(async () => {
    await initializeMap();
  }, [pickupAddress, dropoffAddress]);

  useEffect(() => {
    initializeMapMemo();

    return () => {
      // Cleanup animations if testing
      if (isTesting) {
        stopTesting();
      }
    };
  }, [initializeMapMemo]);

  /**
   * Decode Google encoded polyline
   */
  const decodePolyline = (encoded: string): LocationCoordinates[] => {
    const coords: LocationCoordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coords.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5,
      });
    }

    return coords;
  };

  /**
   * Fetch route coordinates from Google Directions API
   */
  const getRouteCoordinates = async (
    origin: LocationCoordinates,
    destination: LocationCoordinates
  ): Promise<LocationCoordinates[]> => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Directions request failed: ${data.status}`);
    }

    const encoded = data.routes[0].overview_polyline.points;
    return decodePolyline(encoded);
  };

  /**
   * Initialize the map with locations
   */
  const initializeMap = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current location
      const currentLocationRegion = await getCurrentLocation({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      const current = {
        latitude: currentLocationRegion.latitude,
        longitude: currentLocationRegion.longitude,
      };
      setCurrentLocation(current);

      // Initialize animated values
      animatedLatitude.current.setValue(current.latitude);
      animatedLongitude.current.setValue(current.longitude);
      animatedRotation.current.setValue(0);

      // Geocode pickup address
      const pickup = await geocodeAddress(pickupAddress, GOOGLE_MAPS_API_KEY);
      if (!pickup) {
        throw new Error(`Could not find pickup location: ${pickupAddress}`);
      }
      setPickupLocation(pickup);

      // Geocode dropoff address
      const dropoff = await geocodeAddress(dropoffAddress, GOOGLE_MAPS_API_KEY);
      if (!dropoff) {
        throw new Error(`Could not find dropoff location: ${dropoffAddress}`);
      }
      setDropoffLocation(dropoff);

      // Fetch routes
      const pickupRoute = await getRouteCoordinates(current, pickup);
      const interpolatedPickup = interpolateRoute(pickupRoute);
      setPickupInterpolated(interpolatedPickup);

      const dropoffRoute = await getRouteCoordinates(pickup, dropoff);
      const interpolatedDropoff = interpolateRoute(dropoffRoute);
      setDropoffInterpolated(interpolatedDropoff);

      // Set initial bearing
      if (interpolatedPickup.length >= 2) {
        const bearing = calculateBearing(
          interpolatedPickup[0],
          interpolatedPickup[1]
        );
        setCarRotation(bearing);
        animatedRotation.current.setValue(bearing);
      }

      setIsLoading(false);
      onMapReady?.();

      // Fit map to show all markers after a short delay
      setTimeout(() => {
        fitMapToMarkers();
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize map";
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
      log("Map initialization error:", errorMessage);
    }
  };

  /**
   * Fit map to show all markers
   */
  const fitMapToMarkers = () => {
    if (
      mapRef.current &&
      currentLocation &&
      pickupLocation &&
      dropoffLocation
    ) {
      mapRef.current.fitToCoordinates(
        [currentLocation, pickupLocation, dropoffLocation],
        {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        }
      );
    }
  };

  /**
   * Calculate bearing between two coordinates
   */
  const calculateBearing = (
    start: LocationCoordinates,
    end: LocationCoordinates
  ): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const toDeg = (value: number) => (value * 180) / Math.PI;

    const startLat = toRad(start.latitude);
    const startLng = toRad(start.longitude);
    const endLat = toRad(end.latitude);
    const endLng = toRad(end.longitude);

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = toDeg(Math.atan2(y, x));
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  /**
   * Handle Waze button press
   */
  const handleWazePress = () => {
    if (pickupLocation) {
      const url = Platform.select({
        ios: `waze://?ll=${pickupLocation.latitude},${pickupLocation.longitude}&navigate=yes`,
        android: `waze://?ll=${pickupLocation.latitude},${pickupLocation.longitude}&navigate=yes`,
      });

      if (url) {
        Linking.canOpenURL(url)
          .then((supported) => {
            if (supported) {
              Linking.openURL(url);
            } else {
              // Fallback to Waze in browser
              const webUrl = `https://waze.com/ul?ll=${pickupLocation.latitude},${pickupLocation.longitude}&navigate=yes`;
              Linking.openURL(webUrl);
            }
          })
          .catch((err) => log("Error opening Waze:", err));
      }
    }
    onWazePress?.();
  };

  /**
   * Calculate distance between two points in meters
   */
  const getDistance = (
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /**
   * Interpolate route with proper distance-based segmentation (from WebView logic)
   */
  const interpolateRoute = (
    route: LocationCoordinates[]
  ): LocationCoordinates[] => {
    if (route.length < 2) {
      return [...route];
    }

    const interpolated: LocationCoordinates[] = [];
    const maxSegmentDistance = 0.00005; // Roughly ~5.5 meters for more points

    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];

      interpolated.push(start);

      const distance = Math.hypot(
        end.latitude - start.latitude,
        end.longitude - start.longitude
      );
      const segments = Math.max(1, Math.floor(distance / maxSegmentDistance));

      for (let j = 1; j < segments; j++) {
        const ratio = j / segments;
        interpolated.push({
          latitude: start.latitude + (end.latitude - start.latitude) * ratio,
          longitude:
            start.longitude + (end.longitude - start.longitude) * ratio,
        });
      }
    }

    interpolated.push(route[route.length - 1]);
    return interpolated;
  };

  /**
   * Recursive animation for next segment in route
   */
  const animateNext = (
    index: number,
    route: LocationCoordinates[],
    isDropoff: boolean = false
  ) => {
    if (index >= route.length - 1) {
      setCurrentLocation(route[route.length - 1]);
      if (!isDropoff) {
        // Chain to dropoff route if available
        setRidePhase("toDropoff");
        const dropoffRoute = dropoffInterpolated;
        if (dropoffRoute.length > 1) {
          const initialBearing = calculateBearing(
            dropoffRoute[0],
            dropoffRoute[1]
          );
          animatedRotation.current.setValue(initialBearing);
          setCarRotation(initialBearing);
          setCurrentDropoffIndex(0);
          animateNext(0, dropoffRoute, true);
          return;
        }
      }
      setIsTesting(false);
      return;
    }

    const currentPoint = route[index];
    const nextPoint = route[index + 1];
    const distance = getDistance(currentPoint, nextPoint);
    const duration = Math.max(300, (distance / SPEED) * 1000); // Min 300ms for smoothness
    const bearing = calculateBearing(currentPoint, nextPoint);

    const animations = [
      Animated.timing(animatedLatitude.current, {
        toValue: nextPoint.latitude,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLongitude.current, {
        toValue: nextPoint.longitude,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation.current, {
        toValue: bearing,
        duration: duration * 1.2, // Slightly longer for rotation
        useNativeDriver: false,
      }),
    ];

    Animated.parallel(animations).start(() => {
      setCurrentLocation(nextPoint);
      if (isDropoff) {
        setCurrentDropoffIndex(index + 1);
      } else {
        setCurrentPickupIndex(index + 1);
      }
      animateNext(index + 1, route, isDropoff);
    });
  };

  /**
   * Testing mode - simulate car movement with chained realistic animations
   */
  const startTesting = () => {
    if (pickupInterpolated.length === 0) return;

    setIsTesting(true);
    setCurrentPickupIndex(0);

    const route = pickupInterpolated;
    if (route.length < 2) return;

    // Initial position and rotation already set
    animateNext(0, route, false);
  };

  const stopTesting = () => {
    setIsTesting(false);

    // Stop any ongoing animations
    animatedLatitude.current.stopAnimation();
    animatedLongitude.current.stopAnimation();
    animatedRotation.current.stopAnimation();
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Typography type="bodyMedium" style={styles.errorText}>
          {error}
        </Typography>
      </View>
    );
  }

  if (!currentLocation || !pickupLocation || !dropoffLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Typography type="bodyMedium" style={styles.loadingText}>
          Preparing map...
        </Typography>
      </View>
    );
  }

  if (!mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <Typography type="bodyMedium" style={styles.loadingText}>
          Preparing map...
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
        initialRegion={mapRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
      >
        {/* Pickup route - reducing during toPickup phase */}
        {ridePhase === "toPickup" &&
          pickupInterpolated.length > currentPickupIndex && (
            <Polyline
              coordinates={pickupInterpolated.slice(currentPickupIndex)}
              strokeColor={textColors.blue600}
              strokeWidth={4}
            />
          )}

        {/* Dropoff route - full during toPickup, reducing during toDropoff */}
        {ridePhase === "toPickup"
          ? dropoffInterpolated.length > 0 && (
              <Polyline
                coordinates={dropoffInterpolated}
                strokeColor={textColors.green600}
                strokeWidth={4}
              />
            )
          : dropoffInterpolated.length > currentDropoffIndex && (
              <Polyline
                coordinates={dropoffInterpolated.slice(currentDropoffIndex)}
                strokeColor={textColors.green600}
                strokeWidth={4}
              />
            )}

        {/* Current location marker (car) - Use Marker.Animated for smooth movement */}
        <Marker.Animated
          ref={markerRef}
          coordinate={animatedCoordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={animatedRotation.current}
          flat={true}
          icon={carIcon}
          zIndex={1000}
        />

        {/* Pickup location marker */}
        <Marker
          coordinate={pickupLocation}
          anchor={{ x: 0.5, y: 1 }}
          zIndex={999}
        >
          <Image
            source={pickupIconSource}
            style={{ width: 30, height: 60 }}
            resizeMode="contain"
          />
          <Callout>
            <View style={styles.calloutContainer}>
              <View style={styles.calloutHeader}>
                <View style={[styles.calloutDot, styles.calloutDotRed]} />
                <Typography type="bodyMedium" style={styles.calloutTitle}>
                  Pickup From
                </Typography>
              </View>
              <Typography type="bodySmall" style={styles.calloutText}>
                {pickupAddress}
              </Typography>
            </View>
          </Callout>
        </Marker>

        {/* Dropoff location marker */}
        <Marker
          coordinate={dropoffLocation}
          anchor={{ x: 0.5, y: 1 }}
          zIndex={998}
        >
          <Image
            source={dropoffIconSource}
            style={{ width: 30, height: 60 }}
            resizeMode="contain"
          />
          <Callout>
            <View style={styles.calloutContainer}>
              <View style={styles.calloutHeader}>
                <View style={[styles.calloutDot, styles.calloutDotGreen]} />
                <Typography type="bodyMedium" style={styles.calloutTitle}>
                  Drop-Off
                </Typography>
              </View>
              <Typography type="bodySmall" style={styles.calloutText}>
                {dropoffAddress}
              </Typography>
            </View>
          </Callout>
        </Marker>
      </MapView>

      {/* Status Tag */}
      <View style={styles.statusTag}>
        <Typography type="bodySmall" style={styles.statusText}>
          {rideStatus}
        </Typography>
      </View>

      {/* ETA Tag */}
      {eta && (
        <View style={styles.etaTag}>
          <Typography type="bodySmall" style={styles.etaText}>
            ETA: {eta}
          </Typography>
        </View>
      )}

      {/* Waze Button */}
      {showWazeButton && (
        <TouchableOpacity
          style={styles.wazeButton}
          onPress={handleWazePress}
          activeOpacity={0.8}
        >
          <Image source={wazeIcon} style={styles.wazeIcon} />
        </TouchableOpacity>
      )}

      {/* Testing Controls - Dev Only */}
      <View style={styles.testingControls}>
        <Button
          onPress={isTesting ? stopTesting : startTesting}
          variant={isTesting ? "danger" : "primary"}
          style={styles.testingButton}
          disabled={pickupInterpolated.length === 0}
        >
          {isTesting ? "Stop Testing" : "Start Testing"}
        </Button>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: textColors.grey100,
    padding: 20,
  },
  errorText: {
    color: textColors.red500,
    textAlign: "center",
  },
  statusTag: {
    position: "absolute",
    top: 16,
    left: 0,
    backgroundColor: "rgba(79, 79, 79, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statusText: {
    color: textColors.white,
    fontWeight: "bold",
  },
  etaTag: {
    position: "absolute",
    top: 16,
    right: 0,
    backgroundColor: "rgba(79, 79, 79, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  etaText: {
    color: textColors.white,
    fontWeight: "bold",
  },
  wazeButton: {
    position: "absolute",
    bottom: 20,
    left: 0,
    width: 50,
    height: 50,
    backgroundColor: "#000000",
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  wazeIcon: {
    width: 24,
    height: 24,
  },
  testingControls: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  testingButton: {
    marginBottom: 0,
  },
  calloutContainer: {
    padding: 8,
    minWidth: 200,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  calloutDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  calloutDotRed: {
    backgroundColor: textColors.red500,
  },
  calloutDotGreen: {
    backgroundColor: textColors.green600,
  },
  calloutTitle: {
    fontWeight: "bold",
    color: textColors.grey900,
  },
  calloutText: {
    color: textColors.grey700,
    lineHeight: 18,
  },
});
