/**
 * POST Request Hook (Expo/React Native)
 *
 * Caller: Components/screens that need to create/update resources via POST
 * Purpose: Provide reusable POST request functionality with state management
 * Input/Output:
 *   - Input: endpoint - string API endpoint path (e.g., "/qr/code")
 *   - Output: State (data, loading, error) and an `execute` function to perform the POST
 * Description: Uses the configured axios `apiClient` (see `config/apiConfig.ts`) which
 *             includes interceptors for auth and error handling. Manages loading,
 *             error, and data states suitable for Expo/React Native.
 * Expected Outcome: Consistent POST handling across the app with proper
 *                   state management and user-friendly error messages.
 */

import { apiClient, type ApiResponse } from "@/config/apiConfig";
import { logger } from "@/utils/helpers";
import { useCallback, useState } from "react";

const log = logger();

export interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const usePost = <T = any, B = any>(endpoint: string) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Execute POST Request Function
   *
   * Caller: Components using the `usePost` hook
   * Purpose: Performs the POST request with state management
   * Input/Output:
   *   - Input: body - optional request body, params - optional query parameters
   *   - Output: Promise resolving to response data
   * Description: Executes a POST request to the specified endpoint with optional
   *             body and query parameters. Manages loading and error states.
   */
  const execute = useCallback(
    async (body?: B, params?: Record<string, any>): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiClient.post<ApiResponse<T>>(endpoint, body, {
          params,
        });
        const responseData = (response.data as any)?.data ?? response.data;
        log("[usePost] ✅ Response", {
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
        log("[usePost] ❌ Error", { endpoint, error: errorMessage });
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
