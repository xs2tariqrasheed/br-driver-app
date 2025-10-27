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
import { getStorageItem, logger } from "@/utils/helpers";
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
    BASE_URL:
      process.env.EXPO_PUBLIC_BASE_URL ||
      "https://djh0g1zn5pc6f.cloudfront.net",
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
    BASE_URL:
      process.env.EXPO_PUBLIC_OFFERS_SERVER_URL ||
      "http://192.168.100.160:3002",
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
    BASE_URL:
      process.env.EXPO_PUBLIC_BASE_URL ||
      "https://djh0g1zn5pc6f.cloudfront.net",
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
   * Purpose: Log authentication requests (no auth token needed for login flows)
   * Input/Output:
   *   - Input: Axios request config
   *   - Output: Modified request config or rejected promise
   * Description: Logs outgoing authentication requests (dev-only via logger).
   *             Note: Does NOT add Authorization headers as this client is used
   *             for login/registration flows where authentication tokens don't exist yet.
   * Expected Outcome: Request logging for debugging authentication flows.
   */
  client.interceptors.request.use(
    async (config) => {
      log(`🚀 Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
   *             and server errors. Provides user-friendly error messages for auth flows.
   * Expected Outcome: Consistent authentication error handling with user-friendly messages
   *                   for login, registration, and password reset flows.
   */
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response for debugging (remove in production)
      log(`✅ Auth API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error: AxiosError) => {
      // Handle authentication-specific error scenarios
      let errorMessage: string = "An unexpected error occurred";

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timed out";
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

      log("❌ Auth API Error:", errorMessage);
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
    BASE_URL:
      process.env.EXPO_PUBLIC_BASE_URL || "http://192.168.100.160:3000",
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
    BASE_URL:
      process.env.EXPO_PUBLIC_SETTINGS_BASE_URL ||
      "http://192.168.100.160:3003",
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
    BASE_URL:
      process.env.EXPO_PUBLIC_ACTIVE_TRIP_SERVER_URL ||
      "http://192.168.100.160:3003/active-trips",
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
export const apiClient = createApiClient();
export const authApiClient = createAuthApiClient();
export const meApiClient = createMeApiClient();
export const auctionApiClient = createAuctionApiClient();
export const settingsApiClient = createSettingsApiClient();
export const activeTripApiClient = createActiveTripApiClient();

export { axios };
