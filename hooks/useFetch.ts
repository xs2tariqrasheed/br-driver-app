/**
 * GET Request Hook (Expo/React Native)
 *
 * Caller: Components/screens needing to fetch data from API endpoints
 * Purpose: Provide reusable GET request functionality with state management
 * Input/Output:
 *   - Input: endpoint - string API endpoint path (e.g., "/qr/code")
 *   - Output: State (data, loading, error) and an `execute` function to perform the GET
 * Description: Uses the configured axios `apiClient` (see `config/apiConfig.ts`) which
 *             includes interceptors for auth and error handling. Manages loading,
 *             error, and data states suitable for Expo/React Native (auth token
 *             stored via AsyncStorage).
 * Expected Outcome: Consistent GET request handling across the app with proper
 *                   state management and user-friendly error messages.
 */

import { apiClient, type ApiResponse } from "@/config/apiConfig";
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
 *   - Input: `endpoint` - string API endpoint path
 *   - Output: `{ data, loading, error, execute }`
 * Description: Manages the state of a GET request including loading, errors, and data.
 *             `execute` can be called with optional query params to trigger the request.
 *             Responses shaped as `{ data: T }` or raw `T` are both supported.
 * Expected Outcome: Clean interface for GET requests with proper state handling.
 */
export const useFetch = <T = any>(endpoint: string) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Execute GET Request Function
   *
   * Caller: Components using the `useFetch` hook
   * Purpose: Performs the actual GET request with state management
   * Input/Output:
   *   - Input: params - optional query parameters object
   *   - Output: Promise resolving to response data
   * Description: Executes a GET request to the specified endpoint with optional
   *             query parameters. Manages loading and error states throughout
   *             the request lifecycle. Handles response data extraction and
   *             error processing.
   * Expected Outcome: Successful data fetch with updated state, or error
   *                   handling with appropriate error state updates.
   */
  const execute = useCallback(
    async (params?: Record<string, any>): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.get<ApiResponse<T>>(endpoint, {
          params,
        });
        const responseData = (response.data as any)?.data ?? response.data;
        log("[useFetch] ✅ Response", {
          endpoint,
          status: (response as any)?.status,
        });
        setState({
          data: responseData as T,
          loading: false,
          error: null,
        });
        return responseData;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        log("[useFetch] ❌ Error", { endpoint, error: errorMessage });
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [endpoint]
  );

  return { ...state, execute };
};
