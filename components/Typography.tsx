/**
 * Typography component for standardized text styles.
 *
 * Usage:
 * <Typography variant="titleXLargeBlack">Title</Typography>
 * <Typography variant="bodyMediumRegular" lightColor="#333">Body</Typography>
 *
 * - Supports theme-aware color (light/dark)
 * - Default font family: San Francisco (system font, 'System')
 * - All TextProps and accessibility props are supported
 */
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import { Text, TextProps, TextStyle } from "react-native";

export type TypographyVariant =
  | "titleXLargeBlack"
  | "titleXLargeBold"
  | "titleXLargeSemibold"
  | "titleXLargeMedium"
  | "titleXLargeRegular"
  | "titleLargeBlack"
  | "titleLargeBold"
  | "titleLargeSemibold"
  | "titleLargeMedium"
  | "titleLargeRegular"
  | "titleMediumBlack"
  | "titleMediumBold"
  | "titleMediumSemibold"
  | "titleMediumMedium"
  | "titleMediumRegular"
  | "headingLargeBlack"
  | "headingLargeBold"
  | "headingLargeSemibold"
  | "headingLargeMedium"
  | "headingLargeRegular"
  | "headingSmallBlack"
  | "headingSmallBold"
  | "headingSmallSemibold"
  | "headingSmallMedium"
  | "headingSmallRegular"
  | "subHeadingLargeBlack"
  | "subHeadingLargeBold"
  | "subHeadingLargeSemibold"
  | "subHeadingLargeMedium"
  | "subHeadingLargeRegular"
  | "bodyLargeBlack"
  | "bodyLargeBold"
  | "bodyLargeSemibold"
  | "bodyLargeMedium"
  | "bodyLargeRegular"
  | "bodyMediumBlack"
  | "bodyMediumBold"
  | "bodyMediumSemibold"
  | "bodyMediumMedium"
  | "bodyMediumRegular"
  | "bodySmallBlack"
  | "bodySmallBold"
  | "bodySmallSemibold"
  | "bodySmallMedium"
  | "bodySmallRegular"
  | "labelLargeBlack"
  | "labelLargeBold"
  | "labelLargeSemibold"
  | "labelLargeMedium"
  | "labelLargeRegular"
  | "labelMediumBlack"
  | "labelMediumBold"
  | "labelMediumSemibold"
  | "labelMediumMedium"
  | "labelMediumRegular"
  | "labelSmallBlack"
  | "labelSmallBold"
  | "labelSmallSemibold"
  | "labelSmallMedium"
  | "labelSmallRegular";

export interface TypographyProps extends TextProps {
  variant: TypographyVariant;
  children: React.ReactNode;
  style?: TextStyle;
  lightColor?: string;
  darkColor?: string;
}

const fontWeightMap = {
  Black: "900",
  Bold: "bold",
  Semibold: "600",
  Medium: "500",
  Regular: "400",
} as const;

const variantConfig = {
  titleXLarge: { fontSize: 40 },
  titleLarge: { fontSize: 32 },
  titleMedium: { fontSize: 28 },
  headingLarge: { fontSize: 24 },
  headingSmall: { fontSize: 20 },
  subHeadingLarge: { fontSize: 18 },
  bodyLarge: { fontSize: 17 },
  bodyMedium: { fontSize: 16 },
  bodySmall: { fontSize: 14 },
  labelLarge: { fontSize: 13 },
  labelMedium: { fontSize: 12 },
  labelSmall: { fontSize: 11 },
};

// Always use San Francisco system font
const systemFont = "System";

const variantStyles: Record<TypographyVariant, TextStyle> = {} as any;
for (const [group, { fontSize }] of Object.entries(variantConfig)) {
  for (const [weightName, fontWeight] of Object.entries(fontWeightMap)) {
    const key = `${group}${weightName}` as TypographyVariant;
    variantStyles[key] = {
      fontSize,
      fontWeight,
      fontFamily: systemFont,
    };
  }
}

export const Typography: React.FC<TypographyProps> = ({
  variant,
  children,
  style,
  lightColor,
  darkColor,
  ...props
}) => {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  return (
    <Text style={[{ color }, variantStyles[variant], style]} {...props}>
      {children}
    </Text>
  );
};
