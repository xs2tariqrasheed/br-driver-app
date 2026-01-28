import { DESIRED_DESTINATION_EXPIRY_MS, TOKEN_KEY } from "@/constants/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { Alert, Platform } from "react-native";

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
  value: StorageValue,
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
 * Clears AsyncStorage selectively, preserving specified keys.
 *
 * @param {string[]} keysToPreserve - Array of storage keys to preserve during clearing.
 * @returns {Promise<void>} Resolves when storage is cleared (except preserved keys).
 *
 * @example
 * ```typescript
 * // Clear all storage except settings and notifications backup
 * await clearStorageSelectively(['@settings', '@notifications_backup']);
 * ```
 */
export const clearStorageSelectively = async (
  keysToPreserve: string[] = [],
): Promise<void> => {
  try {
    // Get all storage keys
    const allKeys = await getAllStorageKeys();

    // Filter out keys to preserve
    const keysToRemove = allKeys.filter((key) => !keysToPreserve.includes(key));

    // Remove keys in batch if there are any to remove
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error("Error clearing storage selectively:", error);
    // Re-throw to allow caller to handle
    throw error;
  }
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
  entries: Array<[string, StorageValue]>,
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
  keys: readonly string[],
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
  placeId?: string;
  zipCode?: string;
}

/**
 * Interface for WebView message data
 */
export interface WebViewMessageData {
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
  zipCode?: string;
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
  fallbackRegion?: MapRegion,
): Promise<MapRegion> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Location permission is required to show your current location.",
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
  apiKey: string,
): Promise<string> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
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
 * Converts a human-readable address to geographic coordinates using Google Maps Geocoding API.
 *
 * @param {string} address - The address to geocode
 * @param {string} apiKey - Google Maps API key for geocoding
 * @returns {Promise<LocationCoordinates | null>} Promise resolving to coordinates or null if geocoding fails
 *
 * @example
 * ```typescript
 * const coords = await geocodeAddress("123 Main St, City, State", apiKey);
 * if (coords) {
 *   console.log('Coordinates:', coords);
 * }
 * ```
 */
