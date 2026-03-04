/**
 * useFetchContent Hook (mobile-local)
 *
 * Fetches dynamic content from Settings Service and updates ContentContext.
 */

import {
  APP_ENDPOINTS,
  SYSTEM_SETTINGS_ENDPOINTS,
} from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { useContent } from "@/context/ContentContext";
import { usePost } from "@/hooks/usePost";
import { flattenContent, flattenSystemSettings } from "@/utils/content";
import {
  buildAppContentRequest,
  buildSystemSettingsRequest,
} from "@/utils/requestBuilder";
import { useCallback, useEffect, useRef } from "react";

const MAX_CONTENT_FETCH_ATTEMPTS = 3;

export function useFetchContent() {
  const { content, setContent, setIsLoading, setError, setSystemSettings } =
    useContent();
  const { execute: fetchContentRequest, loading } = usePost<any, any>(
    APP_ENDPOINTS.content,
    API_CLIENT_TYPES.SETTINGS,
  );
  const { execute: fetchSystemSettingsRequest } = usePost<any, any>(
    SYSTEM_SETTINGS_ENDPOINTS.getAll,
    API_CLIENT_TYPES.SETTINGS,
  );

  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const failureCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading, setIsLoading]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  const fetchContent = useCallback(async () => {
    if (
      hasFetchedRef.current ||
      failureCountRef.current >= MAX_CONTENT_FETCH_ATTEMPTS
    ) {
      return;
    }
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    if (isMountedRef.current) setError(null);

    const scheduleRetry = () => {
      failureCountRef.current += 1;
      const failures = failureCountRef.current;

      if (failures >= MAX_CONTENT_FETCH_ATTEMPTS) {
        hasFetchedRef.current = true;
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      const delayMs = 500 * Math.pow(2, failures - 1);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        fetchContent();
      }, delayMs);
    };

    try {
      const requestJson = await buildAppContentRequest();
      const response = await fetchContentRequest(requestJson);
      const contents =
        (response as any)?.jData?.contents ||
        (response as any)?.data?.jData?.contents ||
        {};

      const flattened = flattenContent(contents);
      let nextContent = flattened;

      // After content is fetched successfully, fetch system settings content as well
      try {
        const systemSettingsRequest = await buildSystemSettingsRequest();
        const systemSettingsDbResponse = await fetchSystemSettingsRequest(
          systemSettingsRequest,
        );
        console.log(
          "useFetchContent - System settings response:",
          systemSettingsDbResponse,
        );

        // Normalize DB response: prefer jData.system_settings, then jData
        const jData =
          (systemSettingsDbResponse as any)?.jData ||
          (systemSettingsDbResponse as any)?.data?.jData ||
          systemSettingsDbResponse;
        const systemSettingsArray =
          (jData && (jData as any).system_settings) || [];

        const flattenedSystemSettings =
          flattenSystemSettings(systemSettingsArray);

        // Persist flattened system settings separately if needed
        setSystemSettings(flattenedSystemSettings);

        // Merge system settings content into main content map so getContent can access it
        nextContent = {
          ...flattened,
          ...flattenedSystemSettings,
        };
      } catch (systemErr: any) {
        console.warn(
          "[useFetchContent] Failed to fetch system settings content:",
          systemErr,
        );
        // Fall back to just app content if system settings fetch fails
        nextContent = flattened;
      }

      setContent(nextContent);

      hasFetchedRef.current = true;
      failureCountRef.current = 0;
    } catch (err: any) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch content");
      const isConnectionError =
        error.message?.includes("Network Error") ||
        error.message?.includes("ERR_CONNECTION_REFUSED") ||
        error.message?.includes("ERR_NETWORK");

      if (isMountedRef.current && !isConnectionError) {
        setError(error);
      }

      const isEmpty = Object.keys(contentRef.current || {}).length === 0;
      if (isEmpty) {
        scheduleRetry();
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [
    fetchContentRequest,
    fetchSystemSettingsRequest,
    setContent,
    setError,
    setIsLoading,
    setSystemSettings,
  ]);

  return {
    fetchContent,
    isFetching: loading || isFetchingRef.current,
  };
}
