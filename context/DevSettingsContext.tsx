import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEV_SETTINGS_STORAGE_KEY } from "@/constants/global";
import { getStorageItem, setStorageItem } from "@/utils/helpers";

export type FloatingButtonPosition = { x: number; y: number };

type DevSettingsState = {
  showContentKeys: boolean;
  floatingButtonPosition: FloatingButtonPosition;
};

const DEFAULT_POSITION: FloatingButtonPosition = { x: 0.85, y: 0.4 };

type DevSettingsContextValue = {
  showContentKeys: boolean;
  setShowContentKeys: (value: boolean) => void;
  floatingButtonPosition: FloatingButtonPosition;
  setFloatingButtonPosition: (value: FloatingButtonPosition) => void;
  isHydrated: boolean;
};

const DevSettingsContext = createContext<DevSettingsContextValue | undefined>(
  undefined,
);

export function DevSettingsProvider({ children }: { children: React.ReactNode }) {
  const [showContentKeys, setShowContentKeysState] = useState(false);
  const [floatingButtonPosition, setFloatingButtonPositionState] =
    useState<FloatingButtonPosition>(DEFAULT_POSITION);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const raw = await getStorageItem(DEV_SETTINGS_STORAGE_KEY);
        if (!raw) {
          if (isMounted) setIsHydrated(true);
          return;
        }
        const parsed = JSON.parse(raw) as Partial<DevSettingsState>;
        if (isMounted) {
          if (typeof parsed?.showContentKeys === "boolean") {
            setShowContentKeysState(parsed.showContentKeys);
          }
          if (
            parsed?.floatingButtonPosition &&
            typeof parsed.floatingButtonPosition.x === "number" &&
            typeof parsed.floatingButtonPosition.y === "number"
          ) {
            setFloatingButtonPositionState(parsed.floatingButtonPosition);
          }
          setIsHydrated(true);
        }
      } catch {
        if (isMounted) setIsHydrated(true);
      }
    };

    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const persistState = useCallback(
    (patch: Partial<DevSettingsState>) => {
      setStorageItem(
        DEV_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          showContentKeys: patch.showContentKeys ?? showContentKeys,
          floatingButtonPosition:
            patch.floatingButtonPosition ?? floatingButtonPosition,
        }),
      ).catch(() => {});
    },
    [showContentKeys, floatingButtonPosition],
  );

  const setShowContentKeys = useCallback(
    (value: boolean) => {
      setShowContentKeysState(value);
      persistState({ showContentKeys: value });
    },
    [persistState],
  );

  const setFloatingButtonPosition = useCallback(
    (value: FloatingButtonPosition) => {
      setFloatingButtonPositionState(value);
      persistState({ floatingButtonPosition: value });
    },
    [persistState],
  );

  const contextValue = useMemo<DevSettingsContextValue>(
    () => ({
      showContentKeys,
      setShowContentKeys,
      floatingButtonPosition,
      setFloatingButtonPosition,
      isHydrated,
    }),
    [
      showContentKeys,
      setShowContentKeys,
      floatingButtonPosition,
      setFloatingButtonPosition,
      isHydrated,
    ],
  );

  return (
    <DevSettingsContext.Provider value={contextValue}>
      {children}
    </DevSettingsContext.Provider>
  );
}

export function useDevSettings(): DevSettingsContextValue {
  const ctx = useContext(DevSettingsContext);
  if (!ctx) {
    throw new Error("useDevSettings must be used within DevSettingsProvider");
  }
  return ctx;
}
