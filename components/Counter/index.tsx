import { IconButton } from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Image, StyleSheet, TextStyle, View, ViewStyle } from "react-native";

export type CounterProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatLabel?: (value: number) => string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  valueContainerStyle?: ViewStyle;
  valueTextStyle?: TextStyle;
  decrementButtonStyle?: ViewStyle;
  incrementButtonStyle?: ViewStyle;
};

export default function Counter({
  value,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  formatLabel,
  disabled = false,
  containerStyle,
  valueContainerStyle,
  valueTextStyle,
  decrementButtonStyle,
  incrementButtonStyle,
}: CounterProps) {
  // Keep latest value in a ref so button handlers can stay stable
  // (avoids iOS "blink" caused by re-rendering Pressable buttons on every tap).
  const valueRef = useRef<number>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const canDecrement = !disabled && value - step >= min;
  const canIncrement = !disabled && value + step <= max;

  const handleDec = useCallback(() => {
    // Re-check against latest value
    const current = valueRef.current;
    if (disabled) return;
    if (current - step < min) return;
    const next = Math.max(min, current - step);
    onChange(next);
  }, [disabled, min, onChange, step]);

  const handleInc = useCallback(() => {
    const current = valueRef.current;
    if (disabled) return;
    if (current + step > max) return;
    const next = Math.min(max, current + step);
    onChange(next);
  }, [disabled, max, onChange, step]);

  const label = formatLabel ? formatLabel(value) : String(value);

  const minusIcon = useMemo(
    () => (
      <Image source={require("@/assets/images/minus.png")} style={styles.icon20} />
    ),
    []
  );
  const plusIcon = useMemo(
    () => (
      <Image source={require("@/assets/images/plus.png")} style={styles.icon20} />
    ),
    []
  );

  const DecrementButton = useMemo(
    () =>
      memo(function DecrementButton({
        isDisabled,
      }: {
        isDisabled: boolean;
      }) {
        return (
          <IconButton
            size={1}
            rounded
            icon={minusIcon}
            accessibilityRole="button"
            onPress={handleDec}
            disabled={isDisabled}
            style={[
              styles.iconButton24,
              isDisabled && styles.disabledBtn,
              decrementButtonStyle,
            ]}
          />
        );
      }),
    [decrementButtonStyle, handleDec, minusIcon]
  );

  const IncrementButton = useMemo(
    () =>
      memo(function IncrementButton({
        isDisabled,
      }: {
        isDisabled: boolean;
      }) {
        return (
          <IconButton
            size={1}
            rounded
            icon={plusIcon}
            accessibilityRole="button"
            onPress={handleInc}
            disabled={isDisabled}
            style={[
              styles.iconButton24,
              isDisabled && styles.disabledBtn,
              incrementButtonStyle,
            ]}
          />
        );
      }),
    [handleInc, incrementButtonStyle, plusIcon]
  );

  return (
    <View style={[styles.counterRow, containerStyle]}>
      <DecrementButton isDisabled={!canDecrement} />

      <View style={[styles.counterValueWrap, valueContainerStyle]}>
        <Typography
          type="bodyLarge"
          weight="medium"
          style={[styles.counterText, valueTextStyle]}
        >
          {label}
        </Typography>
      </View>

      <IncrementButton isDisabled={!canIncrement} />
    </View>
  );
}

const styles = StyleSheet.create({
  counterRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton24: {
    borderRadius: 12,
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  icon20: { width: 20, height: 20, resizeMode: "contain" },
  counterValueWrap: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: textColors.teal600,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: { color: textColors.black },
});
