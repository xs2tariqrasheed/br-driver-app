/**
 * @fileoverview RideAddress Component - Displays ride information with icons and addresses
 *
 * This component renders:
 * - RideTypeIcons on the left side
 * - Right arrow at the top of the icon
 * - Pickup and dropoff information with time, distance, and addresses
 * - Proper typography for time/distance (SF Pro Semibold 12) and addresses (SF Pro Semibold 14)
 */

import { RideType } from "@/constants/global";
import { Image } from "expo-image";
import { StyleSheet, View, ViewStyle } from "react-native";
import RideTypeIcons from "../RideTypeIcons";
import Typography from "../Typography";

export interface RideAddressProps {
  /** The type of ride to display */
  rideType: RideType;
  /** Pickup time in minutes */
  pickupTime: number;
  /** Pickup distance in miles */
  pickupDistance: number;
  /** Pickup address (will wrap if long) */
  pickupAddress: string;
  /** Dropoff time in minutes */
  dropoffTime: number;
  /** Dropoff distance in miles */
  dropoffDistance: number;
  /** Dropoff address (will wrap if long) */
  dropoffAddress: string;
  /** Type of the ride address */
  type: "live" | "future";
  /** Pickup date */
  pickupDate?: string;
  /** Scheduled pickup time */
  scheduledPickupTime?: string;
  /** Ride time in minutes */
  rideTime?: number;
  /** Ride distance in miles */
  rideDistance?: number;
  /** Total price for the ride */
  totalPrice?: number;
  /** Driver earning amount */
  driverEarn?: number;
  /** Custom style for the container */
  style?: ViewStyle;
}

/**
 * RideAddress component that displays ride information with icons and addresses
 *
 * @example
 * ```tsx
 * <RideAddress
 *   rideType="one-way"
 *   pickupTime={13}
 *   pickupDistance={3.4}
 *   pickupAddress="Pascal Ave N & N Terrace AR. Roseville\n69 Main Street"
 *   dropoffTime={24}
 *   dropoffDistance={3.4}
 *   dropoffAddress="36-01 37th St, Long Island City, NY 11101, USA"
 * />
 * ```
 */
export default function RideAddress({
  rideType,
  pickupTime,
  scheduledPickupTime,
  pickupDistance,
  pickupAddress,
  dropoffTime,
  dropoffDistance,
  dropoffAddress,
  type = "live",
  pickupDate,
  rideTime,
  rideDistance,
  totalPrice,
  driverEarn,
  style,
}: RideAddressProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Left side with RideTypeIcons and right arrow */}
      <View style={styles.leftSection}>
        <RideTypeIcons type={rideType} height={60} width={28} />
        <Image
          source={require("@/assets/images/arrow-right.png")}
          style={styles.rightArrow}
          contentFit="contain"
        />
      </View>

      {/* Right side with pickup and dropoff information */}
      <View style={styles.rightSection}>
        {/* Pickup information */}
        <View>
          {type === "future" ? (
            <Typography
              type="bodySmall"
              weight="semibold"
              style={styles.timeDistanceText}
            >
              {`Date: ${pickupDate}`}
              {"  "}
              {"  "}
              {"  "}
              {`Time: ${scheduledPickupTime} `}
            </Typography>
          ) : (
            <Typography
              type="bodySmall"
              weight="semibold"
              style={styles.timeDistanceText}
            >
              {pickupTime} Mins ({pickupDistance}m) Away
            </Typography>
          )}
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.addressText}
            numberOfLines={0}
          >
            {pickupAddress}
          </Typography>
        </View>

        {/* Dropoff information */}
        <View>
          {type === "live" ? (
            <Typography
              type="bodySmall"
              weight="semibold"
              style={styles.timeDistanceText}
            >
              {dropoffTime} Mins ({dropoffDistance}m)
            </Typography>
          ) : (
            <View style={styles.rideInfoContainer}>
              {/* Ride time with icon */}
              <View style={styles.iconTextContainer}>
                <Typography
                  type="bodyMedium"
                  weight="medium"
                  style={styles.infoText}
                >
                  {rideTime} Mins
                </Typography>
              </View>

              {/* Ride distance with icon */}
              <View style={styles.iconTextContainer}>
                <Typography
                  type="bodyMedium"
                  weight="medium"
                  style={styles.infoText}
                >
                  {rideDistance}m
                </Typography>
              </View>

              {/* Pricing information */}
              <View style={styles.pricingContainer}>
                <Typography
                  type="bodyMedium"
                  weight="black"
                  style={styles.totalPrice}
                >
                  ${Math.round(totalPrice || 0)}
                </Typography>
                <Typography
                  type="bodyMedium"
                  weight="regular"
                  style={styles.driverEarning}
                >
                  (${Math.round(driverEarn || 0)})
                </Typography>
              </View>
            </View>
          )}
          <Typography
            type="bodyMedium"
            weight="semibold"
            style={styles.addressText}
            numberOfLines={0}
          >
            {dropoffAddress}
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "transparent",
    alignItems: "flex-start",
  },
  leftSection: {
    position: "relative",
    marginRight: 16,
  },
  rightArrow: {
    position: "absolute",
    top: 0,
    left: 24,
    width: 20,
    height: 20,
  },
  rightSection: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 60, // Reduced from 80 to 60
    gap: 12, // Reduced from 24 to 12
    marginLeft: 6,
  },
  timeDistanceText: {
    color: "#2A2A2A",
    marginBottom: 2, // Reduced from 4 to 2
  },
  addressText: {
    color: "#2A2A2A",
    lineHeight: 18, // Reduced from 20 to 18
  },
  rideInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    marginBottom: 2, // Reduced from 4 to 2
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    color: "#2A2A2A",
  },
  pricingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalPrice: {
    color: "#2A2A2A",
  },
  driverEarning: {
    color: "#2A2A2A",
    fontSize: 14,
    fontWeight: "400",
  },
});
