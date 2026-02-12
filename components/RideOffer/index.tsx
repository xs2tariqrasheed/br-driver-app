import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "@/components/Button";
import Header from "@/components/Header";
import LiveRideOfferItem from "@/components/LiveRideOfferItem";
import { showToast } from "@/components/Toast";
import { colors, textColors } from "@/constants/colors";
import {
  LIVE_JOB_STATUS,
  RIDE_TYPES,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { RIDE_OFFER_CONTENT_KEYS } from "@/content/ride-offer-keys";
import { useBidBottomSheet } from "@/context/BidBottomSheetContext";
import { useBidWaitingTimer } from "@/context/BidWaitingTimerContext";
import { useModalManager } from "@/context/ModalManagerContext";
import { PackageInfo, usePackageInfo } from "@/context/PackageInfoContext";
import { useRideOffer } from "@/context/RideOfferContext";
import {
  SpecialRequirements,
  useSpecialRequirements,
} from "@/context/SpecialRequirementsContext";
import { useGetContent } from "@/hooks/useGetContent";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Icon URLs for custom markers
const pickupIconUrl = Image.resolveAssetSource(
  require("@/assets/images/pickup-icon.png"),
).uri;
const dropoffIconUrl = Image.resolveAssetSource(
  require("@/assets/images/dropoff-icon.png"),
).uri;

interface TripOffer {
  tripId: string;
  customerId: string;
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  biddable: boolean;
  type: "sequential" | "broadcast";
  fare?: number;
  timestamp?: number;
  for?: "io" | "hired";
}

interface RideOffer {
  // Basic ride offer info
  id: string;
  type: (typeof TRIP_OFFER_TYPES)[keyof typeof TRIP_OFFER_TYPES];
  status:
    | "offered"
    | "bidding"
    | "accepted"
    | "skipped"
    | "rejected"
    | "expired"
    | "offer-expired";

  // Trip offer details
  tripOffer: TripOffer;
  bidable: boolean;
  // LiveRideOfferItem required fields
  rideType: keyof typeof RIDE_TYPES;
  peopleCount: number;
  rating: number;
  hasSpecialRequirements: boolean;
  hasPackage: boolean;

  // Pickup details
  pickupTime: number;
  pickupDistance: number;
  pickupAddress: string;

  // Dropoff details
  dropoffTime: number;
  dropoffDistance: number;
  dropoffAddress: string;

  // Ride details
  rideTime: number;
  rideDistance: number;
  totalPrice: number;
  driverEarn: number;

  // Button details
  buttonTitle: string;

  // Timestamps
  timestamp: string;
  timeout: number;
}

interface RideOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer?: RideOffer;
  bidable: boolean;
  onAccept?: () => void;
  onBid?: () => void;
  onSkipPrice?: () => void;
  onHide?: () => void;
  isSkipLoading?: boolean;
  isHideLoading?: boolean;
  asScreen?: boolean; // render without RN Modal for screen-based presentation
}

/**
 * RideOfferModal Component
 *
 * Displays ride offer details with:
 * - Interactive Google Maps showing route
 * - Ride offer tile with full trip details
 * - Three action buttons: Hide, Skip Price, and Accept
 * - Custom header with back navigation
 */
