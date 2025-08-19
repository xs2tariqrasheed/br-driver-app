/**
 * API Configuration Module (Expo/React Native)
 *
 * Caller: Various components and screens that need to make API calls
 * Purpose: Centralized API configuration and axios setup with interceptors
 * Input/Output:
 *   - Input: API endpoints and configuration options; environment via Expo public env vars
 *   - Output: Configured axios instance and utility functions
 * Description: Provides consistent API configuration with interceptors and utility functions.
 *             Includes request/response interceptors for logging, error handling, and
 *             authentication management. Uses AsyncStorage to read the auth token (key: "@token").
 *             Environment is provided via EXPO_PUBLIC_* vars (e.g., EXPO_PUBLIC_BASE_URL,
 *             EXPO_PUBLIC_ENVIRONMENT). Logging is dev-only via utils/helpers.logger().
 * Expected Outcome: Reliable API communication with proper error handling and
 *                   consistent configuration across the application on native platforms.
 */

import { getAuthToken, logger } from "@/utils/helpers";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
const log = logger();

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Create API Client Function
 *
 * Caller: API utility functions and hooks
 * Purpose: Provide consistent axios configuration with request/response interceptors
 * Input/Output:
 *   - Input: None (uses Expo public environment variables for configuration)
 *   - Output: Configured AxiosInstance with interceptors
 * Description: Creates axios instance with base URL, default headers, and interceptors.
 *             Includes request logging and comprehensive error handling for common
 *             HTTP status codes. Reads the auth token from AsyncStorage and attaches
 *             it to the Authorization header. Provides consistent error messages.
 * Expected Outcome: Consistent API client configuration with automatic error handling
 *                   and proper logging for debugging and monitoring.
 */
const createApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:3001/api",
    HEADERS: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: API_CONFIG.HEADERS,
  });

  /**
   * Request Interceptor
   *
   * Caller: Axios interceptor system
   * Purpose: Log requests and add authentication headers
   * Input/Output:
   *   - Input: Axios request config
   *   - Output: Modified request config or rejected promise
   * Description: Logs outgoing requests (dev-only via logger) and reads the auth token
   *             from AsyncStorage (key: "@token"), adding it to the Authorization header.
   *             Handles request-level errors.
   * Expected Outcome: Request logging for debugging and proper error handling.
   */
  client.interceptors.request.use(
    async (config) => {
      log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      const token = await getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      log("❌ Request Error:", error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   *
   * Caller: Axios interceptor system
   * Purpose: Handle common response scenarios and errors
   * Input/Output:
   *   - Input: Axios response or error
   *   - Output: Response or rejected promise with error message
   * Description: Logs successful responses (dev-only) and handles common error scenarios
   *             including timeouts, authentication errors, and server errors.
   *             Provides user-friendly error messages. For 401 responses, simply
   *             returns an auth error; token persistence is managed via AsyncStorage
   *             elsewhere in the app (no localStorage in React Native).
   * Expected Outcome: Consistent error handling with user-friendly messages
   *                   and proper authentication state management.
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging (remove in production)
      log(`✅ API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError) => {
      // Handle common error scenarios
      let errorMessage: string = "An unexpected error occurred";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Access denied. You do not have permission for this action.";
      } else if (error.response?.status === 404) {
        errorMessage = "Resource not found";
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage = "Server error";
      } else if (
        error.response?.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        errorMessage = (error.response.data as { message: string }).message;
      }

      log("❌ API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

// Create the main API client instance
export const apiClient = createApiClient();

export { axios };
