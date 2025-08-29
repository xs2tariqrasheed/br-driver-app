import { DESIRED_DESTINATION_EXPIRY_MS, TOKEN_KEY } from "@/constants/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Alert } from "react-native";

// Types for destination management
export type DesiredDestination = {
  id: number;
  created_at: string; // ISO string
  address: string;
  expired_at: string; // ISO string
};

type StorageValue = string;

/**
 * Returns whether the current Expo environment is development.
 *
 * Reads `process.env.EXPO_PUBLIC_ENVIRONMENT` and compares it to "dev".
 * Falls back to "production" when unspecified.
 *
 * @returns {boolean} True when environment is dev, false otherwise.
 */
export const isDevEnvironment = (): boolean => {
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || "production";
  return env.toLowerCase() === "dev";
};

/**
 * Creates a console logger function that no-ops outside of development.
 *
 * The returned function proxies its arguments to `console.log` only when
 * `isDevEnvironment()` returns true.
 *
 * @returns {(…args: unknown[]) => void} A logger function safe to use in prod.
 * @example
 * const log = logger();
 * log("Sending request", payload);
 */
export const logger =
  () =>
  (...args: unknown[]) => {
    if (isDevEnvironment()) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  };

/**
 * Persists a string value in AsyncStorage.
 *
 * @param {string} key - Storage key under which to save the value.
 * @param {string} value - The string value to persist.
 * @returns {Promise<void>} Resolves when the value has been saved.
 */
export const setStorageItem = async (
  key: string,
  value: StorageValue
): Promise<void> => {
  await AsyncStorage.setItem(key, value);
};

/**
 * Retrieves a string value from AsyncStorage.
 *
 * @param {string} key - Storage key to read.
 * @returns {Promise<string | null>} The stored value or null if not found.
 */
export const getStorageItem = async (key: string): Promise<string | null> => {
  return AsyncStorage.getItem(key);
};

/**
 * Removes a specific key/value pair from AsyncStorage.
 *
 * @param {string} key - Storage key to remove.
 * @returns {Promise<void>} Resolves when the key has been removed.
 */
export const removeStorageItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};

/**
 * Clears all keys from AsyncStorage. Use with caution.
 *
 * @returns {Promise<void>} Resolves when storage is cleared.
 */
export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.clear();
};

/**
 * Returns all existing keys in AsyncStorage.
 *
 * @returns {Promise<readonly string[]>} An array of keys.
 */
export const getAllStorageKeys = async (): Promise<readonly string[]> => {
  const keys = await AsyncStorage.getAllKeys();
  return keys;
};

/**
 * Stores multiple key/value pairs in one batch operation.
 *
 * @param {Array<[string, string]>} entries - Array of [key, value] pairs.
 * @returns {Promise<void>} Resolves when all pairs are saved.
 */
export const multiSetStorageItems = async (
  entries: Array<[string, StorageValue]>
): Promise<void> => {
  await AsyncStorage.multiSet(entries);
};

/**
 * Retrieves multiple values by their keys in one batch operation.
 *
 * @param {readonly string[]} keys - Keys to read.
 * @returns {Promise<ReadonlyArray<[string, string | null]>>} Array of [key, value] tuples.
 */
export const multiGetStorageItems = async (
  keys: readonly string[]
): Promise<ReadonlyArray<[string, string | null]>> => {
  return AsyncStorage.multiGet(keys);
};

/**
 * Stores the auth token using the application's canonical token key.
 *
 * @param {string} token - Token string to persist.
 * @returns {Promise<void>} Resolves when stored.
 */
export const setAuthToken = async (token: string): Promise<void> => {
  await setStorageItem(TOKEN_KEY, token);
};

/**
 * Reads the auth token from AsyncStorage.
 *
 * @returns {Promise<string | null>} Token string if present, else null.
 */
export const getAuthToken = async (): Promise<string | null> => {
  return getStorageItem(TOKEN_KEY);
};

/**
 * Removes the stored auth token.
 *
 * @returns {Promise<void>} Resolves when removed.
 */
