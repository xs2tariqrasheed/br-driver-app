import Button from "@/components/Button";
import MapLoading from "@/components/MapLoading";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { GOOGLE_MAPS_API_KEY } from "@/constants/global";
import { geocodeAddress, LocationCoordinates, logger } from "@/utils/helpers";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
   * Optional pickup coordinates from API (takes precedence over geocoding)
   */
  pickupCoordinates?: { lat: number; lng: number };
  /**
   * Optional dropoff coordinates from API (takes precedence over geocoding)
   */
  dropoffCoordinates?: { lat: number; lng: number };
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
  pickupCoordinates,
  dropoffCoordinates,
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
  
  // State to track animated coordinates for iOS compatibility
  const [animatedCoordinateState, setAnimatedCoordinateState] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const testingRef = useRef(false);
  const initialLocationRef = useRef<LocationCoordinates | null>(null);

  // Speed for realistic movement
  const SPEED = 15; // meters per second

  // Custom map theme
  const customMapStyle = [
    {
      featureType: "all",
      elementType: "geometry.fill",
      stylers: [
        {
          weight: "2.00",
        },
      ],
    },
    {
      featureType: "all",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#9c9c9c",
        },
      ],
    },
    {
      featureType: "all",
      elementType: "labels.text",
      stylers: [
        {
          visibility: "on",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "all",
      stylers: [
        {
          color: "#f2f2f2",
        },
      ],
    },
    {
      featureType: "landscape",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#ffffff",
        },
      ],
    },
    {
      featureType: "landscape.man_made",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#ffffff",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "all",
      stylers: [
        {
          saturation: -100,
        },
        {
          lightness: 45,
        },
      ],
    },
    {
      featureType: "road",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#eeeeee",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#7b7b7b",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels.text.stroke",
      stylers: [
        {
          color: "#ffffff",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        {
          visibility: "simplified",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [
        {
          color: "#46bcec",
        },
        {
          visibility: "on",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#b5dae1",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#070707",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [
        {
          color: "#ffffff",
        },
      ],
    },
  ];

  // Icon sources
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

  // Memoize animated coordinate object - Use state for iOS compatibility
  const animatedCoordinate = useMemo(() => {
    if (Platform.OS === "ios" && animatedCoordinateState) {
      return animatedCoordinateState;
    }
    return {
      latitude: animatedLatitude.current,
      longitude: animatedLongitude.current,
    };
  }, [animatedCoordinateState]);

  // iOS: Listen to animated value changes and update state (throttled for performance)
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    // Store refs in variables for cleanup
    const latRef = animatedLatitude.current;
    const lngRef = animatedLongitude.current;
    const rotRef = animatedRotation.current;

    let updateTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastUpdate = 0;
    const UPDATE_THROTTLE = 50; // Update at most every 50ms for smoother performance

    const updateCoordinateState = () => {
      const now = Date.now();
      if (now - lastUpdate < UPDATE_THROTTLE) {
        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          const lat = (latRef as any)._value;
          const lng = (lngRef as any)._value;
          setAnimatedCoordinateState({ latitude: lat, longitude: lng });
          lastUpdate = Date.now();
        }, UPDATE_THROTTLE - (now - lastUpdate));
        return;
      }
      
      const lat = (latRef as any)._value;
      const lng = (lngRef as any)._value;
      setAnimatedCoordinateState({ latitude: lat, longitude: lng });
      lastUpdate = now;
    };

    const latListener = latRef.addListener(() => {
      updateCoordinateState();
    });

    const lngListener = lngRef.addListener(() => {
      updateCoordinateState();
    });

    const rotationListener = rotRef.addListener(({ value }) => {
      setCarRotation(value);
    });

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout);
      latRef.removeListener(latListener);
      lngRef.removeListener(lngListener);
      rotRef.removeListener(rotationListener);
    };
  }, []);

  // Memoize the initialization to prevent unnecessary re-runs
  const initializeMapMemo = useCallback(async () => {
    await initializeMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupAddress, dropoffAddress, pickupCoordinates, dropoffCoordinates]);

  useEffect(() => {
    initializeMapMemo();

    return () => {
      // Cleanup animations if testing
      if (testingRef.current) {
        testingRef.current = false;
        setIsTesting(false);
        animatedLatitude.current.stopAnimation();
        animatedLongitude.current.stopAnimation();
        animatedRotation.current.stopAnimation();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        log(`Directions request failed: ${data.status}`);
        // If directions fail, return a simple straight line between points
        return [origin, destination];
      }

      const encoded = data.routes[0].overview_polyline.points;
      const decoded = decodePolyline(encoded);

      // Limit the number of points to prevent polyline overflow
      if (decoded.length > 500) {
        log(`Route has ${decoded.length} points, limiting to 500`);
        const step = Math.floor(decoded.length / 500);
        return decoded.filter((_, index) => index % step === 0);
      }

      return decoded;
    } catch (error) {
      log(`Error fetching route: ${error}`);
      // Return a simple straight line between points
      return [origin, destination];
    }
  };

  /**
   * Initialize the map with locations
   */
  const initializeMap = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get device's current location
      let current: LocationCoordinates;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Location permission not granted");
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        current = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        log(`Device location obtained: ${current.latitude}, ${current.longitude}`);
      } catch (locationError) {
        log(`Error getting device location: ${locationError}, using fallback`);
        // Fallback to Lahore coordinates if location fails
        current = {
          latitude: 31.3545,
          longitude: 74.3953,
        };
      }

      setCurrentLocation(current);

      // Store initial location for reset functionality
      initialLocationRef.current = { ...current };

      // Initialize animated values
      animatedLatitude.current.setValue(current.latitude);
      animatedLongitude.current.setValue(current.longitude);
      animatedRotation.current.setValue(0);
      
      // Initialize iOS coordinate state
      if (Platform.OS === "ios") {
        setAnimatedCoordinateState({
          latitude: current.latitude,
          longitude: current.longitude,
        });
      }

      // Use API coordinates if provided, otherwise geocode the address
      let pickup: LocationCoordinates | null = null;
      if (pickupCoordinates) {
        pickup = {
          latitude: pickupCoordinates.lat,
          longitude: pickupCoordinates.lng,
        };
        log(`Using API pickup coordinates: ${pickup.latitude}, ${pickup.longitude}`);
      } else {
        pickup = await geocodeAddress(pickupAddress, GOOGLE_MAPS_API_KEY);
        if (!pickup) {
          log(
            `Could not geocode pickup address: ${pickupAddress}, using fallback coordinates`
          );
          // Use fallback coordinates for Lahore
          pickup = { latitude: 31.3709, longitude: 74.3648 };
        }
      }
      setPickupLocation(pickup);

      // Use API coordinates if provided, otherwise geocode the address
      let dropoff: LocationCoordinates | null = null;
      if (dropoffCoordinates) {
        dropoff = {
          latitude: dropoffCoordinates.lat,
          longitude: dropoffCoordinates.lng,
        };
        log(`Using API dropoff coordinates: ${dropoff.latitude}, ${dropoff.longitude}`);
      } else {
        dropoff = await geocodeAddress(dropoffAddress, GOOGLE_MAPS_API_KEY);
        if (!dropoff) {
          log(
            `Could not geocode dropoff address: ${dropoffAddress}, using fallback coordinates`
          );
          // Use fallback coordinates for Lahore
          dropoff = { latitude: 31.4244, longitude: 74.3574 };
        }
      }
      setDropoffLocation(dropoff);

      // Get the actual pickup and dropoff locations
      const actualPickup = pickup;
      const actualDropoff = dropoff;

      // Fetch routes
      const pickupRoute = await getRouteCoordinates(current, actualPickup);
      const interpolatedPickup = interpolateRoute(pickupRoute);
      setPickupInterpolated(interpolatedPickup);

      const dropoffRoute = await getRouteCoordinates(
        actualPickup,
        actualDropoff
      );
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
    const maxSegmentDistance = 0.0001; // ~11 meters for more frequent updates and smoother path reduction
    const maxPoints = 1000; // Increased limit for finer interpolation without overflow

    for (
      let i = 0;
      i < route.length - 1 && interpolated.length < maxPoints;
      i++
    ) {
      const start = route[i];
      const end = route[i + 1];

      interpolated.push(start);

      const distance = Math.hypot(
        end.latitude - start.latitude,
        end.longitude - start.longitude
      );
      const segments = Math.max(
        1,
        Math.min(
          Math.floor(distance / maxSegmentDistance),
          Math.floor((maxPoints - interpolated.length) / (route.length - i))
        )
      );

      for (let j = 1; j < segments && interpolated.length < maxPoints; j++) {
        const ratio = j / segments;
        interpolated.push({
          latitude: start.latitude + (end.latitude - start.latitude) * ratio,
          longitude:
            start.longitude + (end.longitude - start.longitude) * ratio,
        });
      }
    }

    if (interpolated.length < maxPoints) {
      interpolated.push(route[route.length - 1]);
    }

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
    // Check if testing was stopped
    if (!testingRef.current) {
      return;
    }

    if (index >= route.length - 1) {
      if (!testingRef.current) {
        return;
      }
      setCurrentLocation(route[route.length - 1]);
      if (!isDropoff) {
        // Chain to dropoff route if available
        setRidePhase("toDropoff");
        const dropoffRoute = dropoffInterpolated;
        if (dropoffRoute.length > 1 && testingRef.current) {
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
      if (testingRef.current) {
        setIsTesting(false);
        testingRef.current = false;
      }
      return;
    }

    // Double check before starting animation
    if (!testingRef.current) {
      return;
    }

    const currentPoint = route[index];
    const nextPoint = route[index + 1];
    const distance = getDistance(currentPoint, nextPoint);
    // iOS needs longer duration for smoother movement
    const baseDuration = Platform.OS === "ios" 
      ? Math.max(500, (distance / SPEED) * 1000)
      : Math.max(300, (distance / SPEED) * 1000);
    const bearing = calculateBearing(currentPoint, nextPoint);

    // iOS needs easing for smoother animation
    const easing = Platform.OS === "ios" 
      ? Easing.out(Easing.quad)
      : undefined;

    const animations = [
      Animated.timing(animatedLatitude.current, {
        toValue: nextPoint.latitude,
        duration: baseDuration,
        easing,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLongitude.current, {
        toValue: nextPoint.longitude,
        duration: baseDuration,
        easing,
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation.current, {
        toValue: bearing,
        duration: baseDuration * (Platform.OS === "ios" ? 1.0 : 1.2), // Same duration on iOS for smoother rotation
        easing: Platform.OS === "ios" 
          ? Easing.out(Easing.quad)
          : undefined,
        useNativeDriver: false,
      }),
    ];

    Animated.parallel(animations).start(() => {
      // Check if testing was stopped during animation
      if (!testingRef.current) {
        return;
      }

      setCurrentLocation(nextPoint);
      
      // Update iOS coordinate state synchronously for smoother updates
      if (Platform.OS === "ios") {
        setAnimatedCoordinateState({
          latitude: nextPoint.latitude,
          longitude: nextPoint.longitude,
        });
      }
      
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

    // Store initial location for reset
    if (currentLocation) {
      initialLocationRef.current = { ...currentLocation };
    }

    testingRef.current = true;
    setIsTesting(true);
    setCurrentPickupIndex(0);
    setCurrentDropoffIndex(0);
    setRidePhase("toPickup");

    const route = pickupInterpolated;
    if (route.length < 2) return;

    // Initial position and rotation already set
    animateNext(0, route, false);
  };

  const stopTesting = () => {
    // Stop the testing flag first
    testingRef.current = false;
    setIsTesting(false);

    // Stop any ongoing animations
    animatedLatitude.current.stopAnimation();
    animatedLongitude.current.stopAnimation();
    animatedRotation.current.stopAnimation();

    // Reset to initial location if available
    if (initialLocationRef.current) {
      const initialLoc = initialLocationRef.current;
      setCurrentLocation(initialLoc);
      
      // Reset animated values
      animatedLatitude.current.setValue(initialLoc.latitude);
      animatedLongitude.current.setValue(initialLoc.longitude);
      
      // Update iOS coordinate state
      if (Platform.OS === "ios") {
        setAnimatedCoordinateState({
          latitude: initialLoc.latitude,
          longitude: initialLoc.longitude,
        });
      }

      // Reset route indices
      setCurrentPickupIndex(0);
      setCurrentDropoffIndex(0);
      setRidePhase("toPickup");

      // Reset rotation to initial bearing if route exists
      if (pickupInterpolated.length >= 2) {
        const initialBearing = calculateBearing(
          pickupInterpolated[0],
          pickupInterpolated[1]
        );
        animatedRotation.current.setValue(initialBearing);
        setCarRotation(initialBearing);
      } else {
        animatedRotation.current.setValue(0);
        setCarRotation(0);
      }
    }
  };

  if (isLoading) {
    return <MapLoading isLoading={isLoading} />;
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
    return <MapLoading isLoading={true} />;
  }

  if (!mapRegion) {
    return <MapLoading isLoading={true} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        customMapStyle={customMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={false}
      >
        {/* Pickup route - reducing during toPickup phase, removing covered path */}
        {ridePhase === "toPickup" &&
          pickupInterpolated.length > currentPickupIndex &&
          currentLocation && (
            <Polyline
              key={`pickup-${currentPickupIndex}`}
              coordinates={[
                currentLocation, // Start from current car position
                ...pickupInterpolated.slice(currentPickupIndex + 1), // Remaining route
              ]}
              strokeColor={textColors.blue600}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}

        {/* Dropoff route - full during toPickup, reducing during toDropoff */}
        {ridePhase === "toPickup"
          ? dropoffInterpolated.length > 0 && (
              <Polyline
                key="dropoff-full"
                coordinates={dropoffInterpolated}
                strokeColor={textColors.green600}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )
          : dropoffInterpolated.length > currentDropoffIndex &&
            currentLocation && (
              <Polyline
                key={`dropoff-${currentDropoffIndex}`}
                coordinates={[
                  currentLocation, // Start from current car position
                  ...dropoffInterpolated.slice(currentDropoffIndex + 1), // Remaining route
                ]}
                strokeColor={textColors.green600}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            )}

        {/* Current location marker (car) - Use Marker.Animated for smooth movement */}
        {Platform.OS === "ios" ? (
          <Marker
            ref={markerRef}
            coordinate={animatedCoordinateState || {
              latitude: (animatedLatitude.current as any)._value,
              longitude: (animatedLongitude.current as any)._value,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={carRotation}
            flat={true}
            zIndex={1000}
            tracksViewChanges={false}
          >
            <Image
              source={require("@/assets/images/3d-car-icon.png")}
              style={styles.carIcon}
              resizeMode="contain"
            />
          </Marker>
        ) : (
          <Marker.Animated
            ref={markerRef}
            coordinate={animatedCoordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={animatedRotation.current}
            flat={true}
            zIndex={1000}
          >
            <Image
              source={require("@/assets/images/3d-car-icon.png")}
              style={styles.carIcon}
              resizeMode="contain"
            />
          </Marker.Animated>
        )}

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
          {isTesting ? "Stop Simulation" : "Start Simulation"}
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
  loadingTitle: {
    color: textColors.grey800,
    fontWeight: "600",
    marginBottom: 16,
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
  carIcon: {
    width: 65,
    height: 65,
  },
});
