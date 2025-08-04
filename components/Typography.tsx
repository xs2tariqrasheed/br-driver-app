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
 */
import {
  FALLBACK_FONT_SIZE,
  FONT_SIZES,
  FONT_WEIGHTS,
  SYSTEM_FONT,
  THEME_COLOR_KEY,
  TYPOGRAPHY_SIZES,
  TYPOGRAPHY_TYPES,
  TYPOGRAPHY_WEIGHTS,
} from "@/constants/Typography";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { Text, TextProps, TextStyle } from "react-native";

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
  darkColor?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  type,
  size,
  weight,
  children,
  style,
  lightColor,
  darkColor,
  ...props
}) => {
  // Fallback logic for missing sizes in a type
  const fontSize = FONT_SIZES[type]?.[size] ?? FALLBACK_FONT_SIZE;
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    THEME_COLOR_KEY
  );
  return (
    <Text
      style={[
        { color },
        {
          fontFamily: SYSTEM_FONT,
          fontWeight: FONT_WEIGHTS[weight],
          fontSize,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
