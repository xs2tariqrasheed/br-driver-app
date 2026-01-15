/**
 * URL Resolver Utility
 *
 * Purpose: Centralize URL resolution logic for API services and socket connections
 * based on the IS_TESTING flag. When testing is enabled, routes to local testing URLs.
 * When disabled, uses environment variables or fallback URLs.
 *
 * @module config/urlResolver
 */

import { IS_TESTING, SERVICES_TESTING_URLS } from "@/constants/global";

let customBaseUrl: string | null = null;

/**
 * Sets a custom base URL to override all service URLs.
 * This is typically used when the user enters a deployed base URL on app startup.
 * 
 * @param url - The custom base URL
 */
export const setCustomBaseUrl = (url: string): void => {
  customBaseUrl = url;
};

/**
 * Gets the currently set custom base URL, if any.
 * 
 * @returns The custom base URL or null
 */
export const getCustomBaseUrl = (): string | null => {
  return customBaseUrl;
};

/**
 * Gets the appropriate service URL based on testing mode
 *
 * @param serviceName - The name of the service (must match a key in SERVICES_TESTING_URLS)
 * @param envVar - Optional environment variable value to use when not testing
 * @param fallback - Optional fallback URL to use when not testing and envVar is not set
 * @returns The resolved URL string
 *
 * @example
 * ```typescript
 * // When IS_TESTING = true
 * getServiceUrl("auth", process.env.EXPO_PUBLIC_BASE_URL, "https://api.example.com")
 * // Returns: "http://192.168.1.5:3001"
 *
 * // When IS_TESTING = false
 * getServiceUrl("auth", "https://api.example.com", "https://fallback.com")
 * // Returns: "https://api.example.com"
 * ```
 */
export const getServiceUrl = (
  serviceName: keyof typeof SERVICES_TESTING_URLS,
  envVar?: string,
  fallback?: string
): string => {
  // If a custom base URL is set, it overrides all other configurations
  // Extract the port from the testing URL for this service and use it with custom base URL
  if (customBaseUrl) {
    // Remove port if already included in customBaseUrl
    const baseUrlWithoutPort = customBaseUrl.replace(/:\d+$/, "");
    
    // Get the port from the testing URL for this service
    const testingUrl = SERVICES_TESTING_URLS[serviceName];
    if (testingUrl) {
      // Extract port from testing URL (e.g., "http://192.168.1.3:3001" -> "3001")
      const portMatch = testingUrl.match(/:(\d+)$/);
      if (portMatch) {
        const port = portMatch[1];
        return `${baseUrlWithoutPort}:${port}`;
      }
    }
    
    // Fallback: if we can't extract port, check if customBaseUrl already has a port
    const hasPort = /:\d+/.test(customBaseUrl);
    return hasPort ? customBaseUrl : `${customBaseUrl}:3001`;
  }

  // When testing mode is enabled, use testing URLs
  if (IS_TESTING) {
    const testingUrl = SERVICES_TESTING_URLS[serviceName];
    if (!testingUrl) {
      console.warn(
        `⚠️ Testing URL not found for service "${serviceName}". Falling back to envVar or fallback.`
      );
      return envVar || fallback || "";
    }
    
    // Log when testing mode is active (helpful for debugging)
    if (__DEV__) {
      console.log(
        `🧪 Testing mode enabled: Using testing URL for "${serviceName}": ${testingUrl}`
      );
    }
    
    return testingUrl;
  }

  // When testing mode is disabled, use environment variable or fallback
  return envVar || fallback || "";
};

