/**
 * @fileoverview FutureJobOfferItem Component - Future job offer item for hired drivers
 *
 * This component displays:
 * - RideOfferItemHeader (passenger count, rating, special requirements, package, car type)
 * - RideAddress (pickup and dropoff locations with ride type icons)
 * - Notes/Directions section (always visible, not collapsible)
 * - Availability buttons: "Not Available" and "Yes, I will be Available"
 * - When availability confirmed: "Availability Confirmed" badge with close icon
 *
 * Features:
 * - No swipe gestures (not swipeable)
 * - Always visible Notes/Directions section
 * - Availability confirmation modals
 * - Two-button footer layout for availability
 */

import { textColors, tripTypeColors } from "@/constants/colors";
import { RIDE_TYPES, type RideType } from "@/constants/global";
import { useFutureJobOffers } from "@/context/FutureJobOffersContext";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import AvailabilityConfirmedModal from "../AvailabilityConfirmedModal";
import Button from "../Button";
import ConfirmationModal from "../ConfirmationModal";
import RideAddress from "../RideAddress";
import RideOfferItemHeader from "../RideOfferItemHeader";
import Typography from "../Typography";

export interface FutureJobOfferItemProps {
  /** Unique identifier for the ride offer */
  id: string;
  /** The type of ride to display */
  rideType: RideType;
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
  /** Ride time in minutes */
  rideTime: number;
  /** Ride distance in miles */
  rideDistance: number;
  /** Total price for the ride */
  totalPrice: number;
  /** Driver earning amount */
  driverEarn: number;
  /** Whether availability is confirmed */
  availabilityConfirmed: boolean;
  /** Notes/directions for the job */
  notes?: string;
  /** Custom style for the container */
  /** Pickup date */
  pickupDate?: string;
  /** Scheduled pickup time */
  scheduledPickupTime?: string;
  style?: ViewStyle;
}

/**
 * FutureJobOfferItem component that displays future job offer information
 *
 * @example
 * ```tsx
 * <FutureJobOfferItem
 *   id="future-job-1"
 *   rideType="one-way"
 *   peopleCount={1}
 *   rating={5.0}
 *   hasSpecialRequirements={false}
 *   onPressSpecialRequirements={() => console.log('Special requirements')}
 *   hasPackage={false}
 *   onPressPackage={() => console.log('Package pressed')}
 *   pickupTime={180}
 *   pickupDistance={2.5}
 *   pickupAddress="Pascal Ave N & N Terrace AR. Roseville 69 Main Street"
 *   dropoffTime={240}
 *   dropoffDistance={15.2}
 *   dropoffAddress="3272 Gale Ave Long Island City NY 11101"
 *   rideTime={60}
 *   rideDistance={12.7}
 *   totalPrice={195}
 *   driverEarn={165}
 *   availabilityConfirmed={false}
 *   notes="Xmas party. 3 hours guaranteed @$65/hour..."
 * />
 * ```
 */