export const clearAuthToken = async (): Promise<void> => {
  await removeStorageItem(TOKEN_KEY);
};

// Map and Location Helper Functions

/**
 * Interface for map region data
 */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Interface for location coordinates
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Interface for location selection callback data
 */
export interface LocationSelectData {
  address: string;
  coordinates: LocationCoordinates;
}

/**
 * Interface for WebView message data
 */
export interface WebViewMessageData {
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Requests the user's current location and returns the region data.
 * Handles permission requests and provides fallback coordinates if permission is denied.
 *
 * @param {MapRegion} [fallbackRegion] - Optional fallback region to use if location access fails
 * @returns {Promise<MapRegion>} Promise resolving to the current location region or fallback
 * @throws {Error} Throws an error if location services fail and no fallback is provided
 *
 * @example
 * ```typescript
 * const region = await getCurrentLocation();
 * console.log('Current location:', region);
 * ```
 */
export const getCurrentLocation = async (
  fallbackRegion?: MapRegion
): Promise<MapRegion> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Location permission is required to show your current location."
      );
      if (fallbackRegion) {
        return fallbackRegion;
      }
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    if (fallbackRegion) {
      return fallbackRegion;
    }
    throw error;
  }
};

/**
 * Converts geographic coordinates to a human-readable address using Google Maps Geocoding API.
 *
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {string} apiKey - Google Maps API key for geocoding
 * @returns {Promise<string>} Promise resolving to the formatted address or coordinate string as fallback
 *
 * @example
 * ```typescript
 * const address = await reverseGeocode(37.7749, -122.4194, apiKey);
 * console.log('Address:', address);
 * ```
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error("Geocoding error:", error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Generates HTML content for Google Maps WebView with interactive location selection.
 *
 * @param {MapRegion} region - The initial map region to display
 * @param {string} apiKey - Google Maps API key
 * @param {boolean} [autoSelectCurrentLocation=true] - Whether to auto-select current location
 * @returns {string} HTML string containing the map implementation
 *
 * @example
 * ```typescript
 * const html = generateMapHTML(region, apiKey);
 * webView.loadHTMLString(html);
 * ```
 */
