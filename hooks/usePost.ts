/**
 * POST Request Hook (Expo/React Native)
 *
 * Caller: Components/screens that need to create/update resources via POST
 * Purpose: Provide reusable POST request functionality with state management
 * Input/Output:
 *   - Input: endpoint - string API endpoint path (e.g., "/qr/code"), clientType - optional "auth" or "me" for specific endpoints
 *   - Output: State (data, loading, error) and an `execute` function to perform the POST
 * Description: Uses the configured axios client based on clientType parameter:
 *             - "auth": Uses authApiClient for authentication endpoints (login, registration, etc.)
 *             - "me": Uses meApiClient for user profile endpoints with auth token and auth base URL
 *             - default: Uses apiClient for regular API endpoints with auth token injection
 *             Both clients include appropriate interceptors and error handling.
 * Expected Outcome: Consistent POST handling across the app with proper
 *                   state management and user-friendly error messages.
 */

import {
  apiClient,
  auctionApiClient,
  authApiClient,
  meApiClient,
  type ApiResponse,
} from "@/config/apiConfig";
import { API_CLIENT_TYPES } from "@/constants/global";
import { logger } from "@/utils/helpers";
import { useCallback, useState } from "react";

const log = logger();

export interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const usePost = <T = any, B = any>(
  endpoint: string,
  clientType?: string
) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Execute POST Request Function
   *
   * Caller: Components using the `usePost` hook
   * Purpose: Performs the POST request with state management using appropriate client
   * Input/Output:
   *   - Input: body - optional request body, params - optional query parameters
   *   - Output: Promise resolving to response data
   * Description: Executes a POST request to the specified endpoint with optional
   *             body and query parameters. Uses authApiClient for "auth" clientType, meApiClient for "me" clientType,
   *             otherwise uses apiClient. Manages loading and error states.
   */
  const execute = useCallback(
    async (body?: B, params?: Record<string, any>): Promise<T> => {
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
            : apiClient;
        const logPrefix =
          clientType === API_CLIENT_TYPES.AUTH
            ? "[usePost-Auth]"
            : clientType === API_CLIENT_TYPES.ME
            ? "[usePost-Me]"
            : clientType === API_CLIENT_TYPES.AUCTION
            ? "[usePost-Auction]"
            : "[usePost]";

        const response = await client.post<ApiResponse<T>>(endpoint, body, {
          params,
        });
        const responseData = (response.data as any)?.data ?? response.data;
        log(`${logPrefix} ✅ Response`, {
          baseURL: client.defaults.baseURL,
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
            ? "[usePost-Auth]"
            : clientType === API_CLIENT_TYPES.ME
            ? "[usePost-Me]"
            : clientType === API_CLIENT_TYPES.AUCTION
            ? "[usePost-Auction]"
            : "[usePost]";
        log(`${logPrefix} ❌ Error`, {
          endpoint,
          error: errorMessage,
        });
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