export default function RideOfferModal({
  visible,
  onClose,
  offer: offerProp,
  bidable,
  onAccept,
  onBid,
  onSkipPrice,
  onHide,
  isSkipLoading = false,
  isHideLoading = false,
  asScreen = false,
}: RideOfferModalProps) {
  // Page Content Start
  const { getContent } = useGetContent();
  const {
    headerTitle,
    markerPickupTitle,
    markerDropOffTitle,
    actionHide,
    actionSkipPrice,
    actionWaiting,
    actionRebid,
    actionBid,
    actionAccept,
    expiredMessage,
    toastExpired,
  } = useMemo(() => {
    const get = getContent;
    return {
      headerTitle: get(RIDE_OFFER_CONTENT_KEYS.HEADER_TITLE),
      markerPickupTitle: get(RIDE_OFFER_CONTENT_KEYS.MARKER_PICKUP_TITLE),
      markerDropOffTitle: get(RIDE_OFFER_CONTENT_KEYS.MARKER_DROP_OFF_TITLE),
      actionHide: get(RIDE_OFFER_CONTENT_KEYS.ACTION_HIDE),
      actionSkipPrice: get(RIDE_OFFER_CONTENT_KEYS.ACTION_SKIP_PRICE),
      actionWaiting: get(RIDE_OFFER_CONTENT_KEYS.ACTION_WAITING),
      actionRebid: get(RIDE_OFFER_CONTENT_KEYS.ACTION_REBID),
      actionBid: get(RIDE_OFFER_CONTENT_KEYS.ACTION_BID),
      actionAccept: get(RIDE_OFFER_CONTENT_KEYS.ACTION_ACCEPT),
      expiredMessage: get(RIDE_OFFER_CONTENT_KEYS.EXPIRED_MESSAGE),
      toastExpired: get(RIDE_OFFER_CONTENT_KEYS.TOAST_EXPIRED),
    };
  }, [getContent]);
  // Page Content End
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const mapRef = useRef<MapView>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [offer, setOffer] = useState<any | null>(null);
  const refStatus = useRef<number>(0);
  const headerRef = useRef<View>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Measure header height when it mounts
  const handleHeaderLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      setHeaderHeight(height);
    }
  };

  // Calculate map height dynamically (remaining space after header)
  const mapHeight =
    headerHeight > 0 ? windowHeight - headerHeight : windowHeight;

  // Calculate overlay card height based on screen size
  // For small devices (< 700px), increase the overlay height to ensure buttons are visible
  const isSmallDevice = windowHeight < 700;
  const overlayMaxHeight = isSmallDevice
    ? windowHeight * 0.75 // 75% for small devices
    : windowHeight * 0.6; // 60% for larger devices

  // Minimum height to ensure buttons are always visible (estimated: ~250px for content + buttons)
  const overlayMinHeight = Math.max(250, windowHeight * 0.35);

  // Bid context hooks
  const { showBidBottomSheet, hideBidBottomSheet } = useBidBottomSheet();
  const { showBidWaitingTimer, hideBidWaitingTimer } = useBidWaitingTimer();
  const { closeAllModals } = useModalManager();
  const {
    submitBid,
    setHasAnyActiveOffer,
    isSubmitBidLoading,
    currentOffer,
    updateCurrentOfferStatus,
    hideRideOfferModal,
    removeTemporaryRidesByTripId,
    markSequentialOfferAsExpired,
  } = useRideOffer();

  // Build mock BidData for BidBottomSheet
  const buildMockBidData = () => {
    const baseAmount = Math.max(
      10,
      Math.round((offer?.totalPrice || 20) * 0.2),
    );
    const suggestionSteps = [0, 5, 10];
    const systemSuggestedBids = suggestionSteps.map((step) => ({
      amount: baseAmount + step,
      driverEarn: Math.round((baseAmount + step) * 0.85),
    }));
    const boostedPrices = [2, 4, 6];

    return {
      amount: offer?.fare || offer?.tripOffer?.fare,
      bosstedAmount: baseAmount + boostedPrices[0],
      driverEarn: Math.round(baseAmount * 0.85),
      numberOfBids: Math.floor(Math.random() * 5) + 1,
      systemEta: 8,
      systemSuggestedBids,
      boostedPrices,
      createdAt: new Date().toISOString(),
    } as any;
  };

  // Modal animation effect
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(screenHeight);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Calculate map region to show both pickup and dropoff
  const getMapRegion = () => {
    if (!offer?.tripOffer) {
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const { pickup, dropoff } = offer.tripOffer;
    const latitudes = [pickup.lat, dropoff.lat];
    const longitudes = [pickup.lng, dropoff.lng];

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.5;
    const deltaLng = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.05),
      longitudeDelta: Math.max(deltaLng, 0.05),
    };
  };

  const region = getMapRegion();

  // Set initial offer when offerProp changes
  useEffect(() => {
    setOffer(offerProp || null);
  }, [offerProp]);

  // If this offer is opened from Notifications, it may already be expired.
  // We use expiredAt as the source of truth to prevent showing action buttons for expired offers.
  const expiredAtMs =
    offer?.expiredAt instanceof Date
      ? offer.expiredAt.getTime()
      : offer?.expiredAt
        ? new Date(offer.expiredAt).getTime()
        : undefined;
  const isExpiredByTime =
    typeof expiredAtMs === "number" &&
    !Number.isNaN(expiredAtMs) &&
    expiredAtMs <= Date.now();

  const isBidding = offer?.status === "bidding";
  const isOfferExpired =
    offer?.status === "offer-expired" ||
    (offer?.status === LIVE_JOB_STATUS.OFFERED && isExpiredByTime);

  // Bid states (offer still alive, driver can rebid)
  const isBidExpired = offer?.status === LIVE_JOB_STATUS.EXPIRED && bidable;
  const isRejected = offer?.status === LIVE_JOB_STATUS.REJECTED && bidable;

  const isOffered =
    offer?.status === LIVE_JOB_STATUS.OFFERED &&
    !isExpiredByTime &&
    !isOfferExpired;

  // Allow rebidding for rejected or bid-expired bids
  const canBid = isOffered || isBidExpired || isRejected;
  const shouldDisabled = isSkipLoading || isHideLoading || isSubmitBidLoading;

  // Handle bid button click for bidable offers
  const handleBidClick = () => {
    // Allow rebidding for rejected or expired bids
    if ((isBidExpired || isRejected) && bidable) {
      // Reset status to "offered" to allow rebidding
      // Note: This assumes the parent component will handle status update
      console.log(`[RideOffer] Allowing rebid for ${offer?.status} status`);
    }
    // As a screen, keep Ride Offer visible and open the Bid sheet on top
    const bidData = buildMockBidData();
    showBidBottomSheet(
      { ...bidData, amount: offer?.fare || offer?.tripOffer?.fare },
      handleBidSubmitted,
    );
  };

  // Handle bid submission success
  const handleBidSubmitted = async (data: any) => {
    try {
      const result = await submitBid(
        data?.selectedBid,
        data?.eta,
        data?.isBoosted ? data?.boostAmount : undefined,
      );
      console.log("🔔 Bid submission result:", result);
      if (result && "success" in result && result.success) {
        // Show waiting timer with completion callback, passing the current offer
        showBidWaitingTimer(offer || undefined);
      }
    } catch (e) {
      // Error toast handled in submitBid
    }
  };

  const { openSpecialRequirements } = useSpecialRequirements();
  const { openPackageInfo } = usePackageInfo();

  const handleShowSpecialRequirements = (data: SpecialRequirements) => {
    // Open the special requirements modal (overlay on top of ride offer modal)
    openSpecialRequirements(data);
  };

  const handleShowPackage = (data: PackageInfo) => {
    // Open the package info modal (overlay on top of ride offer modal)
    openPackageInfo(data);
  };

  // Handle timer completion for sequential offers
  const handleTimerComplete = () => {
    // Only mark as expired if offer is still in "offered" state
    // If driver has performed any action (bid, accept, etc.), status would have changed
    if (offer && offer.status === LIVE_JOB_STATUS.OFFERED) {
      console.log(
        `[RideOffer] Timer completed for sequential offer ${offer.id} - marking as expired`,
      );
      const tripId = offer.tripOffer?.tripId;

      // Case 1 rule: only expire when still "offered" (no action taken)
      showToast(toastExpired, { variant: "warning", position: "top" });

      // Prefer centralized expiration handling (cleans up state + notifications)
      if (tripId) {
        markSequentialOfferAsExpired(tripId);
      } else {
        // Fallback cleanup
        updateCurrentOfferStatus("offer-expired");
        setHasAnyActiveOffer(false);
        closeAllModals();
        hideBidBottomSheet();
        hideBidWaitingTimer();
        hideRideOfferModal();
      }
    } else {
      console.log(
        `[RideOffer] Skipping expiration for ${offer?.id} - status changed to: ${offer?.status}`,
      );
    }
  };

  const Content = (
    <View style={styles.container}>
      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View
          ref={headerRef}
          onLayout={handleHeaderLayout}
          style={{ paddingTop: insets.top + (Platform.OS === "ios" ? 20 : 0) }}
        >
          <Header
            title={headerTitle}
            hideBackIcon={false}
            onBackPress={() => {
              onClose();
            }}
          />
        </View>

        {/* Full Screen Map */}
        {mapHeight > 0 && (
          <View style={[styles.mapSection, { height: mapHeight }]}>
            <MapView
              ref={mapRef}
              style={[styles.map, { height: mapHeight }]}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
            >
              {/* Route */}
              {offer?.tripOffer && GOOGLE_MAPS_API_KEY && (
                <MapViewDirections
                  apikey={GOOGLE_MAPS_API_KEY}
                  origin={{
                    latitude: offer.tripOffer.pickup.lat,
                    longitude: offer.tripOffer.pickup.lng,
                  }}
                  destination={{
                    latitude: offer.tripOffer.dropoff.lat,
                    longitude: offer.tripOffer.dropoff.lng,
                  }}
                  strokeWidth={4}
                  strokeColor={textColors.blue600}
                />
              )}

              {/* Pickup Marker */}
              {offer?.tripOffer && (
                <Marker
                  coordinate={{
                    latitude: offer.tripOffer.pickup.lat,
                    longitude: offer.tripOffer.pickup.lng,
                  }}
                  title={markerPickupTitle}
                  description={offer.pickupAddress}
                  icon={{
                    uri: pickupIconUrl,
                    width: 30,
                    height: 60,
                  }}
                />
              )}

              {/* Dropoff Marker */}
              {offer?.tripOffer && (
                <Marker
                  coordinate={{
                    latitude: offer.tripOffer.dropoff.lat,
                    longitude: offer.tripOffer.dropoff.lng,
                  }}
                  title={markerDropOffTitle}
                  description={offer.dropoffAddress}
                  icon={{
                    uri: dropoffIconUrl,
                    width: 30,
                    height: 60,
                  }}
                />
              )}
            </MapView>

            {/* Overlay Card with Rounded Top Corners */}
            <View
              style={[
                styles.overlayCard,
                {
                  maxHeight: overlayMaxHeight,
                  minHeight: overlayMinHeight,
                },
              ]}
            >
              <ScrollView
                style={styles.overlayScrollView}
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {/* Ride Offer Tile */}
                <View style={styles.offerSection}>
                  <LiveRideOfferItem
                    id={offer?.id || ""}
                    rideType={offer?.rideType || RIDE_TYPES.ONE_WAY}
                    peopleCount={offer?.peopleCount || 0}
                    rating={offer?.rating || 0}
                    hasSpecialRequirements={
                      offer?.hasSpecialRequirements || false
                    }
                    onPressSpecialRequirements={() => {
                      handleShowSpecialRequirements(offer?.specialRequirements);
                    }}
                    hasPackage={offer?.hasPackage || false}
                    onPressPackage={() => {
                      handleShowPackage(offer?.packageInfo);
                    }}
                    bidable={bidable}
                    pickupTime={offer?.pickupTime || 0}
                    pickupDistance={offer?.pickupDistance || 0}
                    pickupAddress={offer?.pickupAddress || ""}
                    dropoffTime={offer?.dropoffTime || 0}
                    dropoffDistance={offer?.dropoffDistance || 0}
                    dropoffAddress={offer?.dropoffAddress || ""}
                    rideTime={offer?.rideTime || 0}
                    rideDistance={offer?.rideDistance || 0}
                    totalPrice={
                      offer?.totalPrice || offer?.tripOffer?.fare || 0
                    }
                    driverEarn={offer?.driverEarn || 0}
                    onButtonClick={() => {}}
                    itemStatus={offer?.status as any}
                    hideActionButton={true}
                    removeFlex
                    disabled
                    carType={offer?.carType}
                    expiredAt={offer?.expiredAt}
                    onTimerComplete={handleTimerComplete}
                  />
                </View>

                {/* Action Buttons or Expired UI */}
                {!isOfferExpired &&
                  (isOffered || isBidExpired || isRejected || isBidding) && (
                    <View
                      style={styles.buttonContainer}
                      onStartShouldSetResponder={() => false}
                    >
                      <Button
                        variant="outlined"
                        block={false}
                        rounded="half"
                        style={styles.hideButton}
                        onPress={onHide}
                        disabled={shouldDisabled || isBidding}
                        loading={isHideLoading}
                      >
                        {actionHide}
                      </Button>

                      <Button
                        variant="outlined"
                        block={false}
                        rounded="half"
                        style={styles.skipButton}
                        onPress={onSkipPrice}
                        disabled={shouldDisabled || isBidding}
                        loading={isSkipLoading}
                      >
                        {actionSkipPrice}
                      </Button>

                      {bidable ? (
                        <Button
                          variant="primary"
                          block={false}
                          rounded="half"
                          style={styles.acceptButton}
                          onPress={() => {
                            if (isBidding) return;
                            handleBidClick();
                          }}
                          disabled={shouldDisabled || isBidding}
                          loading={isSubmitBidLoading}
                        >
                          {isBidding
                            ? actionWaiting
                            : isBidExpired || isRejected
                              ? actionRebid
                              : actionBid}
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          block={false}
                          rounded="half"
                          style={styles.acceptButton}
                          onPress={onAccept}
                          disabled={shouldDisabled || isBidding}
                        >
                          {actionAccept}
                        </Button>
                      )}
                    </View>
                  )}

                {isOfferExpired && (
                  <View style={styles.expiredContainer}>
                    <View style={styles.expiredAlert}>
                      <Text style={styles.expiredText}>{expiredMessage}</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );

  if (asScreen) {
    return Content;
  }

  return (
    <Modal visible={visible} transparent animationType="none">
      {Content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    zIndex: 9999,
    elevation: 9999,
  },

  bottomSheet: {
    height: screenHeight,
    width: "100%",
    zIndex: 9999,
    elevation: 9999,
  },
  // Map Section (Dynamic height based on screen, no padding)
  mapSection: {
    position: "relative",
    width: "100%",
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  map: {
    width: "100%",
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  // Overlay Card
  overlayCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: textColors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  overlayScrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  overlayContent: {
    paddingBottom: Math.max(16, Dimensions.get("window").height * 0.02), // Dynamic padding based on screen height
  },
  // Offer Section
  offerSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Button Section
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: "center",
    minHeight: 48, // Ensure buttons have enough space
  },
  hideButton: {
    width: "25%",
    height: 36,
    borderColor: textColors.red500,
    borderWidth: 1,
  },
  skipButton: {
    width: "30%",
    height: 36,
  },
  acceptButton: {
    width: "40%",
    height: 36,
  },
  // Expired UI Styles
  expiredContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  expiredAlert: {
    backgroundColor: "#FEF3C7", // Light yellow background
    borderColor: "#F59E0B", // Amber border
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  expiredText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400E", // Dark amber text
  },
});
