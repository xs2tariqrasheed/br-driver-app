import Button from "@/components/Button";
import Header from "@/components/Header";
import Typography from "@/components/Typography";
import { textColors } from "@/constants/colors";
import { URLS } from "@/constants/global";
import { useRouter } from "expo-router";
import { Linking, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export default function EarningsScreen() {
  const router = useRouter();

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
          address: "18-KM Main Lahore – Kasur Rd، opp. Descon Head Office, Shadab Garden, Lahore",
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

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Earnings" onBackPress={handleBackPress} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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

          <View style={styles.buttonContainer}>
            <Button
              variant="outlined"
              rounded="half"
              onPress={handleOpenActiveRide}
            >
              Test Active Ride Screen
            </Button>
          </View>
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