export const generateMapHTML = (
  region: MapRegion,
  apiKey: string,
  autoSelectCurrentLocation: boolean = true,
  pickupIconUrl: string = "",
  userLocation: LocationCoordinates | null = null
): string => {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .map-instructions {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 12px 20px;
            border-radius: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: #374151;
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div class="map-instructions">Tap on the map to pick a location</div>
        <div id="map"></div>

        <script>
          let map;
          let marker;

          function initMap() {
            console.log('Google Maps initialized');
            const center = { lat: ${latitude}, lng: ${longitude} };

            map = new google.maps.Map(document.getElementById('map'), {
              center: center,
              zoom: 15,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
              gestureHandling: 'greedy'
            });

            ${
              autoSelectCurrentLocation
                ? `
            // Auto-select user's current location using passed data
            const userLocationData = ${JSON.stringify(userLocation)};
            if (userLocationData && userLocationData.latitude && userLocationData.longitude) {
              console.log('Using provided user location:', userLocationData);
              const pos = {
                lat: userLocationData.latitude,
                lng: userLocationData.longitude
              };

                // Center map on user's location
                map.setCenter(pos);
                map.setZoom(15);

                // Create custom pickup location icon marker
                const pickupIcon = {
                  url: '${pickupIconUrl}' || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTFMMTkgMTFNMTkgMTFMMTMgNUMxMyA1IDEyIDUgMTIgNUwxMiAxMUgxOUwxOSAxMVpNMTkgMTFMMTMgMTdDMTMgMTcgMTIgMTcgMTIgMTdMMTIgMTFIMTlaIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
                  scaledSize: new google.maps.Size(30, 60),
                  anchor: new google.maps.Point(20, 30)
                };

                // Add marker at user's current location
                marker = new google.maps.Marker({
                  position: pos,
                  map: map,
                  title: 'Your Current Location',
                  icon: pickupIcon,
                  animation: google.maps.Animation.DROP
                });

                // Get address for current location and auto-select it
                const geocoder = new google.maps.Geocoder();

                // Add timeout to geocoding
                const geocodingTimeout = setTimeout(() => {
                  console.log('Geocoding timeout, using fallback');
                  const fallbackAddress = pos.lat.toFixed(6) + ', ' + pos.lng.toFixed(6);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: pos.lat,
                    longitude: pos.lng,
                    address: fallbackAddress
                  }));
                }, 5000); // 5 second timeout

                geocoder.geocode({ location: pos }, function(results, status) {
                  clearTimeout(geocodingTimeout);
                  console.log('Geocoding result:', { status, results });
                  if (status === 'OK' && results[0]) {
                    const address = results[0].formatted_address;
                    console.log('Address found:', address);
                    // Auto-select this location with address
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'location_selected',
                      latitude: pos.lat,
                      longitude: pos.lng,
                      address: address
                    }));
                  } else {
                    console.log('Geocoding failed, using fallback');
                    // Fallback to coordinates if geocoding fails
                    const fallbackAddress = pos.lat.toFixed(6) + ', ' + pos.lng.toFixed(6);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'location_selected',
                      latitude: pos.lat,
                      longitude: pos.lng,
                      address: fallbackAddress
                    }));
                  }
                });
            } else {
              console.log('No user location provided, skipping auto-selection');
            }
            `
                : ""
            }

            // Add click listener to map
            map.addListener('click', function(event) {
              const position = event.latLng;

              // Remove existing marker
              if (marker) {
                marker.setMap(null);
              }

              // Create custom pickup location icon marker
              const pickupIcon = {
                url: '${pickupIconUrl}' || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTFMMTkgMTFNMTkgMTFMMTMgNUMxMyA1IDEyIDUgMTIgNUwxMiAxMUgxOUwxOSAxMVpNMTkgMTFMMTMgMTdDMTMgMTcgMTIgMTcgMTIgMTdMMTIgMTFIMTlaIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
                scaledSize: new google.maps.Size(40, 60),
                anchor: new google.maps.Point(20, 30)
              };

              // Add new marker
              marker = new google.maps.Marker({
                position: position,
                map: map,
                title: 'Selected Location',
                icon: pickupIcon,
                animation: google.maps.Animation.DROP
              });

              // Get address for clicked location and send to React Native
              const geocoder = new google.maps.Geocoder();

              // Add timeout to geocoding
              const clickGeocodingTimeout = setTimeout(() => {
                console.log('Click geocoding timeout, using fallback');
                const fallbackAddress = position.lat().toFixed(6) + ', ' + position.lng().toFixed(6);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'location_selected',
                  latitude: position.lat(),
                  longitude: position.lng(),
                  address: fallbackAddress
                }));
              }, 5000); // 5 second timeout

              geocoder.geocode({ location: position }, function(results, status) {
                clearTimeout(clickGeocodingTimeout);
                console.log('Click geocoding result:', { status, results });
                if (status === 'OK' && results[0]) {
                  const address = results[0].formatted_address;
                  console.log('Click address found:', address);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: address
                  }));
                } else {
                  console.log('Click geocoding failed, using fallback');
                  // Fallback to coordinates if geocoding fails
                  const fallbackAddress = position.lat().toFixed(6) + ', ' + position.lng().toFixed(6);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: fallbackAddress
                  }));
                }
              });
            });
          }

          // Load Google Maps API
          function loadGoogleMapsAPI() {
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          }

          // Initialize when page loads
          window.addEventListener('load', loadGoogleMapsAPI);
        </script>
      </body>
    </html>
  `;
};

/**
 * Interface for heatmap data points with ETA information
 */
export interface HeatmapDataPoint {
  lat: number;
  lng: number;
  weight: number;
  eta?: string;
  demandLevel?: "high" | "medium" | "low";
}

/**
 * Options for customizing the heatmap appearance
 */
export interface HeatmapOptions {
  radius?: number;
  opacity?: number;
  gradient?: string[];
  showETALabels?: boolean;
}

/**
 * Generates HTML content for a Google Maps heatmap with ETA overlays and custom markers.
 * This function creates a complete HTML page with Google Maps that displays:
 * - Interactive heatmap visualization with color-coded demand intensity
 * - ETA labels overlaid on high-demand areas
 * - Custom car icon for current location
 * - Click-to-select functionality
 * - Zoom and pan controls
 *
 * @param region - The initial map region to display
 * @param apiKey - Google Maps API key
 * @param heatmapData - Array of data points with coordinates, weights, and ETA info
 * @param options - Customization options for heatmap appearance
 * @param carIconUrl - Base64 data URL or path to car icon for current location marker
 * @returns Complete HTML string ready for WebView
 *
 * @example
 * ```typescript
 * const heatmapData = [
 *   { lat: 37.7749, lng: -122.4194, weight: 0.9, eta: "3 mins", demandLevel: 'high' },
 *   { lat: 37.7849, lng: -122.4094, weight: 0.7, eta: "5 mins", demandLevel: 'medium' }
 * ];
 *
 * const html = generateHeatmapHTML(region, apiKey, heatmapData, {
 *   radius: 50,
 *   opacity: 0.7,
 *   showETALabels: true
 * });
 * ```
 */
export const generateHeatmapHTML = (
  region: MapRegion,
  apiKey: string,
  heatmapData: HeatmapDataPoint[] = [],
  options: HeatmapOptions = {},
  pickupIconUrl: string = "",
  userLocation: LocationCoordinates | null = null
): string => {
  const { latitude, longitude } = region;
  const {
    radius = 50,
    opacity = 0.7,
    showETALabels = true,
  } = options;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #map { 
            width: 100%; 
            height: 100vh; 
          }
          
          .eta-label {
            background: rgba(0, 0, 0, 0.7);
            border: none;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 14px;
            font-weight: bold;
            color: white;
            text-align: center;
            white-space: nowrap;
            pointer-events: none;
            user-select: none;
          }
          


          .legend {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-size: 12px;
            z-index: 1000;
          }
          
          .legend-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            margin: 4px 0;
          }
          
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 8px;
          }
          
          .legend-color.high { background: #DD2626; }
          .legend-color.medium { background: #DD9726; }
          .legend-color.low { background: #38DD38; }
        </style>
      </head>
      <body>
        <div class="legend">
          <div class="legend-title">Demand Level</div>
          <div class="legend-item">
            <div class="legend-color high"></div>
            <span>High Demand</span>
          </div>
          <div class="legend-item">
            <div class="legend-color medium"></div>
            <span>Medium Demand</span>
          </div>
          <div class="legend-item">
            <div class="legend-color low"></div>
            <span>Low Demand</span>
          </div>
        </div>
        
        <div id="map"></div>

        <script>
          let map;
          let demandCircles = [];
          let currentLocationMarker;
          let etaLabels = [];

          function initMap() {
            console.log('Initializing heatmap...');
            const center = { lat: ${latitude}, lng: ${longitude} };

            map = new google.maps.Map(document.getElementById('map'), {
              center: center,
              zoom: 13,
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
              gestureHandling: 'greedy',
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            });

            // Initialize demand circles with data
            const heatmapData = ${JSON.stringify(heatmapData)};
            console.log('Demand data points:', heatmapData.length);
            
            if (heatmapData.length > 0) {
              // Create solid colored circles for each demand point
              heatmapData.forEach(point => {
                // Define colors for each demand level with low opacity
                const demandColors = {
                  high: 'rgba(221, 38, 38, 0.4)',    // red-500 with 0.4 opacity
                  medium: 'rgba(221, 151, 38, 0.4)', // yellow-500 with 0.4 opacity
                  low: 'rgba(56, 221, 56, 0.4)'      // green-500 with 0.4 opacity
                };

                const color = demandColors[point.demandLevel] || demandColors.medium;
                
                // Create circle for demand area
                const demandCircle = new google.maps.Circle({
                  strokeColor: color.replace('0.4', '0.8'), // Slightly more opaque border
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: color,
                  fillOpacity: 0.4,
                  map: map,
                  center: { lat: point.lat, lng: point.lng },
                  radius: ${radius * 10} // Convert to meters (radius was in pixels for heatmap)
                });
                
                demandCircles.push(demandCircle);
                
                ${
                  showETALabels
                    ? `
                // Add ETA label for each demand area
                if (point.eta) {
                  addETALabel(point);
                }
                `
                    : ""
                }
              });
            }

            // Add current location marker with pickup icon if user location is provided
            const userLocationData = ${JSON.stringify(userLocation)};
            if (userLocationData && userLocationData.latitude && userLocationData.longitude) {
              console.log('Adding user location marker:', userLocationData);
              
              const pos = {
                lat: userLocationData.latitude,
                lng: userLocationData.longitude
              };

              // Create custom pickup location icon marker
              const pickupIcon = {
                url: '${pickupIconUrl}' || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTFMMTkgMTFNMTkgMTFMMTMgNUMxMyA1IDEyIDUgMTIgNUwxMiAxMUgxOUwxOSAxMVpNMTkgMTFMMTMgMTdDMTMgMTcgMTIgMTcgMTIgMTdMMTIgMTFIMTlaIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
                scaledSize: new google.maps.Size(30, 60),
                anchor: new google.maps.Point(20, 30)
              };

              currentLocationMarker = new google.maps.Marker({
                position: pos,
                map: map,
                title: 'Your Current Location',
                icon: pickupIcon,
                zIndex: 1000
              });

              console.log('User location marker added successfully');
            } else {
              console.log('No user location provided, skipping location marker');
            }

            // Add click listener to map
            map.addListener('click', function(event) {
              const position = event.latLng;
              
              // Get address for clicked location and send to React Native
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: position }, function(results, status) {
                if (status === 'OK' && results[0]) {
                  const address = results[0].formatted_address;
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: address
                  }));
                } else {
                  // Fallback to coordinates if geocoding fails
                  const fallbackAddress = position.lat().toFixed(6) + ', ' + position.lng().toFixed(6);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: fallbackAddress
                  }));
                }
              });
            });
          }

          // Function to add ETA label overlay
          function addETALabel(point) {
            const position = new google.maps.LatLng(point.lat, point.lng);
            
            const etaOverlay = new google.maps.OverlayView();
            
            etaOverlay.onAdd = function() {
              const div = document.createElement('div');
              div.className = 'eta-label';
              div.innerHTML = 'ETA: ' + point.eta;
              
              const panes = this.getPanes();
              panes.overlayLayer.appendChild(div);
              
              this.div = div;
            };
            
            etaOverlay.draw = function() {
              const overlayProjection = this.getProjection();
              const pos = overlayProjection.fromLatLngToDivPixel(position);
              
              if (pos) {
                const div = this.div;
                // Center the text exactly in the middle of the circle
                div.style.left = pos.x + 'px';
                div.style.top = pos.y + 'px';
                div.style.position = 'absolute';
                div.style.transform = 'translate(-50%, -50%)';
              }
            };
            
            etaOverlay.onRemove = function() {
              if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            };
            
            etaOverlay.setMap(map);
            etaLabels.push(etaOverlay);
          }

          // Function to update demand circles data dynamically
          function updateHeatmap(newData) {
            // Clear existing demand circles
            demandCircles.forEach(circle => circle.setMap(null));
            demandCircles = [];
            
            // Clear existing ETA labels
            etaLabels.forEach(label => label.setMap(null));
            etaLabels = [];
            
            // Create new demand circles
            newData.forEach(point => {
              const demandColors = {
                high: 'rgba(221, 38, 38, 0.4)',    // red-500 with 0.4 opacity
                medium: 'rgba(221, 151, 38, 0.4)', // yellow-500 with 0.4 opacity
                low: 'rgba(56, 221, 56, 0.4)'      // green-500 with 0.4 opacity
              };

              const color = demandColors[point.demandLevel] || demandColors.medium;
              
              const demandCircle = new google.maps.Circle({
                strokeColor: color.replace('0.4', '0.8'),
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: color,
                fillOpacity: 0.4,
                map: map,
                center: { lat: point.lat, lng: point.lng },
                radius: ${radius * 10}
              });
              
              demandCircles.push(demandCircle);
              
              ${
                showETALabels
                  ? `
              // Add ETA label for each demand area
              if (point.eta) {
                addETALabel(point);
              }
              `
                  : ""
              }
            });
          }

          // Function to toggle demand circles visibility
          function toggleHeatmap(visible) {
            demandCircles.forEach(circle => {
              circle.setMap(visible ? map : null);
            });
            
            etaLabels.forEach(label => {
              label.setMap(visible ? map : null);
            });
          }

          // Load Google Maps API with visualization library
          function loadGoogleMapsAPI() {
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=initMap';
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
          
          // Expose functions for React Native communication
          window.updateHeatmapData = updateHeatmap;
          window.toggleHeatmapVisibility = toggleHeatmap;
        </script>
      </body>
    </html>
  `;
};

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point  
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculates estimated travel time from user location to a demand area
 * @param userLocation - User's current coordinates
 * @param demandLocation - Demand area coordinates  
 * @param demandLevel - Level of demand (affects average speed assumption)
 * @returns ETA string like "3 mins" or "12 mins"
 */
