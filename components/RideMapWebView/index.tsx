import { textColors } from "@/constants/colors";
import { GOOGLE_MAPS_API_KEY } from "@/constants/global";
import {
  geocodeAddress,
  getCurrentLocation,
  getDirections,
  LocationCoordinates,
  logger,
} from "@/utils/helpers";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import Button from "../Button";
import Typography from "../Typography";

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
 * - Current location (car icon)
 * - Pickup location (pickup icon)
 * - Dropoff location (dropoff icon)
 * - Polylines connecting all three locations
 *
 * Features:
 * - Automatic geocoding of pickup and dropoff addresses
 * - Route calculation and display between locations
 * - Custom markers for each location type
 * - Responsive map that fits all locations
 *
 * @param props - The component props
 * @param props.pickupAddress - The pickup address string
 * @param props.dropoffAddress - The dropoff address string
 * @param props.onMapReady - Optional callback when map is ready
 * @param props.onError - Optional callback for errors
 * @returns JSX element containing the WebView with embedded Google Maps
 *
 * @example
 * ```tsx
 * <RideMap
 *   pickupAddress="123 Main St, City, State"
 *   dropoffAddress="456 Oak Ave, City, State"
 *   eta="10 mins"
 *   onMapReady={() => console.log('Map ready')}
 *   onError={(error) => console.error('Map error:', error)}
 * />
 * ```
 */
