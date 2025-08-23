import React from "react";
import {
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { textColors } from "@/constants/colors";

export type DividerProps = {
  /** Height of the divider line. Defaults to 1. */
  height?: number;
  /** Width of the divider. Defaults to "100%". */
  width?: DimensionValue;
  /** Vertical margin around the divider. Defaults to 8. */
  marginVertical?: number;
  /** Line color. Defaults to textColors.grey100. */
  color?: string;
  /** Optional style override merged last. */
  style?: StyleProp<ViewStyle>;
};

const Divider: React.FC<DividerProps> = ({
  height = 1,
  width = "100%",
  marginVertical = 8,
  color = textColors.grey100,
  style,
}) => {
  const baseStyle: ViewStyle = {
    height,
    width,
    marginVertical,
    backgroundColor: color,
  };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[baseStyle, style]}
    />
  );
};

export default Divider;
