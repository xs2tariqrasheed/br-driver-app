import { IconButton } from "@/components/Button";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React from "react";
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
  const canDecrement = !disabled && value - step >= min;
  const canIncrement = !disabled && value + step <= max;

  const handleDec = () => {
    if (!canDecrement) return;
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleInc = () => {
    if (!canIncrement) return;
    const next = Math.min(max, value + step);
    onChange(next);
  };

  const label = formatLabel ? formatLabel(value) : String(value);

  return (
    <View style={[styles.counterRow, containerStyle]}>
      <IconButton
        size={1}
        rounded
        icon={
          <Image
            source={require("@/assets/images/minus.png")}
            style={styles.icon20}
          />
        }
        accessibilityRole="button"
        onPress={handleDec}
        disabled={!canDecrement}
        style={[
          styles.iconButton24,
          !canDecrement && styles.disabledBtn,
          decrementButtonStyle,
        ]}
      />

      <View style={[styles.counterValueWrap, valueContainerStyle]}>
        <Typography
          type="bodyLarge"
          weight="medium"
          style={[styles.counterText, valueTextStyle]}
        >
          {label}
        </Typography>
      </View>

      <IconButton
        size={1}
        rounded
        icon={
          <Image
            source={require("@/assets/images/plus.png")}
            style={styles.icon20}
          />
        }
        accessibilityRole="button"
        onPress={handleInc}
        disabled={!canIncrement}
        style={[
          styles.iconButton24,
          !canIncrement && styles.disabledBtn,
          incrementButtonStyle,
        ]}
      />
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
