import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import Button from "@/components/Button";
import Header from "@/components/Header";
import LiveRideOfferItem from "@/components/LiveRideOfferItem";
import { colors, textColors } from "@/constants/colors";
import {
  LIVE_JOB_STATUS,
  RIDE_OFFER_STORAGE_KEY,
  TRIP_OFFER_TYPES,
} from "@/constants/global";
import { useBidBottomSheet } from "@/context/BidBottomSheetContext";
import { useBidWaitingTimer } from "@/context/BidWaitingTimerContext";
import { PackageInfo, usePackageInfo } from "@/context/PackageInfoContext";
import { useRideOffer } from "@/context/RideOfferContext";
import {
  SpecialRequirements,
  useSpecialRequirements,
} from "@/context/SpecialRequirementsContext";
import { checkOfferStatus, removeStorageItem } from "@/utils/helpers";
import { router, usePathname } from "expo-router";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Icon URLs for custom markers
const pickupIconUrl = Image.resolveAssetSource(
  require("@/assets/images/pickup-icon.png")
).uri;
const dropoffIconUrl = Image.resolveAssetSource(
  require("@/assets/images/dropoff-icon.png")
).uri;

interface TripOffer {
  tripId: string;
  pickupLocation: { lat: number; lng: number };
  dropoffLocation: { lat: number; lng: number };
  fare: number;
  expiresAt: Date;
}

interface RideOffer {
  // Basic ride offer info
  id: string;
  type: (typeof TRIP_OFFER_TYPES)[keyof typeof TRIP_OFFER_TYPES];
  status: "offered" | "accepted" | "skipped" | "expired";

