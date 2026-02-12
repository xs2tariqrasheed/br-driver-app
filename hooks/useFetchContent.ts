/**
 * useFetchContent Hook (mobile-local)
 *
 * Fetches dynamic content from Settings Service and updates ContentContext.
 */

import { APP_ENDPOINTS } from "@/constants/endpoints";
import { API_CLIENT_TYPES } from "@/constants/global";
import { useContent } from "@/context/ContentContext";
import { usePost } from "@/hooks/usePost";
import { flattenContent } from "@/utils/content";
import { buildAppContentRequest } from "@/utils/requestBuilder";
import { useCallback, useEffect, useRef } from "react";

const MAX_CONTENT_FETCH_ATTEMPTS = 3;

export function useFetchContent() {
  const { content, setContent, setIsLoading, setError } = useContent();
  const { execute, loading } = usePost<any, any>(
    APP_ENDPOINTS.content,
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
      const response = await execute(requestJson);
      const contents =
        (response as any)?.jData?.contents ||
        (response as any)?.data?.jData?.contents ||
        {};

      const flattened = flattenContent(contents);
      setContent(flattened);
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
  }, [execute, setContent, setError, setIsLoading]);

  return {
    fetchContent,
    isFetching: loading || isFetchingRef.current,
  };
}
