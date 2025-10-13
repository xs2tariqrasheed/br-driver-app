/**
 * GET Request Hook (Expo/React Native)
 *
 * Caller: Components/screens needing to fetch data from API endpoints
 * Purpose: Provide reusable GET request functionality with state management
 * Input/Output:
 *   - Input: endpoint - string API endpoint path (e.g., "/qr/code"), clientType - optional "auth", "me", "auction", or "settings" for specific endpoints
 *   - Output: State (data, loading, error) and an `execute` function to perform the GET
 * Description: Uses the configured axios client based on clientType parameter:
 *             - "auth": Uses authApiClient for authentication endpoints (login, registration, etc.)
 *             - "me": Uses meApiClient for user profile endpoints with auth token and auth base URL
 *             - "auction": Uses auctionApiClient for auction/trip offer endpoints
 *             - "settings": Uses settingsApiClient for settings service endpoints
 *             - default: Uses apiClient for regular API endpoints with auth token injection
 *             Both clients include appropriate interceptors and error handling.
 * Expected Outcome: Consistent GET request handling across the app with proper
 *                   state management and user-friendly error messages.
 */

import {
  apiClient,
  auctionApiClient,
  authApiClient,
  meApiClient,
  settingsApiClient,
  type ApiResponse,
} from "@/config/apiConfig";
import { API_CLIENT_TYPES } from "@/constants/global";
import { logger } from "@/utils/helpers";
import { useCallback, useState } from "react";

const log = logger();

// Type definitions
export interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * GET Request Hook
 *
 * Caller: Components requiring data fetching functionality
 * Purpose: Manages GET request state and execution
 * Input/Output:
 *   - Input: `endpoint` - string API endpoint path, `clientType` - optional "auth", "me", "auction", or "settings" for specific endpoints
 *   - Output: `{ data, loading, error, execute }`
 * Description: Manages the state of a GET request including loading, errors, and data.
 *             `execute` can be called with optional query params to trigger the request.
 *             Uses appropriate client based on clientType: authApiClient for "auth", meApiClient for "me",
 *             auctionApiClient for "auction", settingsApiClient for "settings", otherwise uses apiClient.
 *             Responses shaped as `{ data: T }` or raw `T` are both supported.
 * Expected Outcome: Clean interface for GET requests with proper state handling.
 */
export const useFetch = <T = any>(endpoint: string, clientType?: string) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Execute GET Request Function
   *
   * Caller: Components using the `useFetch` hook
   * Purpose: Performs the actual GET request with state management using appropriate client
   * Input/Output:
   *   - Input: params - optional query parameters object
   *   - Output: Promise resolving to response data
   * Description: Executes a GET request to the specified endpoint with optional
   *             query parameters. Uses appropriate client based on clientType: authApiClient for "auth",
   *             meApiClient for "me", auctionApiClient for "auction", settingsApiClient for "settings",
   *             otherwise uses apiClient. Manages loading and error states.
   * Expected Outcome: Successful data fetch with updated state, or error
   *                   handling with appropriate error state updates.
   */
  const execute = useCallback(
    async (params?: Record<string, any>): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Select the appropriate client based on clientType
        const client =
          clientType === API_CLIENT_TYPES.AUTH
            ? authApiClient
            : clientType === API_CLIENT_TYPES.ME
            ? meApiClient
            : clientType === API_CLIENT_TYPES.AUCTION
            ? auctionApiClient
            : clientType === API_CLIENT_TYPES.SETTINGS
            ? settingsApiClient
            : apiClient;
        const logPrefix =
          clientType === API_CLIENT_TYPES.AUTH
            ? "[useFetch-Auth]"
            : clientType === API_CLIENT_TYPES.ME
            ? "[useFetch-Me]"
            : clientType === API_CLIENT_TYPES.AUCTION
            ? "[useFetch-Auction]"
            : clientType === API_CLIENT_TYPES.SETTINGS
            ? "[useFetch-Settings]"
            : "[useFetch]";

        const response = await client.get<ApiResponse<T>>(endpoint, {
          params,
        });
        const responseData = (response.data as any)?.data ?? response.data;
        log(`${logPrefix} ✅ Response`, {
          endpoint,
          status: (response as any)?.status,
        });
        setState({
          data: responseData as T,
          loading: false,
          error: null,
        });
        return responseData as T;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        const logPrefix =
          clientType === API_CLIENT_TYPES.AUTH
            ? "[useFetch-Auth]"
            : clientType === API_CLIENT_TYPES.ME
            ? "[useFetch-Me]"
            : clientType === API_CLIENT_TYPES.AUCTION
            ? "[useFetch-Auction]"
            : clientType === API_CLIENT_TYPES.SETTINGS
            ? "[useFetch-Settings]"
            : "[useFetch]";
        log(`${logPrefix} ❌ Error`, { endpoint, error: errorMessage });
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [endpoint, clientType]
  );

  return { ...state, execute };
};