export const geocodeAddress = async (
  address: string,
  apiKey: string,
): Promise<LocationCoordinates | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${apiKey}`,
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

/**
 * Gets directions between two points using Google Maps Directions API.
 *
 * @param {LocationCoordinates} origin - Starting coordinates
 * @param {LocationCoordinates} destination - Destination coordinates
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise<any>} Promise resolving to directions data or null if request fails
 *
 * @example
 * ```typescript
 * const directions = await getDirections(origin, destination, apiKey);
 * if (directions) {
 *   console.log('Route:', directions.routes[0]);
 * }
 * ```
 */
export const getDirections = async (
  origin: LocationCoordinates,
  destination: LocationCoordinates,
  apiKey: string,
): Promise<any> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}`,
    );
    const data = await response.json();

    if (data.status === "OK" && data.routes && data.routes.length > 0) {
      return data;
    }
    return null;
  } catch (error) {
    console.error("Directions API error:", error);
    return null;
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
  userLocation: LocationCoordinates | null = null,
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
                    const placeId = results[0].place_id || '';
                    // Extract postal code from address components
                    let zipCode = '';
                    if (results[0].address_components) {
                      const postalCodeComponent = results[0].address_components.find(
                        component => component.types.includes('postal_code')
                      );
                      if (postalCodeComponent) {
                        zipCode = postalCodeComponent.long_name || postalCodeComponent.short_name || '';
                      }
                    }
                    console.log('Address found:', address, 'place_id:', placeId, 'zipCode:', zipCode);
                    // Auto-select this location with address
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'location_selected',
                      latitude: pos.lat,
                      longitude: pos.lng,
                      address: address,
                      placeId: placeId,
                      zipCode: zipCode
                    }));
                  } else {
                    console.log('Geocoding failed, using fallback');
                    // Fallback to coordinates if geocoding fails
                    const fallbackAddress = pos.lat.toFixed(6) + ', ' + pos.lng.toFixed(6);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'location_selected',
                      latitude: pos.lat,
                      longitude: pos.lng,
                      address: fallbackAddress,
                      placeId: '',
                      zipCode: ''
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
                  const placeId = results[0].place_id || '';
                  // Extract postal code from address components
                  let zipCode = '';
                  if (results[0].address_components) {
                    const postalCodeComponent = results[0].address_components.find(
                      component => component.types.includes('postal_code')
                    );
                    if (postalCodeComponent) {
                      zipCode = postalCodeComponent.long_name || postalCodeComponent.short_name || '';
                    }
                  }
                  console.log('Click address found:', address, 'place_id:', placeId, 'zipCode:', zipCode);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: address,
                    placeId: placeId,
                    zipCode: zipCode
                  }));
                } else {
                  console.log('Click geocoding failed, using fallback');
                  // Fallback to coordinates if geocoding fails
                  const fallbackAddress = position.lat().toFixed(6) + ', ' + position.lng().toFixed(6);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: fallbackAddress,
                    placeId: '',
                    zipCode: ''
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
  userLocation: LocationCoordinates | null = null,
): string => {
  const { latitude, longitude } = region;
  const { radius = 50, opacity = 0.7, showETALabels = true } = options;

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
                  radius: ${
                    radius * 10
                  } // Convert to meters (radius was in pixels for heatmap)
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
                  const placeId = results[0].place_id || '';
                  // Extract postal code from address components
                  let zipCode = '';
                  if (results[0].address_components) {
                    const postalCodeComponent = results[0].address_components.find(
                      component => component.types.includes('postal_code')
                    );
                    if (postalCodeComponent) {
                      zipCode = postalCodeComponent.long_name || postalCodeComponent.short_name || '';
                    }
                  }
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: address,
                    placeId: placeId,
                    zipCode: zipCode
                  }));
                } else {
                  // Fallback to coordinates if geocoding fails
                  const fallbackAddress = position.lat().toFixed(6) + ', ' + position.lng().toFixed(6);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location_selected',
                    latitude: position.lat(),
                    longitude: position.lng(),
                    address: fallbackAddress,
                    placeId: '',
                    zipCode: ''
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
  lng2: number,
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates distance in meters between two coordinates using Haversine formula
 */
export const calculateDistanceMeters = (
  prev: { lat: number; lng: number } | null,
  curr: { lat: number; lng: number } | null,
): number => {
  if (!prev || !curr) return Number.POSITIVE_INFINITY;
  const km = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
  return Math.round(km * 1000);
};

/**
 * Computes delta meters vs mentioned distance threshold, per spec:
 * Math.abs(distance(prev,current) - mentioned_distance)
 */
export const computeDeltaMetersAgainstThreshold = (
  prev: { lat: number; lng: number } | null,
  curr: { lat: number; lng: number } | null,
  mentionedDistanceMeters: number,
): number => {
  const meters = calculateDistanceMeters(prev, curr);
  if (!isFinite(meters)) return Number.POSITIVE_INFINITY;
  return Math.abs(meters - mentionedDistanceMeters);
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
  demandLevel: "high" | "medium" | "low" = "medium",
): string => {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    demandLocation.lat,
    demandLocation.lng,
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
      const minText =
        remainingMinutes === 1 ? "1 min" : `${remainingMinutes} mins`;
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
  onMapPress?: (latitude: number, longitude: number) => void,
): void => {
  const log = logger();

  try {
    const data: WebViewMessageData = JSON.parse(event.nativeEvent.data);
    log("WebView message received:", data);

    if (data.type === "location_selected") {
      // If address is provided, use it directly; otherwise, fall back to coordinates
      if (data.address) {
        log(
          "Calling onLocationSelect with address:",
          data.address,
          "placeId:",
          data.placeId,
          "zipCode:",
          data.zipCode,
        );
        onLocationSelect({
          address: data.address,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
          placeId: data.placeId,
          zipCode: data.zipCode,
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
 * Extracts postal/zip code from an address string using common patterns.
 * Tries to find postal codes in various formats (US: 12345, UK: SW1A 1AA, etc.)
 *
 * @param {string} address - The address string to search
 * @returns {string} The extracted postal code or empty string if not found
 */
export const extractZipCodeFromAddress = (address: string): string => {
  if (!address) return "";

  // Common postal code patterns:
  // US: 5 digits (12345) or 5+4 (12345-6789)
  // UK: SW1A 1AA format
  // Canada: A1A 1A1 format
  // Pakistan: 5 digits (54000)
  // Generic: 4-6 digits

  // Try Pakistan format first (5 digits)
  const pakistanPattern = /\b\d{5}\b/;
  const pakMatch = address.match(pakistanPattern);
  if (pakMatch) {
    return pakMatch[0];
  }

  // Try US format (5 digits or 5-4)
  const usPattern = /\b\d{5}(?:-\d{4})?\b/;
  const usMatch = address.match(usPattern);
  if (usMatch) {
    return usMatch[0];
  }

  // Try UK format (SW1A 1AA)
  const ukPattern = /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/i;
  const ukMatch = address.match(ukPattern);
  if (ukMatch) {
    return ukMatch[0].replace(/\s+/g, "");
  }

  // Try generic 4-6 digit pattern
  const genericPattern = /\b\d{4,6}\b/;
  const genericMatch = address.match(genericPattern);
  if (genericMatch) {
    return genericMatch[0];
  }

  return "";
};

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
  destinations: DesiredDestination[],
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

/**
 * Format a timestamp string into a readable date format
 * @param timestamp - ISO timestamp string
 * @returns string - Formatted date string (MM/DD/YYYY hh:mm A)
 */
export const formatDateTimestamp = (
  timestamp: string | number | null | undefined,
): string => {
  try {
    if (timestamp == null) return dayjs().format("MM/DD/YYYY hh:mm A");
    // Support numeric epoch seconds or milliseconds
    if (typeof timestamp === "number") {
      const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp; // seconds -> ms
      return dayjs(ms).format("MM/DD/YYYY hh:mm A");
    }
    // String case: try parse numeric, else treat as ISO
    const trimmed = String(timestamp).trim();
    if (!trimmed) return dayjs().format("MM/DD/YYYY hh:mm A");
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      const ms = num < 1e12 ? num * 1000 : num;
      return dayjs(ms).format("MM/DD/YYYY hh:mm A");
    }
    const d = dayjs(trimmed);
    return d.isValid()
      ? d.format("MM/DD/YYYY hh:mm A")
      : dayjs().format("MM/DD/YYYY hh:mm A");
  } catch {
    return dayjs().format("MM/DD/YYYY hh:mm A");
  }
};

// =============================================================================
// CONTACT ACTION HELPERS
// =============================================================================

/**
 * Checks if the app is running on a simulator/emulator
 * @returns boolean indicating if running on simulator
 */
const isSimulator = (): boolean => {
  if (Platform.OS === "ios") {
    return (
      !Platform.isPad &&
      !Platform.isTV &&
      Platform.constants.systemName === "iOS Simulator"
    );
  }
  return false;
};

/**
 * Opens the phone dialer with the specified phone number
 * @param phoneNumber - The phone number to dial
 * @returns Promise<void>
 * @throws Error if the device cannot make phone calls
 *
 * @example
 * ```typescript
 * await openPhoneDialer("1234567890");
 * ```
 */
export const openPhoneDialer = async (phoneNumber: string): Promise<void> => {
  try {
    console.log("Attempting to open phone dialer for:", phoneNumber);

    if (Platform.OS === "android") {
      // For Android, use IntentLauncher for better compatibility
      try {
        await IntentLauncher.startActivityAsync("android.intent.action.CALL", {
          data: `tel:${phoneNumber}`,
        });
        console.log("Phone dialer opened via IntentLauncher");
        return;
      } catch (intentError) {
        console.log("IntentLauncher failed, trying Linking:", intentError);
        // Fallback to Linking
        await Linking.openURL(`tel:${phoneNumber}`);
        console.log("Phone dialer opened via Linking");
        return;
      }
    } else {
      // For iOS, use standard Linking
      await Linking.openURL(`tel:${phoneNumber}`);
      console.log("Phone dialer opened successfully");
    }
  } catch (error) {
    console.error("Error opening phone dialer:", error);

    const message = isSimulator()
      ? "Phone calls are not available in the simulator. On a real device, this would open the phone dialer with: " +
        phoneNumber
      : "Unable to open phone dialer. Please manually dial: " + phoneNumber;
    Alert.alert("Phone Not Available", message);
  }
};

/**
 * Opens the SMS app with the specified phone number pre-filled
 * @param phoneNumber - The phone number to send SMS to
 * @returns Promise<void>
 * @throws Error if the device cannot send SMS
 *
 * @example
 * ```typescript
 * await openSMSApp("1234567890");
 * ```
 */
export const openSMSApp = async (phoneNumber: string): Promise<void> => {
  try {
    console.log("Attempting to open SMS app for:", phoneNumber);

    if (Platform.OS === "android") {
      // For Android, use IntentLauncher for better compatibility
      try {
        await IntentLauncher.startActivityAsync(
          "android.intent.action.SENDTO",
          {
            data: `sms:${phoneNumber}`,
          },
        );
        console.log("SMS app opened via IntentLauncher");
        return;
      } catch (intentError) {
        console.log("IntentLauncher failed, trying Linking:", intentError);
        // Fallback to Linking
        await Linking.openURL(`sms:${phoneNumber}`);
        console.log("SMS app opened via Linking");
        return;
      }
    } else {
      // For iOS, use standard Linking
      await Linking.openURL(`sms:${phoneNumber}`);
      console.log("SMS app opened successfully");
    }
  } catch (error) {
    console.error("Error opening SMS app:", error);

    const message = isSimulator()
      ? "SMS is not available in the simulator. On a real device, this would open the messaging app with: " +
        phoneNumber
      : "Unable to open SMS app. Please manually text: " + phoneNumber;
    Alert.alert("SMS Not Available", message);
  }
};

/**
 * Opens WhatsApp with the specified phone number
 * Falls back to WhatsApp Web if the app is not installed
 * @param phoneNumber - The phone number to contact via WhatsApp
 * @returns Promise<void>
 * @throws Error if WhatsApp cannot be opened
 *
 * @example
 * ```typescript
 * await openWhatsApp("1234567890");
 * ```
 */
export const openWhatsApp = async (phoneNumber: string): Promise<void> => {
  try {
    // Format phone number for WhatsApp (remove any non-digit characters)
    const formattedPhone = phoneNumber.replace(/\D/g, "");
    const whatsappUrl = `whatsapp://send?phone=${formattedPhone}`;

    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      // Fallback to WhatsApp web if app is not installed
      const whatsappWebUrl = `https://wa.me/${formattedPhone}`;
      await Linking.openURL(whatsappWebUrl);
    }
  } catch (error) {
    console.error("Error opening WhatsApp:", error);
    Alert.alert("Error", "Failed to open WhatsApp");
    throw error;
  }
};

/**
 * Calculate the duration in milliseconds for ProgressTimer component
 * @param expiredAt - ISO string or Date object representing when the offer expires
 * @returns Duration in milliseconds, or null if expiredAt is invalid
 */
export function calculateProgressTimerDuration(
  expiredAt: string | Date | null | undefined,
): number | null {
  if (!expiredAt) {
    return null;
  }

  const expirationDate = new Date(expiredAt);
  const now = new Date();
  const durationMs = expirationDate.getTime() - now.getTime();

  // Return null if already expired or invalid
  if (durationMs <= 0 || isNaN(durationMs)) {
    return null;
  }

  return durationMs;
}

/**
 * System Suggested Bid interface
 */
export interface SystemSuggestedBid {
  amount: number;
  driverEarn: number;
}

/**
 * Transformed bid prices data
 */
export interface TransformedBidPrices {
  systemSuggestedBids: SystemSuggestedBid[];
  boostedPrices: number[];
  bidsOnThisJob: string | null;
  driverPayoutPercentage: number | null;
}

/**
 * Transform system suggested bid prices from DB response to mobile app format
 *
 * @param systemSuggestedPrices - The system_suggested_prices object from DB response
 * @returns Transformed bid prices with systemSuggestedBids and boostedPrices arrays
 *
 * @example
 * const prices = transformBidPrices(response.jData.system_suggested_prices);
 * // Returns: { systemSuggestedBids: [...], boostedPrices: [...] }
 */
export const transformBidPrices = (
  systemSuggestedPrices: Record<string, any> | null | undefined,
): TransformedBidPrices => {
  const result: TransformedBidPrices = {
    systemSuggestedBids: [],
    boostedPrices: [],
    bidsOnThisJob: null,
    driverPayoutPercentage: null,
  };

  if (!systemSuggestedPrices || typeof systemSuggestedPrices !== "object") {
    return result;
  }

  // Extract bids_on_this_job
  if (
    systemSuggestedPrices.bids_on_this_job !== undefined &&
    systemSuggestedPrices.bids_on_this_job !== null
  ) {
    result.bidsOnThisJob = String(systemSuggestedPrices.bids_on_this_job);
  }

  // Extract driver_payout_percentage
  if (
    systemSuggestedPrices.driver_payout_percentage !== undefined &&
    systemSuggestedPrices.driver_payout_percentage !== null
  ) {
    const payoutPercentage = Number(
      systemSuggestedPrices.driver_payout_percentage,
    );
    if (!isNaN(payoutPercentage)) {
      result.driverPayoutPercentage = payoutPercentage;
    }
  }

  // Extract boost amounts (boost_bid_amount_1, boost_bid_amount_2, etc.)
  for (let i = 1; i <= 4; i++) {
    const boostAmount = systemSuggestedPrices[`boost_bid_amount_${i}`];
    if (boostAmount !== undefined && boostAmount !== null) {
      const amount = Number(boostAmount);
      if (!isNaN(amount)) {
        result.boostedPrices.push(amount);
      }
    }
  }

  // Extract bid percentage options and convert to bid amounts with driver earnings
  // The percentage options represent bid amounts
  // driver_payout_percentage is the system charge percentage, so driver earns: bidAmount * (1 - driver_payout_percentage / 100)
  const systemChargePercentage =
    result.driverPayoutPercentage !== null
      ? result.driverPayoutPercentage / 100
      : 0.15; // Default 15% system charge (85% driver payout)

  for (let i = 1; i <= 5; i++) {
    const percentageOption =
      systemSuggestedPrices[`bid_percentage_option_${i}`];
    if (percentageOption !== undefined && percentageOption !== null) {
      const amount = Number(percentageOption);
      if (!isNaN(amount)) {
        // Calculate driver earnings: bidAmount - (bidAmount * systemChargePercentage)
        // Example: $20 bid with 2.5% charge = $20 - $0.50 = $19.50
        const driverEarn =
          Math.round(amount * (1 - systemChargePercentage) * 100) / 100;
        result.systemSuggestedBids.push({ amount, driverEarn });
      }
    }
  }

  return result;
};

/**
 * Transform DB trip response to mobile app format for trip details and feedback screens
 *
 * @param dbResponse - The jData object from TRP.S.TRIP_BY_NUMBER response
 * @returns Transformed trip data in mobile app format
 */
export function transformTripDetailsFromDb(dbResponse: any): any {
  if (!dbResponse || !dbResponse.trip) {
    return null;
  }

  const trip = dbResponse.trip;

  // Format dateTime
  const dateTime = trip.dateTime
    ? new Date(trip.dateTime).toISOString()
    : new Date().toISOString();

  // Format scheduledPickupTime
  const scheduledPickupTime = trip.scheduledPickupTime
    ? new Date(trip.scheduledPickupTime).toISOString()
    : dateTime;

  // Transform fare details
  const fareDetails = trip.fareDetails
    ? {
        ridePrice: trip.fareDetails.ridePrice || 0,
        tolls: trip.fareDetails.tolls || 0,
        tips: trip.fareDetails.tips || 0,
        discount: trip.fareDetails.discount || 0,
        serviceCharges: trip.fareDetails.serviceCharges || 0,
        fuelSurcharge: trip.fareDetails.fuelSurcharge || 0,
        nycCongestionSurcharge: trip.fareDetails.nycCongestionSurcharge || 0,
        unbilledTolls: trip.fareDetails.unbilledTolls || 0,
        extraWaitTime: trip.fareDetails.extraWaitTime || 0,
        additionalStops: trip.fareDetails.additionalStops || 0,
      }
    : {};

  // Transform customer details
  const customerDetails = trip.customerDetails
    ? {
        customerName: trip.customerDetails.customerName || "Customer",
        requiredCarType: trip.customerDetails.requiredCarType || "",
        offerPrice: trip.customerDetails.offerPrice || 0,
        accountNumber: trip.customerDetails.accountNumber || "",
        profileNumber: trip.customerDetails.profileNumber || "",
      }
    : {};

  return {
    tripId:
      trip.tripId || trip.trip_number || trip.trips_rec_id?.toString() || "",
    tripNumber: trip.tripNumber || trip.trip_number || "",
    dateTime,
    rideType: trip.rideType || trip.trip_type || "ONE_WAY",
    peopleCount: trip.peopleCount || trip.people_count || 1,
    rating: trip.rating || 0,
    carType: trip.carType || trip.car_type || "",
    expiredAt: trip.expiredAt || trip.expired_at || null,
    hasSpecialRequirements:
      trip.hasSpecialRequirements || trip.has_special_requirements || false,
    hasPackage: trip.hasPackage || trip.has_package || false,
    pickupTime: trip.pickupTime || trip.pickup_time || 0,
    pickupDistance: trip.pickupDistance || trip.pickup_distance || 0,
    pickupAddress: trip.pickupAddress || trip.pickup_address || "",
    scheduledPickupTime,
    dropoffTime: trip.dropoffTime || trip.dropoff_time || 0,
    dropoffDistance: trip.dropoffDistance || trip.dropoff_distance || 0,
    dropoffAddress: trip.dropoffAddress || trip.dropoff_address || "",
    rideTime: trip.rideTime || trip.ride_time || 0,
    rideDistance: trip.rideDistance || trip.ride_distance || 0,
    totalPrice: trip.totalPrice || trip.total_price || 0,
    driverEarn: trip.driverEarn || trip.driver_earn || 0,
    driverInstructions:
      trip.driverInstructions || trip.driver_instructions || "",
    fareDetails,
    customerDetails,
  };
}

/**
 * Transform trip details to JobDetails component format
 */
export function transformTripDetailsToJobOffer(tripDetails: any): any {
  if (!tripDetails) return null;

  // Format dateTime for display
  const formattedDateTime = tripDetails.dateTime
    ? new Date(tripDetails.dateTime).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  // Transform fare details to InfoTable format
  const fareDetailsItems = tripDetails.fareDetails
    ? [
        {
          label: "Ride Price",
          value: `$${(tripDetails.fareDetails.ridePrice || 0).toFixed(2)}`,
        },
        {
          label: "Tolls (EZ Pass)",
          value: `$${(tripDetails.fareDetails.tolls || 0).toFixed(2)}`,
        },
        {
          label: "Tips",
          value: `$${(tripDetails.fareDetails.tips || 0).toFixed(2)}`,
        },
        {
          label: "Discount",
          value: `$${(tripDetails.fareDetails.discount || 0).toFixed(2)}`,
        },
        {
          label: "Service Charges",
          value: `$${(tripDetails.fareDetails.serviceCharges || 0).toFixed(2)}`,
        },
        {
          label: "Fuel Surcharge",
          value: `$${(tripDetails.fareDetails.fuelSurcharge || 0).toFixed(2)}`,
        },
        {
          label: "NYC Congestion Surcharge",
          value: `$${(tripDetails.fareDetails.nycCongestionSurcharge || 0).toFixed(2)}`,
        },
      ]
    : [];

  // Transform customer details to InfoTable format
  const customerDetailsItems = tripDetails.customerDetails
    ? [
        {
          label: "Name",
          value: tripDetails.customerDetails.customerName || "Customer",
        },
        {
          label: "Required Car Type",
          value: tripDetails.customerDetails.requiredCarType || "",
        },
        {
          label: "Offer Price",
          value: `$${(tripDetails.customerDetails.offerPrice || 0).toFixed(2)}`,
        },
        {
          label: "Account No.",
          value: tripDetails.customerDetails.accountNumber || "",
        },
        {
          label: "Profile No.",
          value: tripDetails.customerDetails.profileNumber || "",
        },
      ]
    : [];

  return {
    id: tripDetails.tripId || tripDetails.tripNumber || "",
    dateTime: formattedDateTime,
    rideType: tripDetails.rideType,
    peopleCount: tripDetails.peopleCount,
    rating: tripDetails.rating,
    hasSpecialRequirements: tripDetails.hasSpecialRequirements,
    onPressSpecialRequirements: () => {},
    hasPackage: tripDetails.hasPackage,
    onPressPackage: () => {},
    pickupTime: tripDetails.pickupTime,
    pickupDistance: tripDetails.pickupDistance,
    pickupAddress: tripDetails.pickupAddress,
    dropoffTime: tripDetails.dropoffTime,
    dropoffDistance: tripDetails.dropoffDistance,
    dropoffAddress: tripDetails.dropoffAddress,
    rideTime: tripDetails.rideTime,
    rideDistance: tripDetails.rideDistance,
    totalPrice: tripDetails.totalPrice,
    driverEarn: tripDetails.driverEarn,
    driverInstructions: tripDetails.driverInstructions,
    fareDetails: fareDetailsItems,
    customerDetails: customerDetailsItems,
    carType: tripDetails.carType,
    expiredAt: tripDetails.expiredAt,
    showActionBar: false,
  };
}

/**
 * Transform trip details to feedback screen fare summary format
 */
export function transformTripDetailsToFareSummary(
  tripDetails: any,
): Array<{ label: string; value: string }> {
  if (!tripDetails || !tripDetails.fareDetails) {
    return [];
  }

  const fare = tripDetails.fareDetails;
  return [
    { label: "Ride Price", value: `$${(fare.ridePrice || 0).toFixed(2)}` },
    { label: "Tolls", value: `$${(fare.tolls || 0).toFixed(2)}` },
    { label: "Discount", value: `$${(fare.discount || 0).toFixed(2)}` },
    {
      label: "UnBilled Tolls",
      value: `$${(fare.unbilledTolls || 0).toFixed(2)}`,
    },
    {
      label: "Extra Wait Time",
      value: `$${(fare.extraWaitTime || 0).toFixed(2)}`,
    },
    {
      label: "Additional Stops",
      value: `$${(fare.additionalStops || 0).toFixed(2)}`,
    },
  ];
}

/**
 * Extracts and converts a driver ID to a numeric value.
 * Handles both string and number inputs, and extracts numeric part from formatted strings (e.g., "d-1" -> 1).
 * Returns 0 if the driver ID is invalid or cannot be converted.
 */
export function getNumericDriverId(
  driverId: string | number | undefined,
): number {
  if (!driverId) {
    return 0;
  }
  if (typeof driverId === "number") {
    return driverId;
  }
  const driverIdStr = String(driverId);
  const numericId = driverIdStr.match(/(\d+)$/)?.[1] || driverIdStr;
  return Number(numericId) || 0;
}
