import Header from "@/components/Header";
import JobDetails from "@/components/JobDetails";
import Typography from "@/components/Typography";
import { activeTripApiClient } from "@/config/apiConfig";
import { textColors } from "@/constants/colors";
import { ACTIVE_TRIP_ROUTES } from "@/constants/endpoints";
import { useBroadcastJobOffers } from "@/context/BroadcastJobOffersContext";
import {
  formatDateTimeToReadableFormat,
  tripDetailsApiResponseToJobOffer,
} from "@/utils/helpers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

/**
 * Transform broadcast offer to JobDetails format for demo details
 */
function transformBroadcastOfferToJobOfferForDemo(broadcastOffer: any) {
  return {
    id: broadcastOffer.id,
    dateTime: formatDateTimeToReadableFormat(broadcastOffer.timestamp),
    rideType: broadcastOffer.rideType,
    peopleCount: broadcastOffer.peopleCount,
    rating: broadcastOffer.rating,
    hasSpecialRequirements: broadcastOffer.hasSpecialRequirements,
    onPressSpecialRequirements: () => {},
    hasPackage: broadcastOffer.hasPackage,
    onPressPackage: () => {},
    pickupTime: broadcastOffer.pickupTime,
    pickupDistance: broadcastOffer.pickupDistance,
    pickupAddress: broadcastOffer.pickupAddress,
    dropoffTime: broadcastOffer.dropoffTime,
    dropoffDistance: broadcastOffer.dropoffDistance,
    dropoffAddress: broadcastOffer.dropoffAddress,
    rideTime: broadcastOffer.rideTime,
    rideDistance: broadcastOffer.rideDistance,
    totalPrice: broadcastOffer.totalPrice,
    driverEarn: broadcastOffer.driverEarn,
    buttonTitle: broadcastOffer.buttonTitle,
    disabled: broadcastOffer.status !== "offered",
    onButtonClick: () => {},
    driverInstructions:
      "Please arrive on time and follow customer instructions.",
    fareDetails: [
      {
        label: "Ride Price",
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: "Tolls (EZ Pass)",
        value: "$0.00",
      },
      { label: "Tips", value: "$0.00" },
      {
        label: "Discount",
        value: "$0.00",
      },
      {
        label: "Service Charges",
        value: "$1.50",
      },
      {
        label: "Fuel Surcharge",
        value: "$1.00",
      },
    ],
    customerDetails: [
      { label: "Name", value: "Customer" },
      {
        label: "Required Car Type",
        value: "Sedan",
      },
      {
        label: "Offer Price",
        value: `$${broadcastOffer.totalPrice.toFixed(2)}`,
      },
      {
        label: "Account No.",
        value: "123456789",
      },
      {
        label: "Profile No.",
        value: "987654321",
      },
    ],
    expiredAt: broadcastOffer.expiredAt,
  };
}

export default function TripDetailsScreen() {
  const params = useLocalSearchParams<{
    offerId?: string;
    tripNumber?: string;
  }>();
  const { broadcastOffers } = useBroadcastJobOffers();
  const [jobOfferData, setJobOfferData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load trip data broadcast offers for demo details
   */
  const loadDemoDetails = () => {
    setJobOfferData(
      transformBroadcastOfferToJobOfferForDemo(
        broadcastOffers.find((o) => o.id === params.offerId) ?? {}
      )
    );
    setIsLoading(false);
  };

  /**
   * Load trip details from API
   */
  const loadTripDetailsFromApi = async () => {
    // If tripNumber or offerId is provided, fetch from API
    if (params.tripNumber || params.offerId) {
      try {
        const tripNumber = params.tripNumber || params.offerId;
        setIsLoading(true);
        setError(null);
        const endpoint = `${ACTIVE_TRIP_ROUTES.GET_TRIP_BY_NUMBER}/${tripNumber}`;

        const response = await activeTripApiClient.get(endpoint);
        const responseData = response.data as any;

        const responseCode = responseData?.jHeader?.responseCode;
        const isSuccess =
          responseCode === 0 ||
          responseCode === "0" ||
          responseCode === undefined;

        if (isSuccess && responseData?.data) {
          const jobOfferDataFromApi = tripDetailsApiResponseToJobOffer(
            responseData.data
          );
          const jobOfferDataFromBroadcast = broadcastOffers.find(
            (o) => o.id === tripNumber
          );

          if (jobOfferDataFromBroadcast || jobOfferDataFromApi) {
            setJobOfferData({
              ...jobOfferDataFromBroadcast,
              fareDetails: jobOfferDataFromApi?.fareDetails,
              customerDetails: jobOfferDataFromApi?.customerDetails,
              driverInstructions: jobOfferDataFromApi?.driverInstructions,
              dateTime: formatDateTimeToReadableFormat(
                jobOfferDataFromBroadcast?.timestamp ??
                  jobOfferDataFromApi?.dateTime
              ),
            });
          }
        } else {
          const errorMsg =
            responseData?.jHeader?.message || "Failed to fetch trip details";
          console.error("❌ [TripDetails] API Error:", errorMsg);
          console.error("❌ [TripDetails] Response Code:", responseCode);
          setError(errorMsg);
        }
      } catch (err: any) {
        console.error("❌ [TripDetails] Error Type:", err?.name);
        if (err?.response) {
          console.error(
            "❌ [TripDetails] Error Response Status:",
            err.response.status
          );
        }
        setError(err?.message || "Failed to load trip details");
      } finally {
        setIsLoading(false);
      }
      return;
    }
  };

  useEffect(() => {
    const isDemoOffer = params?.offerId?.includes("demo-");
    // If demo offer, set job offer data from broadcast offers for the demo details
    if (isDemoOffer) {
      loadDemoDetails();
    } else {
      // Otherwise, load trip data from API
      loadTripDetailsFromApi();
    }
  }, [params.offerId, params.tripNumber, broadcastOffers]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Trip Details" onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={textColors.teal900} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Trip Details" onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <Text>Error: {error}</Text>
          <Pressable  style={styles.retryButton} onPress={() => loadTripDetailsFromApi()} disabled={isLoading} >
            <Typography type="bodyMedium" weight="semibold" style={styles.retryButtonText}>Retry</Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!jobOfferData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Trip Details" onBackPress={() => router.back()} />
        <View style={styles.emptyContainer}>
          <Text>No job offer data found</Text>
          <Pressable  style={styles.retryButton} onPress={() => loadTripDetailsFromApi()} disabled={isLoading} >
            <Typography type="bodyMedium" weight="semibold" style={styles.retryButtonText}>Retry</Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Trip Details" onBackPress={() => router.back()} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <JobDetails jobOffer={jobOfferData} showActionBar={false} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: textColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  retryButton: {
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: textColors.white,
  },
});
