import { TOKEN_KEY } from "@/constants/global";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Alert } from "react-native";

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
  autoSelectCurrentLocation: boolean = true
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
            // Auto-select user's current location by default
            if (navigator.geolocation) {
              console.log('Getting current position...');
              navigator.geolocation.getCurrentPosition(function(position) {
                console.log('Current position received:', position.coords);
                const pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };

                // Center map on user's location
                map.setCenter(pos);
                map.setZoom(15);

                // Add marker at user's current location
                marker = new google.maps.Marker({
                  position: pos,
                  map: map,
                  title: 'Your Current Location',
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
              }, function(error) {
                console.log('Error getting current location:', error);
                // Fallback to default coordinates if geolocation fails
                marker = new google.maps.Marker({
                  position: center,
                  map: map,
                  title: 'Default Location',
                  animation: google.maps.Animation.DROP
                });

                // Still try to send a message with default location
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'location_selected',
                  latitude: center.lat,
                  longitude: center.lng,
                  address: center.lat.toFixed(6) + ', ' + center.lng.toFixed(6)
                }));
              });
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

              // Add new marker
              marker = new google.maps.Marker({
                position: position,
                map: map,
                title: 'Selected Location',
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
  try {
    const data: WebViewMessageData = JSON.parse(event.nativeEvent.data);
    console.log("WebView message received:", data);

    if (data.type === "location_selected") {
      // If address is provided, use it directly; otherwise, fall back to coordinates
      if (data.address) {
        console.log("Calling onLocationSelect with address:", data.address);
        onLocationSelect({
          address: data.address,
          coordinates: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });
      } else {
        console.log("Calling onMapPress with coordinates");
        if (onMapPress) {
          onMapPress(data.latitude, data.longitude);
        }
      }
    }
  } catch (error) {
    console.error("Error parsing WebView message:", error);
  }
};
