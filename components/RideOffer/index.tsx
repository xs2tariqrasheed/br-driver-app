import { useEffect, useRef } from "react";
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
import { LIVE_JOB_STATUS } from "@/constants/global";

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
  type: "sequential" | "broadcast";
  tripOffer: TripOffer;
  timestamp: string;
  timeout: number;
}

interface RideOfferModalProps {
  visible: boolean;
  onClose: () => void;
  offer?: RideOffer;
  onAccept?: () => void;
  onSkipPrice?: () => void;
  onHide?: () => void;
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
  offer,
  onAccept,
  onSkipPrice,
  onHide,
}: RideOfferModalProps) {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const mapRef = useRef<MapView>(null);

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

  // Mock data for the ride offer tile (static data for missing fields)
  const rideOfferData = {
    id: "4",
    status: LIVE_JOB_STATUS.OFFERED,
    pickupTime: 45,
    pickupDistance: 180,
    pickupAddress: "999 Birch Boulevard, Business District, USA",
    dropoffTime: 20,
    dropoffDistance: 220,
    dropoffAddress: "111 Spruce Street, Residential Area, USA",
    rideTime: 55,
    rideDistance: 650,
    totalPrice: 220,
    driverEarn: 220,
    buttonTitle: "Waiting",
    peopleCount: 1,
    disabled: true,
    rating: 4.9,
    hasSpecialRequirements: true,
    hasPackage: true,
    rideType: "one-way" as any,
    createdAt: "2024-01-15T10:45:00Z",
    expiresAt: "2024-01-15T11:15:00Z",
    bid: {
      amount: 20,
      bosstedAmount: 5,
      driverEarn: 16.76,
      numberOfBids: 4,
      systemEta: 5,
      systemSuggestedBids: [
        {
          amount: 10,
          driverEarn: 8.38,
        },
        {
          amount: 15,
          driverEarn: 12.57,
        },
        {
          amount: 20,
          driverEarn: 16.76,
        },
        {
          amount: 25,
          driverEarn: 20.95,
        },
        {
          amount: 30,
          driverEarn: 25.14,
        },
      ],
      boostedPrices: [1, 3, 4, 7],
      createdAt: "2024-01-15T10:30:00Z",
      expiresAt: "2024-01-15T11:00:00Z",
    },
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
            onBackPress={onClose}
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
                  description={rideOfferData.pickupAddress}
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
                  description={rideOfferData.dropoffAddress}
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
                  {...rideOfferData}
                  onPressSpecialRequirements={() => {}}
                  onPressPackage={() => {}}
                  onButtonClick={() => {}}
                  itemStatus={rideOfferData?.status as any}
                  hideBidButton={true}
                  removeFlex
                  disabled
                />
              </View>

              {/* Action Buttons or Expired UI */}
              {offer?.tripOffer &&
              rideOfferData.status === LIVE_JOB_STATUS.OFFERED ? (
                <View style={styles.buttonContainer}>
                  <Button
                    variant="outlined"
                    block={false}
                    rounded="half"
                    style={styles.hideButton}
                    onPress={onHide}
                  >
                    Hide
                  </Button>

                  <Button
                    variant="outlined"
                    block={false}
                    rounded="half"
                    style={styles.skipButton}
                    onPress={onSkipPrice}
                  >
                    Skip Price
                  </Button>

                  <Button
                    variant="primary"
                    block={false}
                    rounded="half"
                    style={styles.acceptButton}
                    onPress={onAccept}
                  >
                    Accept
                  </Button>
                </View>
              ) : (
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
