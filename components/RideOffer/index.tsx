import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  GOOGLE_MAPS_API_KEY,
  LIVE_JOB_STATUS,
  RIDE_TYPES,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { RIDE_OFFER_CONTENT_KEYS } from "@/content/ride-offer-keys";
import { useModalManager } from "@/context/ModalManagerContext";
import { PackageInfo, usePackageInfo } from "@/context/PackageInfoContext";
import { useRideOffer } from "@/context/RideOfferContext";
import {
  SpecialRequirements,
  useSpecialRequirements,
} from "@/context/SpecialRequirementsContext";
import { useGetContent } from "@/hooks/useGetContent";
import { router, useFocusEffect } from "expo-router";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

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
  bidable?: boolean; // sequential offers are always non-biddable; kept for LiveRideOfferItem display
  onAccept?: () => void;
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
  bidable = false,
  onAccept,
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
  const isNavigatingToTripDetailsRef = useRef(false);

  // Reset navigation guard when this screen gains focus (e.g. after returning from trip-details)
  useFocusEffect(
    useCallback(() => {
      isNavigatingToTripDetailsRef.current = false;
    }, []),
  );

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

  const { closeAllModals } = useModalManager();
  const {
    setHasAnyActiveOffer,
    updateCurrentOfferStatus,
    hideRideOfferModal,
    markSequentialOfferAsExpired,
  } = useRideOffer();

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

  const pickupCoordinate = useMemo(() => {
    const latRaw = offer?.tripOffer?.pickup?.lat;
    const lngRaw = offer?.tripOffer?.pickup?.lng;
    const latitude = typeof latRaw === "string" ? Number(latRaw) : latRaw;
    const longitude = typeof lngRaw === "string" ? Number(lngRaw) : lngRaw;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude } as const;
  }, [offer?.tripOffer?.pickup?.lat, offer?.tripOffer?.pickup?.lng]);

  const dropoffCoordinate = useMemo(() => {
    const latRaw = offer?.tripOffer?.dropoff?.lat;
    const lngRaw = offer?.tripOffer?.dropoff?.lng;
    const latitude = typeof latRaw === "string" ? Number(latRaw) : latRaw;
    const longitude = typeof lngRaw === "string" ? Number(lngRaw) : lngRaw;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude } as const;
  }, [offer?.tripOffer?.dropoff?.lat, offer?.tripOffer?.dropoff?.lng]);

  // Set initial offer when offerProp changes
  useEffect(() => {
    setOffer(offerProp || null);
  }, [offerProp]);

  // IMPORTANT: MapView `initialRegion` is only used on mount.
  // Sequential offers often arrive after mount, so we must fit once we have coordinates.
  useEffect(() => {
    if (!pickupCoordinate || !dropoffCoordinate) return;
    // Delay a tick to ensure the MapView has mounted before calling fitToCoordinates.
    const id = setTimeout(() => {
      mapRef.current?.fitToCoordinates([pickupCoordinate, dropoffCoordinate], {
        edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
        animated: true,
      });
    }, 250);
    return () => clearTimeout(id);
  }, [pickupCoordinate, dropoffCoordinate]);

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

  const isOfferExpired =
    offer?.status === "offer-expired" ||
    (offer?.status === LIVE_JOB_STATUS.OFFERED && isExpiredByTime);

  const isOffered =
    offer?.status === LIVE_JOB_STATUS.OFFERED &&
    !isExpiredByTime &&
    !isOfferExpired;

  const shouldDisabled = isSkipLoading || isHideLoading;

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
    // Enforce the full 2‑minute timeout for sequential offers.
    // The timer should continue running regardless of driver actions (bid/accept),
    // and only be skipped if the offer is already accepted.
    if (!offer) {
      return;
    }

    // If the sequential offer has already been accepted, do not mark it as expired.
    if (offer.status === LIVE_JOB_STATUS.ACCEPTED) {
      console.log(
        `[RideOffer] Skipping expiration for ${offer.id} - offer already accepted`,
      );
      return;
    }

    console.log(
      `[RideOffer] Timer completed for sequential offer ${offer.id} - marking as expired (status: ${offer.status})`,
    );
    const tripId = offer.tripOffer?.tripId;

    showToast(toastExpired, { variant: "warning", position: "top" });

    // Prefer centralized expiration handling (cleans up state + notifications)
    if (tripId) {
      markSequentialOfferAsExpired(tripId);
    } else {
      updateCurrentOfferStatus("offer-expired");
      setHasAnyActiveOffer(false);
      closeAllModals();
      hideRideOfferModal();
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
              {offer?.tripOffer &&
                GOOGLE_MAPS_API_KEY &&
                pickupCoordinate &&
                dropoffCoordinate && (
                <MapViewDirections
                  key={`seq-route-${offer.tripOffer.tripId}-${pickupCoordinate.latitude}-${pickupCoordinate.longitude}-${dropoffCoordinate.latitude}-${dropoffCoordinate.longitude}`}
                  apikey={GOOGLE_MAPS_API_KEY}
                  origin={pickupCoordinate}
                  destination={dropoffCoordinate}
                  strokeWidth={4}
                  strokeColor={textColors.blue600}
                  onReady={(result) => {
                    // Fit to the actual route coordinates so the polyline is always visible
                    // even if the map mounted before the offer was set.
                    if (!result?.coordinates?.length) return;
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
                      animated: true,
                    });
                  }}
                  onError={(errorMessage) => {
                    console.warn(
                      "[RideOffer] Directions error:",
                      errorMessage,
                      offer?.tripOffer?.tripId,
                    );
                  }}
                />
              )}

              {/* Pickup Marker */}
              {offer?.tripOffer && pickupCoordinate && (
                <Marker
                  coordinate={pickupCoordinate}
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
              {offer?.tripOffer && dropoffCoordinate && (
                <Marker
                  coordinate={dropoffCoordinate}
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
                {/* Ride Offer Tile - tappable to open trip details (same as broadcast offer item) */}
                <TouchableOpacity
                  style={styles.offerSection}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isNavigatingToTripDetailsRef.current) return;
                    const offerId =
                      offer?.id || offer?.tripOffer?.tripId;
                    if (offerId) {
                      isNavigatingToTripDetailsRef.current = true;
                      router.push({
                        pathname: "/(screens)/trip-details",
                        params: { offerId: String(offerId) },
                      });
                    }
                  }}
                >
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
                </TouchableOpacity>

                {/* Action Buttons or Expired UI (sequential offers: Hide, Skip Price, Accept only) */}
                {!isOfferExpired && isOffered && (
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
                      disabled={shouldDisabled}
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
                      disabled={shouldDisabled}
                      loading={isSkipLoading}
                    >
                      {actionSkipPrice}
                    </Button>

                    <Button
                      variant="primary"
                      block={false}
                      rounded="half"
                      style={styles.acceptButton}
                      onPress={onAccept}
                      disabled={shouldDisabled}
                    >
                      {actionAccept}
                    </Button>
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
