import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

// Types
export type ContentObject = {
  [key: string]: any; // Flexible structure for content from API
};

type ContentState = {
  content: ContentObject | null;
  isHydrated: boolean;
};

type ContentAction =
  | { type: "SET_CONTENT"; payload: ContentObject | null }
  | { type: "HYDRATE_CONTENT"; payload: ContentObject | null };

const initialState: ContentState = {
  content: null,
  isHydrated: false,
};

function contentReducer(
  state: ContentState,
  action: ContentAction
): ContentState {
  switch (action.type) {
    case "HYDRATE_CONTENT":
      return {
        ...state,
        content: action.payload,
        isHydrated: true,
      };
    case "SET_CONTENT":
      return {
        ...state,
        content: action.payload,
      };
    default:
      return state;
  }
}

type ContentContextValue = [
  ContentObject | null,
  (value: ContentObject | null) => void
];

const ContentContext = createContext<ContentContextValue | undefined>(
  undefined
);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(contentReducer, initialState);

  const setContent = useCallback((value: ContentObject | null) => {
    dispatch({ type: "SET_CONTENT", payload: value });
  }, []);

  const contextValue = useMemo<ContentContextValue>(
    () => [state.content, setContent],
    [state.content, setContent]
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
