/**
 * @fileoverview RideTypeIcons Component - Displays different ride type icons
 *
 * This component renders three different ride type icons:
 * - One Way: Location icons at top and bottom with down arrow in middle
 * - Round Trip: Location icons at top and bottom with round trip arrow in middle
 * - Hourly: Location icon at top, hourly arrow in middle, clock icon at bottom
 *
 * All icons support dynamic height based on parent container height.
 */

import { RideType } from "@/constants/global";
import { Image, StyleSheet, View, ViewStyle } from "react-native";

export interface RideTypeIconsProps {
  /** The type of ride to display */
  type: RideType;
  /** Custom height for the component (optional - will be dynamic if not provided) */
  height?: number;
  /** Custom width for the component (defaults to 28) */
  width?: number;
  /** Custom style for the container */
  style?: ViewStyle;
}

/**
 * RideTypeIcons component that displays different ride type visualizations
 *
 * @example
 * ```tsx
 * // One way ride
 * <RideTypeIcons type="one-way" />
 *
 * // Round trip with custom height
 * <RideTypeIcons type="round-trip" height={120} />
 *
 * // Hourly ride with custom dimensions
 * <RideTypeIcons type="hourly" height={100} width={32} />
 * ```
 */
export default function RideTypeIcons({
  type,
  height,
  width = 28,
  style,
}: RideTypeIconsProps) {
  const iconSize = width;

  const renderOneWay = () => (
    <View style={[styles.container, { width: iconSize }, style]}>
      <Image
        source={require("@/assets/images/ride-location-icon.png")}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/ride-arrow-down.png")}
        style={[styles.arrow, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/ride-location-icon.png")}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
    </View>
  );

  const renderRoundTrip = () => (
    <View style={[styles.container, { width: iconSize }, style]}>
      <Image
        source={require("@/assets/images/ride-location-icon.png")}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/round-trip-arrow-icon.png")}
        style={[styles.arrow, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/ride-location-icon.png")}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
    </View>
  );

  const renderHourly = () => (
    <View style={[styles.container, { width: iconSize }, style]}>
      <Image
        source={require("@/assets/images/ride-location-icon.png")}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/hourly-arrow-icon.png")}
        style={[styles.arrow, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/hourly-clock-icon.png")}
        style={[styles.icon, { width: iconSize, height: iconSize }]}
        resizeMode="contain"
      />
    </View>
  );

  const renderIcon = () => {
    switch (type) {
      case "one-way":
        return renderOneWay();
      case "round-trip":
        return renderRoundTrip();
      case "hourly":
        return renderHourly();
      default:
        return renderOneWay();
    }
  };

  return (
    <View
      style={[styles.wrapper, height && height > 0 ? { height } : undefined]}
    >
      {renderIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  icon: {
    flexShrink: 0,
  },
  arrow: {
    flexShrink: 0,
    flex: 1,
    marginVertical: 4,
  },
});
