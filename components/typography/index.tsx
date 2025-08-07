/**
 * Typography component for standardized text styles.
 *
 * Usage:
 * <Typography type="title" weight="Bold" variant="success">Title</Typography>
 * <Typography type="body" weight="Regular" variant="underline">Body</Typography>
 *
 * - Supports theme-aware color (light/dark) if you add such variants
 * - Default font family: San Francisco (system font, 'System')
 * - All TextProps and accessibility props are supported
 *
 * Required props: type, weight, variant (no default values; must be provided)
 *
 * Supported variants (see styles and constants/typography.ts):
 *   - success, danger, warning, disabled, secondary
 *   - underline, delete, strong, italic, mark
 *
 * Fallback: If a type/weight combination is missing, FALLBACK_FONT_SIZE from constants/typography.ts is used.
 */
import { textColors } from "@/constants/colors";
import * as changeCase from "change-case";
import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
import {
  DEFAULT_TYPOGRAPHY_TYPE,
  DEFAULT_TYPOGRAPHY_WEIGHT,
  TYPOGRAPHY_COLOR_VARIANT,
  TYPOGRAPHY_TYPE,
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_WEIGHT,
} from "./constants";

export interface TypographyProps extends TextProps {
  type: TYPOGRAPHY_TYPE;
  weight: TYPOGRAPHY_WEIGHT;
  variant: TYPOGRAPHY_COLOR_VARIANT;
  children: React.ReactNode;
  style?: TextStyle;
}

export const Typography: React.FC<TypographyProps> = ({
  type = DEFAULT_TYPOGRAPHY_TYPE,
  weight = DEFAULT_TYPOGRAPHY_WEIGHT,
  variant,
  children,
  style,
  ...props
}) => {
  weight = changeCase.pascalCase(weight);

  return (
    <Text
      style={[styles[`${type}${weight}`], styles[variant], style]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  ...TYPOGRAPHY_VARIANTS,
  success: { color: textColors.green900 },
  danger: { color: textColors.red900 },
  disabled: { color: textColors.grey700, opacity: 0.5 },
  warning: { color: textColors.yellow900 },
  secondary: { color: textColors.blue900 },
  underline: { textDecorationLine: "underline" },
  delete: { textDecorationLine: "line-through" },
  strong: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  mark: { backgroundColor: "yellow" },
});
