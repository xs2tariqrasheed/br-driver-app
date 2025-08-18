import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import React, { useEffect } from "react";
import { DimensionValue, StyleSheet, View } from "react-native";
import { getPasswordStrength, PasswordStrengths } from "./utils";

export interface PasswordStrengthProps {
  password?: string | null;
  width?: DimensionValue; // default 100%
  onChange?: (isStrong: boolean) => void;
}

const STRENGTH_TO_COPY: Record<PasswordStrengths, string> = {
  weak: "Weak",
  moderate: "Moderate",
  strong: "Strong",
};

const STRENGTH_TO_COLOR: Record<PasswordStrengths, string> = {
  weak: textColors.red500, // red-500
  moderate: textColors.yellowGoogle, // specific yellow from palette
  strong: textColors.teal900, // 00877C
};

/**
 * A responsive password strength indicator with 3 horizontal bars and label.
 * - Width defaults to 100%
 * - Bar height is fixed at 2px
 * - Typography: SF PRO / Medium / 14 via Typography component
 */
const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  width = "100%",
  onChange,
}) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const activeColor = STRENGTH_TO_COLOR[strength];
  const barsActive = strength === "weak" ? 1 : strength === "moderate" ? 2 : 3;

  useEffect(() => {
    onChange?.(strength === "strong");
  }, [strength, onChange]);

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.inlineRow}>
        <View style={styles.barsRow}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  backgroundColor:
                    index < barsActive ? activeColor : textColors.grey200,
                },
                index !== 2 ? { marginRight: 16 } : { marginRight: 0 },
              ]}
            />
          ))}
        </View>
        <Typography
          type="bodyMedium"
          weight="medium"
          style={{ color: activeColor, marginLeft: 12 }}
        >
          {STRENGTH_TO_COPY[strength]}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  bar: {
    flex: 1,
    height: 2, // 2px
    backgroundColor: textColors.grey200, // default Grey-200
  },
  label: {},
});

export default PasswordStrength;
