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
import { TEXT_COLOR_DEFAULT } from "@/constants/colors";
import {
  DEFAULT_TYPOGRAPHY_SIZE,
  DEFAULT_TYPOGRAPHY_TYPE,
  DEFAULT_TYPOGRAPHY_WEIGHT,
  FALLBACK_FONT_SIZE,
  FONT_SIZES,
  FONT_WEIGHTS,
  SYSTEM_FONT,
  TYPOGRAPHY_SIZES,
  TYPOGRAPHY_TYPES,
  TYPOGRAPHY_WEIGHTS,
} from "@/constants/typography";
import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";

export type TypographyType = (typeof TYPOGRAPHY_TYPES)[number];
export type TypographySize = (typeof TYPOGRAPHY_SIZES)[number];
export type TypographyWeight = (typeof TYPOGRAPHY_WEIGHTS)[number];

export interface TypographyProps extends TextProps {
  type: TypographyType;
  size: TypographySize;
  weight: TypographyWeight;
  children: React.ReactNode;
  style?: TextStyle;
  lightColor?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  type = DEFAULT_TYPOGRAPHY_TYPE,
  size = DEFAULT_TYPOGRAPHY_SIZE,
  weight = DEFAULT_TYPOGRAPHY_WEIGHT,
  children,
  style,
  ...props
}) => {
  // Fallback logic for missing sizes in a type
  const fontSize = FONT_SIZES[type]?.[size] ?? FALLBACK_FONT_SIZE;

  return (
    <Text
      style={[
        styles.baseText,
        { fontSize, fontWeight: FONT_WEIGHTS[weight] },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  baseText: {
    fontFamily: SYSTEM_FONT,
    color: TEXT_COLOR_DEFAULT,
  },
});
