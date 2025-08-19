/**
 * DELETE Request Hook (Expo/React Native)
 *
 * Caller: Components/screens that need to delete resources
 * Purpose: Provide reusable DELETE request functionality with state management
 * Input/Output:
 *   - Input: baseEndpoint - base API endpoint path (e.g., "/qr/code")
 *   - Output: State (success, loading, error) and an `execute` function to perform the DELETE
 * Description: Uses the configured axios `apiClient` (see `config/apiConfig.ts`)
 *             which includes interceptors for auth and error handling. Builds
 *             the URL as `${baseEndpoint}/${id}` by default, with optional params.
 */

import { apiClient } from "@/config/apiConfig";
import { logger } from "@/utils/helpers";
import { useCallback, useState } from "react";

const log = logger();

export interface DeleteState {
  success: boolean;
  loading: boolean;
  error: string | null;
}

export const useDelete = (baseEndpoint: string) => {
  const [state, setState] = useState<DeleteState>({
    success: false,
    loading: false,
    error: null,
  });

  /**
   * Execute DELETE Request Function
   *
   * Caller: Components using the `useDelete` hook
   * Purpose: Performs the DELETE request to `${baseEndpoint}/${id}`
   * Input/Output:
   *   - Input: id - string | number identifier, params - optional query parameters
   *   - Output: Promise resolving to a boolean `success`
   */
  const execute = useCallback(
    async (
      id: string | number,
      params?: Record<string, any>
    ): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        success: false,
      }));
      const url = `${baseEndpoint}/${id}`;

      try {
        const response = await apiClient.delete(url, { params });
        log("[useDelete] ✅ Response", {
          url,
          status: (response as any)?.status,
        });
        setState({ success: true, loading: false, error: null });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        log("[useDelete] ❌ Error", { url, error: errorMessage });
        setState({ success: false, loading: false, error: errorMessage });
        throw error;
      }
    },
    [baseEndpoint]
  );

  return { ...state, execute };
};