export const calculateETA = (
  userLocation: LocationCoordinates,
  demandLocation: { lat: number; lng: number },
  demandLevel: "high" | "medium" | "low" = "medium"
): string => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    demandLocation.lat,
    demandLocation.lng
  );

  // Average speed assumptions based on demand level (traffic conditions)
  const avgSpeed = {
    high: 20, // km/h - heavy traffic in high demand areas
    medium: 30, // km/h - moderate traffic
    low: 40, // km/h - lighter traffic
  };

  const speed = avgSpeed[demandLevel];
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);

  // Format the time
  if (timeInMinutes < 1) {
    return "< 1 min";
  } else if (timeInMinutes === 1) {
    return "1 min";
  } else if (timeInMinutes < 60) {
    return `${timeInMinutes} mins`;
  } else {
    // Handle hours and minutes
    const hours = Math.floor(timeInMinutes / 60);
    const remainingMinutes = timeInMinutes % 60;
    
    if (remainingMinutes === 0) {
      return hours === 1 ? "1hr" : `${hours}hrs`;
    } else {
      const hourText = hours === 1 ? "1hr" : `${hours}hrs`;
      const minText = remainingMinutes === 1 ? "1 min" : `${remainingMinutes} mins`;
      return `${hourText} ${minText}`;
    }
  }
};

