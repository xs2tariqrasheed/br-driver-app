/**
 * Typography component for standardized text styles.
 *
 * Usage:
 * <Typography type="title" size="XLarge" weight="Bold">Title</Typography>
 * <Typography type="body" size="Medium" weight="Regular" lightColor="#333">Body</Typography>
 *
 * - Supports theme-aware color (light/dark)
 * - Default font family: San Francisco (system font, 'System')
 * - All TextProps and accessibility props are supported
 *
 * Required props: type, size, weight (no default values; must be provided)
 * Fallback: If a type/size combination is missing, FALLBACK_FONT_SIZE from constants/typography.ts is used.
 */
import {
  DEFAULT_TYPOGRAPHY_TYPE,
  DEFAULT_TYPOGRAPHY_WEIGHT,
  TYPOGRAPHY_VARIANTS,
  TYPOGRAPHY_TYPE,
  TYPOGRAPHY_WEIGHT,
} from "../constants/typography";
import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";

export interface TypographyProps extends TextProps {
  type: TYPOGRAPHY_TYPE;
  weight: TYPOGRAPHY_WEIGHT;
  children: React.ReactNode;
  style?: TextStyle;
}

export const Typography: React.FC<TypographyProps> = ({
  type = DEFAULT_TYPOGRAPHY_TYPE,
  weight = DEFAULT_TYPOGRAPHY_WEIGHT,
  children,
  style,
  ...props
}) => {
  return (
    <Text style={[styles.typography[`${type}${weight}`], style]} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  typography: TYPOGRAPHY_VARIANTS,
});
