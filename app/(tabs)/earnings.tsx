import Button from "@/components/Button";
import { Header } from "@/components/Header";
import { useToast } from "@/components/Toast";
import Typography from "@/components/Typography";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import { textColors } from "@/constants/colors";
import {
  LIVE_JOB_STATUS,
  RIDE_TYPES,
  TRIP_OFFER_TYPES,
  URLS,
} from "@/constants/global";
import { useModalManager } from "@/context/ModalManagerContext";
import { useNotification } from "@/context/NotificationContext";
import { useRideOffer } from "@/context/RideOfferContext";
import { useRouter } from "expo-router";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function EarningsScreen() {
  const router = useRouter();
  const { showRideOfferModal } = useRideOffer();
  useModalManager();
  const { showNotification } = useNotification();
  const { showToast } = useToast();
  const bottomTabOverflow = useBottomTabOverflow();

  const handleBackPress = () => {
    router.push("/(tabs)");
  };

  const handleOpenEarningsPortal = () => {
    Linking.openURL(URLS.earningsPortal);
  };

  const handleOpenActiveRide = () => {
    // Create dummy active trip data for testing
    const dummyActiveTripData = {
      retrievalId: "dummy-retrieval-id-123",
      tripId: "dummy-trip-id-456",
      activeTrip: {
        tripId: "dummy-trip-id-456",
        pickup: {
          address: "99C7+8WV, Service Road, Kahna Nau, Lahore",
          lat: 31.3709,
          lng: 74.3648,
          coordinates: {
            latitude: 31.3709,
            longitude: 74.3648,
          },
        },
        dropoff: {
          address:
            "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore",
          lat: 31.4244,
          lng: 74.3574,
          coordinates: {
            latitude: 31.4244,
            longitude: 74.3574,
          },
        },
        customer: {
          name: "John Doe",
          phone: "1234567890",
        },
        fare: {
          total: 25.0,
        },
        rideType: "ONE_WAY",
        status: "EN_ROUTE",
      },
    };

    router.push({
      pathname: "/(screens)/active-ride",
      params: {
        activeTripData: JSON.stringify(dummyActiveTripData),
      },
    });
  };

  const handleOpenRideOfferAccept = () => {
    // Create dummy ride offer (Accept flow)
    const dummyRideOffer = {
      id: "test-ride-offer-123",
      type: TRIP_OFFER_TYPES.SEQUENTIAL,
      status: LIVE_JOB_STATUS.OFFERED as "offered",
      tripOffer: {
        tripId: "test-trip-id-456",
        customerId: "test-customer-id-789",
        pickup: {
          lat: 31.3709,
          lng: 74.3648,
          address: "99C7+8WV, Service Road, Kahna Nau, Lahore",
        },
        dropoff: {
          lat: 31.4244,
          lng: 74.3574,
          address:
            "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore",
        },
        biddable: false,
        type: "sequential" as const,
        fare: 25.0,
        timestamp: Date.now(),
      },
      bidable: false,
      rideType: "ONE_WAY" as keyof typeof RIDE_TYPES,
      peopleCount: 2,
      rating: 4.8,
      hasSpecialRequirements: false,
      hasPackage: false,
      pickupTime: 5,
      pickupDistance: 0.8,
      pickupAddress: "99C7+8WV, Service Road, Kahna Nau, Lahore",
      dropoffTime: 15,
      dropoffDistance: 3.2,
      dropoffAddress:
        "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore",
      rideTime: 20,
      rideDistance: 4.0,
      totalPrice: 25.0,
      driverEarn: 20.0,
      buttonTitle: "Accept",
      timestamp: new Date().toISOString(),
      timeout: 30000,
    };
    showRideOfferModal(dummyRideOffer);
  };

  const handleOpenRideOfferBid = () => {
    // Create dummy ride offer (Bid flow)
    const dummyRideOffer = {
      id: "test-ride-offer-bid-123",
      type: TRIP_OFFER_TYPES.SEQUENTIAL,
      status: LIVE_JOB_STATUS.OFFERED as "offered",
      tripOffer: {
        tripId: "test-trip-id-bid-456",
        customerId: "test-customer-id-bid-789",
        pickup: {
          lat: 31.3709,
          lng: 74.3648,
          address: "99C7+8WV, Service Road, Kahna Nau, Lahore",
        },
        dropoff: {
          lat: 31.4244,
          lng: 74.3574,
          address:
            "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore",
        },
        biddable: true,
        type: "sequential" as const,
        fare: 25.0,
        timestamp: Date.now(),
      },
      bidable: true,
      rideType: "ONE_WAY" as keyof typeof RIDE_TYPES,
      peopleCount: 2,
      rating: 4.8,
      hasSpecialRequirements: false,
      hasPackage: false,
      pickupTime: 5,
      pickupDistance: 0.8,
      pickupAddress: "99C7+8WV, Service Road, Kahna Nau, Lahore",
      dropoffTime: 15,
      dropoffDistance: 3.2,
      dropoffAddress:
        "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore",
      rideTime: 20,
      rideDistance: 4.0,
      totalPrice: 25.0,
      driverEarn: 20.0,
      buttonTitle: "Bid",
      timestamp: new Date().toISOString(),
      timeout: 30000,
    };

    showRideOfferModal(dummyRideOffer);
  };

  const handleShowToast = () => {
    showToast("This is a test toast message!", "success", "top");
  };

  const handleShowNotification = () => {
    showNotification({
      type: "INFO" as any,
      title: "Test Notification",
      subtitle: "This is a portal-based overlay",
      message: "Hello from Earnings screen",
      modal: false,
      autoHide: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Earnings" onBackPress={handleBackPress} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomTabOverflow + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Typography
            type="bodyLarge"
            weight="regular"
            style={styles.messageText}
          >
            View your earnings information on our web portal. Click the button
            below to access your earnings.
          </Typography>

          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              rounded="half"
              onPress={handleOpenEarningsPortal}
            >
              Open Web Portal
            </Button>
          </View>
{/* 
          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              rounded="half"
              onPress={handleOpenActiveRide}
            >
              Test Active Ride Screen
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              rounded="half"
              onPress={handleOpenRideOfferAccept}
            >
              Test Ride Offer (Accept)
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              rounded="half"
              onPress={handleOpenRideOfferBid}
            >
              Test Ride Offer (Bid)
            </Button>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              rounded="half"
              onPress={handleShowToast}
            >
              Test Toast Message
            </Button>
          </View> 

          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              rounded="half"
              onPress={handleShowNotification}
            >
              Test Notification
            </Button>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  messageText: {
    color: textColors.grey800,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
});