/**
 * Processes WebView messages from the Google Maps implementation.
 * Handles location selection events and calls the appropriate callback.
 *
 * @param {any} event - The WebView message event containing nativeEvent.data
 * @param {(data: LocationSelectData) => void} onLocationSelect - Callback function for location selection
 * @param {(latitude: number, longitude: number) => void} [onMapPress] - Optional callback for map press events
 *
 * @example
 * ```typescript
 * const handleWebViewMessage = (event) => {
 *   handleWebViewLocationMessage(event, onLocationSelect, onMapPress);
 * };
 * ```
 */
export const handleWebViewLocationMessage = (
  event: any,
  onLocationSelect: (data: LocationSelectData) => void,
  onMapPress?: (latitude: number, longitude: number) => void
): void => {
  const log = logger();

  try {
    const data: WebViewMessageData = JSON.parse(event.nativeEvent.data);
    log("WebView message received:", data);

    if (data.type === "location_selected") {
      // If address is provided, use it directly; otherwise, fall back to coordinates
      if (data.address) {
        log("Calling onLocationSelect with address:", data.address);
        onLocationSelect({
          address: data.address,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });
      } else {
        log("Calling onMapPress with coordinates");
        if (onMapPress) {
          onMapPress(data.latitude, data.longitude);
        }
      }
    }
  } catch (error) {
    console.error("Error parsing WebView message:", error);
  }
};

