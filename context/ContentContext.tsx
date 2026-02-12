import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { CONTENT_STORAGE_KEY } from "@/constants/global";
import { getStorageItem, logger, setStorageItem } from "@/utils/helpers";

// Types
export type ContentObject = {
  [key: string]: string;
};

type ContentState = {
  content: ContentObject;
  isHydrated: boolean;
  isLoading: boolean;
  error: Error | null;
};

type ContentAction =
  | { type: "SET_CONTENT"; payload: ContentObject }
  | { type: "HYDRATE_CONTENT"; payload: ContentObject }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null };

const initialState: ContentState = {
  content: {},
  isHydrated: false,
  isLoading: false,
  error: null,
};

function contentReducer(
  state: ContentState,
  action: ContentAction
): ContentState {
  switch (action.type) {
    case "HYDRATE_CONTENT":
      return {
        ...state,
        content:
          Object.keys(state.content).length > 0
            ? state.content
            : action.payload,
        isHydrated: true,
      };
    case "SET_CONTENT":
      return {
        ...state,
        content: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

type ContentContextValue = {
  content: ContentObject;
  setContent: (value: ContentObject) => void;
  isHydrated: boolean;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  error: Error | null;
  setError: (value: Error | null) => void;
};

const ContentContext = createContext<ContentContextValue | undefined>(
  undefined
);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const log = logger();
  const [state, dispatch] = useReducer(contentReducer, initialState);

  const setContent = useCallback((value: ContentObject) => {
    dispatch({ type: "SET_CONTENT", payload: value });
  }, []);

  const setIsLoading = useCallback((value: boolean) => {
    dispatch({ type: "SET_LOADING", payload: value });
  }, []);

  const setError = useCallback((value: Error | null) => {
    dispatch({ type: "SET_ERROR", payload: value });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await getStorageItem(CONTENT_STORAGE_KEY);
        if (!stored) {
          if (isMounted) {
            dispatch({ type: "HYDRATE_CONTENT", payload: {} });
          }
          return;
        }

        const parsed = JSON.parse(stored);
        const storedContent = (parsed?.data || parsed) as ContentObject;
        if (isMounted) {
          dispatch({
            type: "HYDRATE_CONTENT",
            payload: storedContent && typeof storedContent === "object"
              ? storedContent
              : {},
          });
        }
      } catch (error) {
        console.warn("[ContentContext] Failed to hydrate content:", error);
        if (isMounted) {
          dispatch({ type: "HYDRATE_CONTENT", payload: {} });
        }
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;
    const payload = JSON.stringify({
      data: state.content,
      updatedAt: new Date().toISOString(),
    });
    setStorageItem(CONTENT_STORAGE_KEY, payload).catch((error) => {
      log("[ContentContext] Failed to persist content:", error);
    });
  }, [state.content, state.isHydrated, log]);

  const contextValue = useMemo<ContentContextValue>(
    () => ({
      content: state.content,
      setContent,
      isHydrated: state.isHydrated,
      isLoading: state.isLoading,
      setIsLoading,
      error: state.error,
      setError,
    }),
    [
      state.content,
      state.isHydrated,
      state.isLoading,
      state.error,
      setContent,
      setIsLoading,
      setError,
    ]
  );

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error("useContent must be used within ContentProvider");
  }
  return ctx;
}
