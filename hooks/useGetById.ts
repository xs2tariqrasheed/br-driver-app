/**
 * GET-by-ID Hook (Expo/React Native)
 *
 * Caller: Components/screens needing to fetch a resource by ID
 * Purpose: Provide reusable GET-by-ID request functionality with state management
 * Input/Output:
 *   - Input: baseEndpoint - base API endpoint path (e.g., "/qr/code")
 *   - Output: State (data, loading, error) and an `execute` function to perform the GET
 * Description: Uses the configured axios `apiClient` (see `config/apiConfig.ts`)
 *             which includes interceptors for auth and error handling. Builds
 *             the URL as `${baseEndpoint}/${id}`.
 * Expected Outcome: Consistent GET-by-ID handling across the app.
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

export const useGetById = <T = any>(baseEndpoint: string) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Execute GET-by-ID Request Function
   *
   * Caller: Components using the `useGetById` hook
   * Purpose: Performs the GET request to `${baseEndpoint}/${id}`
   * Input/Output:
   *   - Input: id - string | number identifier, params - optional query parameters
   *   - Output: Promise resolving to response data
   */
  const execute = useCallback(
    async (id: string | number, params?: Record<string, any>): Promise<T> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const url = `${baseEndpoint}/${id}`;

      try {
        const response = await apiClient.get<ApiResponse<T>>(url, { params });
        const responseData = (response.data as any)?.data ?? response.data;
        log("[useGetById] ✅ Response", {
          url,
          status: (response as any)?.status,
        });
        setState({ data: responseData as T, loading: false, error: null });
        return responseData as T;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        log("[useGetById] ❌ Error", { url, error: errorMessage });
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [baseEndpoint]
  );

  return { ...state, execute };
};
