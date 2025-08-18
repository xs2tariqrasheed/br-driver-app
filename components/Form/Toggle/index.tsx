import { textColors } from "@/constants/colors";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

export type ToggleSetValueFn =
  | ((value: boolean) => void)
  | ((name: string, value: boolean, options?: unknown) => void);

export type ToggleProps = {
  /** Disable interaction and apply disabled visuals */
  disabled?: boolean;
  /** Optional field name for react-hook-form's setValue(name, value) signature */
  name?: string;
  /** Controlled value (required) */
  value: boolean;
  /**
   * Required setter. Accepts either:
   * - setValue(next: boolean)
   * - setValue(name: string, next: boolean)
   */
  setValue: ToggleSetValueFn;
  /** Callback fired after value changes via user interaction */
  onChange?: (next: boolean) => void;
  /** Optional style override for outer wrapper */
  style?: StyleProp<ViewStyle>;
  /** Size override (width x height). Defaults to 56 x 32. */
  size?: { width: number; height: number };
};

const INACTIVE_BG = textColors.grey250 ?? "#C7C7CC"; // per spec
const ACTIVE_BG = textColors.black; // per spec
const KNOB_COLOR = textColors.white; // per spec

const ANIMATION_DURATION_MS = 180;

const Toggle: React.FC<ToggleProps> = ({
  disabled = false,
  name,
  value,
  setValue,
  onChange,
  style,
  size,
}) => {
  const dimensions = useMemo(() => {
    const width = size?.width ?? 56;
    const height = size?.height ?? 32;
    const padding = 2; // visual padding around knob
    const knobDiameter = height - padding * 2;
    const travelDistance = width - knobDiameter - padding * 2; // distance knob travels left→right
    const borderRadius = height / 2;
    return {
      width,
      height,
      padding,
      knobDiameter,
      travelDistance,
      borderRadius,
    };
  }, [size]);

  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value ? 1 : 0,
      duration: ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // color interpolation requires non-native driver
    }).start();
  }, [value, animated]);

  const backgroundColor = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [INACTIVE_BG, ACTIVE_BG],
  });

  const translateX = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [
      dimensions.padding,
      dimensions.padding + dimensions.travelDistance,
    ],
  });

  const handlePress = () => {
    if (disabled) return;
    const next = !value;

    // Support both setValue(value) and setValue(name, value)
    const fn = setValue as any;
    if (typeof fn === "function") {
      if (name && fn.length >= 2) {
        fn(name, next);
      } else {
        fn(next);
      }
    }

    onChange?.(next);
  };

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ disabled, checked: value }}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
          opacity: 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor,
            borderRadius: dimensions.borderRadius,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.knob,
          {
            width: dimensions.knobDiameter,
            height: dimensions.knobDiameter,
            borderRadius: dimensions.knobDiameter / 2,
            transform: [{ translateX }],
            backgroundColor: disabled ? textColors.grey300 : KNOB_COLOR,
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
  },
  track: {
    ...StyleSheet.absoluteFillObject,
  },
  knob: {
    position: "absolute",
    left: 0,
    backgroundColor: KNOB_COLOR,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

export default Toggle;
