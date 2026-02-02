import { IconButton } from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export type CounterProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatLabel?: (value: number) => string;
  disabled?: boolean;
  /** When true, the value can be edited by tapping and typing (input-style). */
  editable?: boolean;
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
  editable = false,
  containerStyle,
  valueContainerStyle,
  valueTextStyle,
  decrementButtonStyle,
  incrementButtonStyle,
}: CounterProps) {
  // Keep latest value in a ref so button handlers can stay stable
  const valueRef = useRef<number>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // When editable: local string while user is typing; null when showing formatted value
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const isEditing = editingValue !== null;

  const canDecrement = !disabled && value - step >= min;
  const canIncrement = !disabled && value + step <= max;

  const handleDec = useCallback(() => {
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

  const commitEdit = useCallback(() => {
    if (!isEditing) return;
    const parsed = parseFloat(editingValue ?? "");
    const num = Number.isNaN(parsed) ? value : parsed;
    const clamped = Math.min(max, Math.max(min, num));
    const stepped = step === 1 ? Math.round(clamped) : Math.round(clamped / step) * step;
    const final = Math.min(max, Math.max(min, stepped));
    onChange(final);
    setEditingValue(null);
  }, [editingValue, isEditing, min, max, step, value, onChange]);

  const handleFocus = useCallback(() => {
    if (disabled || !editable) return;
    setEditingValue(String(value));
  }, [disabled, editable, value]);

  const handleBlur = useCallback(() => {
    commitEdit();
  }, [commitEdit]);

  const displayLabel = formatLabel ? formatLabel(value) : String(value);
  const inputValue = isEditing ? (editingValue ?? "") : displayLabel;

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
        {editable ? (
          <TextInput
            value={inputValue}
            onChangeText={(text) => setEditingValue(text)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            editable={!disabled}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={[styles.counterText, styles.input, valueTextStyle]}
            placeholder={displayLabel}
            placeholderTextColor={textColors.grey400}
          />
        ) : (
          <Typography
            type="bodyLarge"
            weight="medium"
            style={[styles.counterText, valueTextStyle]}
          >
            {displayLabel}
          </Typography>
        )}
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
  input: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 12,
    textAlign: "center",
    fontSize: 16,
  },
});
