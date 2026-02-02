import React, { createContext, useContext, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type OverlayInsetsContextValue = {
  /** Bottom inset to use for overlays (modals, bottom sheets) so content/buttons stay above tab bar. Safe area bottom + tab bar height when visible. */
  overlayBottomInset: number;
  /** Set the current tab bar height. Call with 0 when tabs are hidden. Used by (tabs)/_layout. */
  setTabBarHeight: (height: number) => void;
};

const OverlayInsetsContext = createContext<OverlayInsetsContextValue | null>(
  null
);

export function OverlayInsetsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const overlayBottomInset = useMemo(
    () => insets.bottom,
    [insets.bottom, tabBarHeight]
  );

  const value = useMemo<OverlayInsetsContextValue>(
    () => ({
      overlayBottomInset,
      setTabBarHeight,
    }),
    [overlayBottomInset]
  );

  return (
    <OverlayInsetsContext.Provider value={value}>
      {children}
    </OverlayInsetsContext.Provider>
  );
}

export function useOverlayInsets(): OverlayInsetsContextValue {
  const ctx = useContext(OverlayInsetsContext);
  if (!ctx) {
    throw new Error(
      "useOverlayInsets must be used within OverlayInsetsProvider"
    );
  }
  return ctx;
}

/** Safe hook that returns 0 if used outside provider (e.g. in tests). */
export function useOverlayInsetsOptional(): number {
  const ctx = useContext(OverlayInsetsContext);
  return ctx?.overlayBottomInset ?? 0;
}
