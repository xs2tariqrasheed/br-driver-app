/**
 * @fileoverview JobDetails Component - Complete job details screen with ride information, instructions, and customer details
 *
 * This component displays:
 * - Action bar with various action buttons
 * - Date and time information
 * - Live ride offer item with hidden button
 * - Driver instructions section
 * - Fare details table
 * - Customer details table
 *
 * Features:
 * - Clean, modern UI with proper spacing
 * - Uses existing custom components (LiveRideOfferItem, InfoTable, Divider, Typography)
 * - Responsive layout with proper padding and gaps
 * - Action buttons with icons from assets/images/actions
 * - Dynamic sections based on data availability
 */

import { textColors } from "@/constants/colors";
import { ACTION_ICON_SOURCE_MAP, type RideType } from "@/constants/global";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Divider from "../Divider";
import InfoTable, { type InfoTableDataItem } from "../InfoTable";
import LiveRideOfferItem from "../LiveRideOfferItem";
import Typography from "../Typography";

export interface ActionButton {
  /** Icon filename from assets/images/actions */
  icon: string;
  /** Callback function when button is pressed */
  onPress?: () => void;
  /** Unique key for the button */
  key: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

export interface JobOffer {
  /** Unique identifier for the job */
  id: string;
  /** Date and time string to display */
  dateTime?: string;
  /** The type of ride */
  rideType?: RideType;
  /** Number of people for the ride */
  peopleCount?: number;
  /** Rating value */
  rating?: number;
  /** Whether special requirements exist */
  hasSpecialRequirements?: boolean;
  /** Callback function for special requirements press */
  onPressSpecialRequirements?: () => void;
  /** Whether the ride has a package */
  hasPackage?: boolean;
  /** Callback function for package icon press */
  onPressPackage?: () => void;
  /** Pickup time in minutes */
  pickupTime?: number;
  /** Pickup distance in miles */
  pickupDistance?: number;
  /** Pickup address */
  pickupAddress?: string;
  /** Dropoff time in minutes */
  dropoffTime?: number;
  /** Dropoff distance in miles */
  dropoffDistance?: number;
  /** Dropoff address */
  dropoffAddress?: string;
  /** Ride time in minutes */
  rideTime?: number;
  /** Ride distance in miles */
  rideDistance?: number;
  /** Total price for the ride */
  totalPrice?: number;
  /** Driver earning amount */
  driverEarn?: number;
  /** Button title text */
  buttonTitle?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback function for button click */
  onButtonClick?: () => void;
  /** Driver instructions text */
  driverInstructions?: string;
  /** Fare details data */
  fareDetails?: InfoTableDataItem[];
  /** Customer details data */
  customerDetails?: InfoTableDataItem[];
  /** Action buttons configuration */
  actionButtons?: ActionButton[];
  /** Whether to hide the action bar */
  showActionBar?: boolean;
  /** ISO string or Date object representing when the offer expires */
  expiredAt?: string | Date | null;
}

export interface JobDetailsProps {
  /** Job offer data object */
  jobOffer: JobOffer;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Whether to hide the action bar */
  showActionBar?: boolean;
}

/**
 * JobDetails component that displays complete job information
 *
 * @example
 * ```tsx
 * <JobDetails
 *   jobOffer={{
 *     id: "job-123",
 *     dateTime: "Tuesday, Dec 7th, 10:15 am",
 *     rideType: "one-way",
 *     peopleCount: 2,
 *     rating: 3.5,
 *     hasSpecialRequirements: true,
 *     onPressSpecialRequirements: () => console.log('Special requirements'),
 *     hasPackage: false,
 *     onPressPackage: () => console.log('Package pressed'),
 *     pickupTime: 13,
 *     pickupDistance: 3.4,
 *     pickupAddress: "Pascal Ave N & N Terrace AR. Roseville\n69 Main Street",
 *     dropoffTime: 24,
 *     dropoffDistance: 3.4,
 *     dropoffAddress: "3272 Gale Ave Long Island City NY 11101",
 *     rideTime: 49,
 *     rideDistance: 23.4,
 *     totalPrice: 55,
 *     driverEarn: 46,
 *     buttonTitle: "Accept",
 *     onButtonClick: () => console.log('Accept pressed'),
 *     driverInstructions: "Please wear the mask while driving and make sure to fasten the seat belt and keep the car clean and neat",
 *     fareDetails: [
 *       { label: "Ride Price", value: "$20.25" },
 *       { label: "Tolls (EZ Pass)", value: "$0.75" },
 *       { label: "Tips", value: "$2.00" },
 *       { label: "Discount", value: "$00.00" },
 *       { label: "Service Charges", value: "$4.00" },
 *       { label: "Fuel Surcharge", value: "$3.25" },
 *       { label: "NYC Congestion Surcharge", value: "$10.25" }
 *     ],
 *     customerDetails: [
 *       { label: "Name", value: "John Smith" },
 *       { label: "Required Car Type", value: "SUV" },
 *       { label: "Offer Price", value: "$55.50" },
 *       { label: "Account No.", value: "Wes123456789" },
 *       { label: "Profile No.", value: "123-12321-12" }
 *     ],
 *     actionButtons: [
 *       { icon: "accept.png", onPress: () => console.log('Accept'), key: "accept" },
 *       { icon: "reject.png", onPress: () => console.log('Reject'), key: "reject" },
 *       { icon: "hide.png", onPress: () => console.log('Hide'), key: "hide" }
 *     ]
 *   }}
 * />
 * ```
 */
export default function JobDetails({
  jobOffer,
  style,
  showActionBar,
}: JobDetailsProps) {
  const {
    id,
    dateTime,
    rideType,
    peopleCount,
    rating,
    hasSpecialRequirements,
    onPressSpecialRequirements,
    hasPackage,
    onPressPackage,
    pickupTime,
    pickupDistance,
    pickupAddress,
    dropoffTime,
    dropoffDistance,
    dropoffAddress,
    rideTime,
    rideDistance,
    totalPrice,
    driverEarn,
    buttonTitle,
    disabled = false,
    onButtonClick,
    driverInstructions,
    fareDetails,
    customerDetails,
    actionButtons = [],
    expiredAt,
  } = jobOffer;

  // Determine if action bar should be shown
  const shouldShowActionBar =
    typeof showActionBar === "boolean"
      ? showActionBar
      : (jobOffer as any).showActionBar ?? true;

  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    >
      {/* Action Bar - Only show if actionButtons are provided */}
      {actionButtons.length > 0 && shouldShowActionBar && (
        <ScrollView
          style={styles.actionBar}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionBarContent}
        >
          {actionButtons.map((button) => (
            <TouchableOpacity
              key={button.key}
              style={styles.actionButton}
              onPress={button.onPress}
              disabled={!button.onPress || button.disabled}
            >
              <View style={styles.actionButtonContainer}>
                <Image
                  source={
                    ACTION_ICON_SOURCE_MAP[button.icon] ||
                    ACTION_ICON_SOURCE_MAP["details.png"]
                  }
                  style={styles.actionIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Date and Time - Only show if dateTime is provided */}
      {dateTime && (
        <View style={styles.dateTimeContainer}>
          <Typography
            type="subHeadingLarge"
            weight="bold"
            style={styles.dateTime}
          >
            {dateTime}
          </Typography>
        </View>
      )}

      {/* Live Ride Item - Only show if we have the required ride data */}
      {rideType && peopleCount && rating !== undefined && (
        <>
          <LiveRideOfferItem
            id={id}
            rideType={rideType}
            peopleCount={peopleCount}
            rating={rating}
            hasSpecialRequirements={hasSpecialRequirements || false}
            onPressSpecialRequirements={
              onPressSpecialRequirements || (() => {})
            }
            hasPackage={hasPackage || false}
            onPressPackage={onPressPackage || (() => {})}
            bidable={false}
            pickupTime={pickupTime || 0}
            pickupDistance={pickupDistance || 0}
            pickupAddress={pickupAddress || ""}
            dropoffTime={dropoffTime || 0}
            dropoffDistance={dropoffDistance || 0}
            dropoffAddress={dropoffAddress || ""}
            rideTime={rideTime || 0}
            rideDistance={rideDistance || 0}
            totalPrice={totalPrice || 0}
            driverEarn={driverEarn || 0}
            disabled={disabled}
            onButtonClick={onButtonClick || (() => {})}
            hideActionButton={true}
            expiredAt={expiredAt}
          />

          {/* Divider after Live Ride Item */}
          <Divider height={1} color={textColors.grey200} marginVertical={20} />
        </>
      )}

      {/* Driver Instructions - Only show if driverInstructions is provided */}
      {driverInstructions && (
        <View style={styles.instructionsContainer}>
          <Typography
            type="titleLarge"
            weight="bold"
            style={styles.instructionsTitle}
          >
            Driver Instructions
          </Typography>
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.instructionsText}
          >
            {driverInstructions}
          </Typography>
        </View>
      )}
      {/* Divider after Driver Instructions */}
      <Divider height={1} color={textColors.grey200} marginVertical={10} />
      {/* Fare Details - Only show if fareDetails are provided */}
      {fareDetails && fareDetails.length > 0 && (
        <>
          <InfoTable title="Fare Detail" data={fareDetails} showFooter={true} />

          {/* Divider after Fare Details */}
          <Divider height={1} color={textColors.grey200} marginBottom={20} />
        </>
      )}

      {/* Customer Details - Only show if customerDetails are provided */}
      {customerDetails && customerDetails.length > 0 && (
        <InfoTable
          title="Customer Detail"
          data={customerDetails}
          showFooter={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
    padding: 10,
  },
  actionBar: {
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  actionBarContent: {
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginRight: 12,
  },
  actionButtonContainer: {
    width: 54,
    height: 42,
    backgroundColor: textColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: textColors.grey300,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: textColors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  dateTimeContainer: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dateTime: {
    color: textColors.black,
  },
  instructionsContainer: {
    marginBottom: 20,
  },
  instructionsTitle: {
    color: textColors.black,
    marginBottom: 12,
  },
  instructionsText: {
    color: textColors.black,
    lineHeight: 24,
  },
});
