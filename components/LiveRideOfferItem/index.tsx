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
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
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
import ProgressTimer from "../ProgressTimer";
import RideAddress from "../RideAddress";
import RideOfferItemFooter from "../RideOfferItemFooter";
import RideOfferItemHeader from "../RideOfferItemHeader";
import { showToast } from "../Toast";

import {
  DRIVER_TYPES,
  LIVE_JOB_STATUS,
  LOCAL_JOB_STATUS,
  OFFER_TYPES,
  RIDE_TYPES,
  type LocalJobStatus,
  type OfferType,
  type RideType,
} from "@/constants/global";
import { useModalManager } from "@/context/ModalManagerContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { calculateProgressTimerDuration } from "@/utils/helpers";

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
  /** Whether the offer is bidable */
  bidable: boolean;
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
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback function for button click */
  onButtonClick: () => void;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Status of the item (visible by default) */
  itemStatus?: ItemStatus | "expired" | "accepted" | "offered";
  /** Whether the parent list is currently scrolling (disables swipe gestures) */
  isScrolling?: boolean;
  /** Whether the bid button should be hidden */
  hideActionButton?: boolean;
  /** Whether to remove the flex from the container */
  removeFlex?: boolean;
  /** ID of the offer currently being processed (skip/hide) */
  processingOfferId?: string | null;
  /** Callback when this offer starts processing */
  onProcessingStart?: (offerId: string) => void;
  /** Callback when this offer finishes processing */
  onProcessingEnd?: () => void;
  /** Type of the offer */
  type?: OfferType;
  /** ISO string or Date object representing when the offer expires */
  expiredAt?: string | Date | null;
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
 *   expiredAt="2024-01-15T10:30:00Z"
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
  bidable,
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
  disabled = false,
  onButtonClick,
  style,
  itemStatus = "offered",
  isScrolling = false,
  hideActionButton = false,
  removeFlex = false,
  processingOfferId = null,
  onProcessingStart,
  onProcessingEnd,
  type = OFFER_TYPES.LIVE,
  expiredAt,
}: LiveRideOfferItemProps) {
  const { skipLiveOffer, hideLiveOffer, getLiveOfferStatus } = useDriver();
  const { hideRideOfferModal, setHasAnyActiveOffer } = useRideOffer();
  const { closeAllModals } = useModalManager();
  const { updateBroadcastOffer } = useBroadcastJobOffers();
  const translateX = React.useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const [showHideButton, setShowHideButton] = React.useState(false);
  const [isSkipping, setIsSkipping] = React.useState(false);
  const [isHiding, setIsHiding] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Get the current status of this offer
  const offerStatus = getLiveOfferStatus(id);

  // Determine button title based on offer status and bidable prop
  const getButtonTitle = () => {
    // Check if the offer itself is expired (from broadcast context) - highest priority
    if (itemStatus === LIVE_JOB_STATUS.EXPIRED) {
      console.log(`[LiveRideOfferItem] Job ${id} - showing Expired`);
      return "Expired";
    }

    // Check for user actions based on itemStatus (from broadcast context)
    if (itemStatus === LIVE_JOB_STATUS.ACCEPTED) {
      console.log(`[LiveRideOfferItem] Job ${id} - showing Accepted`);
      return "Accepted";
    } else if (itemStatus === "skipped") {
      console.log(`[LiveRideOfferItem] Job ${id} - showing Skipped`);
      return "Skipped";
    } else if (itemStatus === "hidden") {
      console.log(`[LiveRideOfferItem] Job ${id} - showing Hidden`);
      return "Hidden";
    }

    // Check for fresh offers (offered status) - show default state based on bidable prop
    if (itemStatus === "offered") {
      // This is a fresh offer - show default state based on bidable prop
      const defaultTitle = bidable ? "Bid" : "Accept";
      console.log(
        `[LiveRideOfferItem] Job ${id} - fresh offer, showing default: ${defaultTitle}`
      );
      return defaultTitle;
    }

    // Fallback: Show the action that was taken based on offerStatus (for backward compatibility)
    if (offerStatus?.status === LOCAL_JOB_STATUS.SKIPPED) {
      console.log(`[LiveRideOfferItem] Job ${id} - showing Skipped (fallback)`);
      return "Skipped";
    } else if (offerStatus?.status === LOCAL_JOB_STATUS.HIDDEN) {
      console.log(`[LiveRideOfferItem] Job ${id} - showing Hidden (fallback)`);
      return "Hidden";
    }

    // Fallback to default state based on bidable prop
    const defaultTitle = bidable ? "Bid" : "Accept";
    console.log(
      `[LiveRideOfferItem] Job ${id} - fallback, showing default: ${defaultTitle}`
    );
    return defaultTitle;
  };

  // Animated value for skip background opacity
  const skipOpacity = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

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
        // Valid left swipe - skip the offer
        console.log(
          `[LiveRideOfferItem] Left swipe detected for job ${id}, velocity: ${velocityX}`
        );

        // Check if offer is expired before attempting to skip
        if (itemStatus === LIVE_JOB_STATUS.EXPIRED) {
          console.log(`[LiveRideOfferItem] Job ${id} is expired, cannot skip`);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
          return;
        }

        setIsSkipping(true);
        onProcessingStart?.(id); // Notify parent that processing started

        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: false,
        }).start(async () => {
          try {
            await skipLiveOffer(id);

            // Also update the broadcast offers context status
            updateBroadcastOffer(id, { status: "skipped" });
            console.log(
              `[LiveRideOfferItem] Marked job ${id} as skipped in broadcast context`
            );

            // Success - reset animation back to 0 so item shows "Skipped" state
            // The item will be filtered out by the parent component
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
            }).start(() => {
              setIsSkipping(false);
              onProcessingEnd?.(); // Notify parent that processing ended
            });
          } catch (error) {
            console.error("Failed to skip offer:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to skip offer. Please try again.";
            showToast(errorMessage, {
              variant: "error",
              position: "top",
            });
            // Reset position if skip fails
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
            }).start(() => {
              setIsSkipping(false);
              onProcessingEnd?.(); // Notify parent that processing ended
            });
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
      // Check if offer is expired before attempting to hide
      if (itemStatus === LIVE_JOB_STATUS.EXPIRED) {
        console.log(`[LiveRideOfferItem] Job ${id} is expired, cannot hide`);
        setShowHideButton(false);
        return;
      }

      setIsHiding(true);
      onProcessingStart?.(id); // Notify parent that processing started

      await hideLiveOffer(id);

      // Also update the broadcast offers context status
      updateBroadcastOffer(id, { status: "hidden" });
      console.log(
        `[LiveRideOfferItem] Marked job ${id} as hidden in broadcast context`
      );

      setShowHideButton(false);
      setIsHiding(false);
      onProcessingEnd?.(); // Notify parent that processing ended
    } catch (error) {
      console.error("Failed to hide offer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to hide offer. Please try again.";
      showToast(errorMessage, {
        variant: "error",
        position: "top",
      });
      setIsHiding(false);
      onProcessingEnd?.(); // Notify parent that processing ended
      // Keep the overlay open so user can retry
    }
  };

  // Handle hide action
  const handleRejectButtonClick = async () => {
    try {
      // Check if offer is expired before attempting to hide
      if (itemStatus === LIVE_JOB_STATUS.EXPIRED) {
        console.log(
          `[HiredDriverJobOfferItem] Job ${id} is expired, cannot reject`
        );
        showToast("Offer is expired and cannot be rejected", {
          variant: "error",
          position: "top",
        });
        return;
      }

      setIsRejecting(true);
      onProcessingStart?.(id); // Notify parent that processing started

      await hideLiveOffer(id);

      // Also update the broadcast offers context status
      updateBroadcastOffer(id, { status: "hidden" });
      console.log(
        `[HiredDriverJobOfferItem] Marked job ${id} as rejected in broadcast context`
      );

      setIsRejecting(false);
      onProcessingEnd?.(); // Notify parent that processing ended
    } catch (error) {
      console.error("Failed to hide offer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to hide offer. Please try again.";
      showToast(errorMessage, {
        variant: "error",
        position: "top",
      });
      setIsHiding(false);
      onProcessingEnd?.(); // Notify parent that processing ended
      // Keep the overlay open so user can retry
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
                disabled={isHiding}
                loading={isHiding}
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
        enabled={
          !isScrolling &&
          !disabled &&
          processingOfferId === null &&
          type !== DRIVER_TYPES.HIRED
        }
      >
        <View>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
            enabled={
              !isScrolling &&
              !disabled &&
              processingOfferId === null &&
              type !== DRIVER_TYPES.HIRED
            }
            // Gesture configuration for horizontal-only left swipes
            // activeOffsetX: Only activate if moved 10px horizontally (left/right)
            // failOffsetY: Fail gesture if moved 15px vertically (allows scrolling)
            // minVelocityX: Require 500px/s horizontal velocity for swipe activation
            // Note: Disabled when any offer is being processed to prevent race conditions
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
                {/* Countdown Timer */}
                {expiredAt && calculateProgressTimerDuration(expiredAt) && (
                  <View>
                    <ProgressTimer
                      duration={calculateProgressTimerDuration(expiredAt)!}
                      onComplete={() => {
                        // Update the offer status to expired when timer completes
                        updateBroadcastOffer(id, {
                          status: LIVE_JOB_STATUS.EXPIRED,
                        });
                        showToast("Offer expired", {
                          variant: "warning",
                          position: "top",
                        });
                        setHasAnyActiveOffer(false);
                        closeAllModals();
                        hideRideOfferModal();
                      }}
                      height={4}
                      isActive={!disabled && processingOfferId === null}
                    />
                  </View>
                )}

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
                  type={rideType as any}
                />

                {/* Footer Section */}
                <RideOfferItemFooter
                  rideTime={rideTime}
                  rideDistance={rideDistance}
                  totalPrice={totalPrice}
                  driverEarn={driverEarn}
                  buttonTitle={getButtonTitle()}
                  disabled={disabled || isRejecting}
                  isRejecting={isRejecting}
                  onButtonClick={onButtonClick}
                  hideActionButton={hideActionButton}
                  hideRejectButton={getButtonTitle() !== "Accept"}
                  onRejectButtonClick={handleRejectButtonClick}
                  type={type}
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
  countdownContainer: {
    paddingHorizontal: 4,
    paddingVertical: 4,
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
