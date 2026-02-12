/**
 * Content Utility Functions (mobile-local copy)
 *
 * Keeps content helpers local to the mobile app as requested.
 */

export type ContentEntry = {
  value: string;
  appName?: string;
  viewName?: string;
  [key: string]: any;
};

export type FlattenedContent = Record<string, string>;

/**
 * Flatten content entries into key → value map.
 */
export function flattenContent(
  contents: Record<string, ContentEntry>,
): FlattenedContent {
  const flattened: FlattenedContent = {};

  Object.keys(contents || {}).forEach((key) => {
    const entry = contents[key];
    if (entry && typeof entry.value === "string") {
      flattened[key] = entry.value;
    }
  });

  return flattened;
}

/**
 * Creates a content getter function using closure.
 */
export function createContentGetterByKey(
  stateOfContent: FlattenedContent,
  showKeys: boolean = false,
): (key: string) => string {
  return function getContent(key: string): string {
    const hasKeys = Object.keys(stateOfContent).length > 0;
    if (!hasKeys) {
      return "Skipping content fetch as no keys are available";
    }

    if (showKeys) {
      return key || "";
    }

    const value = stateOfContent[key];
    if (!value && key) {
      console.warn(
        `[getContent] Content not found for key: "${key}". Available keys:`,
        Object.keys(stateOfContent).slice(0, 10),
      );
    }
    return value || "";
  };
}