// =============================================================================
// DESTINATION MANAGEMENT HELPERS
// =============================================================================

/**
 * Creates a new desired destination object with automatic expiration time.
 *
 * @param {string} address - The human-readable address for the destination
 * @returns {DesiredDestination} A new destination object with id, timestamps, and expiration
 *
 * @example
 * ```typescript
 * const destination = createDesiredDestination("123 Main St, City, State");
 * console.log(destination);
 * // {
 * //   id: 1703123456789,
 * //   created_at: "2023-12-20T10:30:56.789Z",
 * //   address: "123 Main St, City, State",
 * //   expired_at: "2023-12-20T16:30:56.789Z"
 * // }
 * ```
 */
export function createDesiredDestination(address: string): DesiredDestination {
  const now = new Date();
  const expiredAt = new Date(now.getTime() + DESIRED_DESTINATION_EXPIRY_MS);

  // Generate a simple ID based on timestamp
  const id = Date.now();

  return {
    id,
    created_at: now.toISOString(),
    address,
    expired_at: expiredAt.toISOString(),
  };
}

/**
 * Checks if a destination has expired based on its expiration timestamp.
 *
 * @param {string} expiredAt - ISO timestamp string representing when the destination expires
 * @returns {boolean} True if the destination has expired, false otherwise
 *
 * @example
 * ```typescript
 * const expired = isDestinationExpired("2023-12-20T10:30:56.789Z");
 * console.log(expired); // true if current time is past the expiration
 * ```
 */
