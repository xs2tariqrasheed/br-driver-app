import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import type { FloatingButtonPosition } from "@/context/DevSettingsContext";
import { useDevSettings } from "@/context/DevSettingsContext";
import { usePathname, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from "react-native";

const BUTTON_SIZE = 48;
const TAP_THRESHOLD = 10;

/**
 * Movable floating button for development. Opens Developer Settings on tap.
 * Position is stored as 0–1 (percentage) and persists across app restarts.
 * Works on both Android and iOS.
 * Does not push developer-settings again if already on that screen.
 */
export default function DevFloatingButton() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const { floatingButtonPosition, setFloatingButtonPosition, isHydrated } =
    useDevSettings();

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const touchStartRef = useRef({ x: 0, y: 0 });
  const buttonStartRef = useRef({ x: 0, y: 0 });
  const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const currentCenterPxRef = useRef({
    x: floatingButtonPosition.x * screenWidth,
    y: floatingButtonPosition.y * screenHeight,
  });
  currentCenterPxRef.current = {
    x: floatingButtonPosition.x * screenWidth,
    y: floatingButtonPosition.y * screenHeight,
  };

  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const clamp = useCallback(
    (x: number, y: number) => {
      const half = BUTTON_SIZE / 2;
      return {
        x: Math.max(half, Math.min(screenWidth - half, x)),
        y: Math.max(half, Math.min(screenHeight - half, y)),
      };
    },
    [screenWidth, screenHeight],
  );

  const positionToPercentage = useCallback(
    (x: number, y: number): FloatingButtonPosition => ({
      x: Math.max(0, Math.min(1, x / screenWidth)),
      y: Math.max(0, Math.min(1, y / screenHeight)),
    }),
    [screenWidth, screenHeight],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (ev) => {
        const { pageX, pageY } = ev.nativeEvent;
        touchStartRef.current = { x: pageX, y: pageY };
        const currentPx = currentCenterPxRef.current;
        buttonStartRef.current = {
          x: pageX - currentPx.x,
          y: pageY - currentPx.y,
        };
      },
      onPanResponderMove: (ev) => {
        const { pageX, pageY } = ev.nativeEvent;
        const { x: dx, y: dy } = buttonStartRef.current;
        const next = clamp(pageX - dx, pageY - dy);
        lastDragPositionRef.current = next;
        setDragPosition(next);
      },
      onPanResponderRelease: (ev) => {
        const { pageX, pageY } = ev.nativeEvent;
        const dist = Math.hypot(
          pageX - touchStartRef.current.x,
          pageY - touchStartRef.current.y,
        );
        if (dist < TAP_THRESHOLD) {
          const currentPath = pathnameRef.current;
          const alreadyOnDeveloperSettings =
            currentPath === "/(screens)/developer-settings" ||
            currentPath.endsWith("/developer-settings");
          if (!alreadyOnDeveloperSettings) {
            router.push("/(screens)/developer-settings");
          }
          lastDragPositionRef.current = null;
          setDragPosition(null);
          return;
        }
        const lastDrag = lastDragPositionRef.current;
        const currentPx = currentCenterPxRef.current;
        const final = lastDrag
          ? clamp(lastDrag.x, lastDrag.y)
          : clamp(currentPx.x, currentPx.y);
        setFloatingButtonPosition(positionToPercentage(final.x, final.y));
        lastDragPositionRef.current = null;
        setDragPosition(null);
      },
    }),
  ).current;

  if (!isHydrated) return null;

  const displayPosition = dragPosition ?? {
    x: floatingButtonPosition.x * screenWidth,
    y: floatingButtonPosition.y * screenHeight,
  };
  const clamped = clamp(displayPosition.x, displayPosition.y);

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      collapsable={false}
    >
      <View
        style={[
          styles.button,
          {
            left: clamped.x - BUTTON_SIZE / 2,
            top: clamped.y - BUTTON_SIZE / 2,
          },
        ]}
        {...panResponder.panHandlers}
        accessibilityRole="button"
        accessibilityLabel="Open developer settings"
      >
        <Typography
          type="bodySmall"
          weight="semibold"
          style={styles.label}
          numberOfLines={1}
        >
          Dev
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: textColors.black,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  label: {
    color: textColors.white,
  },
});