export default function FutureJobOfferItem({
  id,
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
  availabilityConfirmed,
  notes,
  style,
  pickupDate,
  scheduledPickupTime,
}: FutureJobOfferItemProps) {
  const { confirmAvailability, revokeAvailability } = useFutureJobOffers();
  const [showNotAvailableModal, setShowNotAvailableModal] = useState(false);
  const [showAvailabilityConfirmedModal, setShowAvailabilityConfirmedModal] =
    useState(false);
  const [showRevokeAvailabilityModal, setShowRevokeAvailabilityModal] =
    useState(false);

  // Get background color based on ride type
  const getBackgroundColor = (type: RideType) => {
    switch (type) {
      case RIDE_TYPES.ONE_WAY:
        return tripTypeColors.oneWay;
      case RIDE_TYPES.ROUND_TRIP:
        return tripTypeColors.roundTrip;
      case RIDE_TYPES.HOURLY:
        return tripTypeColors.hourly;
      default:
        return tripTypeColors.oneWay; // Default to one-way
    }
  };

  // Handle "Not Available" button press
  const handleNotAvailablePress = () => {
    setShowNotAvailableModal(true);
  };

  // Handle "Yes, I will be Available" button press
  const handleAvailablePress = () => {
    confirmAvailability(id);
    setShowAvailabilityConfirmedModal(true);
  };

  // Handle "Not Available" confirmation
  const handleNotAvailableConfirm = () => {
    // In a real implementation, this would call an API to mark as unavailable
    setShowNotAvailableModal(false);
  };

  // Handle "Availability Confirmed" close
  const handleAvailabilityConfirmedClose = () => {
    setShowAvailabilityConfirmedModal(false);
  };

  // Handle close icon press (revoke availability)
  const handleCloseIconPress = () => {
    setShowRevokeAvailabilityModal(true);
  };

  // Handle revoke availability confirmation
  const handleRevokeAvailabilityConfirm = () => {
    revokeAvailability(id);
    setShowRevokeAvailabilityModal(false);
  };

  return (
    <View style={styles.swipeContainer}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(rideType),
          },
          style,
        ]}
      >
        {/* Header Section */}
        <RideOfferItemHeader
          peopleCount={peopleCount}
          rating={rating}
          hasSpecialRequirements={hasSpecialRequirements}
          onPressSpecialRequirements={onPressSpecialRequirements}
          hasPackage={hasPackage}
          onPressPackage={onPressPackage}
        />

        {/* Address/Route Section */}
        <RideAddress
          rideType={rideType as any}
          pickupTime={pickupTime}
          pickupDistance={pickupDistance}
          pickupAddress={pickupAddress}
          dropoffTime={dropoffTime}
          dropoffDistance={dropoffDistance}
          dropoffAddress={dropoffAddress}
          pickupDate={pickupDate}
          scheduledPickupTime={scheduledPickupTime}
          rideTime={rideTime}
          rideDistance={rideDistance}
          totalPrice={totalPrice}
          driverEarn={driverEarn}
          type="future"
        />

        {/* Notes/Directions Section - Always Visible */}
        {notes && (
          <View style={styles.notesSection}>
            <Typography
              type="bodyLarge"
              weight="semibold"
              style={styles.notesTitle}
            >
              Notes / Directions:
            </Typography>
            <Typography
              type="bodyMedium"
              weight="regular"
              style={styles.notesText}
            >
              {notes}
            </Typography>
          </View>
        )}
        {/* Footer Section */}
        <View style={styles.footerSection}>
          {/* Right side with availability buttons */}
          <View style={styles.rightSection}>
            {availabilityConfirmed ? (
              // Availability Confirmed State
              <View style={styles.availabilityConfirmedContainer}>
                <Button
                  style={styles.availabilityConfirmedButton}
                  block={false}
                  variant="outlined"
                  rounded="half"
                  onPress={handleCloseIconPress}
                >
                  Availability Confirmed
                </Button>
                <TouchableOpacity
                  style={styles.closeIcon}
                  onPress={handleCloseIconPress}
                  hitSlop={8}
                >
                  <Typography
                    type="bodyLarge"
                    weight="semibold"
                    style={styles.closeIconText}
                  >
                    ✕
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              // Availability Buttons State
              <View style={styles.availabilityButtonsContainer}>
                <Button
                  style={styles.notAvailableButton}
                  block="half"
                  variant="outlined"
                  rounded="half"
                  onPress={handleNotAvailablePress}
                >
                  Not Available
                </Button>
                <Button
                  style={styles.availableButton}
                  block="half"
                  variant="primary"
                  rounded="half"
                  onPress={handleAvailablePress}
                >
                  Yes, I will be Available
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Not Available Confirmation Modal */}
      <ConfirmationModal
        open={showNotAvailableModal}
        title="Not Available For this Ride?"
        description="Are you sure you want to mark yourself unavailable for this ride?"
        cancelButtonText="Go Back"
        confirmButtonText="Yes, Not Available"
        onCancel={() => setShowNotAvailableModal(false)}
        onConfirm={handleNotAvailableConfirm}
      />

      {/* Availability Confirmed Modal */}
      <AvailabilityConfirmedModal
        open={showAvailabilityConfirmedModal}
        onDone={handleAvailabilityConfirmedClose}
      />

      {/* Revoke Availability Confirmation Modal */}
      <ConfirmationModal
        open={showRevokeAvailabilityModal}
        title="Are You Sure You Won't Be Available?"
        description="Marking yourself unavailable means this job will be offered to another driver. Please confirm your decision."
        cancelButtonText="Go Back"
        confirmButtonText="Yes, Not Available"
        onCancel={() => setShowRevokeAvailabilityModal(false)}
        onConfirm={handleRevokeAvailabilityConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    width: "100%",
  },
  container: {
    backgroundColor: textColors.white,
    flexDirection: "column",
    gap: 12,
    borderWidth: 1,
    borderColor: textColors.grey300,
    borderRadius: 12,
    overflow: "hidden",
    padding: 8,
  },
  notesSection: {
    backgroundColor: "transparent",
    paddingVertical: 8,
  },
  notesTitle: {
    color: textColors.black,
    marginBottom: 4,
    fontSize: 20,
  },
  notesText: {
    color: textColors.black,
    lineHeight: 20,
  },
  footerSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  rightSection: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  availabilityButtonsContainer: {
    flexDirection: "row",
    gap: 20,
  },
  notAvailableButton: {
    height: 32,
    maxWidth: 150,
  },
  availableButton: {
    height: 32,
  },
  availabilityConfirmedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availabilityConfirmedButton: {
    height: 32,
    minWidth: 120,
  },
  closeIcon: {
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: textColors.red500,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -16,
    marginTop: -20,
  },
  closeIconText: {
    color: textColors.white,
    fontSize: 12,
  },
});
