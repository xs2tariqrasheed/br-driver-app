/**
 * @fileoverview RideOfferItemFooter Component - Displays ride offer footer information
 *
 * This component renders:
 * - Ride time with ride-time-icon.png
 * - Ride distance with ride-distance-icon.png
 * - Total price with typography "body/black-medium"
 * - Driver earning in brackets with typography "SF PRO/regular/14"
 * - Custom button component with block half
 */

import { textColors } from "@/constants/colors";
import { OFFER_TYPES, type OfferType } from "@/constants/global";
import { Image } from "expo-image";
import { StyleSheet, View, ViewStyle } from "react-native";
import Button from "../Button";
import Typography from "../Typography";

export interface RideOfferItemFooterProps {
  /** Ride time in minutes */
  rideTime: number;
  /** Ride distance in miles */
  rideDistance: number;
  /** Total price for the ride */
  totalPrice: number;
  /** Driver earning amount */
  driverEarn: number;
  /** Button title text */
  buttonTitle: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback function for button click */
  onButtonClick: () => void;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Whether the bid button should be hidden */
  hideActionButton?: boolean;
  /** Type of the offer */
  type?: OfferType;
  /** Callback function for reject button click */
  onRejectButtonClick?: () => void;
  /** Whether the reject button is loading */
  isRejecting?: boolean;
  /** Whether the reject button should be hidden */
  hideRejectButton?: boolean;
}

/**
 * RideOfferItemFooter component that displays ride offer footer information
 *
 * @example
 * ```tsx
 * <RideOfferItemFooter
 *   rideTime={49}
 *   rideDistance={23.4}
 *   totalPrice={55}
 *   driverEarn={46}
 *   buttonTitle="Bid"
 *   onButtonClick={() => console.log('Bid pressed')}
 * />
 * ```
 */
export default function RideOfferItemFooter({
  rideTime,
  rideDistance,
  totalPrice,
  driverEarn,
  buttonTitle,
  disabled = false,
  onButtonClick,
  style,
  hideActionButton = false,
  type = OFFER_TYPES.LIVE,
  onRejectButtonClick,
  isRejecting = false,
  hideRejectButton = false,
}: RideOfferItemFooterProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Left side with ride information */}
      <View style={styles.leftSection}>
        {/* Ride time with icon */}
        <View style={styles.iconTextContainer}>
          <Image
            source={require("@/assets/images/ride-time-icon.png")}
            style={styles.icon}
            contentFit="contain"
          />
          <Typography type="bodyMedium" weight="medium" style={styles.infoText}>
            {rideTime} Mins
          </Typography>
        </View>

        {/* Ride distance with icon */}
        <View style={styles.iconTextContainer}>
          <Image
            source={require("@/assets/images/ride-distance-icon.png")}
            style={styles.icon}
            contentFit="contain"
          />
          <Typography type="bodyMedium" weight="medium" style={styles.infoText}>
            {rideDistance}m
          </Typography>
        </View>

        {/* Pricing information */}
        {(type === OFFER_TYPES.LIVE || hideRejectButton) && (
          <View style={styles.pricingContainer}>
            <Typography
              type="bodyMedium"
              weight="black"
              style={styles.totalPrice}
            >
              ${totalPrice}
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.driverEarning}
            >
              (${driverEarn})
            </Typography>
          </View>
        )}

        {type === OFFER_TYPES.HIRED && !hideRejectButton && (
          <Button
            style={styles.rejectButton}
            block={false}
            variant="danger"
            rounded="half"
            disabled={disabled || isRejecting}
            loading={isRejecting}
            onPress={onRejectButtonClick}
          >
            Reject
          </Button>
        )}
        {/* Bid button */}
        {hideActionButton ? null : (
          <Button
            style={[styles.button]}
            block={false}
            variant="primary"
            rounded="half"
            disabled={disabled}
            onPress={onButtonClick}
          >
            {buttonTitle}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  iconTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  icon: {
    width: 20,
    height: 20,
  },
  infoText: {
    color: textColors.black,
  },
  pricingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalPrice: {
    color: textColors.black,
  },
  driverEarning: {
    color: textColors.black,
    fontSize: 14,
    fontWeight: "400",
  },
  button: {
    height: 32,
    minWidth: 80, // Ensure minimum width for usability
  },
  rejectButton: {
    height: 32,
    minWidth: 80, // Ensure minimum width for usability
    backgroundColor: textColors.red500,
    color: textColors.white,
  },
});