export function isDestinationExpired(expiredAt: string): boolean {
  return new Date() > new Date(expiredAt);
}

/**
 * Filters a list of destinations into valid (non-expired) and expired arrays.
 *
 * @param {DesiredDestination[]} destinations - Array of destination objects to filter
 * @returns {{valid: DesiredDestination[], expired: DesiredDestination[]}} Object containing valid and expired destination arrays
 *
 * @example
 * ```typescript
 * const destinations = [dest1, dest2, dest3];
 * const { valid, expired } = filterExpiredDestinations(destinations);
 * console.log(`Found ${valid.length} valid and ${expired.length} expired destinations`);
 * ```
 */
export function filterExpiredDestinations(destinations: DesiredDestination[]): {
  valid: DesiredDestination[];
  expired: DesiredDestination[];
} {
  const valid: DesiredDestination[] = [];
  const expired: DesiredDestination[] = [];

  destinations.forEach((dest) => {
    if (isDestinationExpired(dest.expired_at)) {
      expired.push(dest);
    } else {
      valid.push(dest);
    }
  });

  return { valid, expired };
}

/**
 * Returns only the valid (non-expired) destinations from a list.
 *
 * @param {DesiredDestination[]} destinations - Array of destination objects to filter
 * @returns {DesiredDestination[]} Array containing only non-expired destinations
 *
 * @example
 * ```typescript
 * const destinations = [dest1, dest2, dest3];
 * const validOnly = getValidDestinations(destinations);
 * console.log(`Found ${validOnly.length} valid destinations`);
 * ```
 */
export function getValidDestinations(
  destinations: DesiredDestination[]
): DesiredDestination[] {
  return destinations.filter((dest) => !isDestinationExpired(dest.expired_at));
}

/**
 * Formats the expiration time as a human-readable string.
 *
 * @param {string} expiredAt - ISO timestamp string representing when the destination expires
 * @returns {string} Human-readable expiration time (e.g., "Expires in 3h 45m", "Expired")
 *
 * @example
 * ```typescript
 * const timeString = formatExpirationTime("2023-12-20T16:30:56.789Z");
 * console.log(timeString); // "Expires in 3h 45m" or "Expired"
 * ```
 */
export function formatExpirationTime(expiredAt: string): string {
  const now = new Date();
  const expiry = new Date(expiredAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expired";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `Expires in ${diffHours}h ${diffMinutes}m`;
  } else {
    return `Expires in ${diffMinutes}m`;
  }
}
