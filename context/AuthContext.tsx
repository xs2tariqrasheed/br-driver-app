import { AUTH_STORAGE_KEY } from "@/constants/global";
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "@/utils/helpers";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// Types
export type AuthObject = {
  token?: string | null;
  // Extend with any user fields you need later (id, name, roles, etc.)
  [key: string]: unknown;
} | null;

type AuthState = {
  auth: AuthObject;
  isHydrated: boolean;
};

type SetAuthAction = {
  type: "SET_AUTH";
  payload: AuthObject;
};

type ClearAuthAction = {
  type: "CLEAR_AUTH";
};

type HydrateAuthAction = {
  type: "HYDRATE_AUTH";
  payload: AuthObject;
};

type AuthAction = SetAuthAction | ClearAuthAction | HydrateAuthAction;

const initialState: AuthState = {
  auth: null,
  isHydrated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_AUTH": {
      return { ...state, auth: action.payload };
    }
    case "CLEAR_AUTH": {
      return { ...state, auth: null };
    }
    case "HYDRATE_AUTH": {
      return { auth: action.payload, isHydrated: true };
    }
    default: {
      return state;
    }
  }
}

type AuthContextValue = [AuthObject, (value: AuthObject) => Promise<void>];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Hydrate once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await getStorageItem(AUTH_STORAGE_KEY);
        const parsed: AuthObject = raw ? JSON.parse(raw) : null;
        dispatch({ type: "HYDRATE_AUTH", payload: parsed });
      } catch {
        dispatch({ type: "HYDRATE_AUTH", payload: null });
      }
    })();
  }, []);

  const setAuth = useCallback(async (value: AuthObject) => {
    dispatch({ type: "SET_AUTH", payload: value });
    try {
      if (value == null) {
        // Remove persisted auth
        await removeStorageItem(AUTH_STORAGE_KEY);
      } else {
        await setStorageItem(AUTH_STORAGE_KEY, JSON.stringify(value));
      }
    } catch {
      // no-op persistence failure
    }
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => [state.auth, setAuth],
    [state.auth, setAuth]
  );

  // Delay rendering children until hydration completes to avoid flicker
  if (!state.isHydrated) return null;

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
