/**
 * @fileoverview LiveRideOfferItem Component - Complete ride offer item with header, address, and footer
 *
 * This component combines:
 * - RideOfferItemHeader (passenger count, rating, special requirements, package, car type)
 * - RideAddress (pickup and dropoff locations with ride type icons)
 * - RideOfferItemFooter (ride time, distance, pricing, and action button)
 *
 * Features:
 * - Horizontal left swipe to skip offers (vertical scrolling disabled)
 * - Longpress to hide offers
 * - Smart gesture handling (disabled during parent scrolling)
 * - Gesture conflict resolution (scrolling vs swiping)
 * - Swipe gestures disabled when viewing hidden jobs (showHiddenJobs mode)
 *
 * Background colors vary based on ride type:
 * - One-way: #6278F2 with 4% opacity
 * - Round-trip: #09B8A9 with 4% opacity
 * - Hourly: #98002E with 4% opacity
 */

import { textColors, tripTypeColors } from "@/constants/colors";
import { useDriver } from "@/context/DriverContext";
import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  LongPressGestureHandler,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import Button from "../Button";
import RideAddress from "../RideAddress";
import RideOfferItemFooter from "../RideOfferItemFooter";
import RideOfferItemHeader from "../RideOfferItemHeader";

import { type LocalJobStatus, type RideType } from "@/constants/global";

export type ItemStatus = LocalJobStatus;

export interface LiveRideOfferItemProps {
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
  /** Button title text */
  buttonTitle: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback function for button click */
  onButtonClick: () => void;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Status of the item (visible by default) */
  itemStatus?: ItemStatus;
  /** Whether the parent list is currently scrolling (disables swipe gestures) */
  isScrolling?: boolean;
  /** Whether hidden jobs are currently being shown (disables swipe gestures) */
  showHiddenJobs?: boolean;
  /** Whether the bid button should be hidden */
  hideBidButton?: boolean;
  /** Whether to remove the flex from the container */
  removeFlex?: boolean;
}

/**
 * LiveRideOfferItem component that displays complete ride offer information
 *
 * @example
 * ```tsx
 * <LiveRideOfferItem
 *   id="ride-123"
 *   rideType="one-way"
 *   peopleCount={2}
 *   rating={4.5}
 *   hasSpecialRequirements={true}
 *   onPressSpecialRequirements={() => console.log('Special requirements')}
 *   hasPackage={true}
 *   onPressPackage={() => console.log('Package pressed')}
 *   pickupTime={13}
 *   pickupDistance={3.4}
 *   pickupAddress="Pascal Ave N & N Terrace AR. Roseville\n69 Main Street"
 *   dropoffTime={24}
 *   dropoffDistance={3.4}
 *   dropoffAddress="3272 Gale Ave Long Island City NY 11101"
 *   rideTime={49}
 *   rideDistance={23.4}
 *   totalPrice={55}
 *   driverEarn={46}
 *   buttonTitle="Bid"
 *   onButtonClick={() => console.log('Bid pressed')}
 * />
 * ```
 */
