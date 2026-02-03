/**
 * @fileoverview RideOfferItemHeader Component - Displays ride offer header information
 *
 * This component renders:
 * - User count with user icon
 * - Rating with rating icon
 * - Special requirements icon (fixed slot; hidden when none, space reserved)
 * - Package icon (fixed slot; hidden when none, space reserved)
 * - Car type with typography
 *
 * All icons are 20x20 and arranged horizontally with auto gap spacing.
 */

import { textColors } from "@/constants/colors";
import { CAR_TYPE, type CarType } from "@/constants/global";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import Typography from "../Typography";

export interface RideOfferItemHeaderProps {
  /** Number of people for the ride */
  peopleCount: number;
  /** Rating value */
  rating: number;
  /** Whether special requirements exist */
  hasSpecialRequirements: boolean;
  /** Callback function for special requirements press */
  onPressSpecialRequirements: () => void;
  /** Whether the ride has a package */
  hasPackage: boolean;
  /** Callback function for package icon press */
  onPressPackage: () => void;
  /** Car type for the ride */
  carType?: CarType | string;
  /** Custom style for the container */
  style?: ViewStyle;
}

/**
 * RideOfferItemHeader component that displays ride offer information
 *
 * @example
 * ```tsx
 * <RideOfferItemHeader
 *   peopleCount={2}
 *   rating={4.5}
 *   hasSpecialRequirements={true}
 *   onPressSpecialRequirements={() => console.log('Special requirements')}
 *   hasPackage={true}
 *   onPressPackage={() => console.log('Package pressed')}
 * />
 * ```
 */
export default function RideOfferItemHeader({
  peopleCount,
  rating,
  hasSpecialRequirements,
  onPressSpecialRequirements,
  hasPackage,
  onPressPackage,
  carType = CAR_TYPE.SUV,
  style,
}: RideOfferItemHeaderProps) {
  // Capitalize car type for display (e.g., "sedan" -> "SEDAN", "economy" -> "ECONOMY")
  const displayCarType = carType
    ? carType.toUpperCase()
    : "SUV";
  return (
    <View style={[styles.container, style]}>
      {/* User count with icon */}
      <View style={styles.iconTextContainer}>
        <Image
          source={require("@/assets/images/user-icon.png")}
          style={styles.icon}
          contentFit="contain"
        />
        <Typography type="bodySmall" weight="semibold" style={styles.iconText}>
          {peopleCount}
        </Typography>
      </View>

      {/* Rating with icon */}
      <View style={styles.iconTextContainer}>
        <Image
          source={require("@/assets/images/rating-icon.png")}
          style={styles.icon}
          contentFit="contain"
        />
        <Typography type="bodySmall" weight="semibold" style={styles.iconText}>
          {rating}
        </Typography>
      </View>

      {/* Special requirements icon - fixed slot so position is same for all car types */}
      <View style={styles.iconSlot}>
        {hasSpecialRequirements ? (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onPressSpecialRequirements}
            activeOpacity={0.7}
          >
            <Image
              source={require("@/assets/images/special-requirment.png")}
              style={styles.icon}
              contentFit="contain"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      {/* Package icon - fixed slot so position is same for all car types */}
      <View style={styles.iconSlot}>
        {hasPackage ? (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onPressPackage}
            activeOpacity={0.7}
          >
            <Image
              source={require("@/assets/images/package-icon.png")}
              style={styles.icon}
              contentFit="contain"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      {/* Car type */}
      <Typography type="bodyMedium" weight="black" style={styles.carTypeText}>
        {displayCarType}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40, // Fixed gap between icons
    backgroundColor: "transparent",
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  /** Fixed-size slot so special requirements and package icons stay at same position (Economy vs Luxury) */
  iconSlot: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Invisible placeholder to reserve space when icon is hidden */
  iconPlaceholder: {
    width: 20,
    height: 20,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 20,
    height: 20,
  },
  iconText: {
    color: "#2A2A2A",
  },
  carTypeText: {
    color: textColors.black,
    marginLeft: "auto", // Push car type to the right side
  },
});
