import { textColors } from "@/constants/colors";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type LoaderSize = "small" | "medium" | "large";

export type LoaderProps = {
  /** "small" | "medium" | "large". Defaults to "medium". */
  size?: LoaderSize;
  /** Color of the spinner. Defaults to brand teal600. */
  color?: string;
  /** Optional style for the outer container. */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for screen readers. */
  accessibilityLabel?: string;
};

const ANDROID_LARGE_BASE_PX = 36; // Used to scale reliably on Android

const numericSizeForToken: Record<LoaderSize, number> = {
  small: 18,
  medium: 28,
  large: 36,
};

const Loader: React.FC<LoaderProps> = ({
  size = "medium",
  color = textColors.teal600,
  style,
  accessibilityLabel = "Loading",
}) => {
  const numericSize = numericSizeForToken[size];

  if (Platform.OS === "android") {
    // Android supports only "small" | "large" reliably; scale "large" to match our tokens
    const scale = numericSize / ANDROID_LARGE_BASE_PX;
    return (
      <View
        style={style}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="progressbar"
      >
        <ActivityIndicator
          size="large"
          color={color}
          style={{ transform: [{ scale }] }}
        />
      </View>
    );
  }

  // iOS/web accept a numeric size directly for consistent rendering
  return (
    <View
      style={style}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size={numericSize} color={color} />
    </View>
  );
};

export default Loader;