export default function LiveRideOfferItem({
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
  buttonTitle,
  disabled = false,
  onButtonClick,
  style,
  itemStatus = "visible",
  isScrolling = false,
  showHiddenJobs = false,
  hideBidButton = false,
  removeFlex = false,
}: LiveRideOfferItemProps) {
  const { skipLiveOffer, hideLiveOffer } = useDriver();
  const translateX = new Animated.Value(0);
  const screenWidth = Dimensions.get("window").width;
  const [showHideButton, setShowHideButton] = React.useState(false);

  // Log showHiddenJobs state changes for debugging
  React.useEffect(() => {
    console.log(
      `[LiveRideOfferItem] Job ${id} - showHiddenJobs: ${showHiddenJobs}`
    );
  }, [showHiddenJobs, id]);

  // Animated value for skip background opacity
  const skipOpacity = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Get background color based on ride type
  const getBackgroundColor = (type: RideType) => {
    switch (type) {
      case "one-way":
        return tripTypeColors.oneWay;
      case "round-trip":
        return tripTypeColors.roundTrip;
      case "hourly":
        return tripTypeColors.hourly;
      default:
        return tripTypeColors.oneWay; // Default to one-way
    }
  };

  // Handle swipe gesture
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX, velocityX, velocityY } = event.nativeEvent;

    if (state === State.END) {
      // Determine if this was primarily a horizontal left swipe gesture
      // Requirements for valid left swipe:
      // 1. Horizontal velocity > vertical velocity (primarily horizontal)
      // 2. Horizontal distance > vertical distance (straight swipe)
      // 3. Minimum 50px horizontal movement
      // 4. Moved left by at least 100px
      // 5. Horizontal velocity > 300px/s (intentional swipe)
      const translationY = event.nativeEvent.translationY || 0;
      const isHorizontalGesture =
        Math.abs(velocityX) > Math.abs(velocityY) &&
        Math.abs(translationX) > Math.abs(translationY) &&
        Math.abs(translationX) > 50; // Minimum horizontal distance

      if (
        isHorizontalGesture &&
        translationX < -100 &&
        Math.abs(velocityX) > 300
      ) {
        // Check if swipe is disabled due to showHiddenJobs mode
        if (showHiddenJobs) {
          console.log(
            `[LiveRideOfferItem] Left swipe blocked for job ${id} - viewing hidden jobs mode`
          );
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
          return;
        }

        // Valid left swipe - skip the offer
        console.log(
          `[LiveRideOfferItem] Left swipe detected for job ${id}, velocity: ${velocityX}`
        );
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: false,
        }).start(async () => {
          try {
            await skipLiveOffer(id);
          } catch (error) {
            console.error("Failed to skip offer:", error);
            // Reset position if skip fails
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        });
      } else {
        // Reset position - either not enough swipe distance or vertical gesture
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    } else if (state === State.FAILED) {
      // Gesture failed (likely due to vertical movement)
      console.log(
        `[LiveRideOfferItem] Swipe gesture failed for job ${id} - likely vertical movement`
      );
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };

  // Handle long press to show hide button
  const onLongPressStateChange = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setShowHideButton(true);
    }
  };

  // Handle hide action
  const handleHideOffer = async () => {
    try {
      await hideLiveOffer(id);
      setShowHideButton(false);
    } catch (error) {
      console.error("Failed to hide offer:", error);
    }
  };

  // Handle dismiss overlay
  const handleDismissOverlay = () => {
    setShowHideButton(false);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Skip indicator background */}
      <Animated.View style={[styles.skipBackground, { opacity: skipOpacity }]}>
        <View style={styles.skipContent}>
          <Text style={styles.skipText}>Skip</Text>
        </View>
      </Animated.View>

      {/* Hide button overlay */}
      {showHideButton && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            onPress={handleDismissOverlay}
            activeOpacity={1}
          >
            <View style={styles.hideButtonContainer}>
              <Button
                variant="primary"
                block="half"
                rounded="half"
                onPress={handleHideOffer}
              >
                Hide
              </Button>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Main card with gesture handlers */}
      <LongPressGestureHandler
        onHandlerStateChange={onLongPressStateChange}
        minDurationMs={500}
        enabled={!isScrolling && !showHiddenJobs && !disabled}
      >
        <View>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            enabled={!isScrolling && !showHiddenJobs && !disabled}
            // Gesture configuration for horizontal-only left swipes
            // activeOffsetX: Only activate if moved 10px horizontally (left/right)
            // failOffsetY: Fail gesture if moved 15px vertically (allows scrolling)
            // minVelocityX: Require 500px/s horizontal velocity for swipe activation
            // Note: Disabled when showHiddenJobs=true to prevent re-skipping viewed jobs
            activeOffsetX={[-10, 10]}
            failOffsetY={[-15, 15]}
            minVelocityX={500}
          >
            <Animated.View
              style={[
                styles.wrapper,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <View
                style={[
                  styles.container,
                  {
                    flex: removeFlex ? undefined : 1,
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
                />

                {/* Footer Section */}
                <RideOfferItemFooter
                  rideTime={rideTime}
                  rideDistance={rideDistance}
                  totalPrice={totalPrice}
                  driverEarn={driverEarn}
                  buttonTitle={buttonTitle}
                  disabled={disabled}
                  onButtonClick={onButtonClick}
                  hideBidButton={hideBidButton}
                />
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </LongPressGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    width: "100%",
  },
  skipBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FF6B6B", // Red background for skip action
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 20,
  },
  skipContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  skipText: {
    color: textColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  wrapper: {
    backgroundColor: textColors.white,
    borderRadius: 12,
    width: "100%",
    elevation: 4,
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  hideButtonContainer: {
    width: "90%",
    height: "90%",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  hideButtonText: {
    color: textColors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