export default function RideMapWebView({
  pickupAddress,
  dropoffAddress,
  rideStatus = "En-Route",
  eta = "",
  showWazeButton = false,
  onWazePress,
  onMapReady,
  onError,
}: RideMapProps) {
  // Reference to the WebView component
  const webViewRef = useRef<WebView>(null);

  // State for map data
  const [currentLocation, setCurrentLocation] =
    useState<LocationCoordinates | null>(null);
  const [pickupLocation, setPickupLocation] =
    useState<LocationCoordinates | null>(null);
  const [dropoffLocation, setDropoffLocation] =
    useState<LocationCoordinates | null>(null);
  const [directions, setDirections] = useState<{
    toPickup: any;
    toDropoff: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const testRouteRef = useRef<LocationCoordinates[]>([]);
  const routeIndexRef = useRef(0);
  const initialTestingLocationRef = useRef<LocationCoordinates | null>(null);
  const testingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Logger function
  const log = logger();

  // Icon URLs
  const carIconUrl = Image.resolveAssetSource(
    require("@/assets/images/car-icon.svg")
  ).uri;
  const pickupIconUrl = Image.resolveAssetSource(
    require("@/assets/images/pickup-icon.png")
  ).uri;
  const dropoffIconUrl = Image.resolveAssetSource(
    require("@/assets/images/dropoff-icon.png")
  ).uri;
  const wazeIconUrl = Image.resolveAssetSource(
    require("@/assets/images/waze-icon.png")
  ).uri;

  useEffect(() => {
    initializeMap();
  }, [pickupAddress, dropoffAddress]);

  useEffect(() => {
    return () => {
      if (testingIntervalRef.current) {
        clearInterval(testingIntervalRef.current);
      }
      testRouteRef.current = [];
    };
  }, []);

  /**
   * Initializes the map by getting current location and geocoding addresses
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

      // Get directions from current to pickup to dropoff
      const pickupDirections = await getDirections(
        current,
        pickup,
        GOOGLE_MAPS_API_KEY
      );
      const dropoffDirections = await getDirections(
        pickup,
        dropoff,
        GOOGLE_MAPS_API_KEY
      );

      setDirections({
        toPickup: pickupDirections,
        toDropoff: dropoffDirections,
      });

      // Extract route coordinates for testing
      const coordinates = buildRouteCoordinates(pickupDirections);
      // setRouteCoordinates(coordinates); // This line is removed as per the edit hint

      setIsLoading(false);
      onMapReady?.();
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
   * Samples route coordinates to create a smoother path for testing
   */
  const decodePolyline = (encoded: string): LocationCoordinates[] => {
    if (!encoded) return [];

    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const path: LocationCoordinates[] = [];

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      path.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return path;
  };

  const buildRouteCoordinates = (
    directionsData: any
  ): LocationCoordinates[] => {
    if (
      !directionsData ||
      !directionsData.routes ||
      !directionsData.routes[0]
    ) {
      return [];
    }

    const route = directionsData.routes[0];
    const coordinates: LocationCoordinates[] = [];

    if (route.overview_polyline?.points) {
      return decodePolyline(route.overview_polyline.points);
    }

    if (route.legs && route.legs[0].steps) {
      route.legs[0].steps.forEach((step: any) => {
        if (step.polyline?.points) {
          coordinates.push(...decodePolyline(step.polyline.points));
        } else if (step.path) {
          step.path.forEach((point: any) => {
            coordinates.push({
              latitude:
                typeof point.lat === "function" ? point.lat() : point.lat,
              longitude:
                typeof point.lng === "function" ? point.lng() : point.lng,
            });
          });
        }
      });
    }

    return coordinates;
  };

  const interpolateRoute = (
    route: LocationCoordinates[]
  ): LocationCoordinates[] => {
    if (route.length < 2) {
      return [...route];
    }

    const interpolated: LocationCoordinates[] = [];
    const maxSegmentDistance = 0.0005; // Roughly ~50 meters

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
   * Starts testing mode - moves car along the route
   */
  const startTesting = () => {
    if (!currentLocation || !pickupLocation) return;

    const actualRoute = directions?.toPickup
      ? buildRouteCoordinates(directions.toPickup)
      : [];

    const baseRoute =
      actualRoute.length > 0
        ? [...actualRoute]
        : [currentLocation, pickupLocation];

    if (baseRoute.length === 0) {
      return;
    }

    const firstPoint = baseRoute[0];
    const distanceToCurrent = Math.hypot(
      firstPoint.latitude - currentLocation.latitude,
      firstPoint.longitude - currentLocation.longitude
    );

    if (distanceToCurrent > 0.0002) {
      baseRoute.unshift(currentLocation);
    } else {
      baseRoute[0] = currentLocation;
    }

    const routeToUse = interpolateRoute(baseRoute);

    testRouteRef.current = routeToUse;
    routeIndexRef.current = 0;
    initialTestingLocationRef.current = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    };

    setIsTesting(true);

    // Calculate initial bearing using the first two points of the route
    const initialBearing =
      routeToUse.length >= 2
        ? calculateBearingBetween(routeToUse[0], routeToUse[1])
        : null;

    updateCarPosition(routeToUse[0], {
      immediate: true,
      previous: initialTestingLocationRef.current,
      bearing: initialBearing,
    });

    if (testingIntervalRef.current) {
      clearInterval(testingIntervalRef.current);
    }

    testingIntervalRef.current = setInterval(() => {
      advanceTestingRoute();
    }, 3000);
  };

  const advanceTestingRoute = () => {
    const route = testRouteRef.current;
    if (!route || route.length === 0) {
      stopTesting();
      return;
    }

    const nextIndex = routeIndexRef.current + 1;
    if (nextIndex >= route.length) {
      stopTesting();
      return;
    }

    const previousPoint = testRouteRef.current[routeIndexRef.current];
    const nextPoint = route[nextIndex];

    routeIndexRef.current = nextIndex;
    updateCarPosition(nextPoint, {
      previous: previousPoint,
    });
  };

  const stopTesting = () => {
    setIsTesting(false);

    if (testingIntervalRef.current) {
      clearInterval(testingIntervalRef.current);
      testingIntervalRef.current = null;
    }

    testRouteRef.current = [];
    routeIndexRef.current = 0;

    if (currentLocation) {
      updateCarPosition(currentLocation, { immediate: true });
    }
  };

  /**
   * Updates car position in WebView with animation
   */
  const updateCarPosition = (
    newPosition: LocationCoordinates,
    options: {
      immediate?: boolean;
      previous?: LocationCoordinates | null;
      bearing?: number | null;
    } = {}
  ) => {
    if (!webViewRef.current) return;

    const previousPoint =
      options.previous ??
      testRouteRef.current[Math.max(routeIndexRef.current - 1, 0)] ??
      currentLocation ??
      null;
    const bearing =
      options.bearing ??
      (previousPoint
        ? calculateBearingBetween(previousPoint, newPosition)
        : null);

    const payload = {
      latitude: newPosition.latitude,
      longitude: newPosition.longitude,
      immediate: options.immediate ?? false,
      bearing,
      previous: previousPoint,
    };

    const script = `
      if (typeof window.updateCarPosition === 'function') {
        window.updateCarPosition(${JSON.stringify(payload)});
      }
    `;
    webViewRef.current.injectJavaScript(script);
  };

  const calculateBearingBetween = (
    start: LocationCoordinates,
    end: LocationCoordinates
  ): number => {
    if (!start || !end) return 0;

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

  // Generate HTML for the map
  const generateRideMapHTML = (): string => {
    if (!currentLocation || !pickupLocation || !dropoffLocation) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .error { text-align: center; color: #666; }
            </style>
          </head>
          <body>
            <div class="error">Loading map...</div>
          </body>
        </html>
      `;
    }

    const { latitude: currentLat, longitude: currentLng } = currentLocation;
    const { latitude: pickupLat, longitude: pickupLng } = pickupLocation;
    const { latitude: dropoffLat, longitude: dropoffLng } = dropoffLocation;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          <!-- Status Tag -->
          <div id="status-tag" style="
            position: absolute;
            top: 16px;
            left: 0px;
            background-color: rgba(79, 79, 79, 0.9);
            color: white;
            padding: 12px 16px;
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          ">
            ${rideStatus}
          </div>

          <!-- ETA Tag -->
          ${
            eta
              ? `
          <div id="eta-tag" style="
            position: absolute;
            top: 16px;
            right: 0px;
            background-color: rgba(79, 79, 79, 0.9);
            color: white;
            padding: 12px 16px;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          ">
            ETA: ${eta}
          </div>
           `
              : ""
          }

          <!-- Waze Button -->
          ${
            showWazeButton
              ? `
          <div id="waze-button" style="
            position: absolute;
            bottom: 20px;
            left: 0px;
            width: 50px;
            height: 50px;
            background-color: #000000;
            border-top-right-radius: 12px;
            border-bottom-right-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <img src="${wazeIconUrl}" alt="Waze" style="width: 24px; height: 24px;" />
          </div>
          `
              : ""
          }
          <script>
            let map;
            let directionsService;
            let markers = [];
            let lastCarPosition = null;
            let lastBearing = null;
            let pickupPolyline = null;
            let dropoffPolyline = null;
            let pickupPath = [];
            let dropoffPath = [];
            let dropoffActive = false;

            function initMap() {
              console.log('Initializing ride map...');
              
              // Center map to show all locations
              const bounds = new google.maps.LatLngBounds();
              bounds.extend(new google.maps.LatLng(${currentLat}, ${currentLng}));
              bounds.extend(new google.maps.LatLng(${pickupLat}, ${pickupLng}));
              bounds.extend(new google.maps.LatLng(${dropoffLat}, ${dropoffLng}));

              map = new google.maps.Map(document.getElementById('map'), {
                center: bounds.getCenter(),
                zoom: 13,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'greedy'
              });

              // Fit map to show all markers
              map.fitBounds(bounds);
              
              // Add padding to bounds
              const listener = google.maps.event.addListener(map, 'idle', function() {
                map.setZoom(Math.min(map.getZoom(), 15));
                google.maps.event.removeListener(listener);
              });

              // Initialize directions service
              directionsService = new google.maps.DirectionsService();
              // directionsRenderer = new google.maps.DirectionsRenderer({ // This line is removed as per the edit hint
              //   suppressMarkers: true, // We'll add custom markers
              //   polylineOptions: {
              //     strokeColor: '#3B82F6',
              //     strokeWeight: 4,
              //     strokeOpacity: 0.8
              //   }
              // });
              // directionsRenderer.setMap(map); // This line is removed as per the edit hint

              // Add custom markers
              addMarkers();
              
              // Draw routes
              drawRoutes();
            }

            function addMarkers() {
              // Current location marker (car icon) - will be updated with rotation after route is drawn
              // Create initial car icon using embedded SVG (no rotation for initial display)
              const initialCarSvg = \`
                <svg width="30" height="30" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_3035_16582)">
                    <path d="M10.697 28.1976L17.6748 28.235C19.5245 28.2449 21.0345 26.1956 21.0444 24.3459L21.1551 3.69303C21.165 1.84397 19.6741 0.335808 17.8244 0.325894L10.8466 0.288492C8.99752 0.27858 7.48935 1.77008 7.47944 3.61973L7.36874 24.2726C7.36001 26.1223 8.84793 28.1877 10.697 28.1976ZM7.9798 19.7635L8.01691 12.8414L9.63743 12.6418L9.62214 15.4937L7.9798 19.7635ZM8.8187 21.7946C9.434 19.4835 10.1625 16.7517 10.1625 16.7517L18.3326 16.7955L19.624 21.8525C19.624 21.8525 14.3426 23.6151 8.8187 21.7946ZM18.8684 15.3564L18.8827 12.6908L20.5016 12.9066L20.4655 19.6441L18.8684 15.3564ZM20.54 5.73704L20.5071 11.8841L18.8882 11.6719L18.9142 6.80836L20.54 5.73704ZM19.6255 3.9851L18.2987 5.95765L10.1269 5.91385L8.82071 3.92719L19.6255 3.9851ZM9.66797 6.94454L9.64293 11.6158L8.02239 11.8178L8.05435 5.85527L9.66797 6.94454Z" fill="#03A093"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_3035_16582">
                      <rect width="27.9095" height="27.9095" fill="white" transform="translate(28.1406 28.291) rotate(-179.693)"/>
                    </clipPath>
                  </defs>
                </svg>
              \`;
              
              const svgBlob = new Blob([initialCarSvg], { type: 'image/svg+xml;charset=utf-8' });
              const svgUrl = URL.createObjectURL(svgBlob);
              
              const currentMarker = new google.maps.Marker({
                position: new google.maps.LatLng(${currentLat}, ${currentLng}),
                map: map,
                title: 'Your Current Location',
                icon: {
                  url: svgUrl,
                  scaledSize: new google.maps.Size(30, 30),
                  anchor: new google.maps.Point(15, 15)
                },
                optimized: false,
                flat: true,
                zIndex: 1000
              });
              markers.push(currentMarker);

              // Pickup location marker
              const pickupMarker = new google.maps.Marker({
                position: new google.maps.LatLng(${pickupLat}, ${pickupLng}),
                map: map,
                title: 'Pickup Location',
                icon: {
                  url: '${pickupIconUrl}',
                  scaledSize: new google.maps.Size(30, 60),
                  anchor: new google.maps.Point(20, 30)
                },
                zIndex: 1000
              });
              markers.push(pickupMarker);

              // Pickup InfoWindow
              const pickupInfoWindow = new google.maps.InfoWindow({
                content: \`
                  <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                      <div style="width: 12px; height: 12px; background-color: #EF4444; border-radius: 2px; margin-right: 8px;"></div>
                      <strong style="color: #1F2937; font-size: 14px;">Pickup From</strong>
                    </div>
                    <div style="color: #374151; font-size: 13px; line-height: 1.4;">
                      ${pickupAddress || "Pickup Location"}
                    </div>
                  </div>
                \`
              });

              // Add click listener to pickup marker
              pickupMarker.addListener('click', function() {
                pickupInfoWindow.open(map, pickupMarker);
              });

              // Dropoff location marker
              const dropoffMarker = new google.maps.Marker({
                position: new google.maps.LatLng(${dropoffLat}, ${dropoffLng}),
                map: map,
                title: 'Dropoff Location',
                icon: {
                  url: '${dropoffIconUrl}',
                  scaledSize: new google.maps.Size(30, 60),
                  anchor: new google.maps.Point(20, 30)
                },
                zIndex: 1000
              });
              markers.push(dropoffMarker);

              // Dropoff InfoWindow
              const dropoffInfoWindow = new google.maps.InfoWindow({
                content: \`
                  <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                      <div style="width: 12px; height: 12px; background-color: #10B981; border-radius: 2px; margin-right: 8px;"></div>
                      <strong style="color: #1F2937; font-size: 14px;">Drop-Off</strong>
                    </div>
                    <div style="color: #374151; font-size: 13px; line-height: 1.4;">
                      ${dropoffAddress || "Drop-off Location"}
                    </div>
                  </div>
                \`
              });

              // Add click listener to dropoff marker
              dropoffMarker.addListener('click', function() {
                dropoffInfoWindow.open(map, dropoffMarker);
              });
            }

            function drawRoutes() {
              directionsService.route({
                origin: new google.maps.LatLng(${currentLat}, ${currentLng}),
                destination: new google.maps.LatLng(${pickupLat}, ${pickupLng}),
                travelMode: google.maps.TravelMode.DRIVING
              }, function(response, status) {
                if (status === 'OK') {
                  const overview = response.routes?.[0]?.overview_polyline?.points;
                  pickupPath = overview
                    ? google.maps.geometry.encoding.decodePath(overview)
                    : response.routes?.[0]?.overview_path || [];

                  if (pickupPolyline) {
                    pickupPolyline.setMap(null);
                  }

                  pickupPolyline = new google.maps.Polyline({
                    map,
                    path: pickupPath,
                    strokeColor: '#3B82F6',
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                  });

                  updatePickupPolyline(${currentLat}, ${currentLng});

                  // Calculate initial bearing using the first two distinct points
                  if (pickupPath.length >= 2) {
                    const startPoint = pickupPath[0];
                    const endPoint = pickupPath[1];
                    window.ReactNativeWebView.postMessage('🗺️ Initial bearing calculation: ' + JSON.stringify({ startPoint, endPoint }));
                    const bearing = calculateBearingBetween(startPoint, endPoint);
                    window.ReactNativeWebView.postMessage('🧭 Calculated initial bearing: ' + bearing);
                    rotateCarIcon(bearing);
                  } else {
                    // Fallback to leg steps if path is too short
                    const leg = response.routes?.[0]?.legs?.[0];
                    if (leg?.steps?.length) {
                      const firstStep = leg.steps[0];
                      if (firstStep.start_location && firstStep.end_location) {
                        const bearing = calculateBearingBetween(
                          firstStep.start_location,
                          firstStep.end_location
                        );
                        rotateCarIcon(bearing);
                      }
                    }
                  }
                } else {
                  console.error('Directions request failed:', status);
                }
              });

              directionsService.route({
                origin: new google.maps.LatLng(${pickupLat}, ${pickupLng}),
                destination: new google.maps.LatLng(${dropoffLat}, ${dropoffLng}),
                travelMode: google.maps.TravelMode.DRIVING
              }, function(response, status) {
                if (status === 'OK') {
                  const overview = response.routes?.[0]?.overview_polyline?.points;
                  dropoffPath = overview
                    ? google.maps.geometry.encoding.decodePath(overview)
                    : response.routes?.[0]?.overview_path || [];

                  // Show the dropoff route initially
                  if (dropoffPolyline) {
                    dropoffPolyline.setMap(null);
                  }

                  dropoffPolyline = new google.maps.Polyline({
                    map,
                    path: dropoffPath,
                    strokeColor: '#10B981',
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                  });
                } else {
                  console.error('Directions request failed:', status);
                }
              });
            }

            function updatePickupPolyline(lat, lng) {
              if (!pickupPolyline || !pickupPath.length) return;

              const carPosition = new google.maps.LatLng(lat, lng);
              let closestIndex = 0;
              let minDistance = Infinity;

              pickupPath.forEach((point, index) => {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(carPosition, point);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = index;
                }
              });

              const remainingPath = pickupPath.slice(closestIndex);

              if (remainingPath.length <= 1) {
                pickupPolyline.setMap(null);
                pickupPolyline = null;
                dropoffActive = true;
                return;
              }

              pickupPolyline.setPath(remainingPath);
            }

            function renderDropoffPolyline() {
              if (!dropoffPath.length) return;

              if (dropoffPolyline) {
                dropoffPolyline.setMap(null);
              }

              dropoffPolyline = new google.maps.Polyline({
                map,
                path: dropoffPath,
                strokeColor: '#10B981',
                strokeWeight: 4,
                strokeOpacity: 0.8,
              });
            }

            function updateDropoffPolyline(lat, lng) {
              if (!dropoffPolyline || !dropoffPath.length) return;

              const carPosition = new google.maps.LatLng(lat, lng);
              let closestIndex = 0;
              let minDistance = Infinity;

              dropoffPath.forEach((point, index) => {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(carPosition, point);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = index;
                }
              });

              const remainingPath = dropoffPath.slice(closestIndex);

              if (remainingPath.length <= 1) {
                dropoffPolyline.setMap(null);
                dropoffPolyline = null;
                dropoffPath = [];
                return;
              }

              dropoffPolyline.setPath(remainingPath);
            }

            function updateCarPosition(payload) {
              if (!payload) return;

              const { latitude, longitude, immediate, bearing, previous } = payload;

              if (markers.length === 0) {
                return;
              }

              const carMarker = markers[0];
              const newPosition = new google.maps.LatLng(latitude, longitude);

              const startLat = previous ? previous.latitude : (lastCarPosition ? lastCarPosition.lat() : latitude);
              const startLng = previous ? previous.longitude : (lastCarPosition ? lastCarPosition.lng() : longitude);
              const finalBearing = typeof bearing === 'number'
                ? bearing
                : calculateBearingBetweenRaw(startLat, startLng, latitude, longitude);

              if (pickupPolyline) {
                updatePickupPolyline(latitude, longitude);
              } else if (!dropoffActive && isNearPickup(latitude, longitude)) {
                dropoffActive = true;
              } else if (dropoffActive && dropoffPolyline) {
                updateDropoffPolyline(latitude, longitude);
              }

              if (immediate || !lastCarPosition) {
                carMarker.setPosition(newPosition);
                rotateCarIcon(finalBearing);
                lastCarPosition = newPosition;
                lastBearing = finalBearing;
                // Force redraw workaround
                const z = carMarker.getZIndex() || 1000;
                carMarker.setZIndex(z + 1);
                return;
              }

              animateCarMovement(carMarker, {
                startLat,
                startLng,
                endLat: latitude,
                endLng: longitude,
                startBearing: lastBearing ?? finalBearing,
                endBearing: finalBearing,
              });

              lastCarPosition = newPosition;
              lastBearing = finalBearing;
            }

            function isNearPickup(lat, lng) {
              const pickupPosition = new google.maps.LatLng(${pickupLat}, ${pickupLng});
              const currentPosition = new google.maps.LatLng(lat, lng);
              const distance = google.maps.geometry.spherical.computeDistanceBetween(currentPosition, pickupPosition);
              return distance < 15;
            }

            function calculateBearingBetween(startLocation, endLocation) {
              const bearing = google.maps.geometry.spherical.computeHeading(startLocation, endLocation);
              const normalizedBearing = (bearing + 360) % 360;
              return normalizedBearing;
            }

            function calculateBearingBetweenRaw(lat1, lng1, lat2, lng2) {
              const bearing = google.maps.geometry.spherical.computeHeading(
                new google.maps.LatLng(lat1, lng1),
                new google.maps.LatLng(lat2, lng2)
              );
              const normalizedBearing = (bearing + 360) % 360;
              return normalizedBearing;
            }

            // Rotate car icon based on bearing
            function rotateCarIcon(bearing) {
              window.ReactNativeWebView.postMessage('🚗 rotateCarIcon called with bearing: ' + bearing + ', markers: ' + markers.length);
              if (markers.length > 0 && typeof bearing === 'number' && !isNaN(bearing)) {
                const carMarker = markers[0]; // First marker is the car
                
                // Embedded car SVG content (no need to fetch from URL)
                const carSvgContent = \`
                  <svg width="30" height="30" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_3035_16582)" transform="rotate(\${bearing + 180} 14.5 14.5)">
                      <path d="M10.697 28.1976L17.6748 28.235C19.5245 28.2449 21.0345 26.1956 21.0444 24.3459L21.1551 3.69303C21.165 1.84397 19.6741 0.335808 17.8244 0.325894L10.8466 0.288492C8.99752 0.27858 7.48935 1.77008 7.47944 3.61973L7.36874 24.2726C7.36001 26.1223 8.84793 28.1877 10.697 28.1976ZM7.9798 19.7635L8.01691 12.8414L9.63743 12.6418L9.62214 15.4937L7.9798 19.7635ZM8.8187 21.7946C9.434 19.4835 10.1625 16.7517 10.1625 16.7517L18.3326 16.7955L19.624 21.8525C19.624 21.8525 14.3426 23.6151 8.8187 21.7946ZM18.8684 15.3564L18.8827 12.6908L20.5016 12.9066L20.4655 19.6441L18.8684 15.3564ZM20.54 5.73704L20.5071 11.8841L18.8882 11.6719L18.9142 6.80836L20.54 5.73704ZM19.6255 3.9851L18.2987 5.95765L10.1269 5.91385L8.82071 3.92719L19.6255 3.9851ZM9.66797 6.94454L9.64293 11.6158L8.02239 11.8178L8.05435 5.85527L9.66797 6.94454Z" fill="#03A093"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_3035_16582">
                        <rect width="27.9095" height="27.9095" fill="white" transform="translate(28.1406 28.291) rotate(-179.693)"/>
                      </clipPath>
                    </defs>
                  </svg>
                \`;
                
                // Debug: Log the rotation angle
                window.ReactNativeWebView.postMessage('🚗 Applying rotation angle: ' + (bearing + 180) + ' degrees (bearing: ' + bearing + ' + 180° offset)');
                
                // Create blob and URL
                const svgBlob = new Blob([carSvgContent], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                // Create rotated icon
                const rotatedIcon = {
                  url: svgUrl,
                  scaledSize: new google.maps.Size(30, 30),
                  anchor: new google.maps.Point(15, 15),
                  origin: new google.maps.Point(0, 0)
                };
                
                // Force marker to re-render by updating icon via setOptions
                carMarker.setOptions({ icon: rotatedIcon, optimized: false, flat: true });
                const z = (carMarker.getZIndex() || 1000) + 1;
                carMarker.setZIndex(z);
                
                window.ReactNativeWebView.postMessage('🚗 Car icon rotated to bearing: ' + bearing + ' degrees');
              }
            }

            function animateCarMovement(marker, { startLat, startLng, endLat, endLng, startBearing, endBearing }) {
              const duration = 2000;
              const steps = 60;
              const interval = duration / steps;
              let currentStep = 0;

              const animate = () => {
                if (currentStep >= steps) {
                  marker.setPosition(new google.maps.LatLng(endLat, endLng));
                  rotateCarIcon(endBearing);
                  return;
                }

                const progress = currentStep / steps;
                const ease = easeInOutCubic(progress);
                const lat = startLat + (endLat - startLat) * ease;
                const lng = startLng + (endLng - startLng) * ease;

                marker.setPosition(new google.maps.LatLng(lat, lng));

                const interpolatedBearing = interpolateBearing(startBearing, endBearing, ease);
                rotateCarIcon(interpolatedBearing);

                currentStep++;
                requestAnimationFrame(() => setTimeout(animate, interval));
              };

              animate();
            }

            // Easing function for smooth animation
            function easeInOutCubic(t) {
              return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            }

            function interpolateBearing(start, end, t) {
              let difference = ((end - start + 540) % 360) - 180;
              return (start + difference * t + 360) % 360;
            }

            // Load Google Maps API
            function loadGoogleMapsAPI() {
              const script = document.createElement('script');
              script.src = 'https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&callback=initMap';
              script.async = true;
              script.defer = true;
              script.onerror = function() {
                console.error('Failed to load Google Maps API');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'maps_error',
                  message: 'Failed to load Google Maps API'
                }));
              };
              document.head.appendChild(script);
            }

            // Initialize when page loads
            window.addEventListener('load', loadGoogleMapsAPI);

            // Waze button click handler
            ${
              showWazeButton
                ? `
            document.addEventListener('DOMContentLoaded', function() {
              const wazeButton = document.getElementById('waze-button');
              if (wazeButton) {
                wazeButton.addEventListener('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'waze_button_pressed'
                  }));
                });
              }
            });
            `
                : ""
            }
          </script>
        </body>
      </html>
    `;
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

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateRideMapHTML() }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => {
          log("Ride map loaded");
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          const errorMessage = `WebView error: ${nativeEvent.description}`;
          setError(errorMessage);
          onError?.(errorMessage);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "waze_button_pressed") {
              onWazePress?.();
            }
          } catch (error) {
            // Handle non-JSON messages or ignore
          }
        }}
      />

      {/* Testing Controls - Dev Only */}
      <View style={styles.testingControls}>
        <Button
          onPress={isTesting ? stopTesting : startTesting}
          variant={isTesting ? "danger" : "primary"}
          style={styles.testingButton}
          disabled={!currentLocation || !pickupLocation}
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
  testingControls: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 120,
  },
  testingButton: {
    marginBottom: 8,
  },
  testingStatus: {
    color: textColors.grey600,
    textAlign: "center",
  },
});
