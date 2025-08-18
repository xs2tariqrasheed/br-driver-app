import { Image, type ImageProps } from "expo-image";
import React from "react";
import { StyleSheet, type ImageStyle, type StyleProp } from "react-native";

export type LogoSize = "Large" | "Medium" | "Small";

export interface LogoProps extends Omit<ImageProps, "source" | "style"> {
  /** "Large" | "Medium" | "Small". Default: "Large" */
  size?: LogoSize;
  /** Optional style overrides for the image */
  style?: StyleProp<ImageStyle>;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  Large: { width: 64, height: 64 },
  Medium: { width: 34, height: 34 },
  Small: { width: 24, height: 24 },
};

const Logo: React.FC<LogoProps> = ({ size = "Large", style, ...rest }) => {
  const dimensions = SIZE_MAP[size] ?? SIZE_MAP.Large;

  return (
    <Image
      accessibilityRole="image"
      source={require("@/assets/images/logo.png")}
      style={[styles.base, dimensions, style]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    resizeMode: "contain",
  },
});

export default Logo;
