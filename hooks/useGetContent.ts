/**
 * useGetContent Hook (mobile-local)
 *
 * Provides a getter for flattened content and exposes loading/error state.
 * When developer setting "show content keys" is enabled, returns the content key
 * instead of the resolved value (for development/debugging).
 */

import { useContent } from "@/context/ContentContext";
import { useDevSettings } from "@/context/DevSettingsContext";
import { createContentGetterByKey } from "@/utils/content";
import { useCallback, useMemo } from "react";

export const useGetContent = (): {
  getContent: (key: string) => string;
  getContentBatch: <T extends Record<string, string>>(keys: T) => {
    [K in keyof T]: string;
  };
  isLoading: boolean;
  error: Error | null;
} => {
  const { content, isLoading, error } = useContent();
  const { showContentKeys } = useDevSettings();

  const getContent = useMemo(() => {
    return createContentGetterByKey(content, showContentKeys);
  }, [content, showContentKeys]);

  const getContentBatch = useCallback(
    <T extends Record<string, string>>(keys: T) => {
      const result = {} as { [K in keyof T]: string };
      for (const key of Object.keys(keys) as Array<keyof T>) {
        result[key] = getContent(keys[key] as string);
      }
      return result;
    },
    [getContent],
  );

  return { getContent, getContentBatch, isLoading, error };
};