  // Trip offer details
  tripOffer: TripOffer;
  bidable: boolean;
  // LiveRideOfferItem required fields
  rideType: "one-way" | "round-trip" | "hourly";
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
}: RideOfferModalProps) {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const mapRef = useRef<MapView>(null);
  const pathname = usePathname();

  const [offer, setOffer] = useState<any | null>(null);
  const refStatus = useRef<number>(0);

  // Bid context hooks
  const { showBidBottomSheet } = useBidBottomSheet();
  const { showBidWaitingTimer } = useBidWaitingTimer();
  const { submitBid, setHasAnyActiveOffer, isSubmitBidLoading } =
    useRideOffer();

  // Build mock BidData for BidBottomSheet
  const buildMockBidData = () => {
    const baseAmount = Math.max(
      10,
      Math.round((offer?.totalPrice || 20) * 0.2)
    );
    const suggestionSteps = [0, 5, 10];
    const systemSuggestedBids = suggestionSteps.map((step) => ({
      amount: baseAmount + step,
      driverEarn: Math.round((baseAmount + step) * 0.85),
    }));
    const boostedPrices = [2, 4, 6];

    return {
      amount: baseAmount,
      bosstedAmount: baseAmount + boostedPrices[0],
      driverEarn: Math.round(baseAmount * 0.85),
      numberOfBids: Math.floor(Math.random() * 5) + 1,
      systemEta: 8,
      systemSuggestedBids,
      boostedPrices,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
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

    const { pickupLocation, dropoffLocation } = offer.tripOffer;
    const latitudes = [pickupLocation.lat, dropoffLocation.lat];
    const longitudes = [pickupLocation.lng, dropoffLocation.lng];

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

  // Status checking interval - only when modal is visible
  useEffect(() => {
    if (!visible || !offer) return;

    // Clear any existing interval
    if (refStatus.current) {
      clearInterval(refStatus.current);
      refStatus.current = 0;
    }

    // Start status checking interval
    refStatus.current = setInterval(() => {
      setOffer((prevOffer: any | null) => {
        if (!prevOffer) return prevOffer;
        const newStatus = checkOfferStatus(prevOffer);
        return {
          ...prevOffer,
          status: newStatus,
        };
      });
    }, 1000);

    return () => {
      if (refStatus.current) {
        clearInterval(refStatus.current);
        refStatus.current = 0;
      }
    };
  }, [visible, offer]);

  const isOffered = offer?.status === LIVE_JOB_STATUS.OFFERED;
  const isExpired = offer?.status === LIVE_JOB_STATUS.EXPIRED;
  const shouldDisabled = isSkipLoading || isHideLoading || isSubmitBidLoading;

  useEffect(() => {
    if (isExpired) {
      removeStorageItem(RIDE_OFFER_STORAGE_KEY);
      // Set hasAnyActiveOffer to false when offer expires
      setHasAnyActiveOffer(false);
    }
  }, [isExpired]);

  // Handle bid button click for bidable offers
  const handleBidClick = () => {
    // Keep the ride offer modal open and show bid modal as overlay
    // Build mock bid data and show bid bottom sheet with submission callback
    const bidData = buildMockBidData();
    showBidBottomSheet(bidData, handleBidSubmitted);
  };

  // Handle bid submission success
  const handleBidSubmitted = async (data: any) => {
    try {
      const result = await submitBid(data?.selectedBid);
      console.log("🔔 Bid submission result:", result);
      if (result && "success" in result && result.success) {
        // Show waiting timer with completion callback
        showBidWaitingTimer();
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

  return (
    <Modal visible={visible} transparent animationType="none">
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
          <Header
            title="Ride Offer"
            hideBackIcon={false}
            onBackPress={() => {
              if (isExpired) {
                // Close the modal first
                onClose();
                // Then navigate to home screen
                setTimeout(() => {
                  router.replace("/(tabs)");
                }, 100);
              } else {
                onClose();
              }
            }}
          />

          {/* Full Screen Map */}
          <View style={styles.mapSection}>
            <MapView
              ref={mapRef}
              style={styles.map}
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
                    latitude: offer.tripOffer.pickupLocation.lat,
                    longitude: offer.tripOffer.pickupLocation.lng,
                  }}
                  destination={{
                    latitude: offer.tripOffer.dropoffLocation.lat,
                    longitude: offer.tripOffer.dropoffLocation.lng,
                  }}
                  strokeWidth={4}
                  strokeColor={textColors.blue600}
                />
              )}

              {/* Pickup Marker */}
              {offer?.tripOffer && (
                <Marker
                  coordinate={{
                    latitude: offer.tripOffer.pickupLocation.lat,
                    longitude: offer.tripOffer.pickupLocation.lng,
                  }}
                  title="Pickup Location"
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
                    latitude: offer.tripOffer.dropoffLocation.lat,
                    longitude: offer.tripOffer.dropoffLocation.lng,
                  }}
                  title="Dropoff Location"
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
            <View style={styles.overlayCard}>
              {/* Ride Offer Tile */}
              <View style={styles.offerSection}>
                <LiveRideOfferItem
                  {...offer}
                  onPressSpecialRequirements={() => {
                    handleShowSpecialRequirements(offer?.specialRequirements);
                  }}
                  onPressPackage={() => {
                    handleShowPackage(offer?.packageInfo);
                  }}
                  onButtonClick={() => {}}
                  itemStatus={offer?.status as any}
                  hideBidButton={true}
                  removeFlex
                  disabled
                />
              </View>

              {/* Action Buttons or Expired UI */}
              {isOffered && (
                <View style={styles.buttonContainer}>
                  <Button
                    variant="outlined"
                    block={false}
                    rounded="half"
                    style={styles.hideButton}
                    onPress={onHide}
                    disabled={shouldDisabled}
                    loading={isHideLoading}
                  >
                    Hide
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
                    Skip Price
                  </Button>

                  {bidable ? (
                    <Button
                      variant="primary"
                      block={false}
                      rounded="half"
                      style={styles.acceptButton}
                      onPress={handleBidClick}
                      disabled={shouldDisabled}
                      loading={isSubmitBidLoading}
                    >
                      Bid
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      block={false}
                      rounded="half"
                      style={styles.acceptButton}
                      onPress={onAccept}
                      disabled={shouldDisabled}
                    >
                      Accept
                    </Button>
                  )}
                </View>
              )}

              {isExpired && (
                <View style={styles.expiredContainer}>
                  <View style={styles.expiredAlert}>
                    <Text style={styles.expiredText}>
                      This offer has expired
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
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
    zIndex: 9999,
    elevation: 9999,
  },
  // Map Section (Full Screen)
  mapSection: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
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
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
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
