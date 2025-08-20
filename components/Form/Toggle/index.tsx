import Typography from "@/components/Typography";
import { SF_PRO_FONTS } from "@/components/Typography/constants";
import { textColors } from "@/constants/colors";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  type TextStyle,
} from "react-native";

type SetValueFn<T> =
  | ((value: T) => void)
  | ((name: string, value: T, options?: unknown) => void);

type CommonProps = {
  /** Disable interaction and apply disabled visuals */
  disabled?: boolean;
  /** Optional field name for react-hook-form's setValue(name, value) signature */
  name?: string;
  /** Optional style override for outer wrapper */
  style?: StyleProp<ViewStyle>;
  /** Size override (width x height). Defaults vary by variant. */
  size?: { width: number; height: number };
};

type SwitchProps = {
  variant?: "switch";
  value: boolean;
  setValue: SetValueFn<boolean>;
  onChange?: (next: boolean) => void;
};

type LabeledProps = {
  variant: "labeled";
  /** Left/right labels. The selected label is returned as the value. */
  labels: [string, string];
  /** The currently selected label value. Must be one of labels[0] or labels[1]. */
  value: string;
  setValue: SetValueFn<string>;
  /** onChange returns the currently selected string value */
  onChange?: (next: string) => void;
};

export type ToggleProps = CommonProps & (SwitchProps | LabeledProps);

const INACTIVE_BG = textColors.grey250 ?? "#C7C7CC"; // per spec
const ACTIVE_BG = textColors.black; // per spec
const KNOB_COLOR = textColors.white; // per spec

const ANIMATION_DURATION_MS = 180;

const Toggle: React.FC<ToggleProps> = (props) => {
  // Labeled string variant
  if (props.variant === "labeled") {
    const {
      disabled = false,
      name,
      labels,
      value,
      setValue,
      onChange,
      style,
      size,
    } = props as CommonProps & LabeledProps;

    const dimensions = useMemo(() => {
      const width = size?.width ?? 150;
      const height = size?.height ?? 36;
      const borderRadius = height / 2;
      const halfWidth = width / 2;
      return { width, height, borderRadius, halfWidth };
    }, [size]);

    const selectedIndex = value === labels[0] ? 0 : 1;
    const animated = useRef(new Animated.Value(selectedIndex)).current;

    useEffect(() => {
      Animated.timing(animated, {
        toValue: selectedIndex,
        duration: ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }, [selectedIndex, animated]);

    const translateX = animated.interpolate({
      inputRange: [0, 1],
      outputRange: [0, dimensions.halfWidth],
    });

    const commit = (nextValue: string) => {
      if (disabled) return;
      const fn = setValue as any;
      if (typeof fn === "function") {
        if (name && fn.length >= 2) {
          fn(name, nextValue);
        } else {
          fn(nextValue);
        }
      }
      onChange?.(nextValue);
    };

    return (
      <View
        accessibilityRole="tablist"
        style={[
          styles.base,
          {
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: dimensions.borderRadius,
          },
          style,
        ]}
      >
        <View
          style={[
            styles.track,
            {
              backgroundColor: INACTIVE_BG,
              borderRadius: dimensions.borderRadius,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.labeledPill,
            {
              width: dimensions.halfWidth,
              height: dimensions.height,
              borderRadius: dimensions.borderRadius,
              transform: [{ translateX }],
            },
          ]}
        />

        <View style={styles.labeledRow}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedIndex === 0, disabled }}
            onPress={() => commit(labels[0])}
            disabled={disabled}
            style={styles.labeledCell}
          >
            <Typography
              type="bodyMedium"
              weight="regular"
              style={
                StyleSheet.flatten([
                  styles.labeledText,
                  selectedIndex === 0
                    ? styles.labeledTextActive
                    : styles.labeledTextInactive,
                ]) as TextStyle
              }
              numberOfLines={1}
            >
              {labels[0]}
            </Typography>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedIndex === 1, disabled }}
            onPress={() => commit(labels[1])}
            disabled={disabled}
            style={styles.labeledCell}
          >
            <Typography
              type="bodyMedium"
              weight="regular"
              style={
                StyleSheet.flatten([
                  styles.labeledText,
                  selectedIndex === 1
                    ? styles.labeledTextActive
                    : styles.labeledTextInactive,
                ]) as TextStyle
              }
              numberOfLines={1}
            >
              {labels[1]}
            </Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  // Default boolean switch variant
  const {
    disabled = false,
    name,
    value,
    setValue,
    onChange,
    style,
    size,
  } = props as CommonProps & SwitchProps;

  const dimensions = useMemo(() => {
    const width = size?.width ?? 56;
    const height = size?.height ?? 32;
    const padding = 2;
    const knobDiameter = height - padding * 2;
    const travelDistance = width - knobDiameter - padding * 2;
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
      useNativeDriver: false,
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
  labeledPill: {
    position: "absolute",
    left: 0,
    backgroundColor: ACTIVE_BG,
  },
  labeledRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labeledCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  labeledText: {
    color: textColors.white,
    fontFamily: SF_PRO_FONTS.Regular,
  },
  labeledTextActive: {
    fontWeight: "800",
    fontSize: 12,
  },
  labeledTextInactive: {
    fontWeight: "400",
    fontSize: 12,
  },
});

export default Toggle;
