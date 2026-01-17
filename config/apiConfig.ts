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

import { AUTH_STORAGE_KEY } from "@/constants/global";
import type { DbRequestJson, DbResponse } from "@/types/dbRequest";
import { getStorageItem, logger } from "@/utils/helpers";
import { buildLoginRequest } from "@/utils/requestBuilder";
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getServiceUrl, setCustomBaseUrl } from "./urlResolver";
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
    BASE_URL: getServiceUrl(
      "online-drivers",
      process.env.EXPO_PUBLIC_BASE_URL,
      "https://djh0g1zn5pc6f.cloudfront.net"
    ),
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
      const completeURL = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`🚀 [auctionApiClient] ${config.method?.toUpperCase()} ${completeURL}`);
      console.log(`🚀 [auctionApiClient] Base URL: ${config.baseURL}`);
      log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      const dynamicBaseUrl = config.baseURL;
      log(`🚀 Dynamic Base URL: ${dynamicBaseUrl}`);
      const data = await getStorageItem(AUTH_STORAGE_KEY);
      const token = data ? JSON.parse(data).token : null;
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
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

/**
 * Create Auction API Client Function
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
const createAuctionApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: getServiceUrl(
      "auction",
      process.env.EXPO_PUBLIC_BASE_URL,
      "https://djh0g1zn5pc6f.cloudfront.net"
    ),
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
      const dynamicBaseUrl = config.baseURL;
      log(`🚀 Dynamic Base URL: ${dynamicBaseUrl}`);
      const data = await getStorageItem(AUTH_STORAGE_KEY);
      const token = data ? JSON.parse(data).token : null;
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
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

/**
 * Create Auth API Client Function
 *
 * Caller: Authentication-related API utility functions and hooks
 * Purpose: Provide specialized axios configuration for authentication endpoints
 * Input/Output:
 *   - Input: None (uses Expo public environment variables for auth service configuration)
 *   - Output: Configured AxiosInstance with auth-specific interceptors
 * Description: Creates axios instance specifically for authentication endpoints with base URL,
 *             default headers, and interceptors. Includes request logging and comprehensive
 *             error handling for auth-specific scenarios. Does NOT add Authorization headers
 *             as this client is used for login/registration flows where tokens don't exist yet.
 *             Handles auth-specific error responses and provides user-friendly error messages.
 * Expected Outcome: Consistent authentication API client configuration with proper error
 *                   handling for login, registration, and password reset flows.
 */
const createAuthApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: getServiceUrl(
      "auth",
      process.env.EXPO_PUBLIC_BASE_URL,
      "https://djh0g1zn5pc6f.cloudfront.net"
    ),
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
   * Purpose: Log authentication requests and transform to DB format if needed
   * Input/Output:
   *   - Input: Axios request config
   *   - Output: Modified request config or rejected promise
   * Description: Logs outgoing authentication requests (dev-only via logger).
   *             Transforms requests to DB format (jHeader, jMetaData, jData) for
   *             endpoints that require it (e.g., /auth/signin).
   *             Note: Does NOT add Authorization headers as this client is used
   *             for login/registration flows where authentication tokens don't exist yet.
   * Expected Outcome: Request logging and DB format transformation for authentication flows.
   */
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const completeURL = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`🚀 [authApiClient] ${config.method?.toUpperCase()} ${completeURL}`);
      console.log(`🚀 [authApiClient] Base URL: ${config.baseURL}`);
      log(`🚀 Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Check if this endpoint needs DB request format transformation
      if (shouldTransformToDbFormat(config.url || "", config.method || "")) {
        try {
          const transformed = await transformRequestToDbFormat(
            config.data,
            config.url || ""
          );
          if (transformed) {
            config.data = transformed;
            log("✅ Request transformed to DB format");
          }
        } catch (error) {
          log("⚠️ Error transforming request to DB format:", error);
          // Continue with original request if transformation fails
        }
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
   * Purpose: Handle authentication-specific response scenarios and errors
   * Input/Output:
   *   - Input: Axios response or error
   *   - Output: Response or rejected promise with auth-specific error message
   * Description: Logs successful auth responses (dev-only) and handles authentication-specific
   *             error scenarios including invalid credentials, account locked, email not verified,
   *             and server errors. Also handles DB response format (extracts jData, validates responseCode).
   *             Provides user-friendly error messages for auth flows.
   * Expected Outcome: Consistent authentication error handling with user-friendly messages
   *                   for login, registration, and password reset flows.
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging (remove in production)
      log(`✅ Auth API Response: ${response.status} ${response.config.url}`);
      
      // Handle DB response format if present
      const transformedResponse = transformDbResponse(response);
      return transformedResponse;
    },
    (error: AxiosError) => {
      // Handle authentication-specific error scenarios
      let errorMessage: string = "An unexpected error occurred";
      
      // First, handle network errors (common on iOS when there's no response)
      if (!error.response) {
        // Network error - no response received
        if (error.code === "ECONNABORTED") {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else if (error.code === "ECONNREFUSED" || error.code === "ERR_CONNECTION_REFUSED") {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else if (error.code === "ENOTFOUND" || error.code === "ERR_NAME_NOT_RESOLVED") {
          errorMessage = "Unable to reach server. Please check your internet connection.";
        } else if (error.code === "ERR_NETWORK" || error.code === "NETWORK_ERROR") {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message && error.message.includes("Network request failed")) {
          errorMessage = "Network request failed. Please check your internet connection and try again.";
        } else if (error.message && error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else if (error.message) {
          // Use the error message if available
          errorMessage = error.message;
        } else {
          errorMessage = "Unable to connect to server. Please check your internet connection and try again.";
        }
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid credentials. Please check your login details.";
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid credentials. Please check your login details.";
      } else if (error.response?.status === 403) {
        errorMessage = "Account access denied. Please contact support.";
      } else if (error.response?.status === 404) {
        errorMessage = "Authentication service not found";
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid input. Please check your information and try again.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage = "Authentication service error. Please try again later.";
      } else if (
        error.response?.data &&
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ Auth API Error:", {
        message: errorMessage,
        code: error.code,
        response: error.response?.status,
        originalError: error.message,
      });
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

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
const createMeApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: getServiceUrl(
      "me",
      process.env.EXPO_PUBLIC_BASE_URL,
      "http://192.168.100.160:3000"
    ),
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
      const completeURL = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`🚀 [meApiClient] ${config.method?.toUpperCase()} ${completeURL}`);
      console.log(`🚀 [meApiClient] Base URL: ${config.baseURL}`);
      log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      const data = await getStorageItem(AUTH_STORAGE_KEY);
      const token = data ? JSON.parse(data).token : null;
      log("Token FOR ME API", token);
      log("BASE URL FOR ME API", config.baseURL);
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
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

/**
 * Create Settings API Client Function
 *
 * Caller: Settings-related API utility functions and hooks
 * Purpose: Provide specialized axios configuration for settings service endpoints
 * Input/Output:
 *   - Input: None (uses Expo public environment variables for settings service configuration)
 *   - Output: Configured AxiosInstance with settings-specific interceptors
 * Description: Creates axios instance specifically for settings service endpoints with base URL,
 *             default headers, and interceptors. Includes request logging and comprehensive
 *             error handling for settings-specific scenarios. Reads the auth token from
 *             AsyncStorage and attaches it to the Authorization header.
 * Expected Outcome: Consistent settings API client configuration with proper error
 *                   handling for settings-related operations.
 */
const createSettingsApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: getServiceUrl(
      "settings",
      process.env.EXPO_PUBLIC_SETTINGS_BASE_URL,
      "http://192.168.100.160:3003"
    ),
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
   * Purpose: Log requests and add authentication headers for settings service
   * Input/Output:
   *   - Input: Axios request config
   *   - Output: Modified request config or rejected promise
   * Description: Logs outgoing settings requests (dev-only via logger) and reads the auth token
   *             from AsyncStorage (key: "@token"), adding it to the Authorization header.
   *             Handles request-level errors.
   * Expected Outcome: Request logging for debugging and proper error handling.
   */
  client.interceptors.request.use(
    async (config) => {
      const completeURL = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`🚀 [settingsApiClient] ${config.method?.toUpperCase()} ${completeURL}`);
      console.log(`🚀 [settingsApiClient] Base URL: ${config.baseURL}`);
      log(
        `🚀 Settings API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
      const dynamicBaseUrl = config.baseURL;
      log(`🚀 Settings Dynamic Base URL: ${dynamicBaseUrl}`);
      const data = await getStorageItem(AUTH_STORAGE_KEY);
      const token = data ? JSON.parse(data).token : null;
      if (token) {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      log("❌ Settings Request Error:", error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   *
   * Caller: Axios interceptor system
   * Purpose: Handle settings-specific response scenarios and errors
   * Input/Output:
   *   - Input: Axios response or error
   *   - Output: Response or rejected promise with settings-specific error message
   * Description: Logs successful settings responses (dev-only) and handles settings-specific
   *             error scenarios including configuration errors, validation errors, and server errors.
   *             Provides user-friendly error messages for settings operations.
   * Expected Outcome: Consistent settings error handling with user-friendly messages
   *                   for settings-related operations.
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging (remove in production)
      log(
        `✅ Settings API Response: ${response.status} ${response.config.url}`
      );
      return response;
    },
    (error: AxiosError) => {
      // Handle settings-specific error scenarios
      let errorMessage: string = "An unexpected error occurred";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Access denied. You do not have permission for this settings action.";
      } else if (error.response?.status === 404) {
        errorMessage = "Settings resource not found";
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid settings configuration. Please check your input and try again.";
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage = "Settings service error. Please try again later.";
      } else if (
        error.response?.data &&
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ Settings API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

/**
 * Create Active Trip API Client Function
 *
 * Caller: Active trip-related API utility functions and hooks
 * Purpose: Provide specialized axios configuration for active trip service endpoints
 * Input/Output:
 *   - Input: None (uses Expo public environment variables for active trip service configuration)
 *   - Output: Configured AxiosInstance with active trip-specific interceptors
 * Description: Creates axios instance specifically for active trip service endpoints with base URL,
 *             default headers, and interceptors. Includes request logging and comprehensive
 *             error handling for active trip-specific scenarios. Reads the auth token from
 *             AsyncStorage and attaches it to the Authorization header.
 * Expected Outcome: Consistent active trip API client configuration with proper error
 *                   handling for active trip-related operations.
 */
const createActiveTripApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: getServiceUrl(
      "active-trip",
      process.env.EXPO_PUBLIC_BASE_URL,
      "https://djh0g1zn5pc6f.cloudfront.net"
    ),
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
   * Purpose: Log requests and add authentication headers for active trip service
   * Input/Output:
   *   - Input: Axios request config
   *   - Output: Modified request config or rejected promise
   * Description: Logs outgoing active trip requests (dev-only via logger) and reads the auth token
   *             from AsyncStorage (key: "@token"), adding it to the Authorization header.
   *             Handles request-level errors.
   * Expected Outcome: Request logging for debugging and proper error handling.
   */
  client.interceptors.request.use(
    async (config) => {
      const completeURL = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`🚀 [activeTripApiClient] ${config.method?.toUpperCase()} ${completeURL}`);
      console.log(`🚀 [activeTripApiClient] Base URL: ${config.baseURL}`);
      log(
        `🚀 Active Trip API Request: ${config.method?.toUpperCase()} ${
          config.url
        }`
      );
      const dynamicBaseUrl = config.baseURL;
      log(`🚀 Active Trip Dynamic Base URL: ${dynamicBaseUrl}`);
      const data = await getStorageItem(AUTH_STORAGE_KEY);
      const token = data ? JSON.parse(data).token : null;
      if (token) {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      log("❌ Active Trip Request Error:", error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   *
   * Caller: Axios interceptor system
   * Purpose: Handle active trip-specific response scenarios and errors
   * Input/Output:
   *   - Input: Axios response or error
   *   - Output: Response or rejected promise with active trip-specific error message
   * Description: Logs successful active trip responses (dev-only) and handles active trip-specific
   *             error scenarios including trip status errors, validation errors, and server errors.
   *             Provides user-friendly error messages for active trip operations.
   * Expected Outcome: Consistent active trip error handling with user-friendly messages
   *                   for active trip-related operations.
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging (remove in production)
      log(
        `✅ Active Trip API Response: ${response.status} ${response.config.url}`
      );
      return response;
    },
    (error: AxiosError) => {
      // Handle active trip-specific error scenarios
      let errorMessage: string = "An unexpected error occurred";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Access denied. You do not have permission for this active trip action.";
      } else if (error.response?.status === 404) {
        errorMessage = "Active trip resource not found";
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid active trip data. Please check your input and try again.";
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage = "Active trip service error. Please try again later.";
      } else if (
        error.response?.data &&
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ Active Trip API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

// Create the main API clients instance
/**
 * Helper function to determine if a request should be transformed to DB format
 * 
 * @param url - Request URL
 * @param method - HTTP method
 * @returns true if request should be transformed
 */
function shouldTransformToDbFormat(url: string, method: string): boolean {
  // Transform POST requests to auth endpoints that need DB format
  if (method.toUpperCase() === "POST") {
    // Login endpoint needs DB format
    if (url.includes("/auth/signin")) {
      return true;
    }
    // Add other endpoints that need DB format here
  }
  return false;
}

/**
 * Transforms a request body to DB format (jHeader, jMetaData, jData)
 * 
 * @param data - Original request body
 * @param url - Request URL
 * @returns Transformed request body in DB format, or null if transformation not needed
 */
async function transformRequestToDbFormat(
  data: any,
  url: string
): Promise<DbRequestJson | null> {
  // Skip if already in DB format
  if (data && typeof data === "object" && "jHeader" in data && "jData" in data) {
    return null; // Already transformed
  }

  // Transform login request
  if (url.includes("/auth/signin")) {
    // Check if it's a legacy format (email/password at root)
    if (data && typeof data === "object" && ("email" in data || "password" in data)) {
      const email = data.email || "";
      const password = data.password || "";
      const companyId = data.companyId !== undefined 
        ? (typeof data.companyId === 'string' ? parseInt(data.companyId, 10) : data.companyId)
        : undefined;
      
      if (email && password) {
        return await buildLoginRequest({
          emailOrPhone: email,
          password: password,
          companyId: companyId,
        });
      }
    }
    // If data is already in DB format or doesn't match legacy format, return null
  }

  return null;
}

/**
 * Transforms DB response format to a consistent structure
 * Handles nested response structure and validates responseCode
 * 
 * @param response - Axios response
 * @returns Transformed response
 */
function transformDbResponse(response: AxiosResponse): AxiosResponse {
  try {
    const data = response.data;

    // Check if response has nested structure: { success: true, data: { jHeader, jData, jMetaData } }
    if (data && typeof data === "object" && "success" in data && "data" in data) {
      const dbResponse = data.data as DbResponse;
      
      // Validate responseCode (0 = success, others = error)
      if (dbResponse?.jHeader?.responseCode !== undefined) {
        const responseCode = dbResponse.jHeader.responseCode;
        if (responseCode !== "0" && responseCode !== 0) {
          const errorMessage = dbResponse.jHeader.message || "Database operation failed";
          log(`⚠️ DB Response error: ${errorMessage} (responseCode: ${responseCode})`);
          // Note: We don't throw here - let the error handler process it
          // The backend may still return 200 with error in responseCode
        }
      }

      // For auth endpoints, extract token and user from jData if present
      if (response.config.url?.includes("/auth/signin")) {
        // Backend auth service returns { token, user, status, message } directly
        // So we don't need to extract from jData for auth endpoints
        // The response structure is already handled by the backend
        return response;
      }

      // For other endpoints, return the nested data structure
      return response;
    }

    // Check if response has direct DB format: { jHeader, jData, jMetaData }
    if (data && typeof data === "object" && "jHeader" in data) {
      const dbResponse = data as DbResponse;
      
      // Validate responseCode
      if (dbResponse.jHeader?.responseCode !== undefined) {
        const responseCode = dbResponse.jHeader.responseCode;
        if (responseCode !== "0" && responseCode !== 0) {
          const errorMessage = dbResponse.jHeader.message || "Database operation failed";
          log(`⚠️ DB Response error: ${errorMessage} (responseCode: ${responseCode})`);
        }
      }

      return response;
    }

    return response;
  } catch (error) {
    log("Error transforming DB response:", error);
    return response;
  }
}

/**
 * Create Notifications API Client Function
 *
 * Caller: Notifications-related API utility functions and hooks
 * Purpose: Provide specialized axios configuration for notifications service endpoints
 * Input/Output:
 *   - Input: None (uses Expo public environment variables for notifications service configuration)
 *   - Output: Configured AxiosInstance with notifications-specific interceptors
 * Description: Creates axios instance specifically for notifications service endpoints with base URL,
 *             default headers, and interceptors. Includes request logging and comprehensive
 *             error handling for notifications-specific scenarios. Reads the auth token from
 *             AsyncStorage and attaches it to the Authorization header.
 * Expected Outcome: Consistent notifications API client configuration with proper error
 *                   handling for notifications-related operations.
 */
const createNotificationsApiClient = (): AxiosInstance => {
  const API_CONFIG = {
    BASE_URL: getServiceUrl(
      "notifications",
      process.env.EXPO_PUBLIC_NOTIFICATIONS_BASE_URL,
      "http://192.168.100.160:3006"
    ),
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
   * Purpose: Log requests and add authentication headers for notifications service
   * Input/Output:
   *   - Input: Axios request config
   *   - Output: Modified request config or rejected promise
   * Description: Logs outgoing notifications requests (dev-only via logger) and reads the auth token
   *             from AsyncStorage (key: "@token"), adding it to the Authorization header.
   *             Handles request-level errors.
   * Expected Outcome: Request logging for debugging and proper error handling.
   */
  client.interceptors.request.use(
    async (config) => {
      const completeURL = `${config.baseURL || ""}${config.url || ""}`;
      console.log(`🚀 [notificationsApiClient] ${config.method?.toUpperCase()} ${completeURL}`);
      console.log(`🚀 [notificationsApiClient] Base URL: ${config.baseURL}`);
      log(
        `🚀 Notifications API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
      const dynamicBaseUrl = config.baseURL;
      log(`🚀 Notifications Dynamic Base URL: ${dynamicBaseUrl}`);
      const data = await getStorageItem(AUTH_STORAGE_KEY);
      const token = data ? JSON.parse(data).token : null;
      if (token) {
        config.headers = config.headers || {};
        (config.headers as Record<string, string>)[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      log("❌ Notifications Request Error:", error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   *
   * Caller: Axios interceptor system
   * Purpose: Handle notifications-specific response scenarios and errors
   * Input/Output:
   *   - Input: Axios response or error
   *   - Output: Response or rejected promise with notifications-specific error message
   * Description: Logs successful notifications responses (dev-only) and handles notifications-specific
   *             error scenarios including notification errors, validation errors, and server errors.
   *             Provides user-friendly error messages for notifications operations.
   * Expected Outcome: Consistent notifications error handling with user-friendly messages
   *                   for notifications-related operations.
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging (remove in production)
      log(
        `✅ Notifications API Response: ${response.status} ${response.config.url}`
      );
      return response;
    },
    (error: AxiosError) => {
      // Handle notifications-specific error scenarios
      let errorMessage: string = "An unexpected error occurred";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Access denied. You do not have permission for this notifications action.";
      } else if (error.response?.status === 404) {
        errorMessage = "Notifications resource not found";
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid notification data. Please check your input and try again.";
      } else if (error.response?.status && error.response.status >= 500) {
        errorMessage = "Notifications service error. Please try again later.";
      } else if (
        error.response?.data &&
        typeof error.response.data === "object"
      ) {
        // Check for 'error' field first (backend format), then 'message' field
        if ("error" in error.response.data) {
          errorMessage = (error.response.data as { error: string }).error;
        } else if ("message" in error.response.data) {
          errorMessage = (error.response.data as { message: string }).message;
        }
      }

      log("❌ Notifications API Error:", errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

export const apiClient = createApiClient();
export const authApiClient = createAuthApiClient();
export const meApiClient = createMeApiClient();
export const auctionApiClient = createAuctionApiClient();
export const settingsApiClient = createSettingsApiClient();
export const activeTripApiClient = createActiveTripApiClient();
export const notificationsApiClient = createNotificationsApiClient();

/**
 * Updates the base URL for all API clients.
 * This is used when the user enters a deployed base URL on app startup.
 * 
 * @param baseUrl - The new base URL to use for all services
 */
export const updateBaseUrls = (baseUrl: string) => {
  if (!baseUrl) {
    console.warn("⚠️ updateBaseUrls called with empty baseUrl");
    return;
  }

  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  
  // Update the global custom base URL in urlResolver (store without port)
  // This ensures getServiceUrl will return the custom URL for any future calls
  setCustomBaseUrl(cleanBaseUrl);

  // Remove port if already included in baseUrl
  const baseUrlWithoutPort = cleanBaseUrl.replace(/:\d+$/, "");

  // Map each client to its specific port based on SERVICES_TESTING_URLS
  const clients = [
    { name: "apiClient", client: apiClient, port: 3003 }, // online-drivers
    { name: "authApiClient", client: authApiClient, port: 3001 }, // auth
    { name: "meApiClient", client: meApiClient, port: 3001 }, // me (shares with auth)
    { name: "auctionApiClient", client: auctionApiClient, port: 3002 }, // auction
    { name: "settingsApiClient", client: settingsApiClient, port: 3004 }, // settings
    { name: "activeTripApiClient", client: activeTripApiClient, port: 3005 }, // active-trip
    { name: "notificationsApiClient", client: notificationsApiClient, port: 3006 } // notifications
  ];

  console.log("🌐 ========== UPDATING ALL API CLIENTS ==========");
  console.log(`🌐 Custom Base URL (stored): ${cleanBaseUrl}`);
  console.log(`🌐 Base URL without port: ${baseUrlWithoutPort}`);
  
  clients.forEach(({ name, client, port }) => {
    const oldBaseURL = client.defaults.baseURL;
    const newBaseURL = `${baseUrlWithoutPort}:${port}`;
    client.defaults.baseURL = newBaseURL;
    console.log(`🌐 ${name}: ${oldBaseURL} → ${newBaseURL} (port ${port})`);
  });

  console.log("🌐 ==============================================");
  log(`🌐 All API clients updated with service-specific ports`);
  log(`🌐 Custom base URL set in urlResolver: ${cleanBaseUrl}`);
};

export { axios };
